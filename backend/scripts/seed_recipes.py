#!/usr/bin/env python3
"""Seed the recipes table from datahiveai/recipes-with-nutrition on HuggingFace.

Fetches recipes via the HuggingFace datasets-server REST API (no extra deps),
maps them to our Recipe model, generates Gemini embeddings, and upserts into
the database. The script is idempotent — it skips any recipe already in the DB
by source_url.

Run from backend/:
    # Recommended first run — 500 recipes with embeddings
    uv run python scripts/seed_recipes.py --limit 500

    # Fast seed (no embeddings, metadata-filter + scoring still work)
    uv run python scripts/seed_recipes.py --no-embed

    # Full dataset with embeddings (~11 h on free Gemini quota)
    uv run python scripts/seed_recipes.py

Options:
    --limit N       Stop after N new recipes (default: all 39,447)
    --no-embed      Skip Gemini embedding — semantic search disabled
    --batch-size N  Commit every N recipes (default: 50)
"""
from __future__ import annotations

import argparse
import asyncio
import json
import logging
import sys
import uuid
from typing import Any

import httpx

sys.path.insert(0, ".")

from app.core.database import AsyncSessionLocal
from app.nutrition_coach.models.recipe import Recipe
from sqlalchemy import text

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

_HF_BASE = (
    "https://datasets-server.huggingface.co/rows"
    "?dataset=datahiveai%2Frecipes-with-nutrition"
    "&config=default&split=train"
    "&offset={offset}&length={length}"
)

# Maps HuggingFace total_nutrients JSON keys → Recipe column names
_NUTRIENT_MAP = {
    "ENERC_KCAL": "calories",
    "PROCNT":     "protein_g",
    "CHOCDF":     "carbs_g",
    "FAT":        "fat_g",
    "FIBTG":      "fibre_g",
    "NA":         "sodium_mg",
}


# ── Parsing helpers ───────────────────────────────────────────────────────────

def _parse_json_field(value: str | None) -> Any:
    if not value:
        return None
    try:
        return json.loads(value)
    except (json.JSONDecodeError, TypeError):
        return None


def _per_serving_nutrients(total_nutrients_str: str | None, servings: float) -> dict[str, float | None]:
    """Divide total-recipe nutrients by servings → per-serving values."""
    out: dict[str, float | None] = {col: None for col in _NUTRIENT_MAP.values()}
    nutrients = _parse_json_field(total_nutrients_str)
    if not isinstance(nutrients, dict):
        return out
    divisor = max(servings, 1.0)
    for hf_key, col in _NUTRIENT_MAP.items():
        entry = nutrients.get(hf_key)
        if isinstance(entry, dict) and "quantity" in entry:
            qty = entry["quantity"]
            if qty is not None:
                out[col] = round(float(qty) / divisor, 2)
    return out


def _build_diet_tags(diet_labels_str: str | None, health_labels_str: str | None) -> list[str]:
    """Merge diet_labels + health_labels into normalised lowercase-hyphenated tags."""
    tags: list[str] = []
    for raw in (diet_labels_str, health_labels_str):
        parsed = _parse_json_field(raw)
        if isinstance(parsed, list):
            tags.extend(str(t).strip() for t in parsed if t)
    return list(dict.fromkeys(t.lower().replace(" ", "-") for t in tags))


def _build_embedding_text(row: dict) -> str:
    """Rich natural-language representation of a recipe for semantic embedding."""
    parts: list[str] = [f"Recipe: {row.get('recipe_name') or 'Unknown'}"]

    for field, label in (("cuisine_type", "Cuisine"), ("meal_type", "Meal type"), ("dish_type", "Dish type")):
        if row.get(field):
            parts.append(f"{label}: {row[field]}")

    tags: list[str] = []
    for raw in (row.get("diet_labels"), row.get("health_labels")):
        parsed = _parse_json_field(raw)
        if isinstance(parsed, list):
            tags.extend(str(t) for t in parsed if t)
    if tags:
        parts.append(f"Dietary tags: {', '.join(tags[:8])}")

    lines = _parse_json_field(row.get("ingredient_lines"))
    if isinstance(lines, list) and lines:
        parts.append(f"Ingredients: {', '.join(str(i) for i in lines[:6])}")

    servings = float(row.get("servings") or 1)
    n = _per_serving_nutrients(row.get("total_nutrients"), servings)
    if n["calories"] is not None:
        parts.append(f"Per serving: {int(n['calories'])} kcal")
    if n["protein_g"] is not None:
        parts.append(f"Protein {n['protein_g']} g")
    if n["carbs_g"] is not None:
        parts.append(f"Carbs {n['carbs_g']} g")

    return ". ".join(parts)


def _map_row(row: dict, embedding: list[float] | None) -> Recipe:
    """Map one HuggingFace dataset row to a Recipe ORM object."""
    servings = float(row.get("servings") or 1)
    n = _per_serving_nutrients(row.get("total_nutrients"), servings)
    lines = _parse_json_field(row.get("ingredient_lines"))

    return Recipe(
        id=uuid.uuid4(),
        title=str(row.get("recipe_name") or "Untitled"),
        description=None,
        calories=int(n["calories"]) if n["calories"] is not None else None,
        protein_g=n["protein_g"],
        carbs_g=n["carbs_g"],
        fat_g=n["fat_g"],
        fibre_g=n["fibre_g"],
        sodium_mg=n["sodium_mg"],
        ingredients=lines if isinstance(lines, list) else None,
        diet_tags=_build_diet_tags(row.get("diet_labels"), row.get("health_labels")),
        cuisine_type=row.get("cuisine_type"),
        time_minutes=None,
        source_url=row.get("url"),
        embedding_vector=embedding,
    )


# ── Network helpers ───────────────────────────────────────────────────────────

async def _fetch_page(client: httpx.AsyncClient, offset: int, page_size: int) -> list[dict]:
    url = _HF_BASE.format(offset=offset, length=page_size)
    for attempt in range(3):
        try:
            resp = await client.get(url, timeout=30)
            resp.raise_for_status()
            return [r["row"] for r in resp.json().get("rows", [])]
        except (httpx.HTTPError, KeyError) as exc:
            if attempt == 2:
                logger.error("HuggingFace fetch failed at offset=%d: %s", offset, exc)
                return []
            await asyncio.sleep(2 ** attempt)
    return []


async def _embed(text: str) -> list[float] | None:
    try:
        from app.prompt.gemini import gemini_service
        result = await gemini_service.embed_text(text)
        return result
    except Exception as exc:
        logger.warning("Embedding failed: %s", exc)
        return None


# ── Main seed loop ────────────────────────────────────────────────────────────

async def _seed(limit: int | None, embed: bool, batch_size: int) -> None:
    logger.info("seed_recipes limit=%s embed=%s batch_size=%d", limit or "all", embed, batch_size)

    # Collect already-seeded source URLs so the script is idempotent
    async with AsyncSessionLocal() as db:
        rows = (await db.execute(text("SELECT source_url FROM recipes WHERE source_url IS NOT NULL"))).all()
        existing_urls: set[str] = {r[0] for r in rows}
    logger.info("Already in DB: %d recipes", len(existing_urls))

    inserted = 0
    skipped = 0
    offset = 0
    page_size = 100
    pending: list[Recipe] = []

    async with httpx.AsyncClient() as http, AsyncSessionLocal() as db:
        while True:
            if limit is not None and inserted >= limit:
                break

            rows = await _fetch_page(http, offset, page_size)
            if not rows:
                logger.info("No more rows from HuggingFace — done fetching.")
                break

            for row in rows:
                if limit is not None and inserted >= limit:
                    break

                src_url = row.get("url") or ""
                if src_url and src_url in existing_urls:
                    skipped += 1
                    continue

                embedding: list[float] | None = None
                if embed:
                    embedding = await _embed(_build_embedding_text(row))
                    await asyncio.sleep(0.05)  # ≈20 rps — safely within Gemini free-tier

                pending.append(_map_row(row, embedding))

                if len(pending) >= batch_size:
                    for r in pending:
                        db.add(r)
                    await db.commit()
                    inserted += len(pending)
                    pending = []
                    logger.info("Inserted %d | skipped %d | offset %d", inserted, skipped, offset)

            offset += page_size

        # Flush remainder
        if pending:
            for r in pending:
                db.add(r)
            await db.commit()
            inserted += len(pending)

    logger.info("Done. inserted=%d skipped=%d embed=%s", inserted, skipped, embed)


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--limit",      type=int,            help="Max new recipes to insert")
    p.add_argument("--no-embed",   action="store_true", help="Skip Gemini embedding generation")
    p.add_argument("--batch-size", type=int, default=50, help="DB commit batch size (default: 50)")
    args = p.parse_args()

    asyncio.run(_seed(limit=args.limit, embed=not args.no_embed, batch_size=args.batch_size))


if __name__ == "__main__":
    main()

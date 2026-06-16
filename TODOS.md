# TODOS

Deferred items from engineering review (2026-06-16). Each item has been explicitly considered and deliberately deferred — not forgotten.

---

## Image upload: full memory buffer before size validation

**What:** Before returning a 413, `analyze.py` calls `await image.read()` which buffers the entire upload into memory. A 50 MB upload consumes 50 MB of heap before the size check fires.

**Why:** A flood of large uploads from authenticated-but-malicious users can OOM the process on a resource-constrained VPS. Low risk while user count is small, higher risk at any real scale.

**Pros:** Fixing this hardens the endpoint against memory exhaustion DoS before it becomes a problem in production.

**Cons:** Streaming validation requires either FastAPI's `UploadFile.size` (from Content-Length header, not always present) or chunked read with a running byte counter — slightly more code.

**Context:** `backend/app/api/routes/analyze.py:58-63`. The fix is to check `image.size` before `image.read()`, or use a chunked approach: `async for chunk in image: ...` with an accumulator that 413s if the running total exceeds the limit. Auth gate reduces urgency — only logged-in users can trigger this.

**Depends on:** None. Can be done independently.

---

"""
Alembic migration env
"""
import asyncio
import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

import app.models
from app.core.config import settings
from app.core.database import Base

# add parent directory to path for imports
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

config = context.config
config.set_main_option(
    "sqlalchemy.url", 
    settings.DATABASE_URL
    )

target_metadata = Base.metadata

def get_alembic_options():
    return {
        "target_metadata": target_metadata,
        "compare_type": True,
        "compare_server_default": True,
    }

def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection, 
        **get_alembic_options(),
    )
    with context.begin_transaction():
        context.run_migrations()

# create database connection
async def run_async_migrations() -> None:
    engine = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with engine.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await engine.dispose()

if context.is_offline_mode():
    ...
else:
    asyncio.run(run_async_migrations())

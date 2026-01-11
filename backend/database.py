import os
from pathlib import Path
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from dotenv import load_dotenv

# -------------------------------------------------
# Environment loading (LOCAL ONLY)
# -------------------------------------------------
if os.getenv("RENDER") != "true":
    ROOT_DIR = Path(__file__).parent
    load_dotenv(ROOT_DIR / ".env")

# -------------------------------------------------
# Database URL selection
# -------------------------------------------------
IS_RENDER = os.getenv("RENDER") == "true"

if IS_RENDER:
    DB_URL = os.getenv("DATABASE_URL")
else:
    DB_URL = os.getenv("DATABASE_URL_LOCAL")

if not DB_URL:
    raise ValueError("No database URL found")

# -------------------------------------------------
# SQLAlchemy engine
# -------------------------------------------------
connect_args = {"sslmode": "require"} if IS_RENDER else {}

engine = create_engine(
    DB_URL,
    pool_pre_ping=True,
    connect_args=connect_args,
)

# -------------------------------------------------
# Session & Base
# -------------------------------------------------
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()

# -------------------------------------------------
# Dependency (Pylance-safe)
# -------------------------------------------------
def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------------------------------------------------
# Explicit exports (helps Pylance)
# -------------------------------------------------
__all__ = ["engine", "SessionLocal", "Base", "get_db"]

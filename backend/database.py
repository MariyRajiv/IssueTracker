import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Use local or hosted DB
DATABASE_URL = os.environ.get("DATABASE_URL")  # production
DATABASE_URL_LOCAL = os.environ.get("DATABASE_URL_LOCAL")  # local dev

# Use local if exists, otherwise production
DB_URL = DATABASE_URL_LOCAL or DATABASE_URL
if not DB_URL:
    raise ValueError("No database URL found")

# Apply SSL only if connecting to render.com
connect_args = {"sslmode": "require"} if "render.com" in DB_URL else {}

engine = create_engine(DB_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Test connection
try:
    with engine.connect() as conn:
        print("Postgres connection successful!")
except Exception as e:
    print("Postgres connection failed:", e)

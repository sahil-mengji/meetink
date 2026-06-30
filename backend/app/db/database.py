from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import get_settings

settings = get_settings()

RAW_DATABASE_URL = settings.database_url or "postgresql://postgres:password@localhost:5432/meetink"

if not RAW_DATABASE_URL:
    raise RuntimeError("DATABASE_URL is required. Set it in your environment.")

# SQLAlchemy needs an explicit driver for psycopg v3.
DATABASE_URL = (
    RAW_DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)
    if RAW_DATABASE_URL.startswith("postgresql://")
    else RAW_DATABASE_URL
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args={"connect_timeout": 5}, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

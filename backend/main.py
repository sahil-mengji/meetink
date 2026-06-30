import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
import logging

logging.basicConfig(level=logging.INFO, format="%(levelname)-9s %(asctime)s - %(name)s - %(message)s")
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
logging.getLogger("openai").setLevel(logging.WARNING)
logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

load_dotenv(Path(__file__).parent / "app" / ".env", override=True)

from app.db.database import engine, Base
from app.db import models  # Important to import models so Base knows about them

from app.api.knowledge import router as knowledge_router
from app.api.meetings import router as meetings_router
from app.api.pipeline import router as pipeline_router
from app.api.attribution import router as attribution_router
from app.api.voice import router as voice_router
from app.api.query import router as query_router
from app.api.integrations import router as integrations_router
from app.api.auth import router as auth_router


# Engine and Base are now managed in app.db.database


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Attempt a startup check so broken DB config fails early in logs.
    try:
        with engine.connect() as connection:
            try:
                connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                connection.commit()
            except Exception as e:
                print(f"Warning creating vector extension: {e}")

        # Create tables automatically (MVP approach)
        Base.metadata.create_all(bind=engine)
        
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
            # Ensure new columns exist if table was already created
            columns = [
                ("meetings", "raw_vtt_content text"),
                ("meetings", "status text DEFAULT 'Processing'"),
                ("meetings", "duration text DEFAULT '45m'"),
                ("meetings", "audio_filepath text"),
                ("meetings", "audio_url text"),
                ("meeting_workflow_traces", "output_data JSONB")
            ]
            for table, col in columns:
                try:
                    connection.execute(text(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {col}"))
                except Exception:
                    pass
            connection.commit()
    except Exception as e:
        print(f"Error during startup migration: {e}")
    yield
    engine.dispose()


app = FastAPI(title="Meeting Intelligence Orchestrator", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
uploads_app = FastAPI()
uploads_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
uploads_app.mount("/", StaticFiles(directory="uploads"), name="uploads")
app.mount("/uploads", uploads_app)

app.include_router(meetings_router, prefix="/meetings", tags=["meetings"])
app.include_router(knowledge_router, prefix="/knowledge", tags=["knowledge"])
app.include_router(pipeline_router, prefix="/pipeline", tags=["pipeline"])
app.include_router(voice_router, prefix="/voice", tags=["voice"])
app.include_router(attribution_router, tags=["attribution"])
app.include_router(query_router, prefix="/query", tags=["query"])
app.include_router(integrations_router, prefix="/integrations", tags=["integrations"])
app.include_router(auth_router, prefix="/auth", tags=["auth"])


@app.get("/")
def hello() -> dict[str, str]:
    return {"message": "Hello, World!"}


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/db")
def health_db() -> dict[str, str]:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except SQLAlchemyError as exc:
        raise HTTPException(status_code=503, detail=f"Database unavailable: {exc}") from exc
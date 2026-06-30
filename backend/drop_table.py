from app.db.database import engine
from app.db.models import MeetingSemanticChunk

def drop_semantic_chunk_table():
    with engine.begin() as conn:
        MeetingSemanticChunk.__table__.drop(conn, checkfirst=True)
        MeetingSemanticChunk.__table__.create(conn, checkfirst=True)
    print("Table meeting_semantic_chunks dropped and recreated with Vector(384).")

if __name__ == "__main__":
    drop_semantic_chunk_table()

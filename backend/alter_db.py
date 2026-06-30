from sqlalchemy import text
from app.db.database import engine

def alter_table():
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE meeting_knowledge_facts ADD COLUMN IF NOT EXISTS tags VARCHAR[] DEFAULT '{}';"))
        conn.commit()
        print("Successfully added tags column to meeting_knowledge_facts.")

if __name__ == "__main__":
    alter_table()

from app.db.database import engine, Base
from app.db.models import KnowledgeTag

def create_tables():
    Base.metadata.create_all(bind=engine)
    print("Tables created.")

if __name__ == "__main__":
    create_tables()

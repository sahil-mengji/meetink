import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from app.db.database import SessionLocal
from app.db import models
from sqlalchemy import select
from app.services.meeting_service import get_report

db = SessionLocal()
meeting_id = "1058a89a-b840-4e65-8bdd-bbea044c845a"
meeting = db.execute(select(models.Meeting).where(models.Meeting.id == meeting_id)).scalar_one_or_none()

if meeting:
    report = get_report(meeting_id, fmt="model")
    for a in report.action_items:
        print(f"TEXT: {repr(a.text)}")
        print(f"OWNER: {repr(a.owner)}")
        print("---")
else:
    print("Meeting not found")

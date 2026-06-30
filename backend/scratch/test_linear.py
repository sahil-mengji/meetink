import sys
import os
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from dotenv import load_dotenv
load_dotenv("app/.env")

from app.integrations.linear import create_linear_issue
from app.schemas.meeting import ActionItem, MeetingReport
from datetime import datetime

# Fake a meeting and action item
meeting = MeetingReport(
    meeting_id="123",
    status="completed",
    generated_at=datetime.now(),
    all_actions=[],
    all_decisions=[],
    markdown_report="",
    confidence_score=1.0,
    gist=""
)
action = ActionItem(
    text="Test Linear Ticket from CLI",
    owner="Alex",
    confidence=0.9,
    source_utterance_ids=[1]
)

res = create_linear_issue(action, meeting)
print(res)

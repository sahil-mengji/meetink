import os
import sys
import logging

logging.basicConfig(level=logging.INFO)

sys.path.append(os.path.abspath('c:/Users/sahil.mengji/Desktop/meet-ink/backend'))

from app.schemas.meeting import MeetingReport, ActionItem, IntegrationOptions
from app.integrations.manager import export_meeting

dummy_actions = [
    ActionItem(text="Fix the bug", owner="Sahil", confidence=0.9, source_utterance_ids=[1]),
    ActionItem(text="Write the tests", owner="Anish", confidence=0.8, source_utterance_ids=[2])
]

report = MeetingReport(
    meeting_id="mock_meeting_123",
    gist="Test meeting gist.",
    all_actions=dummy_actions
)

options = IntegrationOptions(jira=True, calendar=True, tasks=True, email=True)
result = export_meeting(report, options)

print("\n--- Export Result ---")
print(result)

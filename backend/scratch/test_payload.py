import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from app.api.meetings import dispatch_integrations
from app.schemas.meeting import DispatchRequest

# This requires a valid meeting ID
try:
    req = DispatchRequest(
        action_items=[{"text": "Test from Payload", "owner": "Anish Sai Nimmagadda"}],
        options={"linear": False, "calendar": False, "tasks": False, "email": False}
    )
    res = dispatch_integrations("1058a89a-b840-4e65-8bdd-bbea044c845a", req)
    print(res)
except Exception as e:
    print("Error:", e)

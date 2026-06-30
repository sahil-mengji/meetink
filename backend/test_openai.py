import os
from pathlib import Path
from dotenv import load_dotenv

# Load env vars
load_dotenv(Path(__file__).parent / "app" / ".env", override=True)

from app.llm.client import get_chat_model

try:
    print("Testing chat model...")
    model = get_chat_model()
    # We want to test the actual LLM call, not the mock
    # Note: get_chat_model checks LLM_MOCK from settings
    print(f"Model class: {type(model).__name__}")
    response = model.invoke("Hello, are you working?")
    print("SUCCESS! Response received:")
    print(response.content)
except Exception as e:
    print(f"FAILED! Error encountered: {e}")

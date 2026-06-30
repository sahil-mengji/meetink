import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / "app" / ".env", override=True)

from app.pipeline.agents.summary_recap_agent import generate_summary_recap

async def main():
    key_moments = [{"id": "km-1", "text": "Discussed Q3 roadmap and database upgrade dependencies.", "type": "decision", "confidence": 0.9, "source_utterance_ids": [0]}]
    topics_data = {
        "overall_topic": "Q3 Roadmap",
        "overall_description": "Finalizing Q3 roadmap",
        "topics": [{"title": "Database Migration", "description": "Upgrading to Postgres 16"}]
    }
    metadata = {"title": "Test Meeting", "participants": ["Alice", "Bob"]}
    
    print("Testing generate_summary_recap...")
    res = await generate_summary_recap(key_moments, topics_data, metadata)
    print("Result:")
    print(res)

if __name__ == "__main__":
    asyncio.run(main())

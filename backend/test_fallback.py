import asyncio
import os
import sys

# Ensure the app module can be found
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.pipeline.agents.summary_recap_agent import generate_summary_recap

async def main():
    utterances = [
        {"speaker": "Alice", "text": "Hello everyone."},
        {"speaker": "Bob", "text": "Hi Alice, let's start."},
        {"speaker": "Alice", "text": "Okay, I am sharing my screen."}
    ]
    try:
        res = await generate_summary_recap(
            key_moments=[],
            topics_data={},
            metadata={"title": "Short Meeting"},
            utterances=utterances
        )
        print("Result:", res)
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())

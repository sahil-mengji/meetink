from __future__ import annotations

import json
from pathlib import Path

from app.config import get_settings
from app.schemas.meeting import ActionItem, Decision, MeetingReport, TopicReport


class KnowledgeStore:
    def __init__(self, data_dir: str | None = None) -> None:
        settings = get_settings()
        self.data_dir = Path(data_dir or settings.knowledge_data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.index_file = self.data_dir / "index.json"
        if not self.index_file.exists():
            self.index_file.write_text("[]", encoding="utf-8")

    def persist_report(self, report: MeetingReport) -> None:
        record = {
            "meeting_id": report.meeting_id,
            "gist": report.gist,
            "topics": [t.model_dump(mode="json") for t in report.topics],
            "open_actions": [a.model_dump(mode="json") for a in report.all_actions],
            "decisions": [d.model_dump(mode="json") for d in report.all_decisions],
        }
        out_file = self.data_dir / f"{report.meeting_id}.json"
        out_file.write_text(json.dumps(record, indent=2), encoding="utf-8")

        index = json.loads(self.index_file.read_text(encoding="utf-8"))
        if report.meeting_id not in index:
            index.append(report.meeting_id)
            self.index_file.write_text(json.dumps(index, indent=2), encoding="utf-8")

    def list_records(self) -> list[dict]:
        records = []
        for meeting_id in json.loads(self.index_file.read_text(encoding="utf-8")):
            path = self.data_dir / f"{meeting_id}.json"
            if path.exists():
                records.append(json.loads(path.read_text(encoding="utf-8")))
        return records


_store: KnowledgeStore | None = None


def get_knowledge_store() -> KnowledgeStore:
    global _store
    if _store is None:
        _store = KnowledgeStore()
    return _store

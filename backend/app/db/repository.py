from __future__ import annotations

from typing import Protocol

from app.schemas.meeting import Meeting


class MeetingRepository(Protocol):
    def save(self, meeting: Meeting) -> Meeting: ...

    def get(self, meeting_id: str) -> Meeting | None: ...

    def list_ids(self) -> list[str]: ...


class InMemoryMeetingRepository:
    def __init__(self) -> None:
        self._store: dict[str, Meeting] = {}

    def save(self, meeting: Meeting) -> Meeting:
        self._store[meeting.meeting_id] = meeting
        return meeting

    def get(self, meeting_id: str) -> Meeting | None:
        return self._store.get(meeting_id)

    def list_ids(self) -> list[str]:
        return list(self._store.keys())


_repository: InMemoryMeetingRepository | None = None


def get_repository() -> MeetingRepository:
    global _repository
    if _repository is None:
        _repository = InMemoryMeetingRepository()
    return _repository

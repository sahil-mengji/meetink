from fastapi import APIRouter, Query

from app.services import knowledge_service

router = APIRouter()


@router.get("/search")
def search(q: str = Query(..., min_length=1)):
    return {"results": knowledge_service.search(q)}

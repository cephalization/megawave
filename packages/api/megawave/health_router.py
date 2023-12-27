from fastapi import APIRouter, BackgroundTasks

router = APIRouter()


@router.get("/health")
def health():
    return 200

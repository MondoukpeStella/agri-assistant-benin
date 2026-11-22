from fastapi import APIRouter

from app.schemas.health import HealthResponse
from app.services.health import get_process_health

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def read_health() -> HealthResponse:
    return get_process_health()

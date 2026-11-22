from fastapi import APIRouter

from app.schemas.probe import ProbeRequest, ProbeResponse
from app.services.probe import accept_probe

router = APIRouter(prefix="/api/v1", tags=["probe"])


@router.post("/probe", response_model=ProbeResponse)
def create_probe(_payload: ProbeRequest) -> ProbeResponse:
    return accept_probe()

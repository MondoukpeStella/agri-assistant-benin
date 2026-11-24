from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from app.schemas.database import DatabaseStatusResponse
from app.services.database import probe_database

router = APIRouter(tags=["database"])


@router.get("/database/status", response_model=DatabaseStatusResponse)
def read_database_status(request: Request) -> JSONResponse:
    available = probe_database(request.app.state.settings.database_url)
    body = DatabaseStatusResponse(status="ok" if available else "unavailable")
    return JSONResponse(
        status_code=200 if available else 503,
        content=body.model_dump(),
    )

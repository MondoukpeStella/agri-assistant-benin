from app.schemas.health import HealthResponse


def get_process_health() -> HealthResponse:
    """Report that the API process is running.

    This check does not inspect PostgreSQL or any price source.
    """

    return HealthResponse(status="ok")

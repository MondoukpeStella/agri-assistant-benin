from app.schemas.probe import ProbeResponse


def accept_probe() -> ProbeResponse:
    """Confirm that a technical payload passed validation.

    The message is not stored, logged, or treated as a price request.
    """

    return ProbeResponse(accepted=True)

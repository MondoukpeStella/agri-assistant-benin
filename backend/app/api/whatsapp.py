import hmac

from fastapi import APIRouter, Request
from fastapi.responses import PlainTextResponse

router = APIRouter(tags=["whatsapp"])


@router.get("/whatsapp/meta", response_class=PlainTextResponse)
def verify_whatsapp_subscription(request: Request) -> PlainTextResponse:
    """Answer Meta's callback check with the challenge when the token matches."""
    expected = request.app.state.settings.whatsapp_verify_token
    received = request.query_params.get("hub.verify_token", "")
    mode = request.query_params.get("hub.mode", "")
    if expected and mode == "subscribe" and hmac.compare_digest(received, expected):
        return PlainTextResponse(request.query_params.get("hub.challenge", ""))
    return PlainTextResponse("verification_failed", status_code=403)


@router.post("/whatsapp/meta")
def accept_whatsapp_notification() -> dict[str, str]:
    """Accept a notification without reading the sender or sending a reply."""
    return {"status": "ok"}

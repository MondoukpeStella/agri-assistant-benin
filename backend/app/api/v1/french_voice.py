import base64
import binascii

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from app.schemas.french_voice import FrenchVoiceRequest, FrenchVoiceResponse
from app.services.french_stt import transcribe_french_audio
from app.services.french_voice import (
    JsonLanguageModel,
    answer_french_text,
    qwen_generate,
    recognize_unavailable,
)

router = APIRouter(prefix="/api/v1", tags=["voice"])


@router.post(
    "/voice/french",
    response_model=FrenchVoiceResponse,
    response_model_exclude_none=True,
)
def answer_in_french(
    payload: FrenchVoiceRequest,
    request: Request,
) -> FrenchVoiceResponse | JSONResponse:
    transcript = payload.text or ""
    if payload.audio_base64:
        try:
            audio = base64.b64decode(payload.audio_base64, validate=True)
        except binascii.Error:
            return JSONResponse(status_code=422, content={"status": "invalid_audio"})
        heard = transcribe_french_audio(audio)
        if heard is None:
            return FrenchVoiceResponse(**recognize_unavailable())
        transcript = heard
    if not transcript.strip():
        return FrenchVoiceResponse(**answer_french_text("", _model(request)))
    return FrenchVoiceResponse(**answer_french_text(transcript, _model(request)))


def _model(request: Request):
    configured = getattr(request.app.state, "french_model", None)
    if configured is not None:
        return configured
    if request.app.state.settings.french_llm == "qwen":
        return JsonLanguageModel(qwen_generate)
    return None

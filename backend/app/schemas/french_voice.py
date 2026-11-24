from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

VoiceStatus = Literal[
    "clarification",
    "no_validated_price",
    "published_price",
    "not_understood",
    "recognition_unavailable",
    "uncovered_market",
    "unsupported_product",
]


class FrenchVoiceRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    text: str | None = Field(default=None, max_length=500)
    audio_base64: str | None = Field(default=None, max_length=2_000_000)


class FrenchVoiceResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: VoiceStatus
    transcript: str
    reply: str
    product: Literal["maize", "rice"] | None = None
    market: Literal["natitingou", "savalou"] | None = None

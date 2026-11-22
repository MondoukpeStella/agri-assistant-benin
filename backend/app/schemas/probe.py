from pydantic import BaseModel, Field


class ProbeRequest(BaseModel):
    message: str = Field(min_length=1, max_length=80)


class ProbeResponse(BaseModel):
    accepted: bool

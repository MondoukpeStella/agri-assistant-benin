from typing import Literal

from pydantic import BaseModel


class DatabaseStatusResponse(BaseModel):
    status: Literal["ok", "unavailable"]

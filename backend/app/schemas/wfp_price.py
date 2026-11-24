from datetime import date
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class WfpObservationResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    commodity: str
    amount: str
    currency: Literal["XOF"]
    unit: str
    collected_on: date
    priceflag: Literal["actual"]
    pricetype: Literal["Retail"]
    market_id: str


class WfpPriceResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: Literal["published_series", "no_observation"]
    current: Literal[False] = False
    source: Literal["wfp"] = "wfp"
    source_title: str
    source_url: str
    license: str
    dataset_updated_on: date
    product: Literal["maize", "rice"]
    market: Literal["natitingou", "savalou"]
    observations: list[WfpObservationResponse] = Field(default_factory=list)

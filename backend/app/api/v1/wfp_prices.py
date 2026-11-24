from typing import Annotated

from fastapi import APIRouter, Query
from fastapi.responses import JSONResponse

from app.domain.price_observation import Market, Product
from app.schemas.wfp_price import WfpObservationResponse, WfpPriceResponse
from app.services.wfp_prices import (
    DATASET_UPDATED_ON,
    LICENSE,
    SOURCE_TITLE,
    SOURCE_URL,
    latest_observations,
    published_catalog,
)

router = APIRouter(prefix="/api/v1", tags=["prices"])


@router.get("/prices/wfp", response_model=WfpPriceResponse)
def published_wfp_price(
    product: Annotated[Product, Query()],
    market: Annotated[Market, Query()],
) -> WfpPriceResponse | JSONResponse:
    try:
        rows = published_catalog()
    except OSError:
        return JSONResponse(status_code=503, content={"status": "source_unavailable"})
    observations = latest_observations(
        rows,
        product=product.value,
        market=market.value,
    )
    return WfpPriceResponse(
        status="published_series" if observations else "no_observation",
        source_title=SOURCE_TITLE,
        source_url=SOURCE_URL,
        license=LICENSE,
        dataset_updated_on=DATASET_UPDATED_ON,
        product=product.value,
        market=market.value,
        observations=[
            WfpObservationResponse(
                commodity=row.commodity,
                amount=row.amount,
                currency="XOF",
                unit=row.unit,
                collected_on=row.collected_on,
                priceflag="actual",
                pricetype="Retail",
                market_id=row.market_id,
            )
            for row in observations
        ],
    )

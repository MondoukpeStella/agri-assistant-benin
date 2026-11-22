"""Map an adapter record into the internal price observation.

The record uses this application's contract. It is not an AgroFlux response.
A future adapter must translate the supplier payload into these tokens before
calling `map_supplier_record`. Unknown products and markets are rejected
instead of being rewritten.
"""

from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from enum import StrEnum
from uuid import UUID, uuid4

from pydantic import BaseModel, ConfigDict

from app.domain.price_observation import (
    KNOWN_CURRENCIES,
    MAX_DECIMAL_PLACES,
    XOF_DECIMAL_PLACES,
    Market,
    PriceObservation,
    Product,
    ValidationStatus,
)

_STATUS_TOKENS = {
    "validated": ValidationStatus.VALIDATED,
    "not_validated": ValidationStatus.NOT_VALIDATED,
    "cancelled": ValidationStatus.CANCELLED,
}


class RejectionReason(StrEnum):
    SOURCE = "source"
    SOURCE_ID = "source_id"
    PRODUCT = "product"
    MARKET = "market"
    AMOUNT = "amount"
    COLLECTED_ON = "collected_on"
    PUBLISHED_ON = "published_on"
    RETRIEVED_AT = "retrieved_at"


class SupplierPriceRecord(BaseModel):
    """Adapter input. Field names belong to this application, not AgroFlux."""

    model_config = ConfigDict(extra="forbid")

    source: str = ""
    source_id: str = ""
    product: str = ""
    market: str = ""
    amount: object = None
    currency: str | None = None
    unit: str | None = None
    collected_on: object = None
    published_on: object = None
    retrieved_at: object = None
    validation_status: str | None = None
    variety: str | None = None


class MappedObservation(BaseModel):
    model_config = ConfigDict(extra="forbid")

    observation: PriceObservation | None = None
    reason: RejectionReason | None = None


def map_supplier_record(
    record: SupplierPriceRecord,
    *,
    observation_id: UUID | None = None,
) -> MappedObservation:
    source = record.source.strip()
    source_id = record.source_id.strip()
    if not source:
        return MappedObservation(reason=RejectionReason.SOURCE)
    if not source_id:
        return MappedObservation(reason=RejectionReason.SOURCE_ID)
    try:
        product = Product(record.product)
    except ValueError:
        return MappedObservation(reason=RejectionReason.PRODUCT)
    try:
        market = Market(record.market)
    except ValueError:
        return MappedObservation(reason=RejectionReason.MARKET)

    amount = _parse_amount(record.amount, record.currency)
    if amount is None:
        return MappedObservation(reason=RejectionReason.AMOUNT)
    collected_on = _parse_date(record.collected_on)
    if collected_on is None:
        return MappedObservation(reason=RejectionReason.COLLECTED_ON)
    if record.published_on is None:
        published_on = None
    else:
        published_on = _parse_date(record.published_on)
        if published_on is None:
            return MappedObservation(reason=RejectionReason.PUBLISHED_ON)
    if not isinstance(record.retrieved_at, datetime):
        return MappedObservation(reason=RejectionReason.RETRIEVED_AT)

    status = _STATUS_TOKENS.get(
        record.validation_status or "",
        ValidationStatus.UNKNOWN,
    )
    currency = (record.currency or "").strip()
    unit = (record.unit or "").strip()
    variety = (
        record.variety.strip() if record.variety and record.variety.strip() else None
    )

    return MappedObservation(
        observation=PriceObservation(
            observation_id=observation_id or uuid4(),
            source=source,
            source_id=source_id,
            product=product,
            market=market,
            amount=amount,
            currency=currency,
            unit=unit,
            collected_on=collected_on,
            published_on=published_on,
            retrieved_at=record.retrieved_at,
            validation_status=status,
            variety=variety,
        )
    )


def deduplicate_observations(
    observations: list[PriceObservation],
) -> list[PriceObservation]:
    """Keep one observation per source and source id.

    The kept observation is the one with the latest `retrieved_at`.
    An equal timestamp keeps the first observation already chosen.
    Repeating the function does not change the result.
    """

    chosen: dict[tuple[str, str], PriceObservation] = {}
    for observation in observations:
        key = (observation.source, observation.source_id)
        current = chosen.get(key)
        if current is None or observation.retrieved_at > current.retrieved_at:
            chosen[key] = observation
    return list(chosen.values())


def _parse_amount(value: object, currency: str | None) -> Decimal | None:
    if isinstance(value, bool) or isinstance(value, float) or value is None:
        return None
    try:
        amount = value if isinstance(value, Decimal) else Decimal(str(value))
    except (InvalidOperation, ValueError):
        return None
    if not amount.is_finite() or amount <= 0:
        return None
    places = _decimal_places(amount)
    if places > MAX_DECIMAL_PLACES:
        return None
    if (currency or "").strip() in KNOWN_CURRENCIES and places > XOF_DECIMAL_PLACES:
        return None
    return amount


def _parse_date(value: object) -> date | None:
    if isinstance(value, datetime):
        return None
    if isinstance(value, date):
        return value
    if not isinstance(value, str):
        return None
    try:
        return date.fromisoformat(value)
    except ValueError:
        return None


def _decimal_places(amount: Decimal) -> int:
    exponent = amount.as_tuple().exponent
    if isinstance(exponent, int) and exponent < 0:
        return -exponent
    return 0

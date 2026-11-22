"""Internal price observation, independent of any supplier payload.

AgroFlux field names are unknown (ISSUE-003). This module only uses the
application's own names. Freshness bands are provisional and do not, by
themselves, hide a price.
"""

from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

KNOWN_CURRENCIES = frozenset({"XOF"})
XOF_DECIMAL_PLACES = 0
MAX_DECIMAL_PLACES = 2


class Product(StrEnum):
    MAIZE = "maize"
    RICE = "rice"


class Market(StrEnum):
    NATITINGOU = "natitingou"
    SAVALOU = "savalou"


class ValidationStatus(StrEnum):
    VALIDATED = "validated"
    NOT_VALIDATED = "not_validated"
    CANCELLED = "cancelled"
    UNKNOWN = "unknown"


class Freshness(StrEnum):
    FRESH = "fresh"
    AGING = "aging"
    STALE = "stale"


class IneligibilityReason(StrEnum):
    STATUS = "status"
    AMOUNT = "amount"
    CURRENCY = "currency"
    UNIT = "unit"
    COLLECTED_ON = "collected_on"


class PriceObservation(BaseModel):
    model_config = ConfigDict(extra="forbid")

    observation_id: UUID
    source: str = Field(min_length=1)
    source_id: str = Field(min_length=1)
    product: Product
    market: Market
    amount: Decimal
    currency: str
    unit: str
    collected_on: date
    published_on: date | None = None
    retrieved_at: datetime
    validation_status: ValidationStatus
    variety: str | None = None


class Eligibility(BaseModel):
    model_config = ConfigDict(extra="forbid")

    displayable: bool
    reasons: tuple[IneligibilityReason, ...]
    freshness: Freshness | None


def freshness_on(collected_on: date, on_date: date) -> Freshness | None:
    """Provisional bands: 0–2 days fresh, 3–5 aging, older stale.

    A collection date after `on_date` is not a freshness band. Hiding a stale
    price is not decided here.
    """

    age_days = (on_date - collected_on).days
    if age_days < 0:
        return None
    if age_days <= 2:
        return Freshness.FRESH
    if age_days <= 5:
        return Freshness.AGING
    return Freshness.STALE


def assess_display(observation: PriceObservation, *, on_date: date) -> Eligibility:
    """Decide whether this observation may be shown as a current price."""

    reasons: list[IneligibilityReason] = []
    if observation.validation_status is not ValidationStatus.VALIDATED:
        reasons.append(IneligibilityReason.STATUS)
    if not _amount_is_displayable(observation.amount, observation.currency):
        reasons.append(IneligibilityReason.AMOUNT)
    if observation.currency not in KNOWN_CURRENCIES:
        reasons.append(IneligibilityReason.CURRENCY)
    if not observation.unit.strip():
        reasons.append(IneligibilityReason.UNIT)
    if observation.collected_on > on_date:
        reasons.append(IneligibilityReason.COLLECTED_ON)
    return Eligibility(
        displayable=not reasons,
        reasons=tuple(reasons),
        freshness=freshness_on(observation.collected_on, on_date),
    )


def _amount_is_displayable(amount: Decimal, currency: str) -> bool:
    if not amount.is_finite() or amount <= 0:
        return False
    places = _decimal_places(amount)
    if places > MAX_DECIMAL_PLACES:
        return False
    return not (currency == "XOF" and places > XOF_DECIMAL_PLACES)


def _decimal_places(amount: Decimal) -> int:
    exponent = amount.as_tuple().exponent
    if isinstance(exponent, int) and exponent < 0:
        return -exponent
    return 0

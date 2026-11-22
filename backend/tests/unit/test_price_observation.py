from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

import pytest

from app.domain.price_observation import (
    Freshness,
    IneligibilityReason,
    Market,
    Product,
    ValidationStatus,
    assess_display,
    freshness_on,
)
from app.services.supplier_mapping import (
    SupplierPriceRecord,
    deduplicate_observations,
    map_supplier_record,
)

ON_DATE = date(2026, 11, 22)
RETRIEVED = datetime(2026, 11, 22, 8, 0, 0)
OBSERVATION_ID = UUID("11111111-1111-1111-1111-111111111111")


def record(**overrides: object) -> SupplierPriceRecord:
    values: dict[str, object] = {
        "source": "supplier",
        "source_id": "obs-1",
        "product": "maize",
        "market": "natitingou",
        "amount": "200",
        "currency": "XOF",
        "unit": "kg",
        "collected_on": "2026-11-20",
        "published_on": "2026-11-21",
        "retrieved_at": RETRIEVED,
        "validation_status": "validated",
        "variety": None,
    }
    values.update(overrides)
    return SupplierPriceRecord.model_validate(values)


def test_complete_validated_observation_is_displayable() -> None:
    mapped = map_supplier_record(record(), observation_id=OBSERVATION_ID)

    observation = mapped.observation
    assert observation is not None
    assert mapped.reason is None
    assert observation.observation_id == OBSERVATION_ID
    assert observation.product is Product.MAIZE
    assert observation.market is Market.NATITINGOU
    assert observation.amount == Decimal("200")
    assert observation.collected_on == date(2026, 11, 20)
    assert observation.published_on == date(2026, 11, 21)
    assert observation.retrieved_at == RETRIEVED
    assert observation.validation_status is ValidationStatus.VALIDATED
    assert observation.variety is None
    eligibility = assess_display(observation, on_date=ON_DATE)
    assert eligibility.displayable is True
    assert eligibility.reasons == ()
    assert eligibility.freshness is Freshness.FRESH


def test_missing_variety_does_not_reject_a_clear_product() -> None:
    mapped = map_supplier_record(record(variety=None))

    assert mapped.observation is not None
    assert mapped.observation.variety is None


@pytest.mark.parametrize("status", ["not_validated", "cancelled", None, "official"])
def test_unvalidated_or_unknown_status_is_kept_but_not_displayable(
    status: str | None,
) -> None:
    mapped = map_supplier_record(record(validation_status=status))

    assert mapped.observation is not None
    eligibility = assess_display(mapped.observation, on_date=ON_DATE)
    assert eligibility.displayable is False
    assert IneligibilityReason.STATUS in eligibility.reasons


@pytest.mark.parametrize("amount", [None, "", "abc", "0", "-5", "200.50", "1.005", 0])
def test_unusable_amount_is_rejected(amount: object) -> None:
    mapped = map_supplier_record(record(amount=amount))

    assert mapped.observation is None
    assert mapped.reason is not None
    assert mapped.reason.value == "amount"


@pytest.mark.parametrize(
    "collected_on",
    [None, "", "20/11/2026", "2026-11-20T08:00:00", datetime(2026, 11, 20, 8, 0)],
)
def test_absent_or_malformed_collection_date_is_rejected(collected_on: object) -> None:
    mapped = map_supplier_record(record(collected_on=collected_on))

    assert mapped.observation is None
    assert mapped.reason is not None
    assert mapped.reason.value == "collected_on"


def test_future_collection_date_is_kept_and_not_displayable() -> None:
    mapped = map_supplier_record(record(collected_on="2026-11-23"))

    assert mapped.observation is not None
    assert mapped.observation.collected_on == date(2026, 11, 23)
    assert mapped.observation.collected_on != mapped.observation.retrieved_at.date()
    eligibility = assess_display(mapped.observation, on_date=ON_DATE)
    assert eligibility.displayable is False
    assert IneligibilityReason.COLLECTED_ON in eligibility.reasons
    assert eligibility.freshness is None


@pytest.mark.parametrize(
    ("currency", "unit"),
    [("XOF", None), ("XOF", "  "), (None, "kg"), ("FCFA", "kg"), ("EUR", "kg")],
)
def test_missing_or_unknown_currency_or_unit_is_not_displayable(
    currency: str | None,
    unit: str | None,
) -> None:
    mapped = map_supplier_record(record(currency=currency, unit=unit))

    assert mapped.observation is not None
    assert mapped.observation.unit != "kg" or unit == "kg"
    assert mapped.observation.currency != "XOF" or currency == "XOF"
    eligibility = assess_display(mapped.observation, on_date=ON_DATE)
    assert eligibility.displayable is False


def test_unit_is_preserved_without_conversion() -> None:
    mapped = map_supplier_record(record(unit="sac"))

    assert mapped.observation is not None
    assert mapped.observation.unit == "sac"
    eligibility = assess_display(mapped.observation, on_date=ON_DATE)
    assert eligibility.displayable is True


@pytest.mark.parametrize(
    ("product", "market"),
    [("mais", "natitingou"), ("maize", "parakou"), ("MAIZE", "NATITINGOU")],
)
def test_unknown_product_or_market_is_rejected(product: str, market: str) -> None:
    mapped = map_supplier_record(record(product=product, market=market))

    assert mapped.observation is None
    assert mapped.reason is not None
    assert mapped.reason.value in {"product", "market"}


def test_duplicate_source_id_keeps_the_latest_retrieval() -> None:
    first = map_supplier_record(
        record(amount="200", retrieved_at=datetime(2026, 11, 21, 8, 0)),
        observation_id=UUID("22222222-2222-2222-2222-222222222222"),
    )
    second = map_supplier_record(
        record(amount="210", retrieved_at=datetime(2026, 11, 22, 8, 0)),
        observation_id=UUID("33333333-3333-3333-3333-333333333333"),
    )
    assert first.observation is not None
    assert second.observation is not None

    kept = deduplicate_observations([first.observation, second.observation])
    again = deduplicate_observations(kept)

    assert len(kept) == 1
    assert kept[0].amount == Decimal("210")
    assert again == kept


def test_equal_retrieval_time_keeps_the_first_observation() -> None:
    first = map_supplier_record(
        record(amount="200"),
        observation_id=UUID("22222222-2222-2222-2222-222222222222"),
    )
    second = map_supplier_record(
        record(amount="210"),
        observation_id=UUID("33333333-3333-3333-3333-333333333333"),
    )
    assert first.observation is not None
    assert second.observation is not None

    kept = deduplicate_observations([first.observation, second.observation])

    assert kept[0].observation_id == first.observation.observation_id


@pytest.mark.parametrize(
    ("collected_on", "expected"),
    [
        (date(2026, 11, 22), Freshness.FRESH),
        (date(2026, 11, 20), Freshness.FRESH),
        (date(2026, 11, 19), Freshness.AGING),
        (date(2026, 11, 17), Freshness.AGING),
        (date(2026, 11, 16), Freshness.STALE),
    ],
)
def test_provisional_freshness_bands(collected_on: date, expected: Freshness) -> None:
    assert freshness_on(collected_on, ON_DATE) is expected


def test_stale_validated_observation_stays_displayable() -> None:
    mapped = map_supplier_record(record(collected_on="2026-11-01"))

    assert mapped.observation is not None
    eligibility = assess_display(mapped.observation, on_date=ON_DATE)
    assert eligibility.freshness is Freshness.STALE
    assert eligibility.displayable is True

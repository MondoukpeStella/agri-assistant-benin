from datetime import date

from app.services.wfp_prices import WfpRow, latest_observations, product_for_commodity


def row(**overrides: object) -> WfpRow:
    values: dict[str, object] = {
        "product": "maize",
        "market": "natitingou",
        "market_id": "1757",
        "commodity": "Maize (white)",
        "amount": "165",
        "currency": "XOF",
        "unit": "KG",
        "collected_on": date(2026, 10, 15),
        "priceflag": "actual",
        "pricetype": "Retail",
    }
    values.update(overrides)
    return WfpRow(**values)


def test_commodity_names_map_only_when_they_are_maize_or_rice() -> None:
    assert product_for_commodity("Maize (white)") == "maize"
    assert product_for_commodity("Rice (imported)") == "rice"
    assert product_for_commodity("Cassava meal (gari)") is None
    assert product_for_commodity("Maize flour") is None


def test_latest_point_of_each_commodity_is_kept() -> None:
    older = row(collected_on=date(2026, 9, 15), amount="140")
    newer = row(amount="165")
    yellow = row(commodity="Maize (yellow)", amount="176.5")
    forecast = row(commodity="Maize (yellow)", priceflag="forecast", amount="1")

    chosen = latest_observations(
        (older, newer, yellow, forecast), product="maize", market="natitingou"
    )

    assert [item.amount for item in chosen] == ["176.5", "165"]
    assert chosen[1].collected_on == date(2026, 10, 15)
    assert all(item.priceflag == "actual" for item in chosen)


def test_an_empty_market_returns_no_price() -> None:
    assert latest_observations((row(),), product="rice", market="savalou") == []

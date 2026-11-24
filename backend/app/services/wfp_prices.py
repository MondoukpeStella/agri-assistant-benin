"""Published WFP food prices for Natitingou and Savalou.

The figures come from the HDX dataset "Benin - Food Prices". They are copied
as published. A monthly observation is never marked as the current price.
"""

import csv
from dataclasses import dataclass
from datetime import date
from decimal import Decimal, InvalidOperation
from functools import lru_cache
from pathlib import Path

SOURCE = "wfp"
SOURCE_TITLE = "Benin - Food Prices"
SOURCE_URL = "https://data.humdata.org/dataset/wfp-food-prices-for-benin"
LICENSE = "CC-BY-IGO"
DATASET_UPDATED_ON = date(2026, 11, 15)
DEFAULT_PATH = (
    Path(__file__).resolve().parents[2]
    / "data"
    / "wfp"
    / "wfp_maize_rice_natitingou_savalou.csv"
)

_MARKETS = {"natitingou": "natitingou", "savalou": "savalou"}


@dataclass(frozen=True)
class WfpRow:
    product: str
    market: str
    market_id: str
    commodity: str
    amount: str
    currency: str
    unit: str
    collected_on: date
    priceflag: str
    pricetype: str


def product_for_commodity(commodity: str) -> str | None:
    name = commodity.strip().lower()
    if name == "maize" or name.startswith("maize ("):
        return "maize"
    if name == "rice" or name.startswith("rice ("):
        return "rice"
    return None


def load_catalog(path: Path) -> tuple[WfpRow, ...]:
    rows: list[WfpRow] = []
    with path.open(newline="", encoding="utf-8") as handle:
        for raw in csv.DictReader(handle):
            parsed = _parse_row(raw)
            if parsed is not None:
                rows.append(parsed)
    return tuple(rows)


_COMMODITY_LABELS = {
    "Maize": "Maïs",
    "Maize (white)": "Maïs blanc",
    "Maize (yellow)": "Maïs jaune",
    "Rice (imported)": "Riz importé",
    "Rice (local)": "Riz local",
    "Rice (Broken, local)": "Riz brisé local",
    "Rice (milled, local)": "Riz usiné local",
    "Rice (paddy)": "Riz paddy",
}
_PRODUCT_LABELS = {"maize": "maïs", "rice": "riz"}
_MARKET_LABELS = {"natitingou": "Natitingou", "savalou": "Savalou"}


def published_french_reply(product: str, market: str) -> str | None:
    rows = latest_observations(published_catalog(), product=product, market=market)
    if not rows:
        return None
    newest = max(row.collected_on for row in rows)
    published = [row for row in rows if row.collected_on == newest]
    published.sort(key=lambda item: item.commodity)
    intro = (
        f"Prix publié par le PAM pour le {_PRODUCT_LABELS[product]} "
        f"à {_MARKET_LABELS[market]}, collecté le {newest.isoformat()}. "
        "Ce n'est pas le prix du jour."
    )
    lines = [
        f"{_COMMODITY_LABELS.get(row.commodity, row.commodity)} : "
        f"{row.amount} XOF/{row.unit}."
        for row in published
    ]
    return "\n".join([intro, *lines])


def latest_observations(
    rows: tuple[WfpRow, ...] | list[WfpRow],
    *,
    product: str,
    market: str,
) -> list[WfpRow]:
    chosen: dict[str, WfpRow] = {}
    for row in rows:
        if row.product != product or row.market != market:
            continue
        if row.priceflag != "actual" or row.pricetype != "Retail":
            continue
        if row.currency != "XOF":
            continue
        current = chosen.get(row.commodity)
        if current is None or row.collected_on > current.collected_on:
            chosen[row.commodity] = row
    return sorted(
        chosen.values(),
        key=lambda item: (item.collected_on, item.commodity),
        reverse=True,
    )


@lru_cache(maxsize=1)
def published_catalog() -> tuple[WfpRow, ...]:
    return load_catalog(DEFAULT_PATH)


def _parse_row(raw: dict[str, str]) -> WfpRow | None:
    product = product_for_commodity(raw.get("commodity", ""))
    market = _MARKETS.get(raw.get("market", "").strip().lower())
    if product is None or market is None:
        return None
    if raw.get("priceflag") != "actual" or raw.get("pricetype") != "Retail":
        return None
    if raw.get("currency", "").strip() != "XOF":
        return None
    amount = raw.get("price", "").strip()
    if _published_amount(amount) is None:
        return None
    try:
        collected_on = date.fromisoformat(raw.get("date", "").strip())
    except ValueError:
        return None
    unit = raw.get("unit", "").strip()
    market_id = raw.get("market_id", "").strip()
    commodity = raw.get("commodity", "").strip()
    if not unit or not market_id or not commodity:
        return None
    return WfpRow(
        product=product,
        market=market,
        market_id=market_id,
        commodity=commodity,
        amount=amount,
        currency="XOF",
        unit=unit,
        collected_on=collected_on,
        priceflag="actual",
        pricetype="Retail",
    )


def _published_amount(value: str) -> Decimal | None:
    if not value or any(character in value for character in "eE"):
        return None
    try:
        amount = Decimal(value)
    except InvalidOperation:
        return None
    if not amount.is_finite() or amount <= 0:
        return None
    return amount

from fastapi.testclient import TestClient


def test_wfp_route_returns_the_published_october_observations(
    client: TestClient,
) -> None:
    response = client.get(
        "/api/v1/prices/wfp",
        params={"product": "maize", "market": "natitingou"},
    )

    body = response.json()
    assert response.status_code == 200
    assert body["status"] == "published_series"
    assert body["current"] is False
    assert body["source"] == "wfp"
    assert body["license"] == "CC-BY-IGO"
    published = {item["commodity"]: item for item in body["observations"]}
    assert published["Maize (white)"]["amount"] == "165"
    assert published["Maize (white)"]["collected_on"] == "2026-10-15"
    assert published["Maize (white)"]["currency"] == "XOF"
    assert published["Maize (white)"]["unit"] == "KG"
    assert published["Maize (yellow)"]["amount"] == "176.5"
    assert "validated" not in response.text


def test_wfp_route_keeps_the_published_decimal(client: TestClient) -> None:
    response = client.get(
        "/api/v1/prices/wfp",
        params={"product": "rice", "market": "savalou"},
    )

    published = {item["commodity"]: item for item in response.json()["observations"]}
    assert published["Rice (imported)"]["amount"] == "718.25"
    assert published["Rice (imported)"]["collected_on"] == "2026-10-15"


def test_wfp_route_rejects_a_market_outside_the_extract(client: TestClient) -> None:
    response = client.get(
        "/api/v1/prices/wfp",
        params={"product": "maize", "market": "parakou"},
    )

    assert response.status_code == 422
    assert "718.25" not in response.text
    assert "165" not in response.text

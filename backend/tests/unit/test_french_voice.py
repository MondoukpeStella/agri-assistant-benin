import base64

from fastapi.testclient import TestClient

from app.services.french_voice import (
    FrenchLanguageModel,
    FrenchUnderstanding,
    answer_french_text,
    parse_model_json,
)


class PriceInventingModel(FrenchLanguageModel):
    def understand(self, text: str) -> FrenchUnderstanding:
        return FrenchUnderstanding(
            product="maize", market="natitingou", understood=True
        )


def test_a_clear_maize_question_quotes_the_published_wfp_price() -> None:
    answer = answer_french_text("Quel est le prix du maïs à Natitingou ?")

    assert answer["status"] == "published_price"
    assert answer["product"] == "maize"
    assert answer["market"] == "natitingou"
    assert "2026-10-15" in answer["reply"]
    assert "Maïs blanc : 165 XOF/KG." in answer["reply"]
    assert "Maïs jaune : 176.5 XOF/KG." in answer["reply"]
    assert "Ce n'est pas le prix du jour." in answer["reply"]
    assert "250" not in answer["reply"]
    assert "FCFA" not in answer["reply"]


def test_a_missing_market_asks_for_one_place() -> None:
    answer = answer_french_text("Quel est le prix du riz ?")

    assert answer["status"] == "clarification"
    assert answer["product"] == "rice"
    assert "Natitingou" in answer["reply"]
    assert "250" not in answer["reply"]


def test_soja_and_parakou_stay_out_of_scope() -> None:
    soja = answer_french_text("Quel est le prix du soja à Natitingou ?")
    parakou = answer_french_text("Quel est le prix du maïs à Parakou ?")

    assert soja["status"] == "unsupported_product"
    assert soja["product"] is None
    assert parakou["status"] == "uncovered_market"
    assert parakou["market"] is None


def test_a_model_cannot_insert_a_price() -> None:
    parsed = parse_model_json(
        '{"product":"maize","market":"natitingou","amount":"250","currency":"FCFA"}'
    )
    answer = answer_french_text("c'est combien là-bas", model=PriceInventingModel())

    assert parsed.product == "maize"
    assert not hasattr(parsed, "amount")
    assert "165 XOF/KG" in answer["reply"]
    assert "250" not in answer["reply"]
    assert "FCFA" not in answer["reply"]


def test_french_voice_route_returns_no_amount(client: TestClient) -> None:
    response = client.post(
        "/api/v1/voice/french",
        json={"text": "Quel est le prix du maïs à Natitingou ?"},
    )

    body = response.json()
    assert response.status_code == 200
    assert body["status"] == "published_price"
    assert "amount" not in body
    assert "Maïs blanc : 165 XOF/KG." in body["reply"]
    assert "250" not in response.text
    assert "FCFA" not in response.text


def test_audio_without_the_speech_model_is_not_a_price(client: TestClient) -> None:
    response = client.post(
        "/api/v1/voice/french",
        json={"audio_base64": base64.b64encode(b"not-audio").decode("ascii")},
    )

    body = response.json()
    assert response.status_code == 200
    assert body["status"] == "recognition_unavailable"
    assert "amount" not in body
    assert "250" not in response.text

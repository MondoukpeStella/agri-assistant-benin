from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app

VERIFY_TOKEN = "verify-token-for-tests"


def _client(token: str = VERIFY_TOKEN) -> TestClient:
    settings = Settings(
        app_env="test",
        database_url="",
        whatsapp_verify_token=token,
        _env_file=None,
    )
    return TestClient(create_app(settings))


def test_meta_verification_returns_the_challenge() -> None:
    response = _client().get(
        "/whatsapp/meta",
        params={
            "hub.mode": "subscribe",
            "hub.verify_token": VERIFY_TOKEN,
            "hub.challenge": "12345",
        },
    )

    assert response.status_code == 200
    assert response.text == "12345"


def test_meta_verification_rejects_a_different_token() -> None:
    response = _client().get(
        "/whatsapp/meta",
        params={
            "hub.mode": "subscribe",
            "hub.verify_token": "other-token",
            "hub.challenge": "12345",
        },
    )

    assert response.status_code == 403
    assert response.text == "verification_failed"
    assert "12345" not in response.text
    assert VERIFY_TOKEN not in response.text


def test_meta_verification_rejects_an_empty_configured_token() -> None:
    response = _client(token="").get(
        "/whatsapp/meta",
        params={
            "hub.mode": "subscribe",
            "hub.verify_token": "",
            "hub.challenge": "12345",
        },
    )

    assert response.status_code == 403
    assert "12345" not in response.text

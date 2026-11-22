import logging

import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app


def test_valid_probe_confirms_validation_without_returning_a_price(
    client: TestClient,
) -> None:
    response = client.post("/api/v1/probe", json={"message": "ready"})

    assert response.status_code == 200
    assert response.json() == {"accepted": True}


def test_malformed_json_returns_a_structured_client_error(client: TestClient) -> None:
    response = client.post(
        "/api/v1/probe",
        content=b"{",
        headers={"content-type": "application/json"},
    )

    assert response.status_code == 422
    assert response.json() == {"error": "invalid_request"}
    assert "price" not in response.text.lower()


def test_invalid_probe_field_does_not_echo_the_payload(client: TestClient) -> None:
    secret = "payload-secret-value"
    response = client.post("/api/v1/probe", json={"message": secret * 5})

    assert response.status_code == 422
    assert response.json() == {"error": "invalid_request"}
    assert secret not in response.text


def test_unhandled_exception_returns_a_generic_error_and_logs_the_detail(
    caplog: pytest.LogCaptureFixture,
) -> None:
    settings = Settings(app_env="test", _env_file=None)
    app = create_app(settings)

    @app.get("/_test/failure")
    def failure() -> None:
        raise RuntimeError("password=super-secret path=/tmp/internal")

    caplog.set_level(logging.ERROR)
    response = TestClient(app, raise_server_exceptions=False).get("/_test/failure")

    assert response.status_code == 500
    assert response.json() == {"error": "internal_error"}
    assert "super-secret" not in response.text
    assert "/tmp/internal" not in response.text
    assert "super-secret" in caplog.text


def test_production_hides_interactive_docs(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.delenv("LOG_LEVEL", raising=False)
    from app.core.config import load_settings

    app = create_app(load_settings(env_file=None))
    client = TestClient(app)

    assert app.docs_url is None
    assert client.get("/docs").status_code == 404
    assert client.get("/openapi.json").status_code == 404

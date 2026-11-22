from fastapi.testclient import TestClient


def test_health_returns_a_minimal_status(client: TestClient) -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
    body = response.text.lower()
    assert "postgres" not in body
    assert "database" not in body
    assert "price" not in body
    assert "secret" not in body


def test_app_starts_with_minimal_configuration(client: TestClient) -> None:
    assert client.app.state.settings.app_env == "test"
    assert client.app.state.settings.log_level == "INFO"
    assert client.get("/health").status_code == 200

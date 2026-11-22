import pytest

from app.core.config import load_settings


def test_missing_required_variable_fails_without_leaking_values(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.delenv("APP_ENV", raising=False)
    monkeypatch.setenv("UNRELATED_TOKEN", "token-should-not-leak")

    with pytest.raises(SystemExit) as caught:
        load_settings(env_file=None)

    message = str(caught.value)
    assert "app_env" in message
    assert "absente" in message
    assert "token-should-not-leak" not in message


def test_invalid_required_variable_does_not_echo_the_value(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("APP_ENV", "super-secret-value")

    with pytest.raises(SystemExit) as caught:
        load_settings(env_file=None)

    message = str(caught.value)
    assert "app_env" in message
    assert "invalide" in message
    assert "super-secret-value" not in message


def test_missing_optional_variable_uses_the_documented_default(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("APP_ENV", "test")
    monkeypatch.delenv("LOG_LEVEL", raising=False)
    monkeypatch.delenv("CORS_ORIGINS", raising=False)

    settings = load_settings(env_file=None)

    assert settings.app_env == "test"
    assert settings.log_level == "INFO"
    assert settings.cors_origin_list == []


def test_wildcard_cors_origin_is_rejected(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.setenv("CORS_ORIGINS", "*")

    with pytest.raises(SystemExit) as caught:
        load_settings(env_file=None)

    assert "cors_origins" in str(caught.value)
    assert "*" not in str(caught.value)

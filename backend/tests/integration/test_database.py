import logging
import os

import pytest
from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text

from app.core.config import load_settings
from app.services.database import probe_database


def test_process_health_stays_independent_of_the_database(client: TestClient) -> None:
    health = client.get("/health")
    status = client.get("/database/status")

    assert health.status_code == 200
    assert health.json() == {"status": "ok"}
    assert "database" not in health.text.lower()
    assert status.status_code == 503
    assert status.json() == {"status": "unavailable"}


def test_failed_connection_does_not_log_the_password(
    monkeypatch: pytest.MonkeyPatch,
    caplog: pytest.LogCaptureFixture,
) -> None:
    monkeypatch.setenv("APP_ENV", "test")
    monkeypatch.setenv(
        "DATABASE_URL",
        "postgresql+psycopg://agri:super-secret-db@127.0.0.1:1/agri_test",
    )
    settings = load_settings(env_file=None)

    with caplog.at_level(logging.WARNING):
        available = probe_database(settings.database_url)

    assert available is False
    assert "super-secret-db" not in caplog.text


def test_migrations_apply_once_on_the_test_database(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    url = os.environ.get("DATABASE_URL", "").strip()
    if not url:
        pytest.skip("DATABASE_URL is not set")
    monkeypatch.setenv("APP_ENV", "test")
    monkeypatch.setenv("DATABASE_URL", url)
    settings = load_settings(env_file=None)
    if not probe_database(settings.database_url):
        pytest.skip("test PostgreSQL is not reachable")

    config = Config("alembic.ini")
    applied = False
    try:
        command.upgrade(config, "head")
        applied = True
        command.upgrade(config, "head")
        engine = create_engine(settings.database_url)
        with engine.connect() as connection:
            count = connection.execute(
                text("SELECT COUNT(*) FROM alembic_version")
            ).scalar_one()
            tables = connection.execute(
                text("SELECT tablename FROM pg_tables WHERE schemaname = 'public'")
            ).scalars()
            names = sorted(tables)
        engine.dispose()
        assert count == 1
        assert names == ["alembic_version"]
    finally:
        if applied:
            command.downgrade(config, "base")

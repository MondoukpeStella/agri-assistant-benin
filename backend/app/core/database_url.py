from sqlalchemy.engine import make_url
from sqlalchemy.exc import ArgumentError

DEV_DATABASE_NAME = "agri_dev"
TEST_DATABASE_NAME = "agri_test"
_ALLOWED_DRIVERS = frozenset({"postgresql", "postgresql+psycopg"})


def normalize_database_url(app_env: str | None, value: str) -> str:
    """Accept an empty URL, or a PostgreSQL URL for the environment's own database."""

    url = value.strip()
    if url == "":
        return ""
    try:
        parsed = make_url(url)
    except ArgumentError as exc:
        raise ValueError("invalid database url") from exc
    if parsed.drivername not in _ALLOWED_DRIVERS:
        raise ValueError("invalid database url")
    name = parsed.database or ""
    if app_env == "test" and name != TEST_DATABASE_NAME:
        raise ValueError("invalid database url")
    if app_env == "development" and name != DEV_DATABASE_NAME:
        raise ValueError("invalid database url")
    if app_env == "production" and name in {"", DEV_DATABASE_NAME, TEST_DATABASE_NAME}:
        raise ValueError("invalid database url")
    return url

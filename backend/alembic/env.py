from alembic import context
from sqlalchemy import create_engine

from app.core.config import load_settings

config = context.config


def _database_url() -> str:
    settings = load_settings()
    if not settings.database_url:
        raise SystemExit("Configuration invalide : database_url absente.")
    return settings.database_url


def run_migrations_offline() -> None:
    context.configure(url=_database_url(), target_metadata=None, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = create_engine(_database_url())
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=None)
        with context.begin_transaction():
            context.run_migrations()
    connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

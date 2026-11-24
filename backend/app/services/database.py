import logging

from sqlalchemy import create_engine, text

logger = logging.getLogger(__name__)


def probe_database(url: str) -> bool:
    """Return whether PostgreSQL accepts a connection.

    Failures are logged without the URL, so a password cannot appear in the log.
    """

    if not url:
        return False
    engine = create_engine(
        url,
        pool_pre_ping=True,
        connect_args={"connect_timeout": 2},
    )
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception:
        logger.warning("Connexion PostgreSQL impossible.")
        return False
    else:
        return True
    finally:
        engine.dispose()

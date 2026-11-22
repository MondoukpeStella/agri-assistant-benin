import logging

from app.core.config import Settings


def configure_logging(settings: Settings) -> None:
    logging.basicConfig(
        level=settings.log_level, format="%(levelname)s %(name)s %(message)s"
    )

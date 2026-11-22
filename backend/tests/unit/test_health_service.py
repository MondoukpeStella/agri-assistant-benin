from app.services.health import get_process_health


def test_process_health_reports_only_that_the_process_is_up() -> None:
    assert get_process_health().model_dump() == {"status": "ok"}

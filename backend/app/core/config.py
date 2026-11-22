from pathlib import Path
from typing import Literal

from pydantic import Field, ValidationError, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

AppEnv = Literal["development", "test", "production"]
LogLevel = Literal["DEBUG", "INFO", "WARNING", "ERROR"]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: AppEnv
    log_level: LogLevel = "INFO"
    cors_origins: str = Field(default="")

    @field_validator("cors_origins")
    @classmethod
    def reject_wildcard_origin(cls, value: str) -> str:
        origins = [item.strip() for item in value.split(",") if item.strip()]
        if "*" in origins:
            raise ValueError("wildcard origin")
        return value

    @property
    def cors_origin_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]


def load_settings(*, env_file: str | None = ".env") -> Settings:
    selected_file = env_file
    if selected_file == ".env" and not Path(".env").is_file():
        selected_file = None

    try:
        return Settings(_env_file=selected_file)
    except ValidationError as exc:
        raise SystemExit(_configuration_message(exc)) from None


def _configuration_message(exc: ValidationError) -> str:
    problems: list[str] = []
    for error in exc.errors():
        name = ".".join(str(part) for part in error["loc"]) or "configuration"
        if error["type"] == "missing":
            problems.append(f"{name} absente")
        else:
            problems.append(f"{name} invalide")
    detail = ", ".join(problems) or "paramètres refusés"
    return f"Configuration invalide : {detail}."

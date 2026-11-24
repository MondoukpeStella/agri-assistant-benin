from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.database import router as database_router
from app.api.health import router as health_router
from app.api.v1.french_voice import router as french_voice_router
from app.api.v1.probe import router as probe_router
from app.api.v1.wfp_prices import router as wfp_prices_router
from app.core.config import Settings, load_settings
from app.core.errors import register_exception_handlers
from app.core.logging import configure_logging


def create_app(settings: Settings | None = None) -> FastAPI:
    resolved = settings if settings is not None else load_settings()
    configure_logging(resolved)

    app = FastAPI(
        title="Assistant agricole",
        version="0.1.0",
        docs_url=None if resolved.app_env == "production" else "/docs",
        redoc_url=None if resolved.app_env == "production" else "/redoc",
        openapi_url=None if resolved.app_env == "production" else "/openapi.json",
    )
    app.state.settings = resolved
    register_exception_handlers(app)

    if resolved.cors_origin_list:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=resolved.cors_origin_list,
            allow_credentials=False,
            allow_methods=["GET", "POST"],
            allow_headers=["content-type"],
        )

    app.include_router(health_router)
    app.include_router(database_router)
    app.include_router(probe_router)
    app.include_router(french_voice_router)
    app.include_router(wfp_prices_router)
    return app

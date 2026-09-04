from fastapi import (
    FastAPI,
    Response,
)

from fastapi.middleware.cors import CORSMiddleware

from prometheus_client import (
    CONTENT_TYPE_LATEST,
    generate_latest,
)

from sqlalchemy import text

from app.config import settings

from app.database import (
    SessionLocal,
    engine,
)

from app.db_observability import (
    install_database_metrics,
)

from app.observability import (
    RequestObservabilityMiddleware,
    configure_logging,
)

from app.routes import (
    auth,
    drivers,
    orders,
    restaurants,
)


configure_logging()

install_database_metrics(
    engine
)


app = FastAPI(
    title="Mini Uber Eats Backend",
    version="1.0.0",
)


app.add_middleware(
    RequestObservabilityMiddleware
)


app.add_middleware(
    CORSMiddleware,

    allow_origins=settings.cors_origin_list,

    allow_credentials=False,

    allow_methods=[
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "OPTIONS",
    ],

    allow_headers=[
        "Accept",
        "Authorization",
        "Content-Type",
        "Idempotency-Key",
        "X-Request-ID",
    ],

    expose_headers=[
        "X-Request-ID",
    ],

    max_age=600,
)


app.include_router(
    auth.router
)

app.include_router(
    restaurants.router
)

app.include_router(
    orders.router
)

app.include_router(
    drivers.router
)


@app.get("/")
def root():
    return {
        "message": (
            "Mini Uber Eats Backend "
            "is running"
        )
    }


@app.get("/health")
def health():
    return {
        "status": "ok"
    }


@app.get(
    "/database-health"
)
def database_health():

    db = SessionLocal()

    try:

        db.execute(
            text(
                "SELECT 1"
            )
        )

        return {
            "status": "ok",
            "database": "connected"
        }

    finally:

        db.close()


@app.get(
    "/metrics",
    include_in_schema=False
)
def metrics():

    return Response(
        content=generate_latest(),
        media_type=(
            CONTENT_TYPE_LATEST
        )
    )
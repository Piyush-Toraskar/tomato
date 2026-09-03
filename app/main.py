from fastapi import (
    FastAPI,
    Response,
)

from prometheus_client import (
    CONTENT_TYPE_LATEST,
    generate_latest,
)

from sqlalchemy import text

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
    version="1.0.0"
)


app.add_middleware(
    RequestObservabilityMiddleware
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
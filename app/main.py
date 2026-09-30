import asyncio
from contextlib import asynccontextmanager, suppress

from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest
from sqlalchemy import text

from app.config import settings
from app.database import SessionLocal, engine
from app.db_observability import install_database_metrics
from app.kafka_client import kafka_producer
from app.observability import RequestObservabilityMiddleware, configure_logging
from app.redis_client import redis_client
from app.routes import auth, drivers, orders, restaurants
from app.workers.order_consumer import run_order_consumer

configure_logging()
install_database_metrics(engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await redis_client.connect()
    await kafka_producer.start()
    consumer_task = asyncio.create_task(run_order_consumer())
    yield
    consumer_task.cancel()
    with suppress(asyncio.CancelledError):
        await consumer_task
    await kafka_producer.stop()
    await redis_client.disconnect()


app = FastAPI(title="Tomato Food Delivery API", version="2.0.0", lifespan=lifespan)
app.add_middleware(RequestObservabilityMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Accept", "Authorization", "Content-Type", "Idempotency-Key", "X-Request-ID"],
    expose_headers=["X-Request-ID"],
    max_age=600,
)

app.include_router(auth.router)
app.include_router(restaurants.router)
app.include_router(orders.router)
app.include_router(drivers.router)


@app.get("/")
def root():
    return {"message": "Tomato Food Delivery API is running"}


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/database-health")
def database_health():
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    finally:
        db.close()


@app.get("/metrics", include_in_schema=False)
def metrics():
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

import os

from pathlib import Path


os.environ["APP_ENV"] = "test"


# Local development already has valid PostgreSQL
# credentials inside .env.
#
# CI does not have .env, so it supplies credentials
# through environment variables instead.
if not Path(".env").exists():
    os.environ.setdefault(
        "DB_PASSWORD",
        "test-password"
    )


os.environ.setdefault(
    "SECRET_KEY",
    "test-secret-key-that-is-only-used-by-pytest"
)

os.environ.setdefault(
    "ACCESS_TOKEN_EXPIRE_MINUTES",
    "15"
)

os.environ.setdefault(
    "REFRESH_TOKEN_EXPIRE_DAYS",
    "7"
)

os.environ.setdefault(
    "EMAIL_VERIFICATION_EXPIRE_MINUTES",
    "60"
)

os.environ.setdefault(
    "PASSWORD_RESET_EXPIRE_MINUTES",
    "30"
)

os.environ.setdefault(
    "EXPOSE_DEBUG_TOKENS",
    "true"
)


import pytest

from fastapi import FastAPI
from fastapi.testclient import TestClient

from sqlalchemy import (
    create_engine,
    event
)

from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db

from app.routes import (
    auth,
    drivers,
    orders,
    restaurants
)


TEST_DATABASE_URL = "sqlite://"


test_engine = create_engine(
    TEST_DATABASE_URL,

    connect_args={
        "check_same_thread": False
    },

    poolclass=StaticPool
)


@event.listens_for(
    test_engine,
    "connect"
)
def enable_sqlite_foreign_keys(
    dbapi_connection,
    connection_record
):
    cursor = (
        dbapi_connection.cursor()
    )

    cursor.execute(
        "PRAGMA foreign_keys=ON"
    )

    cursor.close()


TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine
)


def override_get_db():
    db = TestingSessionLocal()

    try:
        yield db

    finally:
        db.close()


@pytest.fixture()
def client():

    Base.metadata.drop_all(
        bind=test_engine
    )

    Base.metadata.create_all(
        bind=test_engine
    )

    test_app = FastAPI()

    test_app.include_router(
        auth.router
    )

    test_app.include_router(
        restaurants.router
    )

    test_app.include_router(
        orders.router
    )

    test_app.include_router(
        drivers.router
    )

    test_app.dependency_overrides[
        get_db
    ] = override_get_db

    with TestClient(
        test_app
    ) as test_client:
        yield test_client

    Base.metadata.drop_all(
        bind=test_engine
    )
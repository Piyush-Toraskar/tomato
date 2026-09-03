import os
import subprocess
import sys

from pathlib import Path

import pytest

from sqlalchemy import (
    create_engine,
    inspect,
    text
)

from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker

from app.config import settings


PROJECT_ROOT = (
    Path(__file__)
    .resolve()
    .parents[2]
)


def build_test_database_url():

    test_database_name = os.getenv(
        "TEST_DB_NAME",
        "mini_uber_test"
    )

    if "test" not in test_database_name.lower():
        pytest.fail(
            "TEST_DB_NAME must contain 'test'. "
            "Refusing to run destructive "
            "PostgreSQL integration tests."
        )

    production_url = make_url(
        settings.sqlalchemy_database_url
    )

    production_database = (
        production_url.database
    )

    if (
        production_database
        == test_database_name
        and production_database
        == "mini_uber"
    ):
        pytest.fail(
            "PostgreSQL integration tests "
            "cannot use the development database."
        )

    test_url = production_url.set(
        database=test_database_name
    )

    return test_url.render_as_string(
        hide_password=False
    )


@pytest.fixture(
    scope="session"
)
def postgres_test_url():

    if os.getenv(
        "RUN_POSTGRES_TESTS"
    ) != "1":
        pytest.skip(
            "Set RUN_POSTGRES_TESTS=1 "
            "to run PostgreSQL integration tests."
        )

    return build_test_database_url()


@pytest.fixture(
    scope="session"
)
def migrated_postgres_engine(
    postgres_test_url
):

    bootstrap_engine = create_engine(
        postgres_test_url,
        isolation_level="AUTOCOMMIT"
    )

    try:
        with bootstrap_engine.connect() as connection:

            # This destroys ONLY the dedicated
            # test database schema.
            connection.execute(
                text(
                    "DROP SCHEMA IF EXISTS "
                    "public CASCADE"
                )
            )

            connection.execute(
                text(
                    "CREATE SCHEMA public"
                )
            )

    except Exception as exc:
        pytest.fail(
            "Could not reset PostgreSQL test "
            "database. Ensure mini_uber_test "
            "exists and credentials are correct.\n"
            f"{exc}"
        )

    finally:
        bootstrap_engine.dispose()

    migration_environment = (
        os.environ.copy()
    )

    migration_environment[
        "DATABASE_URL"
    ] = postgres_test_url

    migration_environment[
        "APP_ENV"
    ] = "test"

    result = subprocess.run(
        [
            sys.executable,
            "-m",
            "alembic",
            "upgrade",
            "head"
        ],
        cwd=PROJECT_ROOT,
        env=migration_environment,
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        pytest.fail(
            "Alembic failed against a fresh "
            "PostgreSQL database.\n\n"
            f"STDOUT:\n{result.stdout}\n\n"
            f"STDERR:\n{result.stderr}"
        )

    engine = create_engine(
        postgres_test_url,
        pool_pre_ping=True
    )

    yield engine

    engine.dispose()


@pytest.fixture()
def postgres_session_factory(
    migrated_postgres_engine
):
    return sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=migrated_postgres_engine
    )


@pytest.fixture(
    autouse=True
)
def clean_postgres_database(
    migrated_postgres_engine
):
    yield

    inspector = inspect(
        migrated_postgres_engine
    )

    table_names = [
        table_name
        for table_name
        in inspector.get_table_names()
        if table_name
        != "alembic_version"
    ]

    if not table_names:
        return

    quoted_tables = ", ".join(
        f'"{table_name}"'
        for table_name in table_names
    )

    with migrated_postgres_engine.begin() as connection:

        connection.execute(
            text(
                f"TRUNCATE TABLE "
                f"{quoted_tables} "
                f"RESTART IDENTITY CASCADE"
            )
        )
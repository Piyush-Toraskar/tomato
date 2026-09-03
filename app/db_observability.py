from time import perf_counter

from sqlalchemy import event
from sqlalchemy.engine import Engine

from app.metrics import (
    DB_CONNECTIONS_IN_USE,
    DB_QUERY_DURATION_SECONDS,
    DB_QUERY_ERRORS_TOTAL,
)


QUERY_TIMER_KEY = "_mini_uber_query_timers"


def get_operation(
    statement: str
) -> str:
    """
    Convert SQL such as:

        SELECT * FROM orders ...

    into:

        SELECT

    We deliberately do NOT use the complete SQL statement
    as a Prometheus label because that would create a very
    high number of metric label combinations.
    """

    cleaned_statement = statement.strip()

    if not cleaned_statement:
        return "UNKNOWN"

    return (
        cleaned_statement
        .split(None, 1)[0]
        .upper()
    )


def install_database_metrics(
    engine: Engine
) -> None:

    # Prevent registering the same SQLAlchemy event
    # handlers more than once in a process.
    if getattr(
        engine,
        "_mini_uber_metrics_installed",
        False
    ):
        return

    setattr(
        engine,
        "_mini_uber_metrics_installed",
        True
    )

    # -----------------------------------------------------
    # QUERY START
    # -----------------------------------------------------

    @event.listens_for(
        engine,
        "before_cursor_execute"
    )
    def before_cursor_execute(
        conn,
        cursor,
        statement,
        parameters,
        context,
        executemany
    ):
        timers = conn.info.setdefault(
            QUERY_TIMER_KEY,
            []
        )

        timers.append(
            (
                perf_counter(),
                get_operation(statement)
            )
        )

    # -----------------------------------------------------
    # SUCCESSFUL QUERY
    # -----------------------------------------------------

    @event.listens_for(
        engine,
        "after_cursor_execute"
    )
    def after_cursor_execute(
        conn,
        cursor,
        statement,
        parameters,
        context,
        executemany
    ):
        timers = conn.info.get(
            QUERY_TIMER_KEY,
            []
        )

        if not timers:
            return

        start_time, operation = (
            timers.pop()
        )

        duration = (
            perf_counter()
            - start_time
        )

        DB_QUERY_DURATION_SECONDS.labels(
            operation=operation
        ).observe(
            duration
        )

    # -----------------------------------------------------
    # FAILED QUERY
    # -----------------------------------------------------

    @event.listens_for(
        engine,
        "handle_error"
    )
    def handle_database_error(
        exception_context
    ):
        connection = (
            exception_context.connection
        )

        if connection is None:
            return

        timers = connection.info.get(
            QUERY_TIMER_KEY,
            []
        )

        if not timers:
            return

        start_time, operation = (
            timers.pop()
        )

        duration = (
            perf_counter()
            - start_time
        )

        DB_QUERY_DURATION_SECONDS.labels(
            operation=operation
        ).observe(
            duration
        )

        DB_QUERY_ERRORS_TOTAL.labels(
            operation=operation
        ).inc()

    # -----------------------------------------------------
    # CONNECTION POOL
    # -----------------------------------------------------

    @event.listens_for(
        engine.pool,
        "checkout"
    )
    def connection_checked_out(
        dbapi_connection,
        connection_record,
        connection_proxy
    ):
        DB_CONNECTIONS_IN_USE.inc()

    @event.listens_for(
        engine.pool,
        "checkin"
    )
    def connection_checked_in(
        dbapi_connection,
        connection_record
    ):
        DB_CONNECTIONS_IN_USE.dec()
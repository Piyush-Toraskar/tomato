from prometheus_client import (
    Counter,
    Gauge,
    Histogram,
)


# ---------------------------------------------------------
# HTTP METRICS
# ---------------------------------------------------------

HTTP_REQUESTS_TOTAL = Counter(
    "mini_uber_http_requests_total",
    "Total number of HTTP requests",
    [
        "method",
        "route",
        "status",
    ],
)


HTTP_REQUEST_DURATION_SECONDS = Histogram(
    "mini_uber_http_request_duration_seconds",
    "HTTP request duration in seconds",
    [
        "method",
        "route",
    ],
    buckets=(
        0.005,
        0.01,
        0.025,
        0.05,
        0.1,
        0.25,
        0.5,
        1.0,
        2.5,
        5.0,
    ),
)


# ---------------------------------------------------------
# DATABASE METRICS
# ---------------------------------------------------------

DB_QUERY_DURATION_SECONDS = Histogram(
    "mini_uber_db_query_duration_seconds",
    "Database query duration in seconds",
    [
        "operation",
    ],
    buckets=(
        0.001,
        0.005,
        0.01,
        0.025,
        0.05,
        0.1,
        0.25,
        0.5,
        1.0,
        2.5,
    ),
)


DB_QUERY_ERRORS_TOTAL = Counter(
    "mini_uber_db_query_errors_total",
    "Total number of database query failures",
    [
        "operation",
    ],
)


DB_CONNECTIONS_IN_USE = Gauge(
    "mini_uber_db_connections_in_use",
    "Number of database connections currently checked out",
)


# ---------------------------------------------------------
# BUSINESS METRICS
# ---------------------------------------------------------

DRIVER_MATCHING_TOTAL = Counter(
    "mini_uber_driver_matching_total",
    "Driver matching attempts",
    [
        "result",
    ],
)
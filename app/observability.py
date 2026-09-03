import json
import logging
import os
import sys

from datetime import (
    datetime,
    timezone,
)

from time import perf_counter

from uuid import uuid4

from starlette.datastructures import (
    Headers,
    MutableHeaders,
)

from starlette.responses import (
    JSONResponse,
)

from app.metrics import (
    HTTP_REQUEST_DURATION_SECONDS,
    HTTP_REQUESTS_TOTAL,
)


logger = logging.getLogger(
    "mini_uber.http"
)


class JsonFormatter(
    logging.Formatter
):
    def format(
        self,
        record: logging.LogRecord
    ) -> str:

        payload = {
            "timestamp": (
                datetime.now(
                    timezone.utc
                ).isoformat()
            ),
            "level": (
                record.levelname
            ),
            "logger": (
                record.name
            ),
            "message": (
                record.getMessage()
            ),
        }

        optional_fields = (
            "request_id",
            "account_id",
            "method",
            "path",
            "route",
            "status_code",
            "duration_ms",
        )

        for field in optional_fields:

            if hasattr(
                record,
                field
            ):
                payload[field] = getattr(
                    record,
                    field
                )

        if record.exc_info:

            payload[
                "exception"
            ] = self.formatException(
                record.exc_info
            )

        return json.dumps(
            payload,
            default=str
        )


def configure_logging() -> None:

    level_name = os.getenv(
        "LOG_LEVEL",
        "INFO"
    ).upper()

    level = getattr(
        logging,
        level_name,
        logging.INFO
    )

    handler = logging.StreamHandler(
        sys.stdout
    )

    handler.setFormatter(
        JsonFormatter()
    )

    root_logger = logging.getLogger()

    root_logger.handlers.clear()

    root_logger.addHandler(
        handler
    )

    root_logger.setLevel(
        level
    )

    # Our middleware produces a better access log containing
    # request ID, route and latency, so the default Uvicorn
    # access log would just duplicate each HTTP request.
    logging.getLogger(
        "uvicorn.access"
    ).disabled = True


def normalise_request_id(
    incoming_request_id: str | None
) -> str:

    if incoming_request_id is None:
        return uuid4().hex

    incoming_request_id = (
        incoming_request_id.strip()
    )

    if (
        not incoming_request_id
        or len(incoming_request_id) > 128
    ):
        return uuid4().hex

    return incoming_request_id


def get_route_name(
    scope
) -> str:

    route = scope.get(
        "route"
    )

    if route is not None:

        route_path = getattr(
            route,
            "path",
            None
        )

        if route_path:
            return route_path

    return scope.get(
        "path",
        "unknown"
    )


class RequestObservabilityMiddleware:

    def __init__(
        self,
        app
    ):
        self.app = app

    async def __call__(
        self,
        scope,
        receive,
        send
    ):

        if scope["type"] != "http":

            await self.app(
                scope,
                receive,
                send
            )

            return

        headers = Headers(
            scope=scope
        )

        request_id = (
            normalise_request_id(
                headers.get(
                    "X-Request-ID"
                )
            )
        )

        state = scope.setdefault(
            "state",
            {}
        )

        state[
            "request_id"
        ] = request_id

        state[
            "account_id"
        ] = None

        start_time = (
            perf_counter()
        )

        status_code = 500

        response_started = False

        async def send_with_request_id(
            message
        ):
            nonlocal status_code
            nonlocal response_started

            if (
                message["type"]
                == "http.response.start"
            ):
                response_started = True

                status_code = (
                    message["status"]
                )

                response_headers = (
                    MutableHeaders(
                        scope=message
                    )
                )

                response_headers[
                    "X-Request-ID"
                ] = request_id

            await send(
                message
            )

        try:

            await self.app(
                scope,
                receive,
                send_with_request_id
            )

        except Exception:

            route_name = (
                get_route_name(
                    scope
                )
            )

            logger.exception(
                "unhandled_request_exception",
                extra={
                    "request_id": (
                        request_id
                    ),
                    "account_id": (
                        state.get(
                            "account_id"
                        )
                    ),
                    "method": (
                        scope.get(
                            "method"
                        )
                    ),
                    "path": (
                        scope.get(
                            "path"
                        )
                    ),
                    "route": (
                        route_name
                    ),
                    "status_code": 500,
                }
            )

            if response_started:
                raise

            error_response = (
                JSONResponse(
                    status_code=500,
                    content={
                        "detail": (
                            "Internal server error"
                        ),
                        "request_id": (
                            request_id
                        ),
                    }
                )
            )

            await error_response(
                scope,
                receive,
                send_with_request_id
            )

        finally:

            duration_seconds = (
                perf_counter()
                - start_time
            )

            route_name = (
                get_route_name(
                    scope
                )
            )

            method = scope.get(
                "method",
                "UNKNOWN"
            )

            path = scope.get(
                "path",
                "unknown"
            )

            # Avoid making Prometheus scraping itself
            # distort HTTP application metrics.
            if path != "/metrics":

                HTTP_REQUESTS_TOTAL.labels(
                    method=method,
                    route=route_name,
                    status=str(
                        status_code
                    )
                ).inc()

                (
                    HTTP_REQUEST_DURATION_SECONDS
                    .labels(
                        method=method,
                        route=route_name
                    )
                    .observe(
                        duration_seconds
                    )
                )

            logger.info(
                "request_completed",
                extra={
                    "request_id": (
                        request_id
                    ),
                    "account_id": (
                        state.get(
                            "account_id"
                        )
                    ),
                    "method": method,
                    "path": path,
                    "route": route_name,
                    "status_code": (
                        status_code
                    ),
                    "duration_ms": round(
                        duration_seconds
                        * 1000,
                        2
                    ),
                }
            )
import time

from collections import (
    defaultdict,
    deque
)

from threading import Lock

from fastapi import (
    HTTPException,
    Request,
    status
)

from app.config import settings


class InMemoryRateLimiter:
    def __init__(self):
        self.requests = defaultdict(
            deque
        )

        self.lock = Lock()

    def check(
        self,
        key: str,
        limit: int,
        window_seconds: int
    ):
        if settings.app_env == "test":
            return

        now = time.monotonic()

        cutoff = (
            now - window_seconds
        )

        with self.lock:
            timestamps = self.requests[
                key
            ]

            while (
                timestamps
                and timestamps[0] < cutoff
            ):
                timestamps.popleft()

            if len(timestamps) >= limit:
                retry_after = int(
                    timestamps[0]
                    + window_seconds
                    - now
                ) + 1

                raise HTTPException(
                    status_code=(
                        status
                        .HTTP_429_TOO_MANY_REQUESTS
                    ),
                    detail=(
                        "Too many requests. "
                        "Please try again later."
                    ),
                    headers={
                        "Retry-After": str(
                            max(
                                retry_after,
                                1
                            )
                        )
                    }
                )

            timestamps.append(
                now
            )


def get_client_ip(
    request: Request
):
    if request.client is None:
        return "unknown"

    return request.client.host


rate_limiter = InMemoryRateLimiter()
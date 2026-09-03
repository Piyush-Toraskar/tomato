from fastapi import FastAPI

from fastapi.testclient import (
    TestClient,
)

from app.main import app

from app.observability import (
    RequestObservabilityMiddleware,
)


def test_request_id_is_generated():
    with TestClient(
        app
    ) as client:

        response = client.get(
            "/health"
        )

    assert (
        response.status_code
        == 200
    )

    assert (
        "X-Request-ID"
        in response.headers
    )

    assert (
        response.headers[
            "X-Request-ID"
        ]
    )


def test_client_request_id_is_preserved():
    request_id = (
        "integration-test-request-123"
    )

    with TestClient(
        app
    ) as client:

        response = client.get(
            "/health",
            headers={
                "X-Request-ID":
                request_id
            }
        )

    assert (
        response.status_code
        == 200
    )

    assert (
        response.headers[
            "X-Request-ID"
        ]
        == request_id
    )


def test_metrics_endpoint():
    with TestClient(
        app
    ) as client:

        client.get(
            "/health"
        )

        response = client.get(
            "/metrics"
        )

    assert (
        response.status_code
        == 200
    )

    assert (
        "mini_uber_http_requests_total"
        in response.text
    )

    assert (
        "mini_uber_http_request_duration_seconds"
        in response.text
    )


def test_unhandled_exception_is_generic():
    test_app = FastAPI()

    test_app.add_middleware(
        RequestObservabilityMiddleware
    )

    @test_app.get(
        "/explode"
    )
    def explode():
        raise RuntimeError(
            "Sensitive internal failure"
        )

    with TestClient(
        test_app,
        raise_server_exceptions=False
    ) as client:

        response = client.get(
            "/explode"
        )

    assert (
        response.status_code
        == 500
    )

    body = response.json()

    assert (
        body["detail"]
        == "Internal server error"
    )

    assert (
        "request_id"
        in body
    )

    assert (
        "Sensitive internal failure"
        not in response.text
    )
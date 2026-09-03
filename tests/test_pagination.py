from decimal import Decimal

from app import models

from tests.conftest import (
    TestingSessionLocal,
)

from tests.helpers import (
    auth_headers,
    create_customer,
)


def test_restaurant_list_default_page_size(
    client
):
    db = TestingSessionLocal()

    try:

        for index in range(
            25
        ):
            db.add(
                models.Restaurant(
                    name=(
                        f"Restaurant {index}"
                    ),
                    cuisine="Test",
                    address=(
                        f"Street {index}"
                    )
                )
            )

        db.commit()

    finally:
        db.close()

    response = client.get(
        "/restaurants"
    )

    assert (
        response.status_code
        == 200
    )

    assert len(
        response.json()
    ) == 20


def test_restaurant_second_page(
    client
):
    db = TestingSessionLocal()

    try:

        for index in range(
            25
        ):
            db.add(
                models.Restaurant(
                    name=(
                        f"Restaurant {index}"
                    ),
                    cuisine="Test",
                    address=(
                        f"Street {index}"
                    )
                )
            )

        db.commit()

    finally:
        db.close()

    response = client.get(
        "/restaurants",
        params={
            "limit": 5,
            "offset": 20
        }
    )

    assert (
        response.status_code
        == 200
    )

    assert len(
        response.json()
    ) == 5


def test_page_size_cannot_exceed_100(
    client
):
    response = client.get(
        "/restaurants",
        params={
            "limit": 101
        }
    )

    assert (
        response.status_code
        == 422
    )


def test_limit_cannot_be_zero(
    client
):
    response = client.get(
        "/restaurants",
        params={
            "limit": 0
        }
    )

    assert (
        response.status_code
        == 422
    )


def test_offset_cannot_be_negative(
    client
):
    response = client.get(
        "/restaurants",
        params={
            "offset": -1
        }
    )

    assert (
        response.status_code
        == 422
    )


def test_customer_orders_are_paginated(
    client
):
    customer = create_customer(
        client,
        email=(
            "pagination@example.com"
        )
    )

    db = TestingSessionLocal()

    try:

        user = (
            db.query(
                models.User
            )
            .filter(
                models.User.email
                == "pagination@example.com"
            )
            .one()
        )

        restaurant = (
            models.Restaurant(
                name=(
                    "Pagination Restaurant"
                ),
                cuisine="Test",
                address="Test Street"
            )
        )

        db.add(
            restaurant
        )

        db.flush()

        for _ in range(
            25
        ):
            db.add(
                models.Order(
                    user_id=user.id,
                    restaurant_id=(
                        restaurant.id
                    ),
                    total_amount=(
                        Decimal(
                            "10.00"
                        )
                    ),
                    status="PLACED"
                )
            )

        db.commit()

    finally:
        db.close()

    response = client.get(
        "/orders",
        headers=auth_headers(
            customer["token"]
        ),
        params={
            "limit": 7,
            "offset": 5
        }
    )

    assert (
        response.status_code
        == 200
    )

    assert len(
        response.json()
    ) == 7


def test_customer_order_default_limit_is_20(
    client
):
    customer = create_customer(
        client,
        email=(
            "pagination2@example.com"
        )
    )

    db = TestingSessionLocal()

    try:

        user = (
            db.query(
                models.User
            )
            .filter(
                models.User.email
                == "pagination2@example.com"
            )
            .one()
        )

        restaurant = (
            models.Restaurant(
                name="Restaurant",
                cuisine="Test",
                address="Street"
            )
        )

        db.add(
            restaurant
        )

        db.flush()

        for _ in range(
            30
        ):
            db.add(
                models.Order(
                    user_id=user.id,
                    restaurant_id=restaurant.id,
                    total_amount=Decimal(
                        "10.00"
                    ),
                    status="PLACED"
                )
            )

        db.commit()

    finally:
        db.close()

    response = client.get(
        "/orders",
        headers=auth_headers(
            customer["token"]
        )
    )

    assert response.status_code == 200

    assert len(
        response.json()
    ) == 20
from decimal import Decimal

from tests.helpers import (
    add_menu_item,
    auth_headers,
    create_customer,
    create_driver_account,
    create_order,
    create_restaurant_account,
    set_restaurant_location,
    update_order_status
)


def create_basic_order(
    client
):
    restaurant_account = (
        create_restaurant_account(
            client,
            email="restaurant@example.com",
            name="Burger House"
        )
    )

    restaurant_token = (
        restaurant_account["token"]
    )

    restaurant = (
        restaurant_account[
            "restaurant"
        ]
    )

    menu_item = add_menu_item(
        client,
        restaurant_token,
        name="Burger",
        price="199.99"
    )

    customer = create_customer(
        client,
        email="customer@example.com"
    )

    order = create_order(
        client,
        customer["token"],
        restaurant_id=restaurant["id"],
        menu_item_id=menu_item["id"],
        quantity=3
    )

    return {
        "restaurant": restaurant,
        "restaurant_token": (
            restaurant_token
        ),
        "customer": customer,
        "menu_item": menu_item,
        "order": order
    }


def test_money_is_calculated_exactly(
    client
):
    context = create_basic_order(
        client
    )

    total = Decimal(
        str(
            context[
                "order"
            ][
                "total_amount"
            ]
        )
    )

    assert total == Decimal(
        "599.97"
    )


def test_customer_can_cancel_placed_order(
    client
):
    context = create_basic_order(
        client
    )

    response = update_order_status(
        client,
        context["customer"]["token"],
        context["order"]["id"],
        "CANCELLED"
    )

    assert response.status_code == 200

    assert (
        response.json()["status"]
        == "CANCELLED"
    )


def test_customer_cannot_cancel_after_restaurant_confirms(
    client
):
    context = create_basic_order(
        client
    )

    confirmation = update_order_status(
        client,
        context["restaurant_token"],
        context["order"]["id"],
        "CONFIRMED"
    )

    assert (
        confirmation.status_code
        == 200
    )

    cancellation = update_order_status(
        client,
        context["customer"]["token"],
        context["order"]["id"],
        "CANCELLED"
    )

    assert (
        cancellation.status_code
        == 400
    )


def test_status_history_records_transitions(
    client
):
    context = create_basic_order(
        client
    )

    for new_status in [
        "CONFIRMED",
        "PREPARING"
    ]:
        response = update_order_status(
            client,
            context["restaurant_token"],
            context["order"]["id"],
            new_status
        )

        assert response.status_code == 200

    history_response = client.get(
        (
            f"/orders/"
            f"{context['order']['id']}"
            f"/history"
        ),
        headers=auth_headers(
            context["customer"]["token"]
        )
    )

    assert (
        history_response.status_code
        == 200
    )

    history = (
        history_response.json()
    )

    statuses = [
        event["to_status"]
        for event in history
    ]

    assert statuses == [
        "PLACED",
        "CONFIRMED",
        "PREPARING"
    ]


def test_restaurant_cancellation_releases_assigned_driver(
    client
):
    context = create_basic_order(
        client
    )

    restaurant_token = (
        context["restaurant_token"]
    )

    restaurant = (
        context["restaurant"]
    )

    set_restaurant_location(
        client,
        restaurant_token,
        latitude=19.0760,
        longitude=72.8777
    )

    for new_status in [
        "CONFIRMED",
        "PREPARING",
        "READY"
    ]:
        response = update_order_status(
            client,
            restaurant_token,
            context["order"]["id"],
            new_status
        )

        assert response.status_code == 200

    driver_account = (
        create_driver_account(
            client,
            email="driver@example.com",
            name="Driver One"
        )
    )

    driver_token = (
        driver_account["token"]
    )

    location_response = client.put(
        "/driver/location",
        headers=auth_headers(
            driver_token
        ),
        json={
            "latitude": 19.0770,
            "longitude": 72.8780
        }
    )

    assert (
        location_response.status_code
        == 200
    )

    assignment = client.post(
        (
            f"/orders/"
            f"{context['order']['id']}"
            f"/assign-driver"
        ),
        headers=auth_headers(
            restaurant_token
        )
    )

    assert assignment.status_code == 201

    before_cancel = client.get(
        "/driver/profile",
        headers=auth_headers(
            driver_token
        )
    )

    assert (
        before_cancel.json()[
            "is_available"
        ]
        is False
    )

    cancellation = update_order_status(
        client,
        restaurant_token,
        context["order"]["id"],
        "CANCELLED"
    )

    assert cancellation.status_code == 200

    after_cancel = client.get(
        "/driver/profile",
        headers=auth_headers(
            driver_token
        )
    )

    assert (
        after_cancel.json()[
            "is_available"
        ]
        is True
    )
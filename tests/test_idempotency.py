from tests.helpers import (
    add_menu_item,
    auth_headers,
    create_customer,
    create_restaurant_account
)


def prepare_order_context(
    client
):
    restaurant_account = (
        create_restaurant_account(
            client,
            email="restaurant@example.com",
            name="Burger House"
        )
    )

    menu_item = add_menu_item(
        client,
        restaurant_account["token"],
        name="Burger",
        price="199.99"
    )

    customer = create_customer(
        client,
        email="customer@example.com"
    )

    return {
        "restaurant": (
            restaurant_account["restaurant"]
        ),
        "menu_item": menu_item,
        "customer": customer
    }


def test_same_key_same_request_returns_same_order(
    client
):
    context = prepare_order_context(
        client
    )

    key = "order-attempt-abc123"

    headers = auth_headers(
        context["customer"]["token"]
    )

    headers["Idempotency-Key"] = key

    payload = {
        "restaurant_id": (
            context["restaurant"]["id"]
        ),
        "items": [
            {
                "menu_item_id": (
                    context["menu_item"]["id"]
                ),
                "quantity": 2
            }
        ]
    }

    first_response = client.post(
        "/orders",
        headers=headers,
        json=payload
    )

    assert first_response.status_code == 201

    second_response = client.post(
        "/orders",
        headers=headers,
        json=payload
    )

    assert second_response.status_code == 201

    first_order = first_response.json()

    second_order = second_response.json()

    assert (
        first_order["id"]
        == second_order["id"]
    )

    orders_response = client.get(
        "/orders",
        headers=auth_headers(
            context["customer"]["token"]
        )
    )

    assert orders_response.status_code == 200

    assert len(
        orders_response.json()
    ) == 1

    history_response = client.get(
        (
            f"/orders/"
            f"{first_order['id']}"
            f"/history"
        ),
        headers=auth_headers(
            context["customer"]["token"]
        )
    )

    assert history_response.status_code == 200

    history = history_response.json()

    assert len(history) == 1

    assert (
        history[0]["to_status"]
        == "PLACED"
    )


def test_same_key_different_request_is_rejected(
    client
):
    context = prepare_order_context(
        client
    )

    key = "same-key"

    headers = auth_headers(
        context["customer"]["token"]
    )

    headers["Idempotency-Key"] = key

    first_response = client.post(
        "/orders",
        headers=headers,
        json={
            "restaurant_id": (
                context["restaurant"]["id"]
            ),
            "items": [
                {
                    "menu_item_id": (
                        context["menu_item"]["id"]
                    ),
                    "quantity": 1
                }
            ]
        }
    )

    assert first_response.status_code == 201

    second_response = client.post(
        "/orders",
        headers=headers,
        json={
            "restaurant_id": (
                context["restaurant"]["id"]
            ),
            "items": [
                {
                    "menu_item_id": (
                        context["menu_item"]["id"]
                    ),
                    "quantity": 3
                }
            ]
        }
    )

    assert second_response.status_code == 409

    assert second_response.json()["detail"] == (
        "Idempotency-Key has already been "
        "used with a different order request"
    )


def test_same_key_can_be_used_by_different_customers(
    client
):
    restaurant_account = (
        create_restaurant_account(
            client,
            email="restaurant@example.com",
            name="Burger House"
        )
    )

    menu_item = add_menu_item(
        client,
        restaurant_account["token"],
        name="Burger",
        price="199.99"
    )

    first_customer = create_customer(
        client,
        email="customer1@example.com"
    )

    second_customer = create_customer(
        client,
        email="customer2@example.com"
    )

    key = "shared-client-key"

    payload = {
        "restaurant_id": (
            restaurant_account[
                "restaurant"
            ][
                "id"
            ]
        ),
        "items": [
            {
                "menu_item_id": (
                    menu_item["id"]
                ),
                "quantity": 1
            }
        ]
    }

    first_headers = auth_headers(
        first_customer["token"]
    )

    first_headers[
        "Idempotency-Key"
    ] = key

    second_headers = auth_headers(
        second_customer["token"]
    )

    second_headers[
        "Idempotency-Key"
    ] = key

    first_response = client.post(
        "/orders",
        headers=first_headers,
        json=payload
    )

    second_response = client.post(
        "/orders",
        headers=second_headers,
        json=payload
    )

    assert first_response.status_code == 201

    assert second_response.status_code == 201

    assert (
        first_response.json()["id"]
        != second_response.json()["id"]
    )


def test_order_requires_idempotency_key(
    client
):
    context = prepare_order_context(
        client
    )

    response = client.post(
        "/orders",
        headers=auth_headers(
            context["customer"]["token"]
        ),
        json={
            "restaurant_id": (
                context["restaurant"]["id"]
            ),
            "items": [
                {
                    "menu_item_id": (
                        context["menu_item"]["id"]
                    ),
                    "quantity": 1
                }
            ]
        }
    )

    assert response.status_code == 422
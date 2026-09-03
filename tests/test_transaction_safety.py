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


def prepare_ready_order_and_driver(
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

    set_restaurant_location(
        client,
        restaurant_token,
        latitude=19.0760,
        longitude=72.8777
    )

    menu_item = add_menu_item(
        client,
        restaurant_token,
        name="Burger",
        price=200
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
        quantity=1
    )

    for new_status in [
        "CONFIRMED",
        "PREPARING",
        "READY"
    ]:
        response = update_order_status(
            client,
            restaurant_token,
            order["id"],
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

    return {
        "restaurant_token": (
            restaurant_token
        ),
        "driver_token": (
            driver_token
        ),
        "order": order
    }


def test_same_order_cannot_receive_two_driver_assignments(
    client
):
    context = (
        prepare_ready_order_and_driver(
            client
        )
    )

    first_assignment = client.post(
        (
            f"/orders/"
            f"{context['order']['id']}"
            f"/assign-driver"
        ),
        headers=auth_headers(
            context["restaurant_token"]
        )
    )

    assert (
        first_assignment.status_code
        == 201
    )

    second_assignment = client.post(
        (
            f"/orders/"
            f"{context['order']['id']}"
            f"/assign-driver"
        ),
        headers=auth_headers(
            context["restaurant_token"]
        )
    )

    assert (
        second_assignment.status_code
        == 409
    )

    assert (
        second_assignment.json()[
            "detail"
        ]
        == "Driver already assigned"
    )


def test_busy_driver_cannot_mark_themselves_available(
    client
):
    context = (
        prepare_ready_order_and_driver(
            client
        )
    )

    assignment_response = client.post(
        (
            f"/orders/"
            f"{context['order']['id']}"
            f"/assign-driver"
        ),
        headers=auth_headers(
            context["restaurant_token"]
        )
    )

    assert (
        assignment_response.status_code
        == 201
    )

    availability_response = client.patch(
        "/driver/availability",
        headers=auth_headers(
            context["driver_token"]
        ),
        json={
            "is_available": True
        }
    )

    assert (
        availability_response.status_code
        == 409
    )

    profile_response = client.get(
        "/driver/profile",
        headers=auth_headers(
            context["driver_token"]
        )
    )

    assert (
        profile_response.status_code
        == 200
    )

    assert (
        profile_response.json()[
            "is_available"
        ]
        is False
    )
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
from decimal import Decimal

def test_complete_order_delivery_flow(
    client
):
    restaurant = create_restaurant_account(
        client
    )

    restaurant_id = restaurant[
        "restaurant"
    ]["id"]

    set_restaurant_location(
        client=client,
        token=restaurant["token"],
        latitude=19.0760,
        longitude=72.8777
    )

    menu_item = add_menu_item(
        client=client,
        restaurant_token=restaurant["token"],
        name="Burger",
        price=250
    )

    customer = create_customer(
        client
    )

    order = create_order(
        client=client,
        customer_token=customer["token"],
        restaurant_id=restaurant_id,
        menu_item_id=menu_item["id"],
        quantity=2
    )

    assert order["status"] == "PLACED"
    assert Decimal(
        str(order["total_amount"])
    ) == Decimal("500.00")

    confirmed = update_order_status(
        client=client,
        token=restaurant["token"],
        order_id=order["id"],
        new_status="CONFIRMED"
    )

    assert confirmed.status_code == 200
    assert (
        confirmed.json()["status"]
        == "CONFIRMED"
    )

    preparing = update_order_status(
        client=client,
        token=restaurant["token"],
        order_id=order["id"],
        new_status="PREPARING"
    )

    assert preparing.status_code == 200

    ready = update_order_status(
        client=client,
        token=restaurant["token"],
        order_id=order["id"],
        new_status="READY"
    )

    assert ready.status_code == 200

    nearby_driver = create_driver_account(
        client=client,
        email="nearby@example.com",
        name="Nearby Driver"
    )

    far_driver = create_driver_account(
        client=client,
        email="far@example.com",
        name="Far Driver"
    )

    nearby_location = client.put(
        "/driver/location",
        headers=auth_headers(
            nearby_driver["token"]
        ),
        json={
            "latitude": 19.0800,
            "longitude": 72.8800
        }
    )

    assert nearby_location.status_code == 200

    far_location = client.put(
        "/driver/location",
        headers=auth_headers(
            far_driver["token"]
        ),
        json={
            "latitude": 19.2183,
            "longitude": 72.9781
        }
    )

    assert far_location.status_code == 200

    assignment_response = client.post(
        f"/orders/{order['id']}/assign-driver",
        headers=auth_headers(
            restaurant["token"]
        )
    )

    assert (
        assignment_response.status_code
        == 201
    )

    assignment = (
        assignment_response.json()
    )

    assert (
        assignment["driver_id"]
        == nearby_driver["driver"]["id"]
    )

    nearby_driver_profile = client.get(
        "/driver/profile",
        headers=auth_headers(
            nearby_driver["token"]
        )
    )

    assert (
        nearby_driver_profile.json()[
            "is_available"
        ]
        is False
    )

    driver_orders = client.get(
        "/driver/orders",
        headers=auth_headers(
            nearby_driver["token"]
        )
    )

    assert driver_orders.status_code == 200
    assert len(driver_orders.json()) == 1

    picked_up = update_order_status(
        client=client,
        token=nearby_driver["token"],
        order_id=order["id"],
        new_status="PICKED_UP"
    )

    assert picked_up.status_code == 200
    assert (
        picked_up.json()["status"]
        == "PICKED_UP"
    )

    delivered = update_order_status(
        client=client,
        token=nearby_driver["token"],
        order_id=order["id"],
        new_status="DELIVERED"
    )

    assert delivered.status_code == 200
    assert (
        delivered.json()["status"]
        == "DELIVERED"
    )

    nearby_driver_profile = client.get(
        "/driver/profile",
        headers=auth_headers(
            nearby_driver["token"]
        )
    )

    assert (
        nearby_driver_profile.json()[
            "is_available"
        ]
        is True
    )


def test_unassigned_driver_cannot_pick_up_order(
    client
):
    restaurant = create_restaurant_account(
        client
    )

    set_restaurant_location(
        client=client,
        token=restaurant["token"],
        latitude=19.0760,
        longitude=72.8777
    )

    menu_item = add_menu_item(
        client,
        restaurant["token"]
    )

    customer = create_customer(
        client
    )

    order = create_order(
        client=client,
        customer_token=customer["token"],
        restaurant_id=restaurant[
            "restaurant"
        ]["id"],
        menu_item_id=menu_item["id"]
    )

    for new_status in [
        "CONFIRMED",
        "PREPARING",
        "READY"
    ]:
        response = update_order_status(
            client=client,
            token=restaurant["token"],
            order_id=order["id"],
            new_status=new_status
        )

        assert response.status_code == 200

    driver = create_driver_account(
        client=client,
        email="driver@example.com",
        name="Driver"
    )

    response = update_order_status(
        client=client,
        token=driver["token"],
        order_id=order["id"],
        new_status="PICKED_UP"
    )

    assert response.status_code == 403
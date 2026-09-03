from tests.helpers import (
    add_menu_item,
    auth_headers,
    create_customer,
    create_order,
    create_restaurant_account,
    update_order_status
)


def test_customer_cannot_view_another_customers_order(
    client
):
    restaurant = create_restaurant_account(
        client
    )

    menu_item = add_menu_item(
        client,
        restaurant["token"]
    )

    customer_one = create_customer(
        client,
        email="customer1@example.com"
    )

    customer_two = create_customer(
        client,
        email="customer2@example.com"
    )

    order = create_order(
        client=client,
        customer_token=customer_one["token"],
        restaurant_id=restaurant[
            "restaurant"
        ]["id"],
        menu_item_id=menu_item["id"]
    )

    response = client.get(
        f"/orders/{order['id']}",
        headers=auth_headers(
            customer_two["token"]
        )
    )

    assert response.status_code == 403


def test_customer_cannot_update_order_status(
    client
):
    restaurant = create_restaurant_account(
        client
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

    response = update_order_status(
        client=client,
        token=customer["token"],
        order_id=order["id"],
        new_status="CONFIRMED"
    )

    assert response.status_code == 403


def test_restaurant_cannot_manage_another_restaurants_order(
    client
):
    restaurant_one = (
        create_restaurant_account(
            client,
            email="restaurant1@example.com",
            name="Restaurant One"
        )
    )

    restaurant_two = (
        create_restaurant_account(
            client,
            email="restaurant2@example.com",
            name="Restaurant Two"
        )
    )

    menu_item = add_menu_item(
        client,
        restaurant_one["token"]
    )

    customer = create_customer(
        client
    )

    order = create_order(
        client=client,
        customer_token=customer["token"],
        restaurant_id=restaurant_one[
            "restaurant"
        ]["id"],
        menu_item_id=menu_item["id"]
    )

    response = update_order_status(
        client=client,
        token=restaurant_two["token"],
        order_id=order["id"],
        new_status="CONFIRMED"
    )

    assert response.status_code == 403


def test_restaurant_cannot_skip_order_state(
    client
):
    restaurant = create_restaurant_account(
        client
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

    response = update_order_status(
        client=client,
        token=restaurant["token"],
        order_id=order["id"],
        new_status="PREPARING"
    )

    assert response.status_code == 400
from uuid import uuid4

from app import models

from tests.conftest import (
    TestingSessionLocal
)


def register_user(
    client,
    name,
    email,
    password,
    role="CUSTOMER"
):
    response = client.post(
        "/auth/register",
        json={
            "name": name,
            "email": email,
            "password": password
        }
    )

    if (
        response.status_code == 201
        and role != "CUSTOMER"
    ):
        db = TestingSessionLocal()

        try:
            user = db.query(
                models.User
            ).filter(
                models.User.email
                == email
            ).first()

            user.account.role = role

            user.email_verified = True

            db.commit()

        finally:
            db.close()

    return response


def login_token_pair(
    client,
    email,
    password,
    device_id
):
    response = client.post(
        "/auth/login",
        json={
            "email": email,
            "password": password,
            "device_id": device_id
        }
    )

    assert response.status_code == 200

    return response.json()


def login_user(
    client,
    email,
    password,
    device_id
):
    return login_token_pair(
        client,
        email,
        password,
        device_id
    )["access_token"]


def auth_headers(
    token
):
    return {
        "Authorization": (
            f"Bearer {token}"
        )
    }


def create_customer(
    client,
    email="customer@example.com"
):
    password = "password@123"

    response = register_user(
        client=client,
        name="Test Customer",
        email=email,
        password=password,
        role="CUSTOMER"
    )

    assert response.status_code == 201

    token = login_user(
        client=client,
        email=email,
        password=password,
        device_id="customer-device"
    )

    return {
        "email": email,
        "password": password,
        "token": token,
        "user": response.json()
    }


def create_restaurant_account(
    client,
    email="restaurant@example.com",
    name="Burger House"
):
    password = "password@123"

    response = register_user(
        client=client,
        name="Restaurant Owner",
        email=email,
        password=password,
        role="RESTAURANT"
    )

    assert response.status_code == 201

    token = login_user(
        client=client,
        email=email,
        password=password,
        device_id="restaurant-device"
    )

    profile_response = client.post(
        "/restaurant/profile",
        headers=auth_headers(
            token
        ),
        json={
            "name": name,
            "cuisine": "Fast Food",
            "address": "Test Street"
        }
    )

    assert (
        profile_response.status_code
        == 201
    )

    return {
        "email": email,
        "password": password,
        "token": token,
        "restaurant": (
            profile_response.json()
        )
    }


def create_driver_account(
    client,
    email,
    name
):
    password = "password@123"

    response = register_user(
        client=client,
        name=name,
        email=email,
        password=password,
        role="DRIVER"
    )

    assert response.status_code == 201

    token = login_user(
        client=client,
        email=email,
        password=password,
        device_id=f"{name}-device"
    )

    profile_response = client.post(
        "/driver/profile",
        headers=auth_headers(
            token
        ),
        json={
            "name": name
        }
    )

    assert (
        profile_response.status_code
        == 201
    )

    return {
        "email": email,
        "password": password,
        "token": token,
        "driver": (
            profile_response.json()
        )
    }


def set_restaurant_location(
    client,
    token,
    latitude,
    longitude
):
    response = client.put(
        "/restaurant/location",
        headers=auth_headers(
            token
        ),
        json={
            "latitude": latitude,
            "longitude": longitude
        }
    )

    assert response.status_code == 200

    return response.json()


def add_menu_item(
    client,
    restaurant_token,
    name="Burger",
    price=200
):
    response = client.post(
        "/restaurant/menu",
        headers=auth_headers(
            restaurant_token
        ),
        json={
            "name": name,
            "price": price,
            "is_available": True
        }
    )

    assert response.status_code == 201

    return response.json()


def create_order(
    client,
    customer_token,
    restaurant_id,
    menu_item_id,
    quantity=1,
    idempotency_key=None
):
    if idempotency_key is None:
        idempotency_key = uuid4().hex

    headers = auth_headers(
        customer_token
    )

    headers[
        "Idempotency-Key"
    ] = idempotency_key

    response = client.post(
        "/orders",
        headers=headers,
        json={
            "restaurant_id": (
                restaurant_id
            ),
            "items": [
                {
                    "menu_item_id": (
                        menu_item_id
                    ),
                    "quantity": quantity
                }
            ]
        }
    )

    assert response.status_code == 201

    return response.json()


def update_order_status(
    client,
    token,
    order_id,
    new_status
):
    return client.patch(
        f"/orders/{order_id}/status",
        headers=auth_headers(
            token
        ),
        json={
            "status": new_status
        }
    )
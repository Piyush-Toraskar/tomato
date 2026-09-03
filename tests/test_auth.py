from tests.helpers import (
    auth_headers,
    login_token_pair,
    login_user,
    register_user
)


def test_register_and_login(
    client
):
    register_response = register_user(
        client=client,
        name="Piyush",
        email="piyush@example.com",
        password="password@123"
    )

    assert (
        register_response.status_code
        == 201
    )

    assert (
        register_response.json()["role"]
        == "CUSTOMER"
    )

    login_response = client.post(
        "/auth/login",
        json={
            "email": "piyush@example.com",
            "password": "password@123",
            "device_id": "laptop"
        }
    )

    assert login_response.status_code == 200

    data = login_response.json()

    assert "access_token" in data

    assert "refresh_token" in data

    assert data["token_type"] == "bearer"


def test_public_registration_cannot_choose_privileged_role(
    client
):
    response = client.post(
        "/auth/register",
        json={
            "name": "Fake Restaurant",
            "email": "fake@example.com",
            "password": "password@123",
            "role": "RESTAURANT"
        }
    )

    assert response.status_code == 422


def test_wrong_password_is_rejected(
    client
):
    register_user(
        client=client,
        name="Piyush",
        email="piyush@example.com",
        password="password@123"
    )

    response = client.post(
        "/auth/login",
        json={
            "email": "piyush@example.com",
            "password": "wrong-password",
            "device_id": "laptop"
        }
    )

    assert response.status_code == 401


def test_same_device_old_token_becomes_invalid(
    client
):
    email = "customer@example.com"
    password = "password@123"

    register_user(
        client=client,
        name="Customer",
        email=email,
        password=password
    )

    old_token = login_user(
        client=client,
        email=email,
        password=password,
        device_id="laptop"
    )

    assert client.get(
        "/auth/me",
        headers=auth_headers(
            old_token
        )
    ).status_code == 200

    new_token = login_user(
        client=client,
        email=email,
        password=password,
        device_id="laptop"
    )

    assert client.get(
        "/auth/me",
        headers=auth_headers(
            old_token
        )
    ).status_code == 401

    assert client.get(
        "/auth/me",
        headers=auth_headers(
            new_token
        )
    ).status_code == 200


def test_different_device_remains_logged_in(
    client
):
    email = "customer@example.com"
    password = "password@123"

    register_user(
        client=client,
        name="Customer",
        email=email,
        password=password
    )

    laptop_token = login_user(
        client=client,
        email=email,
        password=password,
        device_id="laptop"
    )

    phone_token = login_user(
        client=client,
        email=email,
        password=password,
        device_id="phone"
    )

    new_laptop_token = login_user(
        client=client,
        email=email,
        password=password,
        device_id="laptop"
    )

    assert client.get(
        "/auth/me",
        headers=auth_headers(
            laptop_token
        )
    ).status_code == 401

    assert client.get(
        "/auth/me",
        headers=auth_headers(
            phone_token
        )
    ).status_code == 200

    assert client.get(
        "/auth/me",
        headers=auth_headers(
            new_laptop_token
        )
    ).status_code == 200


def test_logout_only_logs_out_current_device(
    client
):
    email = "customer@example.com"
    password = "password@123"

    register_user(
        client=client,
        name="Customer",
        email=email,
        password=password
    )

    laptop_token = login_user(
        client=client,
        email=email,
        password=password,
        device_id="laptop"
    )

    phone_token = login_user(
        client=client,
        email=email,
        password=password,
        device_id="phone"
    )

    logout_response = client.post(
        "/auth/logout",
        headers=auth_headers(
            laptop_token
        )
    )

    assert logout_response.status_code == 200

    assert client.get(
        "/auth/me",
        headers=auth_headers(
            laptop_token
        )
    ).status_code == 401

    assert client.get(
        "/auth/me",
        headers=auth_headers(
            phone_token
        )
    ).status_code == 200


def test_logout_all_devices(
    client
):
    email = "customer@example.com"
    password = "password@123"

    register_user(
        client=client,
        name="Customer",
        email=email,
        password=password
    )

    laptop_token = login_user(
        client=client,
        email=email,
        password=password,
        device_id="laptop"
    )

    phone_token = login_user(
        client=client,
        email=email,
        password=password,
        device_id="phone"
    )

    response = client.post(
        "/auth/logout-all",
        headers=auth_headers(
            laptop_token
        )
    )

    assert response.status_code == 200

    assert client.get(
        "/auth/me",
        headers=auth_headers(
            laptop_token
        )
    ).status_code == 401

    assert client.get(
        "/auth/me",
        headers=auth_headers(
            phone_token
        )
    ).status_code == 401


def test_refresh_rotates_access_and_refresh_tokens(
    client
):
    email = "customer@example.com"
    password = "password@123"

    register_user(
        client=client,
        name="Customer",
        email=email,
        password=password
    )

    first_pair = login_token_pair(
        client=client,
        email=email,
        password=password,
        device_id="laptop"
    )

    old_access = (
        first_pair["access_token"]
    )

    old_refresh = (
        first_pair["refresh_token"]
    )

    refresh_response = client.post(
        "/auth/refresh",
        json={
            "refresh_token": old_refresh
        }
    )

    assert refresh_response.status_code == 200

    new_pair = refresh_response.json()

    assert (
        new_pair["access_token"]
        != old_access
    )

    assert (
        new_pair["refresh_token"]
        != old_refresh
    )

    # Refresh rotates active_jti.
    # The previous access token is now invalid.
    assert client.get(
        "/auth/me",
        headers=auth_headers(
            old_access
        )
    ).status_code == 401

    # The old refresh token cannot be reused.
    old_refresh_again = client.post(
        "/auth/refresh",
        json={
            "refresh_token": old_refresh
        }
    )

    assert old_refresh_again.status_code == 401

    # New access token works.
    assert client.get(
        "/auth/me",
        headers=auth_headers(
            new_pair["access_token"]
        )
    ).status_code == 200


def test_email_verification(
    client
):
    response = register_user(
        client=client,
        name="Customer",
        email="customer@example.com",
        password="password@123"
    )

    data = response.json()

    assert data["email_verified"] is False

    verification_token = data[
        "debug_verification_token"
    ]

    assert verification_token

    verify_response = client.post(
        "/auth/verify-email",
        json={
            "token": verification_token
        }
    )

    assert verify_response.status_code == 200

    token = login_user(
        client=client,
        email="customer@example.com",
        password="password@123",
        device_id="laptop"
    )

    me = client.get(
        "/auth/me",
        headers=auth_headers(
            token
        )
    )

    assert me.status_code == 200

    assert (
        me.json()["email_verified"]
        is True
    )


def test_password_reset_revokes_all_sessions(
    client
):
    email = "customer@example.com"

    old_password = "password@123"

    new_password = "new-password@123"

    register_user(
        client=client,
        name="Customer",
        email=email,
        password=old_password
    )

    laptop_token = login_user(
        client=client,
        email=email,
        password=old_password,
        device_id="laptop"
    )

    phone_token = login_user(
        client=client,
        email=email,
        password=old_password,
        device_id="phone"
    )

    forgot_response = client.post(
        "/auth/forgot-password",
        json={
            "email": email
        }
    )

    assert forgot_response.status_code == 200

    reset_token = forgot_response.json()[
        "debug_token"
    ]

    assert reset_token

    reset_response = client.post(
        "/auth/reset-password",
        json={
            "token": reset_token,
            "new_password": new_password
        }
    )

    assert reset_response.status_code == 200

    # Password reset invalidates every
    # existing device session.
    assert client.get(
        "/auth/me",
        headers=auth_headers(
            laptop_token
        )
    ).status_code == 401

    assert client.get(
        "/auth/me",
        headers=auth_headers(
            phone_token
        )
    ).status_code == 401

    old_login = client.post(
        "/auth/login",
        json={
            "email": email,
            "password": old_password,
            "device_id": "new-device"
        }
    )

    assert old_login.status_code == 401

    new_login = client.post(
        "/auth/login",
        json={
            "email": email,
            "password": new_password,
            "device_id": "new-device"
        }
    )

    assert new_login.status_code == 200
from concurrent.futures import (
    ThreadPoolExecutor
)

from decimal import Decimal
from threading import Barrier

import pytest

from sqlalchemy import (
    inspect,
    text
)

from app import models, schemas

from app.services.order_service import (
    assign_driver_to_order,
    create_order
)


pytestmark = pytest.mark.postgres


def test_fresh_database_migrations_reach_head(
    migrated_postgres_engine
):

    inspector = inspect(
        migrated_postgres_engine
    )

    tables = set(
        inspector.get_table_names()
    )

    expected_tables = {
        "users",
        "accounts",
        "auth_sessions",
        "restaurants",
        "restaurant_accounts",
        "restaurant_locations",
        "menu_items",
        "orders",
        "order_items",
        "order_status_history",
        "order_idempotency_records",
        "drivers",
        "driver_accounts",
        "driver_locations",
        "driver_assignments",
        "email_verification_tokens",
        "password_reset_tokens",
        "alembic_version"
    }

    assert expected_tables.issubset(
        tables
    )

    with (
        migrated_postgres_engine
        .connect()
    ) as connection:

        revision = connection.execute(
            text(
                "SELECT version_num "
                "FROM alembic_version"
            )
        ).scalar_one()

    assert (
        revision
        == "0005_performance_indexes"
    )


def test_postgres_numeric_returns_decimal(
    postgres_session_factory
):

    db = postgres_session_factory()

    try:
        restaurant = models.Restaurant(
            name="Money Test Restaurant",
            cuisine="Test",
            address="Test Street"
        )

        db.add(
            restaurant
        )

        db.flush()

        menu_item = models.MenuItem(
            name="Precision Burger",
            price=Decimal("199.99"),
            is_available=True,
            restaurant_id=restaurant.id
        )

        db.add(
            menu_item
        )

        db.commit()

        menu_item_id = (
            menu_item.id
        )

        db.expire_all()

        stored_menu_item = db.get(
            models.MenuItem,
            menu_item_id
        )

        assert isinstance(
            stored_menu_item.price,
            Decimal
        )

        assert (
            stored_menu_item.price
            == Decimal("199.99")
        )

    finally:
        db.close()


def seed_dispatch_data(
    db
):
    restaurant_user = models.User(
        name="Restaurant Owner",
        email="restaurant@test.local",
        email_verified=True
    )

    restaurant_account = models.Account(
        user=restaurant_user,
        password_hash="not-used",
        role="RESTAURANT"
    )

    restaurant = models.Restaurant(
        name="Dispatch Restaurant",
        cuisine="Test",
        address="Test Street"
    )

    restaurant_link = (
        models.RestaurantAccount(
            account=restaurant_account,
            restaurant=restaurant
        )
    )

    restaurant_location = (
        models.RestaurantLocation(
            restaurant=restaurant,
            latitude=19.0760,
            longitude=72.8777
        )
    )

    customer_user = models.User(
        name="Customer",
        email="customer@test.local",
        email_verified=True
    )

    customer_account = models.Account(
        user=customer_user,
        password_hash="not-used",
        role="CUSTOMER"
    )

    order = models.Order(
        user=customer_user,
        restaurant=restaurant,
        total_amount=Decimal("100.00"),
        status="READY"
    )

    driver_one_user = models.User(
        name="Driver One User",
        email="driver1@test.local",
        email_verified=True
    )

    driver_one_account = models.Account(
        user=driver_one_user,
        password_hash="not-used",
        role="DRIVER"
    )

    driver_one = models.Driver(
        name="Nearest Driver",
        is_available=True
    )

    driver_one_link = models.DriverAccount(
        account=driver_one_account,
        driver=driver_one
    )

    driver_one_location = (
        models.DriverLocation(
            driver=driver_one,
            latitude=19.0761,
            longitude=72.8778
        )
    )

    driver_two_user = models.User(
        name="Driver Two User",
        email="driver2@test.local",
        email_verified=True
    )

    driver_two_account = models.Account(
        user=driver_two_user,
        password_hash="not-used",
        role="DRIVER"
    )

    driver_two = models.Driver(
        name="Second Driver",
        is_available=True
    )

    driver_two_link = models.DriverAccount(
        account=driver_two_account,
        driver=driver_two
    )

    driver_two_location = (
        models.DriverLocation(
            driver=driver_two,
            latitude=19.1000,
            longitude=72.9000
        )
    )

    db.add_all(
        [
            restaurant_user,
            restaurant_account,
            restaurant,
            restaurant_link,
            restaurant_location,
            customer_user,
            customer_account,
            order,
            driver_one_user,
            driver_one_account,
            driver_one,
            driver_one_link,
            driver_one_location,
            driver_two_user,
            driver_two_account,
            driver_two,
            driver_two_link,
            driver_two_location
        ]
    )

    db.commit()

    return {
        "restaurant_account_id": (
            restaurant_account.id
        ),
        "order_id": order.id,
        "nearest_driver_id": (
            driver_one.id
        ),
        "second_driver_id": (
            driver_two.id
        )
    }


def test_skip_locked_uses_next_available_driver(
    postgres_session_factory
):

    setup_db = (
        postgres_session_factory()
    )

    try:
        data = seed_dispatch_data(
            setup_db
        )

    finally:
        setup_db.close()

    locking_db = (
        postgres_session_factory()
    )

    assignment_db = (
        postgres_session_factory()
    )

    try:
        # Simulate another transaction already
        # working with the closest driver.
        locked_driver = (
            locking_db
            .query(models.Driver)
            .filter(
                models.Driver.id
                == data[
                    "nearest_driver_id"
                ]
            )
            .with_for_update()
            .one()
        )

        assert locked_driver is not None

        restaurant_account = (
            assignment_db.get(
                models.Account,
                data[
                    "restaurant_account_id"
                ]
            )
        )

        result = (
            assign_driver_to_order(
                db=assignment_db,
                current_account=(
                    restaurant_account
                ),
                order_id=data[
                    "order_id"
                ]
            )
        )

        # The nearest driver is locked.
        # SKIP LOCKED must skip it and
        # claim the second driver.
        assert (
            result["driver_id"]
            == data[
                "second_driver_id"
            ]
        )

    finally:
        locking_db.rollback()
        locking_db.close()
        assignment_db.close()


def seed_idempotency_data(
    db
):
    customer_user = models.User(
        name="Customer",
        email="idempotency@test.local",
        email_verified=True
    )

    customer_account = models.Account(
        user=customer_user,
        password_hash="not-used",
        role="CUSTOMER"
    )

    restaurant = models.Restaurant(
        name="Idempotency Restaurant",
        cuisine="Test",
        address="Test Street"
    )

    menu_item = models.MenuItem(
        name="Burger",
        price=Decimal("199.99"),
        is_available=True,
        restaurant=restaurant
    )

    db.add_all(
        [
            customer_user,
            customer_account,
            restaurant,
            menu_item
        ]
    )

    db.commit()

    return {
        "customer_account_id": (
            customer_account.id
        ),
        "customer_user_id": (
            customer_user.id
        ),
        "restaurant_id": (
            restaurant.id
        ),
        "menu_item_id": (
            menu_item.id
        )
    }


def test_concurrent_idempotent_requests_create_one_order(
    postgres_session_factory
):

    setup_db = (
        postgres_session_factory()
    )

    try:
        data = seed_idempotency_data(
            setup_db
        )

    finally:
        setup_db.close()

    start_barrier = Barrier(
        2
    )

    def place_order():
        db = (
            postgres_session_factory()
        )

        try:
            account = db.get(
                models.Account,
                data[
                    "customer_account_id"
                ]
            )

            order_request = (
                schemas.OrderCreate(
                    restaurant_id=(
                        data[
                            "restaurant_id"
                        ]
                    ),
                    items=[
                        schemas.OrderItemCreate(
                            menu_item_id=(
                                data[
                                    "menu_item_id"
                                ]
                            ),
                            quantity=2
                        )
                    ]
                )
            )

            start_barrier.wait(
                timeout=5
            )

            order = create_order(
                db=db,
                current_account=account,
                order=order_request,
                idempotency_key=(
                    "postgres-concurrent-key"
                )
            )

            return order.id

        finally:
            db.close()

    with ThreadPoolExecutor(
        max_workers=2
    ) as executor:

        future_one = executor.submit(
            place_order
        )

        future_two = executor.submit(
            place_order
        )

        order_one_id = (
            future_one.result(
                timeout=10
            )
        )

        order_two_id = (
            future_two.result(
                timeout=10
            )
        )

    assert (
        order_one_id
        == order_two_id
    )

    verify_db = (
        postgres_session_factory()
    )

    try:
        order_count = (
            verify_db
            .query(models.Order)
            .filter(
                models.Order.user_id
                == data[
                    "customer_user_id"
                ]
            )
            .count()
        )

        record_count = (
            verify_db
            .query(
                models.OrderIdempotencyRecord
            )
            .filter(
                models.OrderIdempotencyRecord.user_id
                == data[
                    "customer_user_id"
                ]
            )
            .count()
        )

        assert order_count == 1

        assert record_count == 1

    finally:
        verify_db.close()
import argparse

from sqlalchemy import text

from app.database import engine


def print_plan(
    title: str,
    sql: str,
    parameters: dict
):
    explain_sql = (
        "EXPLAIN "
        "(ANALYZE, BUFFERS, FORMAT TEXT) "
        + sql
    )

    print()
    print("=" * 80)
    print(title)
    print("=" * 80)

    with engine.connect() as connection:

        rows = connection.execute(
            text(
                explain_sql
            ),
            parameters
        )

        for row in rows:
            print(
                row[0]
            )


def main():
    parser = argparse.ArgumentParser(
        description=(
            "Inspect important Mini Uber "
            "PostgreSQL query plans"
        )
    )

    parser.add_argument(
        "--user-id",
        type=int
    )

    parser.add_argument(
        "--restaurant-id",
        type=int
    )

    parser.add_argument(
        "--driver-id",
        type=int
    )

    args = parser.parse_args()

    if args.user_id is not None:

        print_plan(
            title=(
                "CUSTOMER ORDER LIST"
            ),
            sql="""
                SELECT *
                FROM orders
                WHERE user_id = :user_id
                ORDER BY
                    created_at DESC,
                    id DESC
                LIMIT 20
            """,
            parameters={
                "user_id": args.user_id
            }
        )

    if (
        args.restaurant_id
        is not None
    ):

        print_plan(
            title=(
                "RESTAURANT ORDER LIST"
            ),
            sql="""
                SELECT *
                FROM orders
                WHERE restaurant_id = :restaurant_id
                ORDER BY
                    created_at DESC,
                    id DESC
                LIMIT 20
            """,
            parameters={
                "restaurant_id":
                args.restaurant_id
            }
        )

        print_plan(
            title=(
                "RESTAURANT MENU"
            ),
            sql="""
                SELECT *
                FROM menu_items
                WHERE restaurant_id = :restaurant_id
                ORDER BY id
                LIMIT 20
            """,
            parameters={
                "restaurant_id":
                args.restaurant_id
            }
        )

    if args.driver_id is not None:

        print_plan(
            title=(
                "DRIVER ASSIGNMENTS"
            ),
            sql="""
                SELECT
                    o.*
                FROM orders AS o

                JOIN driver_assignments AS da
                    ON da.order_id = o.id

                WHERE
                    da.driver_id = :driver_id

                ORDER BY
                    o.created_at DESC,
                    o.id DESC

                LIMIT 20
            """,
            parameters={
                "driver_id":
                args.driver_id
            }
        )

    if (
        args.user_id is None
        and args.restaurant_id is None
        and args.driver_id is None
    ):
        parser.print_help()


if __name__ == "__main__":
    main()
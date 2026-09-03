import argparse

from getpass import getpass

from sqlalchemy import func

from app import models
from app.database import SessionLocal

from app.security import hash_password


ALLOWED_ROLES = {
    "RESTAURANT",
    "DRIVER"
}


def main():
    parser = argparse.ArgumentParser(
        description=(
            "Provision a privileged "
            "Mini Uber account"
        )
    )

    parser.add_argument(
        "--name",
        required=True
    )

    parser.add_argument(
        "--email",
        required=True
    )

    parser.add_argument(
        "--role",
        required=True,
        choices=sorted(
            ALLOWED_ROLES
        )
    )

    parser.add_argument(
        "--password",
        required=False
    )

    args = parser.parse_args()

    password = args.password

    if password is None:
        password = getpass(
            "Password: "
        )

    if len(password) < 8:
        raise ValueError(
            "Password must contain "
            "at least 8 characters"
        )

    email = (
        args.email
        .strip()
        .lower()
    )

    db = SessionLocal()

    try:
        existing_user = db.query(
            models.User
        ).filter(
            func.lower(
                models.User.email
            ) == email
        ).first()

        if existing_user:
            raise ValueError(
                "Email already exists"
            )

        user = models.User(
            name=args.name.strip(),
            email=email,
            email_verified=True
        )

        db.add(
            user
        )

        db.flush()

        account = models.Account(
            user_id=user.id,

            password_hash=hash_password(
                password
            ),

            role=args.role
        )

        db.add(
            account
        )

        db.commit()

        print(
            f"Created {args.role} account "
            f"for {email}"
        )

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()
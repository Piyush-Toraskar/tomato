import hmac

from datetime import (
    datetime,
    timedelta,
    timezone
)

from uuid import uuid4

from fastapi import (
    HTTPException,
    status
)

from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models, schemas
from app.config import settings

from app.security import (
    create_access_token,
    create_refresh_token,
    generate_one_time_token,
    get_session_id_from_refresh_token,
    hash_password,
    hash_token,
    verify_password
)


def utc_now():
    return datetime.now(
        timezone.utc
    )


def normalise_datetime(
    value: datetime
):
    if value.tzinfo is None:
        return value.replace(
            tzinfo=timezone.utc
        )

    return value


def token_is_expired(
    expires_at: datetime
):
    expires_at = normalise_datetime(
        expires_at
    )

    return expires_at <= utc_now()


def debug_token_or_none(
    token: str
):
    if (
        settings.expose_debug_tokens
        and settings.app_env
        != "production"
    ):
        return token

    return None


def find_user_by_email(
    db: Session,
    email: str
):
    normalised_email = (
        email.strip().lower()
    )

    return db.query(
        models.User
    ).filter(
        func.lower(
            models.User.email
        )
        == normalised_email
    ).first()


def create_email_verification_token(
    db: Session,
    user: models.User
):
    db.query(
        models.EmailVerificationToken
    ).filter(
        models.EmailVerificationToken.user_id
        == user.id
    ).delete(
        synchronize_session=False
    )

    raw_token = (
        generate_one_time_token()
    )

    token_record = (
        models.EmailVerificationToken(
            user_id=user.id,

            token_hash=hash_token(
                raw_token
            ),

            expires_at=(
                utc_now()
                + timedelta(
                    minutes=(
                        settings
                        .email_verification_expire_minutes
                    )
                )
            )
        )
    )

    db.add(
        token_record
    )

    return raw_token


def create_password_reset_token(
    db: Session,
    user: models.User
):
    db.query(
        models.PasswordResetToken
    ).filter(
        models.PasswordResetToken.user_id
        == user.id
    ).delete(
        synchronize_session=False
    )

    raw_token = (
        generate_one_time_token()
    )

    token_record = (
        models.PasswordResetToken(
            user_id=user.id,

            token_hash=hash_token(
                raw_token
            ),

            expires_at=(
                utc_now()
                + timedelta(
                    minutes=(
                        settings
                        .password_reset_expire_minutes
                    )
                )
            )
        )
    )

    db.add(
        token_record
    )

    return raw_token


def revoke_session(
    session: models.AuthSession
):
    session.revoked_at = utc_now()

    session.refresh_token_hash = None

    session.refresh_expires_at = None

    # Replacing the JTI gives an additional
    # invalidation mechanism.
    session.active_jti = uuid4().hex


def revoke_all_user_sessions(
    db: Session,
    user_id: int
):
    sessions = db.query(
        models.AuthSession
    ).filter(
        models.AuthSession.user_id
        == user_id
    ).all()

    for session in sessions:
        revoke_session(
            session
        )


def register_user(
    db: Session,
    registration: schemas.RegisterRequest
):
    existing_user = find_user_by_email(
        db,
        registration.email
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    normalised_email = (
        registration
        .email
        .strip()
        .lower()
    )

    new_user = models.User(
        name=registration.name.strip(),
        email=normalised_email,
        email_verified=False
    )

    db.add(
        new_user
    )

    db.flush()

    new_account = models.Account(
        user_id=new_user.id,

        password_hash=hash_password(
            registration.password
        ),

        role="CUSTOMER"
    )

    db.add(
        new_account
    )

    verification_token = (
        create_email_verification_token(
            db,
            new_user
        )
    )

    db.commit()

    db.refresh(
        new_user
    )

    return {
        "id": new_user.id,
        "name": new_user.name,
        "email": new_user.email,
        "role": new_account.role,
        "email_verified": (
            new_user.email_verified
        ),
        "debug_verification_token": (
            debug_token_or_none(
                verification_token
            )
        )
    }


def login_user(
    db: Session,
    login_data: schemas.LoginRequest
):
    user = find_user_by_email(
        db,
        login_data.email
    )

    if user is None:
        raise HTTPException(
            status_code=(
                status
                .HTTP_401_UNAUTHORIZED
            ),
            detail=(
                "Invalid email or password"
            )
        )

    account = user.account

    if account is None:
        raise HTTPException(
            status_code=(
                status
                .HTTP_401_UNAUTHORIZED
            ),
            detail=(
                "Invalid email or password"
            )
        )

    if not verify_password(
        login_data.password,
        account.password_hash
    ):
        raise HTTPException(
            status_code=(
                status
                .HTTP_401_UNAUTHORIZED
            ),
            detail=(
                "Invalid email or password"
            )
        )

    token_id = uuid4().hex

    auth_session = db.query(
        models.AuthSession
    ).filter(
        models.AuthSession.user_id
        == user.id,

        models.AuthSession.device_id
        == login_data.device_id
    ).first()

    if auth_session is None:
        auth_session = models.AuthSession(
            user_id=user.id,
            device_id=login_data.device_id,
            active_jti=token_id,
            revoked_at=None,
            last_used_at=utc_now()
        )

        db.add(
            auth_session
        )

        db.flush()

    else:
        auth_session.active_jti = (
            token_id
        )

        auth_session.revoked_at = None

        auth_session.last_used_at = (
            utc_now()
        )

    refresh_token = create_refresh_token(
        auth_session.id
    )

    auth_session.refresh_token_hash = (
        hash_token(
            refresh_token
        )
    )

    auth_session.refresh_expires_at = (
        utc_now()
        + timedelta(
            days=(
                settings
                .refresh_token_expire_days
            )
        )
    )

    access_token = create_access_token(
        user_id=user.id,
        role=account.role,
        session_id=auth_session.id,
        token_id=token_id
    )

    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


def refresh_tokens(
    db: Session,
    refresh_request: schemas.RefreshRequest
):
    refresh_token = (
        refresh_request.refresh_token
    )

    session_id = (
        get_session_id_from_refresh_token(
            refresh_token
        )
    )

    if session_id is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid refresh token"
        )

    auth_session = db.query(
        models.AuthSession
    ).filter(
        models.AuthSession.id
        == session_id
    ).first()

    if (
        auth_session is None
        or auth_session.revoked_at
        is not None
        or auth_session.refresh_token_hash
        is None
        or auth_session.refresh_expires_at
        is None
    ):
        raise HTTPException(
            status_code=401,
            detail=(
                "Invalid or expired "
                "refresh token"
            )
        )

    if token_is_expired(
        auth_session.refresh_expires_at
    ):
        revoke_session(
            auth_session
        )

        db.commit()

        raise HTTPException(
            status_code=401,
            detail=(
                "Invalid or expired "
                "refresh token"
            )
        )

    supplied_hash = hash_token(
        refresh_token
    )

    if not hmac.compare_digest(
        supplied_hash,
        auth_session.refresh_token_hash
    ):
        raise HTTPException(
            status_code=401,
            detail=(
                "Invalid or expired "
                "refresh token"
            )
        )

    account = (
        auth_session.user.account
    )

    if account is None:
        raise HTTPException(
            status_code=401,
            detail="Account not found"
        )

    new_token_id = uuid4().hex

    new_refresh_token = (
        create_refresh_token(
            auth_session.id
        )
    )

    auth_session.active_jti = (
        new_token_id
    )

    auth_session.refresh_token_hash = (
        hash_token(
            new_refresh_token
        )
    )

    auth_session.refresh_expires_at = (
        utc_now()
        + timedelta(
            days=(
                settings
                .refresh_token_expire_days
            )
        )
    )

    auth_session.last_used_at = (
        utc_now()
    )

    new_access_token = (
        create_access_token(
            user_id=auth_session.user_id,
            role=account.role,
            session_id=auth_session.id,
            token_id=new_token_id
        )
    )

    db.commit()

    return {
        "access_token": (
            new_access_token
        ),
        "refresh_token": (
            new_refresh_token
        ),
        "token_type": "bearer"
    }


def get_account_profile(
    current_account: models.Account
):
    user = current_account.user

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": current_account.role,
        "email_verified": (
            user.email_verified
        )
    }


def logout_user(
    db: Session,
    current_session: models.AuthSession
):
    revoke_session(
        current_session
    )

    db.commit()

    return {
        "message": (
            "Logged out successfully"
        )
    }


def logout_all_devices(
    db: Session,
    current_session: models.AuthSession
):
    revoke_all_user_sessions(
        db,
        current_session.user_id
    )

    db.commit()

    return {
        "message": (
            "Logged out from all devices"
        )
    }


def request_email_verification(
    db: Session,
    current_account: models.Account
):
    user = current_account.user

    if user.email_verified:
        return {
            "message": (
                "Email is already verified"
            ),
            "debug_token": None
        }

    raw_token = (
        create_email_verification_token(
            db,
            user
        )
    )

    db.commit()

    return {
        "message": (
            "Verification token created"
        ),
        "debug_token": (
            debug_token_or_none(
                raw_token
            )
        )
    }


def verify_email(
    db: Session,
    verification: schemas.VerifyEmailRequest
):
    token_hash_value = hash_token(
        verification.token
    )

    token_record = db.query(
        models.EmailVerificationToken
    ).filter(
        models.EmailVerificationToken.token_hash
        == token_hash_value
    ).first()

    if (
        token_record is None
        or token_record.used_at
        is not None
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid verification token"
            )
        )

    if token_is_expired(
        token_record.expires_at
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Verification token expired"
            )
        )

    token_record.user.email_verified = (
        True
    )

    token_record.used_at = utc_now()

    db.commit()

    return {
        "message": (
            "Email verified successfully"
        ),
        "debug_token": None
    }


def forgot_password(
    db: Session,
    request_data: schemas.ForgotPasswordRequest
):
    generic_message = (
        "If an account exists for that email, "
        "a password reset token has been created."
    )

    user = find_user_by_email(
        db,
        request_data.email
    )

    if (
        user is None
        or user.account is None
    ):
        return {
            "message": generic_message,
            "debug_token": None
        }

    reset_token = (
        create_password_reset_token(
            db,
            user
        )
    )

    db.commit()

    return {
        "message": generic_message,

        "debug_token": (
            debug_token_or_none(
                reset_token
            )
        )
    }


def reset_password(
    db: Session,
    reset_data: schemas.ResetPasswordRequest
):
    token_hash_value = hash_token(
        reset_data.token
    )

    token_record = db.query(
        models.PasswordResetToken
    ).filter(
        models.PasswordResetToken.token_hash
        == token_hash_value
    ).first()

    if (
        token_record is None
        or token_record.used_at
        is not None
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid password reset token"
            )
        )

    if token_is_expired(
        token_record.expires_at
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Password reset token expired"
            )
        )

    user = token_record.user

    account = user.account

    if account is None:
        raise HTTPException(
            status_code=400,
            detail="Account not found"
        )

    account.password_hash = (
        hash_password(
            reset_data.new_password
        )
    )

    token_record.used_at = utc_now()

    revoke_all_user_sessions(
        db,
        user.id
    )

    db.commit()

    return {
        "message": (
            "Password reset successfully. "
            "Please log in again."
        ),
        "debug_token": None
    }
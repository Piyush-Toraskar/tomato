import hashlib
import secrets

from datetime import (
    datetime,
    timedelta,
    timezone,
)

import jwt

from fastapi import (
    Depends,
    HTTPException,
    Request,
    status,
)

from fastapi.security import (
    HTTPAuthorizationCredentials,
    HTTPBearer,
)

from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash
from sqlalchemy.orm import Session

from app import models
from app.config import settings
from app.database import get_db


ALGORITHM = "HS256"


password_hash = PasswordHash.recommended()


bearer_scheme = HTTPBearer(
    auto_error=False
)


def hash_password(
    password: str
):
    return password_hash.hash(
        password
    )


def verify_password(
    plain_password: str,
    hashed_password: str
):
    return password_hash.verify(
        plain_password,
        hashed_password
    )


def create_access_token(
    user_id: int,
    role: str,
    session_id: int,
    token_id: str
):
    expiration = (
        datetime.now(
            timezone.utc
        )
        + timedelta(
            minutes=(
                settings
                .access_token_expire_minutes
            )
        )
    )

    payload = {
        "sub": str(user_id),
        "role": role,
        "sid": session_id,
        "jti": token_id,
        "exp": expiration,
    }

    return jwt.encode(
        payload,
        settings.secret_key,
        algorithm=ALGORITHM,
    )


def create_refresh_token(
    session_id: int
):
    random_part = secrets.token_urlsafe(
        48
    )

    return (
        f"{session_id}.{random_part}"
    )


def get_session_id_from_refresh_token(
    refresh_token: str
):
    try:
        session_id_text, random_part = (
            refresh_token.split(
                ".",
                1,
            )
        )

        if not random_part:
            return None

        return int(
            session_id_text
        )

    except (
        ValueError,
        AttributeError,
    ):
        return None


def generate_one_time_token():
    return secrets.token_urlsafe(
        32
    )


def hash_token(
    token: str
):
    return hashlib.sha256(
        token.encode(
            "utf-8"
        )
    ).hexdigest()


def get_current_session(
    credentials: (
        HTTPAuthorizationCredentials
        | None
    ) = Depends(
        bearer_scheme
    ),

    db: Session = Depends(
        get_db
    ),
):
    if credentials is None:
        raise HTTPException(
            status_code=(
                status.HTTP_401_UNAUTHORIZED
            ),
            detail=(
                "Authentication required"
            ),
        )

    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            settings.secret_key,
            algorithms=[
                ALGORITHM
            ],
        )

        user_id = payload.get(
            "sub"
        )

        session_id = payload.get(
            "sid"
        )

        token_id = payload.get(
            "jti"
        )

        if (
            user_id is None
            or session_id is None
            or token_id is None
        ):
            raise HTTPException(
                status_code=(
                    status
                    .HTTP_401_UNAUTHORIZED
                ),
                detail="Invalid token",
            )

        user_id = int(
            user_id
        )

        session_id = int(
            session_id
        )

    except (
        InvalidTokenError,
        ValueError,
        TypeError,
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_401_UNAUTHORIZED
            ),
            detail=(
                "Invalid or expired token"
            ),
        )

    auth_session = (
        db.query(
            models.AuthSession
        )
        .filter(
            models.AuthSession.id
            == session_id,

            models.AuthSession.user_id
            == user_id,
        )
        .first()
    )

    if auth_session is None:
        raise HTTPException(
            status_code=(
                status.HTTP_401_UNAUTHORIZED
            ),
            detail=(
                "Session is no longer active"
            ),
        )

    if (
        auth_session.revoked_at
        is not None
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_401_UNAUTHORIZED
            ),
            detail=(
                "Session is no longer active"
            ),
        )

    if (
        auth_session.active_jti
        != token_id
    ):
        raise HTTPException(
            status_code=(
                status.HTTP_401_UNAUTHORIZED
            ),
            detail=(
                "Token is no longer active"
            ),
        )

    return auth_session


def get_current_account(
    request: Request,

    current_session: (
        models.AuthSession
    ) = Depends(
        get_current_session
    ),
):
    account = (
        current_session
        .user
        .account
    )

    if account is None:
        raise HTTPException(
            status_code=(
                status.HTTP_401_UNAUTHORIZED
            ),
            detail=(
                "Account not found"
            ),
        )

    # Store the authenticated account ID
    # in the current request's state.
    #
    # Our observability middleware reads
    # this later when it creates the
    # structured request log.
    request.state.account_id = (
        account.id
    )

    return account
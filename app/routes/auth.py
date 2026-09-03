from fastapi import (
    APIRouter,
    Depends,
    Request,
    status
)

from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

from app.rate_limiter import (
    get_client_ip,
    rate_limiter
)

from app.security import (
    get_current_account,
    get_current_session
)

from app.services import auth_service


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post(
    "/register",
    response_model=schemas.RegisterResponse,
    response_model_exclude_none=True,
    status_code=status.HTTP_201_CREATED
)
def register(
    request: Request,
    registration: schemas.RegisterRequest,
    db: Session = Depends(get_db)
):
    rate_limiter.check(
        key=(
            f"register:"
            f"{get_client_ip(request)}"
        ),
        limit=10,
        window_seconds=60
    )

    return auth_service.register_user(
        db,
        registration
    )


@router.post(
    "/login",
    response_model=schemas.TokenResponse
)
def login(
    request: Request,
    login_data: schemas.LoginRequest,
    db: Session = Depends(get_db)
):
    rate_limiter.check(
        key=(
            f"login:"
            f"{get_client_ip(request)}:"
            f"{login_data.email.lower()}"
        ),
        limit=10,
        window_seconds=60
    )

    return auth_service.login_user(
        db,
        login_data
    )


@router.post(
    "/refresh",
    response_model=schemas.TokenResponse
)
def refresh(
    refresh_request: schemas.RefreshRequest,
    db: Session = Depends(get_db)
):
    return auth_service.refresh_tokens(
        db,
        refresh_request
    )


@router.get(
    "/me",
    response_model=schemas.AuthMeResponse
)
def get_me(
    current_account: models.Account
    = Depends(get_current_account)
):
    return (
        auth_service
        .get_account_profile(
            current_account
        )
    )


@router.post(
    "/logout",
    response_model=schemas.MessageResponse,
    response_model_exclude_none=True
)
def logout(
    current_session: models.AuthSession
    = Depends(get_current_session),

    db: Session = Depends(get_db)
):
    return auth_service.logout_user(
        db,
        current_session
    )


@router.post(
    "/logout-all",
    response_model=schemas.MessageResponse,
    response_model_exclude_none=True
)
def logout_all(
    current_session: models.AuthSession
    = Depends(get_current_session),

    db: Session = Depends(get_db)
):
    return (
        auth_service
        .logout_all_devices(
            db,
            current_session
        )
    )


@router.post(
    "/request-email-verification",
    response_model=schemas.MessageResponse,
    response_model_exclude_none=True
)
def request_email_verification(
    request: Request,

    current_account: models.Account
    = Depends(get_current_account),

    db: Session = Depends(get_db)
):
    rate_limiter.check(
        key=(
            "verify-request:"
            f"{current_account.user_id}:"
            f"{get_client_ip(request)}"
        ),
        limit=5,
        window_seconds=900
    )

    return (
        auth_service
        .request_email_verification(
            db,
            current_account
        )
    )


@router.post(
    "/verify-email",
    response_model=schemas.MessageResponse,
    response_model_exclude_none=True
)
def verify_email(
    request: Request,

    verification: (
        schemas.VerifyEmailRequest
    ),

    db: Session = Depends(get_db)
):
    rate_limiter.check(
        key=(
            "verify-email:"
            f"{get_client_ip(request)}"
        ),
        limit=10,
        window_seconds=60
    )

    return auth_service.verify_email(
        db,
        verification
    )


@router.post(
    "/forgot-password",
    response_model=schemas.MessageResponse,
    response_model_exclude_none=True
)
def forgot_password(
    request: Request,

    request_data: (
        schemas.ForgotPasswordRequest
    ),

    db: Session = Depends(get_db)
):
    rate_limiter.check(
        key=(
            "forgot-password:"
            f"{get_client_ip(request)}:"
            f"{request_data.email.lower()}"
        ),
        limit=5,
        window_seconds=900
    )

    return auth_service.forgot_password(
        db,
        request_data
    )


@router.post(
    "/reset-password",
    response_model=schemas.MessageResponse,
    response_model_exclude_none=True
)
def reset_password(
    request: Request,

    reset_data: (
        schemas.ResetPasswordRequest
    ),

    db: Session = Depends(get_db)
):
    rate_limiter.check(
        key=(
            "reset-password:"
            f"{get_client_ip(request)}"
        ),
        limit=10,
        window_seconds=900
    )

    return auth_service.reset_password(
        db,
        reset_data
    )
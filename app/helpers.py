from math import asin, cos, radians, sin, sqrt

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app import models


def calculate_distance(
    latitude_1: float,
    longitude_1: float,
    latitude_2: float,
    longitude_2: float
):
    earth_radius_km = 6371

    latitude_1 = radians(
        latitude_1
    )

    longitude_1 = radians(
        longitude_1
    )

    latitude_2 = radians(
        latitude_2
    )

    longitude_2 = radians(
        longitude_2
    )

    latitude_difference = (
        latitude_2 - latitude_1
    )

    longitude_difference = (
        longitude_2 - longitude_1
    )

    value = (
        sin(latitude_difference / 2) ** 2
        +
        cos(latitude_1)
        * cos(latitude_2)
        * sin(longitude_difference / 2) ** 2
    )

    distance = (
        2
        * earth_radius_km
        * asin(sqrt(value))
    )

    return distance


def get_restaurant_for_account(
    db: Session,
    account: models.Account
):
    link = db.query(
        models.RestaurantAccount
    ).filter(
        models.RestaurantAccount.account_id
        == account.id
    ).first()

    if link is None:
        raise HTTPException(
            status_code=400,
            detail=(
                "Restaurant profile is not linked "
                "to this account"
            )
        )

    return link.restaurant


def get_driver_for_account(
    db: Session,
    account: models.Account
):
    link = db.query(
        models.DriverAccount
    ).filter(
        models.DriverAccount.account_id
        == account.id
    ).first()

    if link is None:
        raise HTTPException(
            status_code=400,
            detail=(
                "Driver profile is not linked "
                "to this account"
            )
        )

    return link.driver
from pydantic_settings import (
    BaseSettings,
    SettingsConfigDict
)

from sqlalchemy.engine import URL


class Settings(BaseSettings):
    app_env: str = "development"

    db_user: str = "postgres"
    db_password: str
    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "mini_uber"

    database_url: str | None = None

    secret_key: str

    access_token_expire_minutes: int = 15

    refresh_token_expire_days: int = 7

    email_verification_expire_minutes: int = 60

    password_reset_expire_minutes: int = 30

    expose_debug_tokens: bool = True

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    @property
    def sqlalchemy_database_url(self) -> str:
        if self.database_url:
            return self.database_url

        url = URL.create(
            drivername="postgresql+psycopg2",
            username=self.db_user,
            password=self.db_password,
            host=self.db_host,
            port=self.db_port,
            database=self.db_name
        )

        return url.render_as_string(
            hide_password=False
        )


settings = Settings()
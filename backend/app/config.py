from functools import lru_cache
from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    supabase_url: str = Field(default="", validation_alias="SUPABASE_URL")
    supabase_key: str = Field(
        default="",
        validation_alias=AliasChoices("SUPABASE_KEY", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_ANON_KEY"),
    )

    secret_key: str = "change-this-secret"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080

    openweather_api_key: str = Field(default="", validation_alias="OPENWEATHER_API_KEY")

    cloudinary_cloud_name: str = Field(default="", validation_alias="CLOUDINARY_CLOUD_NAME")
    cloudinary_api_key: str = Field(default="", validation_alias="CLOUDINARY_API_KEY")
    cloudinary_api_secret: str = Field(default="", validation_alias="CLOUDINARY_API_SECRET")

    # AI Providers
    groq_api_key: str = Field(default="", validation_alias="GROQ_API_KEY")
    openrouter_api_key: str = Field(default="", validation_alias="OPENROUTER_API_KEY")
    together_api_key: str = Field(default="", validation_alias="TOGETHER_API_KEY")

    firebase_credentials_path: str = "firebase-credentials.json"
    frontend_url: str = "http://localhost:5173"

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "allow",
    }


@lru_cache()
def get_settings() -> Settings:
    return Settings()

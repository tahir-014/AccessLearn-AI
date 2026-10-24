import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings

# Resolve base backend directory
BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    """Application configuration settings loaded from environment or defaults."""
    
    APP_NAME: str = "AccessLearn AI API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    APP_HOST: str = "127.0.0.1"
    APP_PORT: int = 8000

    # AI Service Configuration
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"

    # SQLite Database
    DATABASE_PATH: str = str(BASE_DIR / "accesslearn.db")

    # File Upload limits
    MAX_UPLOAD_SIZE_MB: int = 10
    UPLOAD_DIR: str = str(BASE_DIR / "uploads")

    # Allowed CORS Origins
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]

    @property
    def is_demo_mode(self) -> bool:
        """Returns True if running without a live Gemini API key."""
        key = self.GEMINI_API_KEY.strip()
        return not key or key == "your_gemini_api_key_here" or key.startswith("demo_")

    model_config = {
        "env_file": str(BASE_DIR / ".env"),
        "env_file_encoding": "utf-8",
        "extra": "ignore"
    }

# Ensure uploads directory exists
settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

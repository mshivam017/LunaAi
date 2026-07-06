import os

class Settings:
    PROJECT_NAME: str = "Luna AI Assistant"
    
    # Database configuration
    # Save the database in a hidden local folder or the app folder
    DB_DIR: str = os.path.join(os.path.expanduser("~"), ".luna")
    os.makedirs(DB_DIR, exist_ok=True)
    DATABASE_URL: str = f"sqlite:///{os.path.join(DB_DIR, 'luna.db')}"
    
    # AI settings
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    DEFAULT_MODEL: str = "qwen2.5:0.5b"
    FALLBACK_MODEL: str = "phi3"

settings = Settings()

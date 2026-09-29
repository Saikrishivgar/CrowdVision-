from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "CrimeVision AI"
    DATABASE_URL: str = "sqlite:///./crimevision.db"
    SECRET_KEY: str = "crimevision-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # AI Models
    YOLO_MODEL_PATH: str = "yolo11x.pt"
    YOLO_CONFIDENCE: float = 0.20
    FRAME_EXTRACTION_FPS: int = 2
    
    # Storage
    UPLOAD_DIR: str = "uploads"
    CLIPS_DIR: str = "clips"
    FRAMES_DIR: str = "frames"
    FAISS_INDEX_PATH: str = "faiss_index.bin"
    
    # OpenCLIP
    CLIP_MODEL: str = "ViT-L-14"
    CLIP_PRETRAINED: str = "openai"
    
    # Gemini (optional)
    GEMINI_API_KEY: str = ""
    HUGGINGFACE_API_KEY: str = ""
    HUGGINGFACE_MODEL: str = "google/flan-t5-small"
    
    class Config:
        env_file = ".env"

settings = Settings()

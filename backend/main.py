from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from config import settings
from models.database import create_tables
from demo_data import populate_demo_data

from api import auth, videos, search, indexing, incidents, cameras, analytics, crowd


RUNTIME_DIRECTORIES = (
    settings.UPLOAD_DIR,
    settings.CLIPS_DIR,
    settings.FRAMES_DIR,
    "heatmaps",
)


def ensure_runtime_directories():
    for directory in RUNTIME_DIRECTORIES:
        os.makedirs(directory, exist_ok=True)


# StaticFiles validates its directory while the module is imported, so these
# directories must exist before the mounts below are created.
ensure_runtime_directories()

app = FastAPI(
    title="CrimeVision AI API",
    description="AI-Powered CCTV Investigation Platform",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    # Keep existing data across restarts; schema creation is non-destructive.
    ensure_runtime_directories()

    # Create tables
    create_tables()

    # Populate demo data only when the corresponding tables are empty.
    populate_demo_data()


# Mount static directories
app.mount(f"/{settings.UPLOAD_DIR}", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")
app.mount(f"/{settings.CLIPS_DIR}", StaticFiles(directory=settings.CLIPS_DIR), name="clips")
app.mount(f"/{settings.FRAMES_DIR}", StaticFiles(directory=settings.FRAMES_DIR), name="frames")
app.mount("/heatmaps", StaticFiles(directory="heatmaps"), name="heatmaps")


# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(cameras.router, prefix="/api/cameras", tags=["Cameras"])
app.include_router(videos.router, prefix="/api/videos", tags=["Videos"])
app.include_router(search.router, prefix="/api/search", tags=["Search"])
app.include_router(indexing.router, prefix="/api/indexing", tags=["Indexing"])
app.include_router(incidents.router, prefix="/api/incidents", tags=["Incidents"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(crowd.router, prefix="/api/crowd", tags=["Crowd"])


@app.get("/")
def read_root():
    return {"message": "Welcome to CrimeVision AI API"}

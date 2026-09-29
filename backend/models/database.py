from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from datetime import datetime
import os

from config import settings

engine = create_engine(
    settings.DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Camera(Base):
    __tablename__ = "cameras"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    rtsp_url = Column(String)
    location = Column(String)
    status = Column(String, default="offline")
    resolution = Column(String, default="1080p")
    fps = Column(Integer, default=30)
    monitored_area_sqm = Column(Float, nullable=True)
    perspective_calibrated = Column(Boolean, default=False)
    ground_homography = Column(Text, nullable=True) # JSON string configuration
    capacity_threshold = Column(Integer, default=100)
    created_at = Column(DateTime, default=datetime.utcnow)

class AnalysisResult(Base):
    __tablename__ = "analysis_results"
    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=True)
    video_id = Column(Integer, ForeignKey("videos.id"), nullable=True)
    source_type = Column(String) # "image" or "video"
    image_path = Column(String) # Uploaded image path or keyframe path
    heatmap_path = Column(String, nullable=True) # KDE density heatmap path
    timestamp = Column(DateTime, default=datetime.utcnow)
    people_count = Column(Integer)
    density_score = Column(Float) # Relative 0-100 density score
    risk_score = Column(Float) # 0-100 risk score
    risk_level = Column(String) # LOW, MODERATE, HIGH, CRITICAL
    confidence = Column(Float) # Model confidence 0.0-1.0
    processing_time = Column(Float) # in seconds
    model_version = Column(String, default="PET-v1.0")
    points_json = Column(Text) # JSON string of head coordinates [[x,y], ...]
    preferred_exit = Column(String, nullable=True)
    avoid_exit = Column(String, nullable=True)
    recommendation_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class CrowdGroup(Base):
    __tablename__ = "crowd_groups"
    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analysis_results.id"))
    group_number = Column(Integer)
    people_count = Column(Integer)
    density_level = Column(String) # LOW, MEDIUM, HIGH, CRITICAL
    centroid_x = Column(Float)
    centroid_y = Column(Float)
    bbox_x = Column(Float)
    bbox_y = Column(Float)
    bbox_w = Column(Float)
    bbox_h = Column(Float)

class CrowdZone(Base):
    __tablename__ = "crowd_zones"
    id = Column(Integer, primary_key=True, index=True)
    analysis_id = Column(Integer, ForeignKey("analysis_results.id"))
    zone_name = Column(String)
    people_count = Column(Integer)
    density_score = Column(Float)
    risk_score = Column(Float)
    risk_level = Column(String) # LOW, MODERATE, HIGH, CRITICAL
    centroid_x = Column(Float, nullable=True)
    centroid_y = Column(Float, nullable=True)
    group_count = Column(Integer, default=0)

class CameraZone(Base):
    __tablename__ = "camera_zones"
    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(Integer, ForeignKey("cameras.id"))
    zone_name = Column(String)
    polygon_coords = Column(Text) # JSON coordinates list of lists [[x1, y1], ...]
    capacity = Column(Integer, default=50)
    risk_weight = Column(Float, default=1.0)

class ExitConfig(Base):
    __tablename__ = "exits"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    location = Column(String)
    capacity_limit = Column(Integer, default=100)
    current_occupancy = Column(Integer, default=0)
    status = Column(String, default="open") # open/congested/closed

class RouteConfig(Base):
    __tablename__ = "routes"
    id = Column(Integer, primary_key=True, index=True)
    source_zone = Column(String)
    destination_exit = Column(String)
    path_nodes = Column(Text) # JSON serialized list of walkable zones/nodes
    distance_meters = Column(Float, default=10.0)


class Video(Base):
    __tablename__ = "videos"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    original_name = Column(String)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=True)
    duration = Column(Float)
    resolution = Column(String)
    fps = Column(Float)
    size_bytes = Column(Integer)
    status = Column(String, default="uploaded") # uploaded/processing/indexed/error
    created_at = Column(DateTime, default=datetime.utcnow)

class Frame(Base):
    __tablename__ = "frames"
    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"))
    frame_number = Column(Integer)
    timestamp = Column(Float)
    file_path = Column(String)

class Detection(Base):
    __tablename__ = "detections"
    id = Column(Integer, primary_key=True, index=True)
    frame_id = Column(Integer, ForeignKey("frames.id"))
    track_id = Column(String)
    class_name = Column(String)
    confidence = Column(Float)
    bbox_x = Column(Float)
    bbox_y = Column(Float)
    bbox_w = Column(Float)
    bbox_h = Column(Float)

class Track(Base):
    __tablename__ = "tracks"
    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"))
    track_number = Column(Integer)
    class_name = Column(String)
    first_frame = Column(Integer)
    last_frame = Column(Integer)
    first_timestamp = Column(Float)
    last_timestamp = Column(Float)

class Embedding(Base):
    __tablename__ = "embeddings"
    id = Column(Integer, primary_key=True, index=True)
    track_id = Column(Integer, ForeignKey("tracks.id"))
    vector_id = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

class Incident(Base):
    __tablename__ = "incidents"
    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(Integer, ForeignKey("videos.id"), nullable=True)
    camera_id = Column(Integer, ForeignKey("cameras.id"), nullable=True)
    incident_type = Column(String)
    severity = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)
    description = Column(Text)
    ai_summary = Column(Text)
    clip_path = Column(String, nullable=True)
    status = Column(String, default="detected") # detected/acknowledged/resolved
    created_at = Column(DateTime, default=datetime.utcnow)

class Alert(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(Integer, ForeignKey("incidents.id"))
    message = Column(String)
    severity = Column(String)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class SearchHistory(Base):
    __tablename__ = "search_history"
    id = Column(Integer, primary_key=True, index=True)
    query_text = Column(String)
    results_count = Column(Integer)
    search_time_ms = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="viewer") # admin/operator/viewer
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

def create_tables():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List
import os
import shutil
import uuid
import datetime

from config import settings
from models.database import get_db, Video

router = APIRouter()

@router.post("/upload")
async def upload_video(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith((".mp4", ".avi", ".mkv")):
        raise HTTPException(status_code=400, detail="Invalid video format")
    
    filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    size_bytes = os.path.getsize(file_path)
    
    video = Video(
        filename=filename,
        original_name=file.filename,
        duration=0, # Would use ffmpeg to get real duration
        resolution="unknown",
        fps=0,
        size_bytes=size_bytes,
        status="uploaded"
    )
    db.add(video)
    db.commit()
    db.refresh(video)
    
    return video

@router.get("/")
def list_videos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    videos = db.query(Video).offset(skip).limit(limit).all()
    return videos

@router.get("/{id}")
def get_video(id: int, db: Session = Depends(get_db)):
    video = db.query(Video).filter(Video.id == id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return video

@router.get("/{id}/clip")
def extract_clip(id: int, start_time: float, end_time: float, db: Session = Depends(get_db)):
    video = db.query(Video).filter(Video.id == id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
        
    # In a real app we would use ffmpeg here
    # For demo we just return a mock URL
    clip_filename = f"clip_{video.id}_{start_time}_{end_time}.mp4"
    return {"clip_url": f"/{settings.CLIPS_DIR}/{clip_filename}", "status": "simulated"}

@router.delete("/{id}")
def delete_video(id: int, db: Session = Depends(get_db)):
    video = db.query(Video).filter(Video.id == id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
        
    # Delete from filesystem
    file_path = os.path.join(settings.UPLOAD_DIR, video.filename)
    if os.path.exists(file_path):
        os.remove(file_path)
        
    db.delete(video)
    db.commit()
    return {"detail": "Video deleted"}

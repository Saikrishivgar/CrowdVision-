from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException, WebSocket
from sqlalchemy.orm import Session
from models.database import get_db, Video, SessionLocal
import asyncio
import random

router = APIRouter()

async def mock_indexing_task(video_id: int):
    # BackgroundTasks run after the request session has been closed, so each
    # task must own and close its own database session.
    db = SessionLocal()
    try:
        video = db.query(Video).filter(Video.id == video_id).first()
        if not video:
            return

        video.status = "processing"
        db.commit()

        stages = ["extracting", "detecting", "tracking", "embedding", "indexed"]
        for stage in stages:
            await asyncio.sleep(2)
            if stage == "indexed":
                video.status = "indexed"
                db.commit()
    finally:
        db.close()
            
@router.post("/start/{video_id}")
def start_indexing(video_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
        
    if video.status in ["processing", "indexed"]:
        return {"message": f"Video is already {video.status}"}
        
    background_tasks.add_task(mock_indexing_task, video_id)
    return {"message": "Indexing started"}

@router.get("/status/{video_id}")
def get_indexing_status(video_id: int, db: Session = Depends(get_db)):
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
        
    if video.status == "indexed":
        return {"stage": "indexed", "progress_percent": 100, "eta": 0}
    elif video.status == "uploaded":
        return {"stage": "pending", "progress_percent": 0, "eta": None}
    else:
        # Mock progress for processing
        return {"stage": "detecting", "progress_percent": random.randint(10, 90), "eta": random.randint(10, 300)}

@router.get("/stats")
def get_indexing_stats(db: Session = Depends(get_db)):
    total = db.query(Video).count()
    indexed = db.query(Video).filter(Video.status == "indexed").count()
    processing = db.query(Video).filter(Video.status == "processing").count()
    
    return {
        "total_videos": total,
        "indexed_videos": indexed,
        "processing_videos": processing,
        "queue_length": 0
    }

@router.websocket("/ws/{video_id}")
async def websocket_endpoint(websocket: WebSocket, video_id: int):
    await websocket.accept()
    try:
        progress = 0
        while progress < 100:
            await asyncio.sleep(1)
            progress += random.randint(5, 15)
            progress = min(100, progress)
            await websocket.send_json({
                "video_id": video_id,
                "progress_percent": progress,
                "stage": "detecting" if progress < 50 else "embedding"
            })
            if progress >= 100:
                break
    except Exception as e:
        pass
    finally:
        await websocket.close()

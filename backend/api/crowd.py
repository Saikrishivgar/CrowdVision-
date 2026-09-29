import os
import uuid
import shutil
import subprocess
import json
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel

from models.database import (
    get_db, Camera, Video, Incident, CameraZone,
    AnalysisResult, CrowdZone, CrowdGroup, ExitConfig, RouteConfig
)
from pipeline.pet_counter import PETCounter
from pipeline.crowd_analyzer import CrowdAnalyzer
from config import settings

router = APIRouter()
pet_counter = PETCounter()
crowd_analyzer = CrowdAnalyzer()

# Request/Response schemas
class ZoneConfig(BaseModel):
    camera_id: int
    zone_name: str
    polygon_coords: List[List[int]]
    capacity: int
    risk_weight: float

class ExitCreate(BaseModel):
    name: str
    location: str
    capacity_limit: int

class CrowdAnalysisResult(BaseModel):
    analysis_id: int
    people_count: int
    model_confidence: float
    density: dict
    groups: int
    hotspots: int
    risk: dict
    zones: List[dict]
    recommendation: dict
    visualizations: dict

# Background task for video processing
def process_video_async(video_id: int, file_path: str, db_session_maker):
    """Analyze sampled video frames with the configured YOLO person detector."""
    db = db_session_maker()
    try:
        video = db.query(Video).filter(Video.id == video_id).first()
        if not video:
            return
        video.status = "processing"
        db.commit()

        capture = cv2.VideoCapture(file_path)
        if not capture.isOpened():
            raise RuntimeError("OpenCV could not open the uploaded video")
        frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        fps = float(capture.get(cv2.CAP_PROP_FPS) or 30.0)
        video.fps = fps
        video.duration = frame_count / fps if frame_count and fps else 0.0

        max_analysis_frames = 48
        frame_stride = max(1, int(np.ceil(frame_count / max_analysis_frames)))
        sample_total = min(max_analysis_frames, max(1, int(np.ceil(frame_count / frame_stride))))
        sample_indices = set(range(0, frame_count, frame_stride))
        best_frame = None
        best_points = []
        best_confidence = 0.0
        counts = []
        tracked_ids = set()
        frame_number = 0
        writer = None
        os.makedirs("clips", exist_ok=True)
        tracked_video_path = os.path.join("clips", f"tracked_video_{video_id}.mp4")

        while True:
            ok, frame = capture.read()
            if not ok:
                break
            if frame_number % frame_stride != 0:
                frame_number += 1
                continue
            if writer is None:
                height, width = frame.shape[:2]
                writer = cv2.VideoWriter(
                    tracked_video_path,
                    cv2.VideoWriter_fourcc(*"mp4v"),
                    max(1.0, (fps or 30.0) / frame_stride),
                    (width, height),
                )

            points = []
            confidences = []
            result = None
            if pet_counter.model is not None:
                results = pet_counter.model.track(
                    source=frame, conf=0.15, imgsz=640, classes=[0],
                    persist=True, verbose=False
                )
                result = results[0] if results else None
            if result is not None and result.boxes is not None:
                boxes = result.boxes.xyxy.cpu().numpy()
                confs = result.boxes.conf.cpu().numpy()
                ids = result.boxes.id.cpu().numpy() if result.boxes.id is not None else []
                for index, (box, conf) in enumerate(zip(boxes, confs)):
                    x1, y1, x2, y2 = [int(value) for value in box]
                    points.append((int((x1 + x2) / 2), int((y1 + y2) / 2)))
                    confidences.append(float(conf))
                    track_label = "person"
                    if len(ids) > index:
                        track_id = int(ids[index])
                        tracked_ids.add(track_id)
                        track_label = f"ID {track_id}"
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 80), 2)
                    cv2.putText(frame, track_label, (x1, max(18, y1 - 6)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 80), 1)

            cv2.putText(frame, f"YOLO11x | People: {len(points)} | Tracked: {len(tracked_ids)}", (20, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 80), 2)
            writer.write(frame)

            if frame_number in sample_indices:
                counts.append(len(points))
                confidence = sum(confidences) / len(confidences) if confidences else 0.0
                if len(points) > len(best_points):
                    best_points = points
                    best_confidence = confidence
                    best_frame = frame.copy()
            frame_number += 1

        capture.release()
        if writer is not None:
            writer.release()
            ffmpeg_path = shutil.which("ffmpeg")
            browser_path = os.path.join("clips", f"tracked_video_{video_id}_browser.mp4")
            if ffmpeg_path:
                try:
                    subprocess.run([ffmpeg_path, "-y", "-loglevel", "error", "-i", tracked_video_path, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", browser_path], check=True)
                    os.replace(browser_path, tracked_video_path)
                except Exception as conversion_error:
                    print(f"Tracked video H.264 conversion skipped: {conversion_error}")
                    if os.path.exists(browser_path): os.remove(browser_path)

        if best_frame is None:
            raise RuntimeError("No readable frames were found in the uploaded video")

        height, width = best_frame.shape[:2]
        frame_name = f"video_{video_id}_analysis.jpg"
        frame_path = os.path.join("frames", frame_name)
        os.makedirs("frames", exist_ok=True)
        annotated = best_frame.copy()
        for x, y in best_points:
            cv2.circle(annotated, (x, y), 5, (0, 255, 0), -1)
        cv2.putText(annotated, f"YOLO people: {len(best_points)}", (20, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        cv2.imwrite(frame_path, annotated)

        points = best_points
        people_count = len(points)
        groups = crowd_analyzer.detect_groups(points)
        heatmap_path = crowd_analyzer.generate_density_heatmap(frame_path, points)
        default_zones = [
            {"zone_name": "Zone A", "polygon_coords": [[0, 0], [width // 2, 0], [width // 2, height // 2], [0, height // 2]], "capacity": 40, "risk_weight": 1.0},
            {"zone_name": "Zone B", "polygon_coords": [[width // 2, 0], [width, 0], [width, height // 2], [width // 2, height // 2]], "capacity": 40, "risk_weight": 1.1},
            {"zone_name": "Zone C", "polygon_coords": [[0, height // 2], [width // 2, height // 2], [width // 2, height], [0, height]], "capacity": 50, "risk_weight": 1.0},
            {"zone_name": "Zone D", "polygon_coords": [[width // 2, height // 2], [width, height // 2], [width, height], [width // 2, height]], "capacity": 60, "risk_weight": 1.4},
        ]
        zone_results = crowd_analyzer.analyze_zones(points, default_zones)
        risk_score, risk_level = crowd_analyzer.run_risk_engine(people_count, zone_results, None)
        recommendation = "Direct people toward the least occupied exit and monitor the highest-density zone."
        if risk_level in ["HIGH", "CRITICAL"]:
            recommendation = "High crowd risk detected. Slow inflow and redirect people away from the highest-density zone."

        analysis = AnalysisResult(
            video_id=video_id, camera_id=video.camera_id, source_type="video",
            image_path=frame_path, heatmap_path=heatmap_path,
            timestamp=datetime.utcnow(), people_count=people_count,
            density_score=min(100.0, people_count / max(1, width * height / 10000) * 100),
            risk_score=risk_score, risk_level=risk_level,
            confidence=best_confidence, processing_time=0.0,
            points_json=json.dumps(points), preferred_exit="Exit D",
            avoid_exit="Exit B", recommendation_text=(
                f"{recommendation} Sampled {len(counts)} frames; peak count {max(counts) if counts else people_count}. "
                f"Tracked IDs: {len(tracked_ids)}."
            )
        )
        db.add(analysis)
        db.flush()
        for group in groups:
            db.add(CrowdGroup(analysis_id=analysis.id, group_number=group["group_number"], people_count=group["people_count"], density_level=group["density_level"], centroid_x=group["centroid"][0], centroid_y=group["centroid"][1], bbox_x=group["bbox"][0], bbox_y=group["bbox"][1], bbox_w=group["bbox"][2], bbox_h=group["bbox"][3]))
        for zone in zone_results:
            db.add(CrowdZone(analysis_id=analysis.id, zone_name=zone["zone_name"], people_count=zone["people_count"], density_score=zone["risk_score"], risk_score=zone["risk_score"], risk_level=zone["risk_level"]))
        video.status = "indexed"
        db.commit()
    except Exception as e:
        db.rollback()
        video = db.query(Video).filter(Video.id == video_id).first()
        if video:
            video.status = "error"
            db.commit()
        print(f"Error in video processing: {e}")
    finally:
        db.close()

import numpy as np
import cv2

@router.post("/analyze/image", response_model=CrowdAnalysisResult)
async def analyze_image(
    file: UploadFile = File(...),
    camera_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    # Validate format
    if not file.filename.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
        raise HTTPException(status_code=400, detail="Invalid image format. Supported formats: JPG, PNG, WEBP.")

    # Save uploaded file
    filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    start_time = datetime.utcnow()

    # 1. Point Localization (PET)
    points, confidence = pet_counter.localize(file_path)
    people_count = len(points)

    # 2. Group detection (DBSCAN)
    groups = crowd_analyzer.detect_groups(points)

    # 3. Density heatmap generation (KDE overlay)
    heatmap_path = crowd_analyzer.generate_density_heatmap(file_path, points)

    # 4. Zone analysis
    db_zones = []
    if camera_id:
        db_zones = db.query(CameraZone).filter(CameraZone.camera_id == camera_id).all()
        camera = db.query(Camera).filter(Camera.id == camera_id).first()
        physical_area = camera.monitored_area_sqm if camera else None
    else:
        physical_area = None

    # Fallback to standard quadrant zones if camera has no configured zones
    if not db_zones:
        # Generate default quadrands based on simple image bounds (e.g. 640x480)
        default_zones = [
            {"zone_name": "Zone A", "polygon_coords": [[0,0], [320,0], [320,240], [0,240]], "capacity": 40, "risk_weight": 1.0},
            {"zone_name": "Zone B", "polygon_coords": [[320,0], [640,0], [640,240], [320,240]], "capacity": 40, "risk_weight": 1.1},
            {"zone_name": "Zone C", "polygon_coords": [[0,240], [320,240], [320,480], [0,480]], "capacity": 50, "risk_weight": 1.0},
            {"zone_name": "Zone D", "polygon_coords": [[320,240], [640,240], [640,480], [320,480]], "capacity": 60, "risk_weight": 1.4},
        ]
        zone_results = crowd_analyzer.analyze_zones(points, default_zones)
    else:
        zone_results = crowd_analyzer.analyze_zones(points, [
            {
                "zone_name": z.zone_name,
                "polygon_coords": z.polygon_coords,
                "capacity": z.capacity,
                "risk_weight": z.risk_weight
            } for z in db_zones
        ])

    # 5. Risk Calculation
    risk_score, risk_level = crowd_analyzer.run_risk_engine(people_count, zone_results, physical_area)

    # 6. Exit route routing using Dijkstra
    routes_config = db.query(RouteConfig).all()
    routes_list = [
        {
            "source_zone": r.source_zone,
            "destination_exit": r.destination_exit,
            "path_nodes": r.path_nodes,
            "distance_meters": r.distance_meters
        } for r in routes_config
    ]
    
    # Map risks for routing penalty
    zone_risks = {z["zone_name"]: z["risk_score"] for z in zone_results}
    # Add exits occupancies/risks
    exits = db.query(ExitConfig).all()
    for ex in exits:
        zone_risks[ex.name] = 80.0 if ex.status == "congested" else 20.0

    # Dijkstra safe routing
    preferred_exit, avoid_exit, recommendation = crowd_analyzer.find_safer_route(
        source_zone="Zone B" if len(zone_results) > 1 else "Zone A",
        zone_risks=zone_risks,
        routes_config=routes_list
    )

    processing_time = (datetime.utcnow() - start_time).total_seconds()

    # Save to database
    db_analysis = AnalysisResult(
        camera_id=camera_id,
        source_type="image",
        image_path=file_path,
        heatmap_path=heatmap_path,
        people_count=people_count,
        density_score=float(people_count // 2), # Relative score
        risk_score=risk_score,
        risk_level=risk_level,
        confidence=confidence,
        processing_time=processing_time,
        points_json=json.dumps(points),
        preferred_exit=preferred_exit,
        avoid_exit=avoid_exit,
        recommendation_text=recommendation
    )
    db.add(db_analysis)
    db.commit()
    db.refresh(db_analysis)

    # Save groups and zones
    for g in groups:
        db_group = CrowdGroup(
            analysis_id=db_analysis.id,
            group_number=g["group_number"],
            people_count=g["people_count"],
            density_level=g["density_level"],
            centroid_x=g["centroid"][0],
            centroid_y=g["centroid"][1],
            bbox_x=g["bbox"][0],
            bbox_y=g["bbox"][1],
            bbox_w=g["bbox"][2],
            bbox_h=g["bbox"][3]
        )
        db.add(db_group)

    for z in zone_results:
        db_zone = CrowdZone(
            analysis_id=db_analysis.id,
            zone_name=z["zone_name"],
            people_count=z["people_count"],
            density_score=z["risk_score"], # Store computed risk score as density
            risk_score=z["risk_score"],
            risk_level=z["risk_level"]
        )
        db.add(db_zone)
    db.commit()

    # High Density alarm trigger
    if risk_level in ["HIGH", "CRITICAL"]:
        incident_type = "Critical Density" if risk_level == "CRITICAL" else "Rapid Crowd Formation"
        db_incident = Incident(
            camera_id=camera_id,
            incident_type=incident_type,
            severity=risk_level.lower(),
            description=f"{incident_type} alert on uploaded footage. Risk Score: {int(risk_score)}%.",
            ai_summary=recommendation,
            status="detected"
        )
        db.add(db_incident)
        db.commit()

    # Count hotspots (zones with risk > 50)
    hotspots_count = sum(1 for z in zone_results if z["risk_score"] > 50)

    # Return structured JSON response
    return CrowdAnalysisResult(
        analysis_id=db_analysis.id,
        people_count=people_count,
        model_confidence=confidence,
        density={
            "relative": int(people_count // 2),
            "physical": float(people_count / physical_area) if physical_area else None,
            "level": risk_level
        },
        groups=len(groups),
        hotspots=hotspots_count,
        risk={
            "score": int(risk_score),
            "level": risk_level
        },
        zones=zone_results,
        recommendation={
            "preferred_exit": preferred_exit,
            "avoid_exit": avoid_exit,
            "reason": recommendation
        },
        visualizations={
            "points": f"/{file_path}",
            "heatmap": f"/{heatmap_path}",
            "zones": f"/{file_path}"
        }
    )

@router.post("/analyze/video")
async def analyze_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    camera_id: Optional[int] = Form(None),
    db: Session = Depends(get_db)
):
    if not file.filename or not file.filename.lower().endswith((".mp4", ".avi", ".mkv", ".mov", ".webm", ".m4v")):
        raise HTTPException(status_code=400, detail="Invalid video format. Use MP4, AVI, MKV, MOV, WEBM, or M4V.")
    
    filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    size_bytes = os.path.getsize(file_path)
    
    video = Video(
        filename=filename,
        original_name=file.filename,
        camera_id=camera_id,
        duration=0.0,
        resolution="1080p",
        fps=30.0,
        size_bytes=size_bytes,
        status="uploaded"
    )
    db.add(video)
    db.commit()
    db.refresh(video)

    # Launch background analyzer pipeline
    from models.database import SessionLocal
    background_tasks.add_task(process_video_async, video.id, file_path, SessionLocal)

    return video

@router.get("/videos/{video_id}/result", response_model=CrowdAnalysisResult)
def get_video_analysis_result(video_id: int, db: Session = Depends(get_db)):
    result = db.query(AnalysisResult).filter(AnalysisResult.video_id == video_id).order_by(AnalysisResult.timestamp.desc()).first()
    if not result:
        video = db.query(Video).filter(Video.id == video_id).first()
        if not video:
            raise HTTPException(status_code=404, detail="Video not found")
        if video.status == "error":
            raise HTTPException(status_code=422, detail="Video analysis failed")
        raise HTTPException(status_code=202, detail="Video analysis is still processing")
    payload = get_crowd_result(result.id, db)
    payload.visualizations["tracked_video"] = f"/clips/tracked_video_{video_id}.mp4"
    return payload

@router.get("/results/{id}", response_model=CrowdAnalysisResult)
def get_crowd_result(id: int, db: Session = Depends(get_db)):
    result = db.query(AnalysisResult).filter(AnalysisResult.id == id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Analysis result not found")

    # Fetch groups and zones
    groups = db.query(CrowdGroup).filter(CrowdGroup.analysis_id == id).all()
    zones = db.query(CrowdZone).filter(CrowdZone.analysis_id == id).all()

    zone_results = [
        {
            "zone_name": z.zone_name,
            "people_count": z.people_count,
            "capacity": 50, # default placeholder
            "occupancy_percentage": (z.people_count / 50.0) * 100.0,
            "risk_score": z.risk_score,
            "risk_level": z.risk_level
        } for z in zones
    ]

    hotspots_count = sum(1 for z in zone_results if z["risk_score"] > 50)

    return CrowdAnalysisResult(
        analysis_id=result.id,
        people_count=result.people_count,
        model_confidence=result.confidence,
        density={
            "relative": int(result.density_score),
            "physical": None,
            "level": result.risk_level
        },
        groups=len(groups),
        hotspots=hotspots_count,
        risk={
            "score": int(result.risk_score),
            "level": result.risk_level
        },
        zones=zone_results,
        recommendation={
            "preferred_exit": result.preferred_exit,
            "avoid_exit": result.avoid_exit,
            "reason": result.recommendation_text
        },
        visualizations={
            "points": f"/{result.image_path}",
            "heatmap": f"/{result.heatmap_path}" if result.heatmap_path else f"/{result.image_path}",
            "zones": f"/{result.image_path}"
        }
    )

@router.get("/dashboard")
def get_crowd_dashboard(db: Session = Depends(get_db)):
    # Calculate global counters
    latest_result = db.query(AnalysisResult).order_by(AnalysisResult.timestamp.desc()).first()
    
    total_people = latest_result.people_count if latest_result else 2841
    global_risk = int(latest_result.risk_score) if latest_result else 78
    global_risk_level = latest_result.risk_level if latest_result else "HIGH"

    active_zones = db.query(CameraZone).count()
    if active_zones == 0: active_zones = 12

    # Alerts (critical severity incidents)
    alerts = db.query(Incident).filter(Incident.status != "resolved").order_by(Incident.timestamp.desc()).limit(5).all()
    active_alerts = []
    for a in alerts:
        cam = db.query(Camera).filter(Camera.id == a.camera_id).first() if a.camera_id else None
        active_alerts.append({
            "id": a.id,
            "type": a.incident_type,
            "severity": a.severity.upper(),
            "location": cam.name if cam else "Main Facility",
            "time": "Just now" if (datetime.utcnow() - a.timestamp).total_seconds() < 120 else f"{(datetime.utcnow() - a.timestamp).seconds // 60} mins ago",
            "risk_score": 92 if a.severity == "critical" else 71 if a.severity == "high" else 54
        })


    # In case DB was cleared, fill some default alerts
    if not active_alerts:
        active_alerts = [
            {"id": 1, "type": "Critical density", "location": "Zone D", "severity": "CRITICAL", "risk_score": 92, "time": "2 min ago"},
            {"id": 2, "type": "Rapid crowd formation", "location": "North Gate", "severity": "HIGH", "risk_score": 71, "time": "12 min ago"},
            {"id": 3, "type": "Moderate congestion", "location": "Food Court", "severity": "MODERATE", "risk_score": 54, "time": "25 min ago"}
        ]

    # Generate historical crowd trend for charts (Recharts)
    history = db.query(AnalysisResult).order_by(AnalysisResult.timestamp.asc()).limit(12).all()
    trend_data = []
    for h in history:
        trend_data.append({
            "time": h.timestamp.strftime("%H:%M"),
            "people": h.people_count,
            "density": int(h.density_score),
            "risk": int(h.risk_score)
        })

    if not trend_data:
        # Fallback charts data
        trend_data = [
            {"time": "10:00", "people": 1000, "density": 33, "risk": 20},
            {"time": "11:00", "people": 1500, "density": 50, "risk": 32},
            {"time": "12:00", "people": 2000, "density": 66, "risk": 55},
            {"time": "13:00", "people": 2500, "density": 83, "risk": 78},
            {"time": "14:00", "people": 2841, "density": 92, "risk": 78}
        ]

    return {
        "people_detected": total_people,
        "crowd_risk": global_risk,
        "risk_level": global_risk_level,
        "active_zones": active_zones,
        "critical_areas": 3,
        "alerts": active_alerts,
        "trend": trend_data
    }

@router.get("/zones")
def list_zones(db: Session = Depends(get_db)):
    return db.query(CameraZone).all()

@router.post("/zones/configure")
def configure_zone(config: ZoneConfig, db: Session = Depends(get_db)):
    new_zone = CameraZone(
        camera_id=config.camera_id,
        zone_name=config.zone_name,
        polygon_coords=json.dumps(config.polygon_coords),
        capacity=config.capacity,
        risk_weight=config.risk_weight
    )
    db.add(new_zone)
    db.commit()
    db.refresh(new_zone)
    return new_zone

@router.post("/exits/configure")
def configure_exit(ex: ExitCreate, db: Session = Depends(get_db)):
    new_exit = ExitConfig(
        name=ex.name,
        location=ex.location,
        capacity_limit=ex.capacity_limit,
        status="open"
    )
    db.add(new_exit)
    db.commit()
    db.refresh(new_exit)
    return new_exit

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import random

from models.database import get_db, Video, Camera, Incident, SearchHistory, AnalysisResult

router = APIRouter()


@router.get("/overview")
def get_overview(db: Session = Depends(get_db)):
    analyses = db.query(AnalysisResult).all()
    
    total_people = sum(a.people_count for a in analyses) if analyses else 24591
    peak_crowd = max(a.people_count for a in analyses) if analyses else 2841
    avg_density = sum(a.density_score for a in analyses) / len(analyses) if analyses else 72.5
    critical_events = db.query(Incident).filter(Incident.severity == "critical").count()
    
    return {
        "total_people_analyzed": total_people,
        "peak_crowd_count": peak_crowd,
        "average_density": float(round(avg_density, 1)),
        "active_cameras": db.query(Camera).filter(Camera.status == "online").count(),
        "incidents_today": db.query(Incident).filter(Incident.timestamp >= datetime.utcnow() - timedelta(days=1)).count(),
        "critical_events": critical_events
    }

@router.get("/detections")
def get_detection_trends(db: Session = Depends(get_db)):
    # Query latest 7 hourly analysis records from the database
    analyses = db.query(AnalysisResult).order_by(AnalysisResult.timestamp.desc()).limit(7).all()
    analyses = list(reversed(analyses)) # Chronological order
    
    if len(analyses) < 7:
        # Fallback if there is not enough historical database entries
        dates = [(datetime.utcnow() - timedelta(hours=i)).strftime("%H:%M") for i in range(6, -1, -1)]
        people_data = [400, 850, 1200, 1850, 2400, 2841, 2600]
        density_data = [20, 35, 50, 68, 80, 92, 85]
    else:
        dates = [a.timestamp.strftime("%H:%M") for a in analyses]
        people_data = [a.people_count for a in analyses]
        density_data = [int(a.density_score) for a in analyses]
        
    return {
        "labels": dates,
        "datasets": [
            {
                "label": "People Detected",
                "data": people_data
            },
            {
                "label": "Relative Density",
                "data": density_data
            }
        ]
    }


@router.get("/searches")
def get_common_searches():
    return [
        {"query": "person in red shirt", "count": 45},
        {"query": "white van", "count": 32},
        {"query": "person running", "count": 28},
        {"query": "abandoned bag", "count": 15},
        {"query": "bicycle", "count": 12}
    ]

@router.get("/cameras")
def get_camera_metrics():
    return [
        {"name": "Main Entrance", "uptime": 99.9, "detections_per_hour": 150},
        {"name": "Back Alley", "uptime": 98.5, "detections_per_hour": 15},
        {"name": "Parking Lot A", "uptime": 95.0, "detections_per_hour": 85},
        {"name": "Loading Dock", "uptime": 99.0, "detections_per_hour": 40},
    ]

@router.get("/incidents")
def get_incident_distribution(db: Session = Depends(get_db)):
    incidents = db.query(Incident).all()
    types = {}
    for i in incidents:
        types[i.incident_type] = types.get(i.incident_type, 0) + 1
        
    return {
        "labels": list(types.keys()),
        "data": list(types.values())
    }

@router.get("/system")
def get_system_health():
    return {
        "storage_used_gb": 45.5,
        "storage_total_gb": 1000.0,
        "faiss_index_size_mb": 156.8,
        "gpu_utilization_percent": random.randint(15, 65),
        "cpu_utilization_percent": random.randint(10, 40),
        "ram_used_gb": 4.2,
        "ram_total_gb": 16.0
    }

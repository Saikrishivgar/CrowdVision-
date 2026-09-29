from models.database import (
    SessionLocal, Camera, Video, Incident, SearchHistory, User,
    ExitConfig, RouteConfig, CameraZone, AnalysisResult, CrowdZone, CrowdGroup
)
from passlib.context import CryptContext
from datetime import datetime, timedelta
import os
import random
import json

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def populate_demo_data():
    db = SessionLocal()
    try:
        # 1. Admin User
        if db.query(User).count() == 0:
            admin_user = User(
                username="admin",
                email="admin@crowdvision.local",
                hashed_password=pwd_context.hash("admin123"),
                role="admin",
                is_active=True
            )
            db.add(admin_user)
            
        # 2. Exits
        if db.query(ExitConfig).count() == 0:
            exits = [
                {"name": "Exit A", "location": "North Gate", "capacity_limit": 300, "current_occupancy": 32, "status": "open"},
                {"name": "Exit B", "location": "South Gate", "capacity_limit": 200, "current_occupancy": 187, "status": "congested"},
                {"name": "Exit C", "location": "East Annex", "capacity_limit": 150, "current_occupancy": 84, "status": "open"},
                {"name": "Exit D", "location": "West Annex", "capacity_limit": 250, "current_occupancy": 51, "status": "open"}
            ]
            for ex in exits:
                db.add(ExitConfig(**ex))

        # 3. Cameras
        if db.query(Camera).count() == 0:
            cameras = [
                {"name": "CAM-NorthGate-01", "location": "North Perimeter", "status": "online", "rtsp_url": "rtsp://demo/1", "monitored_area_sqm": 250.0, "perspective_calibrated": True, "capacity_threshold": 300},
                {"name": "CAM-Lobby-Main", "location": "Building A Lobby", "status": "online", "rtsp_url": "rtsp://demo/2", "monitored_area_sqm": 120.0, "perspective_calibrated": True, "capacity_threshold": 150},
                {"name": "CAM-Parking-L1", "location": "Underground Parking", "status": "offline", "rtsp_url": "rtsp://demo/3", "monitored_area_sqm": 180.0, "perspective_calibrated": False, "capacity_threshold": 100},
                {"name": "CAM-LoadingDock", "location": "South Perimeter", "status": "online", "rtsp_url": "rtsp://demo/4", "monitored_area_sqm": 200.0, "perspective_calibrated": True, "capacity_threshold": 200},
                {"name": "CAM-Corridor-East", "location": "Building B Corridor", "status": "online", "rtsp_url": "rtsp://demo/5", "monitored_area_sqm": 90.0, "perspective_calibrated": True, "capacity_threshold": 80},
                {"name": "CAM-DataCenter", "location": "Secure Zone", "status": "maintenance", "rtsp_url": "rtsp://demo/6", "monitored_area_sqm": 50.0, "perspective_calibrated": True, "capacity_threshold": 30},
            ]
            for cam in cameras:
                db.add(Camera(**cam))
            db.commit() # commit to get camera IDs

        # 4. Camera Zones
        if db.query(CameraZone).count() == 0:
            # Setup zones for NorthGate-01
            zones = [
                {"camera_id": 1, "zone_name": "Zone A", "polygon_coords": json.dumps([[10, 10], [300, 10], [300, 200], [10, 200]]), "capacity": 50, "risk_weight": 1.0},
                {"camera_id": 1, "zone_name": "Zone B", "polygon_coords": json.dumps([[310, 10], [600, 10], [600, 200], [310, 200]]), "capacity": 60, "risk_weight": 1.2},
                {"camera_id": 1, "zone_name": "Zone C", "polygon_coords": json.dumps([[10, 210], [300, 210], [300, 400], [10, 400]]), "capacity": 50, "risk_weight": 1.0},
                {"camera_id": 1, "zone_name": "Zone D", "polygon_coords": json.dumps([[310, 210], [600, 210], [600, 400], [310, 400]]), "capacity": 70, "risk_weight": 1.5},
            ]
            for z in zones:
                db.add(CameraZone(**z))

        # 5. Exits & Routes Graph
        if db.query(RouteConfig).count() == 0:
            routes = [
                {"source_zone": "Zone A", "destination_exit": "Exit A", "path_nodes": json.dumps(["Zone A", "Exit A"]), "distance_meters": 15.0},
                {"source_zone": "Zone B", "destination_exit": "Exit D", "path_nodes": json.dumps(["Zone B", "Zone A", "Exit D"]), "distance_meters": 35.0},
                {"source_zone": "Zone C", "destination_exit": "Exit C", "path_nodes": json.dumps(["Zone C", "Exit C"]), "distance_meters": 22.0},
                {"source_zone": "Zone D", "destination_exit": "Exit D", "path_nodes": json.dumps(["Zone D", "Zone C", "Exit D"]), "distance_meters": 40.0},
            ]
            for r in routes:
                db.add(RouteConfig(**r))

        # 6. Videos
        if db.query(Video).count() == 0:
            videos = [
                {"filename": "video1.mp4", "original_name": "crowd_north_gate.mp4", "camera_id": 1, "duration": 120.5, "resolution": "1080p", "fps": 30, "size_bytes": 10485760, "status": "indexed"},
                {"filename": "video2.mp4", "original_name": "lobby_rush_hour.mp4", "camera_id": 2, "duration": 45.0, "resolution": "720p", "fps": 15, "size_bytes": 5242880, "status": "indexed"},
                {"filename": "video3.mp4", "original_name": "parking_movement.mp4", "camera_id": 3, "duration": 300.0, "resolution": "1080p", "fps": 30, "size_bytes": 25000000, "status": "processing"},
            ]
            for vid in videos:
                db.add(Video(**vid))

        # 7. Incidents
        if db.query(Incident).count() == 0:
            incidents = [
                {
                    "incident_type": "Critical Density",
                    "severity": "critical",
                    "timestamp": datetime.utcnow() - timedelta(minutes=2),
                    "description": "Zone D density reached critical safety threshold.",
                    "ai_summary": "Extremely high density (92% risk) detected in Zone D of North Gate. 187 individuals localized in Zone B/D.",
                    "status": "detected",
                    "camera_id": 1
                },
                {
                    "incident_type": "Rapid Crowd Growth",
                    "severity": "high",
                    "timestamp": datetime.utcnow() - timedelta(minutes=15),
                    "description": "Rapid crowd concentration near Lobby Main Entrance.",
                    "ai_summary": "Lobby camera registered an increase of +142 people over 3 minutes. Influx from North Plaza.",
                    "status": "acknowledged",
                    "camera_id": 2
                },
                {
                    "incident_type": "Exit Congestion",
                    "severity": "medium",
                    "timestamp": datetime.utcnow() - timedelta(hours=2),
                    "description": "Exit B is heavily congested due to slow throughput.",
                    "ai_summary": "Crowd flow bottleneck detected at Exit B with estimated queuing latency of 5+ minutes.",
                    "status": "resolved",
                    "camera_id": 4
                },
            ]
            for inc in incidents:
                db.add(Incident(**inc))

        # 8. Historical Analysis Records (to feed Recharts on Dashboard & Analytics)
        if db.query(AnalysisResult).count() == 0:
            base_time = datetime.utcnow() - timedelta(hours=24)
            
            # Generate historical analyses (hourly points for the past 24 hours)
            for h in range(25):
                timestamp = base_time + timedelta(hours=h)
                
                # Base counts fluctuate realistically
                lobby_count = int(80 + 60 * random.uniform(0.5, 1.5) + (40 if 8 <= timestamp.hour <= 18 else 10))
                north_count = int(150 + 120 * random.uniform(0.6, 1.8) + (100 if 12 <= timestamp.hour <= 20 else 20))
                
                # Overall system count
                total_count = lobby_count + north_count
                
                # Calculate risk score
                risk = int(min(98, max(15, total_count // 5)))
                risk_lvl = "LOW"
                if risk > 75: risk_lvl = "CRITICAL"
                elif risk > 50: risk_lvl = "HIGH"
                elif risk > 25: risk_lvl = "MODERATE"
                
                analysis = AnalysisResult(
                    camera_id=1 if random.choice([True, False]) else 2,
                    source_type="video",
                    image_path=f"frames/demo_thumb_{h%2+1}.jpg",
                    heatmap_path=f"heatmaps/demo_heat_{h%2+1}.png",
                    timestamp=timestamp,
                    people_count=total_count,
                    density_score=float(total_count // 6),
                    risk_score=float(risk),
                    risk_level=risk_lvl,
                    confidence=0.92 + 0.05 * random.random(),
                    processing_time=0.45,
                    points_json=json.dumps([[random.randint(10, 600), random.randint(10, 400)] for _ in range(50)]),
                    preferred_exit="Exit D",
                    avoid_exit="Exit B",
                    recommendation_text="Direct incoming crowds to exit D. Keep exit B cleared."
                )
                db.add(analysis)

        # 9. Search History Suggestions
        if db.query(SearchHistory).count() == 0:
            histories = [
                {"query_text": "Which area is most crowded?", "results_count": 1, "search_time_ms": 95.0},
                {"query_text": "Show critical crowd incidents today", "results_count": 2, "search_time_ms": 115.0},
                {"query_text": "Compare crowd density between North Gate and Lobby", "results_count": 2, "search_time_ms": 180.0},
            ]
            for hs in histories:
                db.add(SearchHistory(**hs))

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error populating demo data: {e}")
    finally:
        db.close()

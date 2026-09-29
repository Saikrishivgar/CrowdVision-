from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from models.database import get_db, Incident
from pydantic import BaseModel

router = APIRouter()

class IncidentUpdate(BaseModel):
    status: str

@router.get("/")
def list_incidents(
    severity: Optional[str] = None,
    status: Optional[str] = None,
    camera_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Incident)
    if severity:
        query = query.filter(Incident.severity == severity)
    if status:
        query = query.filter(Incident.status == status)
    if camera_id:
        query = query.filter(Incident.camera_id == camera_id)
        
    return query.order_by(Incident.timestamp.desc()).all()

@router.get("/stats")
def get_incident_stats(db: Session = Depends(get_db)):
    incidents = db.query(Incident).all()
    
    severity_counts = {"low": 0, "medium": 0, "high": 0, "critical": 0}
    type_counts = {}
    
    for inc in incidents:
        if inc.severity in severity_counts:
            severity_counts[inc.severity] += 1
            
        type_counts[inc.incident_type] = type_counts.get(inc.incident_type, 0) + 1
        
    return {
        "total": len(incidents),
        "by_severity": severity_counts,
        "by_type": type_counts,
        "unresolved": sum(1 for i in incidents if i.status != "resolved")
    }

@router.get("/{id}")
def get_incident(id: int, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident

@router.patch("/{id}")
def update_incident(id: int, incident_update: IncidentUpdate, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    incident.status = incident_update.status
    db.commit()
    db.refresh(incident)
    return incident

@router.delete("/{id}")
def delete_incident(id: int, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
        
    db.delete(incident)
    db.commit()
    return {"detail": "Incident deleted"}

import json
import urllib.error
import urllib.request
from typing import Any, Dict, Optional
from sqlalchemy.orm import Session
from config import settings
from models.database import AnalysisResult, CrowdZone, ExitConfig, SearchHistory

def risk_level(score: float) -> str:
    if score >= 80: return "CRITICAL"
    if score >= 60: return "HIGH"
    if score >= 35: return "MODERATE"
    return "LOW"

def build_context(db: Session, analysis_id: Optional[int] = None) -> Dict[str, Any]:
    query = db.query(AnalysisResult)
    if analysis_id: query = query.filter(AnalysisResult.id == analysis_id)
    latest = query.order_by(AnalysisResult.timestamp.desc()).first()
    if not latest: return {"has_data": False, "message": "No completed crowd analysis exists yet."}
    zones = db.query(CrowdZone).filter(CrowdZone.analysis_id == latest.id).order_by(CrowdZone.risk_score.desc()).all()
    # Video indexing records may not have zone rows yet. Prefer the newest
    # completed analysis that includes zones so area questions remain useful.
    if not zones and not analysis_id:
        zoned_ids = [row[0] for row in db.query(CrowdZone.analysis_id).distinct().all()]
        if zoned_ids:
            latest = db.query(AnalysisResult).filter(AnalysisResult.id.in_(zoned_ids)).order_by(AnalysisResult.timestamp.desc()).first()
            zones = db.query(CrowdZone).filter(CrowdZone.analysis_id == latest.id).order_by(CrowdZone.risk_score.desc()).all()
    exits = db.query(ExitConfig).order_by(ExitConfig.current_occupancy.asc()).all()
    recent = db.query(AnalysisResult).order_by(AnalysisResult.timestamp.desc()).limit(8).all()
    trend_per_minute = 0.0
    if len(recent) >= 2:
        older, newer = recent[-1], recent[0]
        elapsed = max((newer.timestamp - older.timestamp).total_seconds() / 60.0, 1.0)
        trend_per_minute = round((newer.people_count - older.people_count) / elapsed, 2)
    projected_15m = max(0, round(latest.people_count + trend_per_minute * 15))
    open_exits = [e for e in exits if e.status != "closed"]
    available_capacity = sum(max(0, (e.capacity_limit or 0) - (e.current_occupancy or 0)) for e in open_exits)
    clearable_15m = min(latest.people_count, len(open_exits) * 30 * 15, available_capacity) if open_exits else 0
    return {"has_data": True, "analysis_id": latest.id, "timestamp": latest.timestamp.isoformat(),
            "people_count": latest.people_count, "risk_score": round(float(latest.risk_score or 0), 1),
            "risk_level": latest.risk_level, "density_score": round(float(latest.density_score or 0), 1),
            "trend_people_per_minute": trend_per_minute, "projected_people_15_minutes": projected_15m,
            "zones": [{"name": z.zone_name, "people": z.people_count, "risk_score": round(float(z.risk_score or 0), 1),
                       "risk_level": z.risk_level} for z in zones],
            "exits": [{"name": e.name, "status": e.status, "occupancy": e.current_occupancy, "capacity": e.capacity_limit} for e in exits],
            "estimated_clearable_15_minutes": clearable_15m, "open_exit_count": len(open_exits)}

def deterministic_answer(context: Dict[str, Any], message: str = "") -> str:
    if not context.get("has_data"):
        return "I do not have a completed crowd analysis yet. Upload an image or video first, then ask me about risk, zones, exits, or clearance."
    zones = context["zones"]; highest = zones[0] if zones else None
    if "low risk" in message.lower() or "safest area" in message.lower():
        low = [z for z in zones if float(z["risk_score"]) < 35]
        if low:
            return "Low-risk areas: " + ", ".join(z["name"] + " (" + str(z["risk_score"]) + "/100)" for z in low) + "."
        if zones:
            z = zones[-1]
            return "No zone is currently low risk. The lowest measured zone is " + z["name"] + " at " + str(z["risk_score"]) + "/100 (" + z["risk_level"] + ")."
        return "No low-risk area is available: the latest analysis has no zone measurements and facility risk is " + str(context["risk_score"]) + "/100 (" + context["risk_level"] + "). Upload an image to calculate zone risk."
    open_exits = [e for e in context["exits"] if e["status"] != "closed"]
    safest = min(open_exits, key=lambda e: e["occupancy"] / max(e["capacity"], 1), default=None)
    trend = context["trend_people_per_minute"]
    trend_text = f"increasing by about {trend} people/minute" if trend > 0 else f"decreasing by about {abs(trend)} people/minute" if trend < 0 else "currently stable"
    zone_text = (f"{highest['name']} is the first area to act on: {highest['people']} people, risk {highest['risk_score']}/100 ({highest['risk_level']})." if highest else "No zone-level measurements are available.")
    exit_text = f"{safest['name']} has the lowest occupancy ratio among open exits." if safest else "There are no open exits configured."
    return (f"Based on analysis #{context['analysis_id']}, the facility has {context['people_count']} detected people with overall risk {context['risk_score']}/100 ({context['risk_level']}). Crowd movement is {trend_text}. {zone_text} {exit_text} At the configured planning rate, approximately {context['estimated_clearable_15_minutes']} people could be processed in 15 minutes. Treat this as an operational estimate and confirm it with on-site staff.")

def ask_huggingface(message: str, context: Dict[str, Any]) -> Optional[str]:
    token = settings.HUGGINGFACE_API_KEY.strip()
    if not token or not context.get("has_data"): return None
    prompt = ("You are CrowdVision's safety operations assistant. Answer concisely and use only the measured context. Never invent values. Say forecasts are estimates.\n"
              f"Measured context: {json.dumps(context, default=str)}\nUser question: {message}\nAnswer:")
    payload = json.dumps({"inputs": prompt, "parameters": {"max_new_tokens": 180, "temperature": 0.2}}).encode()
    request = urllib.request.Request(f"https://api-inference.huggingface.co/models/{settings.HUGGINGFACE_MODEL}", data=payload,
                                      headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=12) as response: data = json.loads(response.read().decode())
        if isinstance(data, list) and data and isinstance(data[0], dict):
            text = data[0].get("generated_text") or data[0].get("summary_text")
            if text: return str(text).replace(prompt, "").strip()
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, ValueError): pass
    return None

def run_chat(db: Session, message: str, analysis_id: Optional[int] = None) -> Dict[str, Any]:
    context = build_context(db, analysis_id)
    risk_question = "low risk" in message.lower() or "safest area" in message.lower()
    answer = deterministic_answer(context, message) if risk_question else (ask_huggingface(message, context) or deterministic_answer(context, message))
    forecast = []
    for zone in context.get("zones", [])[:4]:
        score = float(zone["risk_score"]); trend = max(0, context.get("trend_people_per_minute", 0))
        forecast.append({"area": zone["name"], "current_risk": score, "current_level": zone["risk_level"],
                         "predicted_level_15m": risk_level(min(100, score + trend * 0.5)), "people": zone["people"],
                         "action": "Reduce inflow and redirect people" if score >= 60 else "Continue monitoring"})
    if not forecast and context.get("has_data"):
        forecast.append({
            "area": "Facility-wide",
            "current_risk": context["risk_score"],
            "current_level": context["risk_level"],
            "predicted_level_15m": risk_level(min(100, context["risk_score"] + max(0, context["trend_people_per_minute"]) * 0.5)),
            "people": context["people_count"],
            "action": "Run an image analysis with configured zones for area-level guidance",
        })
    db.add(SearchHistory(query_text=message, results_count=len(forecast), search_time_ms=0.0)); db.commit()
    return {"answer": answer, "model": settings.HUGGINGFACE_MODEL if settings.HUGGINGFACE_API_KEY else "analytics-safe-fallback",
            "context": context, "forecast": forecast,
            "disclaimer": "Forecasts and clearance values are planning estimates based on observed analyses and configured exit capacity."}

# CrowdVision AI 👁️🏟️

> **AI-Powered Crowd Intelligence & Real-Time Evacuation Routing Platform**

Transform raw multi-camera CCTV feeds into real-time crowd dynamics, spatial density maps, anomaly detection, and congestion-aware evacuation pathways.

---

## 🌟 Key Features

- **3D Amphitheater Digital Twin**: Interactive WebGL Three.js stadium visualization with dynamic moving crowd particle flow and real-time perspective tracking.
- **YOLO11x Person Detection & Tracking**: Real-time object detection and multi-camera spatial tracking.
- **Gaussian KDE Density Heatmapping**: High-fidelity continuous density evaluation identifying real-time congestion hotspots.
- **DBSCAN Spatial Clustering**: Autonomous clustering classifying dense gatherings and spatial crowd groupings.
- **Dijkstra-Based Safe Evacuation Routing**: Dynamic routing that recalculates escape vectors weighted by crowd risk penalties.
- **Operator Command Portal**: Cyber-security access control with live telemetry stream.

---

## 🏗️ Project Architecture

```
CrowdVision/
├── backend/
│   ├── api/            # FastAPI REST endpoints (crowd, analytics, incidents, cameras)
│   ├── models/         # Database models & schemas
│   ├── pipeline/       # YOLO detection, tracking, KDE heatmapping & routing algorithms
│   ├── main.py         # Application entry point
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── app/        # Next.js 16 App Router (Landing, Dashboard, Login, Analytics, etc.)
    │   ├── components/ # 3D WebGL Canvas, FeatureCards, UI Components
    │   └── lib/        # API clients & utilities
    ├── package.json
    └── tailwind.config.ts
```

---

## 🚀 Quick Start Guide

### 1. Backend Setup (FastAPI & Computer Vision)

```bash
cd backend

# Create & activate environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the backend server (port 8001)
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

### 2. Frontend Setup (Next.js & Three.js)

```bash
cd frontend

# Install dependencies
npm install

# Start the development server (port 3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the landing page and operator command console.

---

## 🔐 Demo Credentials

- **Operator ID**: `admin`
- **Clearance Code**: `admin123`

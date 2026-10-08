# 🚗 Project Overview & Work Split — Nithish

**Developer Name**: Nithish  
**Role**: Full-Stack & Impact Dashboard Lead  
**Project**: AI-Based Traffic Management and Adaptive Signal Control  
**Repository**: [https://github.com/nith-ishh/erode-hackathon.git](https://github.com/nith-ishh/erode-hackathon.git)  
**Git Branch**: `nithish`

---

## 📌 Nithish's Assigned Modules & Codebase Ownership

1. **Frontend Dashboard UI**:
   * [`frontend/src/App.tsx`](file:///c:/Users/avine/Documents/erode%20hackathon/frontend/src/App.tsx) — Main layout, mode toggle, system status state.
   * [`frontend/src/components/JunctionVisualizer.tsx`](file:///c:/Users/avine/Documents/erode%20hackathon/frontend/src/components/JunctionVisualizer.tsx) — Real-time 2D Canvas SUMO Digital Twin visualizer with animated vehicle movements.
   * [`frontend/src/components/Header.tsx`](file:///c:/Users/avine/Documents/erode%20hackathon/frontend/src/components/Header.tsx) — Header bar with backend connection status badge & clock.

2. **Traffic Metrics & Fixed-Time Comparison**:
   * [`frontend/src/components/ImpactDashboard.tsx`](file:///c:/Users/avine/Documents/erode%20hackathon/frontend/src/components/ImpactDashboard.tsx) — Comparative analytics chart displaying **Adaptive AI Traffic** vs. **Fixed-Time Baseline Traffic**.
   * [`counterfactual/comparison.py`](file:///c:/Users/avine/Documents/erode%20hackathon/counterfactual/comparison.py) — Telemetry comparison calculator for delay reduction, queue reduction, and emergency response time saved.

3. **Backend Telemetry & Database**:
   * [`backend/app/main.py`](file:///c:/Users/avine/Documents/erode%20hackathon/backend/app/main.py) — FastAPI REST server & routing initialization.
   * [`backend/app/websocket/handler.py`](file:///c:/Users/avine/Documents/erode%20hackathon/backend/app/websocket/handler.py) — 10Hz WebSockets server streaming telemetry to frontend.
   * [`backend/app/database/db.py`](file:///c:/Users/avine/Documents/erode%20hackathon/backend/app/database/db.py) — SQLite database for audit log persistence.

---

## 🚀 Hackathon Pitch Responsibilities for Nithish

1. **Demonstrate 2D SUMO Digital Twin**: Open the dashboard during the pitch, showing live signal changes, vehicle queues, and real-time PCU traffic.
2. **Present Side-by-Side Traffic Comparison**: Show judges the comparison panel between **Adaptive AI Traffic** and **Fixed-Time Baseline Traffic**.
3. **Present Performance Gains**: Highlight 35.9% Delay Reduction, 37.7% Queue Reduction, and 38.9% Emergency Response Time Saved.

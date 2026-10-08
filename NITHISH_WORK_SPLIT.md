# 👤 Nithish's Personal Work Split & Pitch Guide
**Name**: Nithish  
**Role**: Full-Stack & Impact Dashboard Developer (Full-Stack / Frontend Lead)  
**Project**: AI-Based Traffic Management and Adaptive Signal Control  
**Target Repo**: [https://github.com/nith-ishh/erode-hackathon.git](https://github.com/nith-ishh/erode-hackathon.git)

---

## 🎯 Primary Responsibilities

1. **Live React + TypeScript Dashboard**:
   * Build & manage the main application UI ([`frontend/src/App.tsx`](file:///c:/Users/avine/Documents/erode%20hackathon/frontend/src/App.tsx)).
   * Develop the **2D SUMO Digital Twin Visualizer** ([`frontend/src/components/JunctionVisualizer.tsx`](file:///c:/Users/avine/Documents/erode%20hackathon/frontend/src/components/JunctionVisualizer.tsx)) with dynamic vehicle driving animations.
   * Render real-time telemetry, signal status lights, phase countdown timers, and active vehicle counts.

2. **Counterfactual Twin & Traffic Comparison**:
   * Develop the **Impact Dashboard** ([`frontend/src/components/ImpactDashboard.tsx`](file:///c:/Users/avine/Documents/erode%20hackathon/frontend/src/components/ImpactDashboard.tsx)).
   * Display side-by-side comparative analytics evaluating **Adaptive AI Traffic** vs. **Fixed-Time Baseline Traffic**.
   * Show live metrics:
     * ⏱️ **Average Delay Reduction**: 35.9% saved
     * 🚗 **Queue PCU Reduction**: 37.7% saved
     * 🚑 **Emergency Response Time Saved**: 38.9% faster

3. **Backend & Telemetry Infrastructure**:
   * Manage FastAPI REST APIs & WebSockets connection ([`backend/app/main.py`](file:///c:/Users/avine/Documents/erode%20hackathon/backend/app/main.py) & [`backend/app/websocket/handler.py`](file:///c:/Users/avine/Documents/erode%20hackathon/backend/app/websocket/handler.py)).
   * Maintain the SQLite Audit Database ([`backend/app/database/db.py`](file:///c:/Users/avine/Documents/erode%20hackathon/backend/app/database/db.py)) for auditability and post-pitch data verification.

---

## 💻 Codebase Files Owned by Nithish

| File Path | Description |
| :--- | :--- |
| [`frontend/src/components/JunctionVisualizer.tsx`](file:///c:/Users/avine/Documents/erode%20hackathon/frontend/src/components/JunctionVisualizer.tsx) | 2D SUMO Digital Twin Map Canvas with real-time driving canvas |
| [`frontend/src/components/ImpactDashboard.tsx`](file:///c:/Users/avine/Documents/erode%20hackathon/frontend/src/components/ImpactDashboard.tsx) | Side-by-side Adaptive AI Traffic vs Fixed-Time Traffic comparison |
| [`frontend/src/components/Header.tsx`](file:///c:/Users/avine/Documents/erode%20hackathon/frontend/src/components/Header.tsx) | Header with status badges and live system clock |
| [`backend/app/main.py`](file:///c:/Users/avine/Documents/erode%20hackathon/backend/app/main.py) | FastAPI backend initialization & REST endpoints |
| [`backend/app/websocket/handler.py`](file:///c:/Users/avine/Documents/erode%20hackathon/backend/app/websocket/handler.py) | 10Hz WebSockets simulation state streamer |
| [`backend/app/database/db.py`](file:///c:/Users/avine/Documents/erode%20hackathon/backend/app/database/db.py) | SQLite database for decision and telemetry audit logs |
| [`counterfactual/comparison.py`](file:///c:/Users/avine/Documents/erode%20hackathon/counterfactual/comparison.py) | Dual-twin counterfactual comparison engine |

---

## 🎤 Nithish's Pitch & Presentation Workflow

1. **Opening (Step 1)**:
   * Open the React Dashboard and showcase the live 2D SUMO Digital Twin junction in action.
   * Highlight the live telemetry, WebSocket streams, and real-time PCU traffic queues.

2. **Closing (Step 5)**:
   * Navigate to the **Impact Dashboard**.
   * Highlight the clear side-by-side comparison between **Adaptive AI Traffic** and **Fixed-Time Baseline Traffic**.
   * Present the final empirical gains: **35.9% Delay Reduction**, **37.7% Queue Reduction**, and **38.9% Emergency Time Saved**.

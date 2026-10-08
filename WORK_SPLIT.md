# Hackathon Team Work Split Document
**Project Title**: AI-Based Traffic Management and Adaptive Signal Control  
**Target Domain**: Trustworthy, Explainable, Safety-Shielded Adaptive Signal Control for Indian Mixed Traffic  

---

## 👥 4-Member Engineering Responsibility Matrix

### 👤 Member 1: Reinforcement Learning & Traffic Modeling Specialist (AI/ML Lead)
**Primary Focus**: Reinforcement Learning (PPO) Brain, Indian Passenger Car Unit (PCU) Weighting, Reward Function Design, and Gymnasium Environment Integration.

* **Assigned Codebase Files**:
  * [`rl/pcu.py`](file:///c:/Users/avine/Documents/erode%20hackathon/rl/pcu.py) — Indian PCU calculation engine for mixed vehicle types (Cars: 1.0, 2-Wheelers: 0.5, Buses: 3.0, Trucks: 3.0, Autos: 0.75).
  * [`rl/reward.py`](file:///c:/Users/avine/Documents/erode%20hackathon/rl/reward.py) — Multi-objective PPO reward function (delay penalty, queue minimization, pedestrian fairness, emergency bonus).
  * [`rl/environment.py`](file:///c:/Users/avine/Documents/erode%20hackathon/rl/environment.py) — Custom 18-dimensional normalized observation space Gymnasium environment (`TrafficSignalEnv`).
  * [`rl/train_ppo.py`](file:///c:/Users/avine/Documents/erode%20hackathon/rl/train_ppo.py) — PPO model training execution & hyperparameter tuning using Stable-Baselines3.
* **Key Pitch & Demo Responsibilities**:
  * Explain how PPO reinforcement learning adapts signal timing dynamically based on real-time PCU queue pressure.
  * Demonstrate why PCU weighting is critical for Indian mixed traffic compared to raw vehicle counts.

---

### 👤 Member 2: Safety Shield, JEV & Governance Engineer (Safety & Explainability Lead)
**Primary Focus**: Deterministic Guardrails, JEV Decision Evaluation Layer, Explain Engine, and Break-It Fault Demonstration.

* **Assigned Codebase Files**:
  * [`decision/safety_shield.py`](file:///c:/Users/avine/Documents/erode%20hackathon/decision/safety_shield.py) — Rule-Based Safety Shield enforcing 11 hardware/timing rules (Minimum green 10s, Maximum green 60s, Yellow clearance 4s, emergency override).
  * [`decision/jev.py`](file:///c:/Users/avine/Documents/erode%20hackathon/decision/jev.py) — JEV Layer evaluating queue imbalance ratios and context scoring.
  * [`decision/explain_engine.py`](file:///c:/Users/avine/Documents/erode%20hackathon/decision/explain_engine.py) — Natural language explanation generator for every AI decision.
  * [`decision/fallback_controller.py`](file:///c:/Users/avine/Documents/erode%20hackathon/decision/fallback_controller.py) — Fixed-Time Fallback state manager.
* **Key Pitch & Demo Responsibilities**:
  * Execute the live **`[ BREAK-IT ]`** fault injection button during the pitch.
  * Prove to judges that AI cannot cause signal collisions or safety violations because the Safety Shield is the final authority.

---

### 👤 Member 3: Simulation & Emergency Corridor Engineer (Traffic Sim & Green Wave Lead)
**Primary Focus**: SUMO Digital Twin network, TraCI telemetry interface, Delhi dataset demand calibration, and Emergency Green Wave Corridor.

* **Assigned Codebase Files**:
  * [`simulation/sumo/network/`](file:///c:/Users/avine/Documents/erode%20hackathon/simulation/sumo/network/) — SUMO 4-way junction compiled XML network and route specifications (`junction.net.xml`).
  * [`simulation/traci_controller.py`](file:///c:/Users/avine/Documents/erode%20hackathon/simulation/traci_controller.py) & [`state_extractor.py`](file:///c:/Users/avine/Documents/erode%20hackathon/simulation/state_extractor.py) — Live TraCI connection & state extraction loops.
  * [`scripts/process_dataset.py`](file:///c:/Users/avine/Documents/erode%20hackathon/scripts/process_dataset.py) & [`generate_demand.py`](file:///c:/Users/avine/Documents/erode%20hackathon/scripts/generate_demand.py) — Delhi traffic density calibration profiles and dynamic scenario route generator.
  * [`emergency/emergency_detector.py`](file:///c:/Users/avine/Documents/erode%20hackathon/emergency/emergency_detector.py) & [`green_wave.py`](file:///c:/Users/avine/Documents/erode%20hackathon/emergency/green_wave.py) — Ambulance priority verification and multi-junction ($J_1 \rightarrow J_2 \rightarrow J_3$) Green Wave corridor coordinator.
* **Key Pitch & Demo Responsibilities**:
  * Trigger the **Emergency Ambulance Priority** feature.
  * Show coordinated signal timing progression across neighboring junctions without spilling downstream congestion.

---

### 👤 Member 4: Full-Stack & Impact Dashboard Developer (Full-Stack / Frontend Lead)
**Primary Focus**: React Dashboard, WebSockets live stream, FastAPI REST Backend, SQLite decision database, and Counterfactual Twin metrics (comparing Adaptive AI Traffic vs Fixed-Time Traffic side-by-side).

* **Assigned Codebase Files**:
  * [`frontend/src/components/JunctionVisualizer.tsx`](file:///c:/Users/avine/Documents/erode%20hackathon/frontend/src/components/JunctionVisualizer.tsx) — Expansive 2D Digital Twin Map Canvas with dynamic vehicle driving animations.
  * [`frontend/src/components/ImpactDashboard.tsx`](file:///c:/Users/avine/Documents/erode%20hackathon/frontend/src/components/ImpactDashboard.tsx) & [`counterfactual/comparison.py`](file:///c:/Users/avine/Documents/erode%20hackathon/counterfactual/comparison.py) — AI Adaptive Traffic vs Baseline Fixed-Time Traffic counterfactual twin comparison charts and live metrics.
  * [`backend/app/main.py`](file:///c:/Users/avine/Documents/erode%20hackathon/backend/app/main.py), [`api/routes.py`](file:///c:/Users/avine/Documents/erode%20hackathon/backend/app/api/routes.py), [`websocket/handler.py`](file:///c:/Users/avine/Documents/erode%20hackathon/backend/app/websocket/handler.py), and [`database/db.py`](file:///c:/Users/avine/Documents/erode%20hackathon/backend/app/database/db.py).
* **Key Pitch & Demo Responsibilities**:
  * Control the live presentation flow on the React dashboard during the pitch.
  * Present empirical performance metrics comparing Adaptive AI Traffic against Fixed-Time Baseline Traffic (35.9% Delay Reduction, 37.7% Queue Reduction, 38.9% Emergency Time Saved).

---

## 📊 Summary Feature Ownership Matrix

| Project Feature | Primary Lead | Secondary Support |
| :--- | :--- | :--- |
| **FEATURE 1: Mixed-Traffic RL Brain** | **Member 1** (AI/ML Lead) | Member 3 (Traffic Demand) |
| **FEATURE 2: Safety Shield & Explain Engine** | **Member 2** (Safety Lead) | Member 1 (PPO Policy) |
| **FEATURE 3: Live Counterfactual Twin & Dashboard** | **Member 4** (Full-Stack Lead) | Member 2 (Metrics Audit) |
| **FEATURE 4: Emergency Green Corridor & Green Wave** | **Member 3** (Sim/Corridor Lead) | Member 4 (UI Visuals) |

---

## 🚀 Recommended Demo Presentation Order (Hackathon Pitch)

1. **Member 4 (Full-Stack Lead)** opens the live dashboard and presents the **2D SUMO Digital Twin** running in real-time.
2. **Member 1 (AI Lead)** explains the **PPO RL Brain**, **PCU-weighted queues** (Cars, 2-Wheelers, Buses, Trucks, Autos), and multi-objective rewards.
3. **Member 2 (Safety Lead)** hits the **`[ BREAK-IT ]`** button to inject a simulated sensor fault, demonstrating that the **Safety Shield** immediately blocks PPO and activates zero-risk fixed-time fallback.
4. **Member 3 (Sim Lead)** triggers the **Emergency Ambulance Corridor**, demonstrating green pre-emption and multi-junction **Green Wave coordination**.
5. **Member 4 (Full-Stack Lead)** concludes by showcasing the **Counterfactual Twin Impact Dashboard** with real simulation metrics (Delay %, Queue %, and Travel Time % saved).

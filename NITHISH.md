# 🚑 Project Overview & Work Split — Nithish

**Developer Name**: Nithish  
**Role**: Simulation & Emergency Corridor Engineer (Traffic Sim & Green Wave Lead — Member 3)  
**Project**: AI-Based Traffic Management and Adaptive Signal Control  
**Repository**: [https://github.com/nith-ishh/erode-hackathon.git](https://github.com/nith-ishh/erode-hackathon.git)  
**Git Branch**: `nithish` *(Do NOT push to main branch)*

---

## 🎯 Primary Responsibilities (Member 3)

1. **SUMO Digital Twin Network & Traffic Demand**:
   * Manage SUMO 4-way junction compiled network (`junction.net.xml`) and route files ([`simulation/sumo/network/`](file:///c:/Users/avine/Documents/erode%20hackathon/simulation/sumo/network/)).
   * Run dataset demand calibration scripts ([`scripts/process_dataset.py`](file:///c:/Users/avine/Documents/erode%20hackathon/scripts/process_dataset.py) & [`scripts/generate_demand.py`](file:///c:/Users/avine/Documents/erode%20hackathon/scripts/generate_demand.py)) for Indian traffic density profiles (Cars, 2-Wheelers, Buses, Trucks, Autos).

2. **Live TraCI Telemetry Connection**:
   * Telemetry loop and TraCI dynamic step simulation ([`simulation/traci_controller.py`](file:///c:/Users/avine/Documents/erode%20hackathon/simulation/traci_controller.py)).
   * Real-time state extraction engine ([`simulation/state_extractor.py`](file:///c:/Users/avine/Documents/erode%20hackathon/simulation/state_extractor.py)).

3. **Emergency Pre-emption & Multi-Junction Green Wave Corridor**:
   * Ambulance detection & emergency green corridor verification ([`emergency/emergency_detector.py`](file:///c:/Users/avine/Documents/erode%20hackathon/emergency/emergency_detector.py)).
   * Multi-junction ($J_1 \rightarrow J_2 \rightarrow J_3$) Green Wave coordinator ([`emergency/green_wave.py`](file:///c:/Users/avine/Documents/erode%20hackathon/emergency/green_wave.py)).
   * Frontend Green Wave Control Panel ([`frontend/src/components/GreenWavePanel.tsx`](file:///c:/Users/avine/Documents/erode%20hackathon/frontend/src/components/GreenWavePanel.tsx)).

---

## 💻 Codebase Files Owned by Nithish (Member 3)

| File Path | Description |
| :--- | :--- |
| [`emergency/emergency_detector.py`](file:///c:/Users/avine/Documents/erode%20hackathon/emergency/emergency_detector.py) | Emergency vehicle detection & pre-emption signal override |
| [`emergency/green_wave.py`](file:///c:/Users/avine/Documents/erode%20hackathon/emergency/green_wave.py) | Multi-junction ($J_1 \rightarrow J_2 \rightarrow J_3$) offset calculation & Green Wave corridor |
| [`simulation/traci_controller.py`](file:///c:/Users/avine/Documents/erode%20hackathon/simulation/traci_controller.py) | Live SUMO TraCI simulation controller & phase switcher |
| [`simulation/state_extractor.py`](file:///c:/Users/avine/Documents/erode%20hackathon/simulation/state_extractor.py) | Real-time vehicle telemetry and queue PCU calculator |
| [`scripts/generate_demand.py`](file:///c:/Users/avine/Documents/erode%20hackathon/scripts/generate_demand.py) | Dynamic traffic demand & peak/off-peak route scenario generator |
| [`scripts/process_dataset.py`](file:///c:/Users/avine/Documents/erode%20hackathon/scripts/process_dataset.py) | Delhi traffic density dataset preprocessor |
| [`frontend/src/components/GreenWavePanel.tsx`](file:///c:/Users/avine/Documents/erode%20hackathon/frontend/src/components/GreenWavePanel.tsx) | Live Green Wave Corridor UI & Emergency vehicle activation trigger |

---

## 🎤 Nithish's Demo Presentation Workflow (Pitch Step 4)

1. **Trigger Emergency Corridor**: Click **`[ ACTIVATE AMBULANCE CORRIDOR ]`** in the Green Wave panel.
2. **Show Priority Green Signal**: Demonstrate that the approaching ambulance is granted immediate green pre-emption at Junction $J_1$.
3. **Show Multi-Junction Coordination**: Point out how signal offsets cascade dynamically down the corridor ($J_1 \rightarrow J_2 \rightarrow J_3$) to create a non-stop green wave for emergency vehicles without gridlocking surrounding traffic.

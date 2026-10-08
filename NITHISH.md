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

## 🎤 Nithish's Demo Presentation Workflow & Pitch Narrative

### Real-World Rush Hour Pitch Narrative (Say this during Jury Pitch):
> “Let me explain our system through a real-world scenario. Imagine a busy four-way junction during evening rush hour. Our system observes that the North–South direction has a much larger traffic queue than the East–West direction. The reinforcement learning agent analyzes this information and proposes giving North–South more green time to reduce congestion. Before executing this decision, our Safety Shield verifies that the signal transition is safe and legally allowed. Once approved, the traffic signal changes, vehicles move, and the system continuously observes the updated traffic conditions to make further decisions.
> 
> At the same time, our Live Counterfactual Twin evaluates the same traffic demand using traditional fixed-time control. Our dashboard compares both controllers using average delay, queue length and throughput, allowing us to measure the actual impact of our AI. If an ambulance is detected, our emergency module requests priority through the Safety Shield and coordinates upcoming junctions to establish an emergency green corridor.
> 
> Therefore, our system does not simply display traffic or change lights randomly. It observes traffic, makes adaptive decisions, validates safety, executes the approved action and measures the outcome against a fixed-time baseline.”

### 4-Step Hackathon Live Action Sequence:
1. **Explain Rush Hour Flow**: Show North-South queue build-up and PPO RL phase adaptivity.
2. **Trigger Emergency Corridor**: Click **`[ ACTIVATE AMBULANCE CORRIDOR ]`** in the Green Wave panel.
3. **Show Priority Green Signal**: Demonstrate that the approaching ambulance is granted immediate green pre-emption at Junction $J_1$.
4. **Show Multi-Junction Coordination**: Point out how signal offsets cascade dynamically down the corridor ($J_1 \rightarrow J_2 \rightarrow J_3$) to create a non-stop green wave for emergency vehicles without gridlocking surrounding traffic.

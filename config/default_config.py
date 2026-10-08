"""
Central Configuration for AI-Based Traffic Management & Adaptive Signal Control
All settings, signal timing constraints, PCU weights, PPO hyperparameters,
and fallback thresholds are centrally managed here.
"""

import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Auto-configure SUMO_HOME if eclipse-sumo package is installed
python_sp = Path(sys.executable).parent / "lib" / "site-packages"
sumo_pkg_dir = python_sp / "sumo"
if sumo_pkg_dir.exists():
    os.environ["SUMO_HOME"] = str(sumo_pkg_dir)
    sys.path.append(str(sumo_pkg_dir / "tools"))

# Simulation Settings
SIMULATION = {
    "step_length": 1.0,         # seconds per simulation step
    "max_steps": 3600,           # default episode duration
    "seed": 42,
    "primary_junction_id": "J1",
    "corridor_junction_ids": ["J1", "J2", "J3"],
    "gui": False,                # Set True for SUMO GUI visualization
}

# Signal Timing Constraints (Enforced by Safety Shield)
SIGNAL_CONSTRAINTS = {
    "min_green_time": 10,       # minimum green duration in seconds
    "max_green_time": 60,       # maximum green duration in seconds
    "yellow_duration": 4,        # yellow clearance phase duration
    "all_red_duration": 2,       # all-red clearance interval
    "num_phases": 4,            # 4 signal phases for a 4-way junction
    "phase_names": [
        "N_S_STRAIGHT",         # Phase 0: North-South green
        "N_S_LEFT",             # Phase 1: North-South turns / clearance
        "E_W_STRAIGHT",         # Phase 2: East-West green
        "E_W_LEFT"              # Phase 3: East-West turns / clearance
    ]
}

# Indian Mixed-Traffic Passenger Car Unit (PCU) Weights
# Configurable weights representing relative road space & dynamics
PCU_WEIGHTS = {
    "car": 1.0,
    "motorcycle": 0.5,
    "bus": 3.0,
    "truck": 3.0,
    "auto": 0.75,
    "emergency": 1.0,
    "pedestrian": 0.2
}

# Pedestrian & Safety Thresholds
SAFETY_THRESHOLDS = {
    "max_pedestrian_wait_time": 90,  # Max wait time before triggering pedestrian priority
    "max_queue_length_pcu": 120,    # Threshold for extreme congestion alert
    "sensor_timeout_seconds": 5,     # Sensor data age before declaring fault
    "emergency_clearance_time": 5,   # Lead time required to safely clear conflicting green
}

# Reinforcement Learning (PPO) Hyperparameters
PPO_CONFIG = {
    "learning_rate": 0.0003,
    "n_steps": 2048,
    "batch_size": 64,
    "n_epochs": 10,
    "gamma": 0.99,
    "gae_lambda": 0.95,
    "clip_range": 0.2,
    "ent_coef": 0.01,
    "model_dir": str(BASE_DIR / "rl" / "models")
}

# PPO Reward Weighting
REWARD_WEIGHTS = {
    "pcu_delay_penalty": -1.0,
    "pcu_queue_penalty": -0.5,
    "throughput_reward": +2.0,
    "pedestrian_wait_penalty": -0.8,
    "phase_switch_penalty": -2.0,
    "emergency_priority_reward": +10.0,
    "safety_violation_penalty": -50.0
}

# Fallback Settings
FALLBACK_CONFIG = {
    "fixed_time_cycle": 120,      # total cycle time in seconds
    "fixed_phase_durations": [30, 30, 30, 30], # fixed time per phase
    "yellow_duration": 4
}

# Database & Server Settings
SERVER_CONFIG = {
    "host": "127.0.0.1",
    "port": 8000,
    "db_path": str(BASE_DIR / "backend" / "app" / "database" / "traffic.db")
}

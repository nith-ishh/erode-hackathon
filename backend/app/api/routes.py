"""
FastAPI REST API Routes
Exposes API endpoints for live junction state, scenario selection, Break-It fault toggling,
emergency corridor triggers, decision logs, and counterfactual comparison metrics.
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, Optional

import sys
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
sys.path.append(str(BASE_DIR))

from backend.app.services.simulation_service import sim_service

router = APIRouter(prefix="/api")

@router.get("/state")
def get_current_state():
    """Get current traffic state and active phase."""
    step_data = sim_service.process_step()
    return step_data

@router.post("/scenario")
def set_scenario(name: str = Query("normal", description="Scenario name: normal, rush_hour, high_density, incident")):
    """Set simulation scenario (normal, rush_hour, high_density, incident)."""
    valid = ["normal", "rush_hour", "high_density", "incident"]
    if name not in valid:
        raise HTTPException(status_code=400, detail=f"Invalid scenario name. Must be one of {valid}")
    success = sim_service.start_simulation(scenario_name=name)
    return {"status": "success", "scenario": name, "started": success}

@router.post("/break-it")
def toggle_break_it():
    """Infect/Clear simulated sensor failure (Break-It fault injection)."""
    active = sim_service.toggle_break_it()
    return {
        "status": "success",
        "break_it_active": active,
        "message": "FAULT INJECTED: Sensor failure simulated. Safety Shield ACTIVE. PPO CONTROL BLOCKED. FALLBACK ACTIVE." if active else "FAULT CLEARED: Normal AI Control restored."
    }

@router.post("/emergency")
def set_emergency(enable: bool = Query(True, description="Enable or disable emergency vehicle")):
    """Inject emergency vehicle to trigger safe pre-emption and Green Wave."""
    active = sim_service.trigger_emergency(enable=enable)
    return {"status": "success", "emergency_active": active}

@router.get("/metrics")
def get_counterfactual_metrics():
    """Run counterfactual twin comparison and return AI vs Baseline performance statistics."""
    metrics = sim_service.run_counterfactual_comparison()
    return metrics

@router.get("/decisions")
def get_decision_history(limit: int = 50):
    """Retrieve decision audit log from SQLite database."""
    decisions = sim_service.db.get_recent_decisions(limit=limit)
    return {"status": "success", "count": len(decisions), "decisions": decisions}

@router.get("/safety")
def get_safety_status():
    """Retrieve Safety Shield current rule statuses."""
    return {
        "sensor_fault": sim_service.break_it_active,
        "safety_shield_active": True,
        "min_green_s": 10,
        "max_green_s": 60,
        "mode": "FALLBACK_MODE" if sim_service.break_it_active else "NORMAL_AI_CONTROL"
    }

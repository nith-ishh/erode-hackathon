"""
FastAPI REST API Routes
Exposes endpoints for live junction state, dual controller comparison, Break-It fault toggling,
emergency corridor triggers, traffic surges, decision audit logs, and counterfactual metrics.
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
    """Get current live traffic state, PPO decisions, Safety Shield status, and Dual Controller metrics."""
    step_data = sim_service.process_step()
    return step_data

@router.post("/scenario")
def set_scenario(name: str = Query("normal", description="Scenario: normal, rush_hour, heavy_ew, heavy_ns, pedestrian_heavy, emergency, high_density, incident")):
    """Set simulation scenario."""
    valid = ["normal", "rush_hour", "heavy_ew", "heavy_ns", "pedestrian_heavy", "emergency", "high_density", "incident"]
    if name not in valid:
        raise HTTPException(status_code=400, detail=f"Invalid scenario name. Must be one of {valid}")
    success = sim_service.start_simulation(scenario_name=name)
    return {"status": "success", "scenario": name, "started": success}

@router.post("/surge")
def trigger_traffic_surge(
    direction: str = Query("EW", description="Direction to surge traffic: EW or NS"),
    amount: float = Query(15.0, description="Amount of PCU queue to inject")
):
    """Dynamically surge traffic in a specific direction (Proof of Adaptivity Demo)."""
    res = sim_service.trigger_surge(direction=direction, amount=amount)
    return res

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
def get_counterfactual_metrics(
    scenario: str = Query("rush_hour", description="Scenario for twin comparison"),
    steps: int = Query(600, description="Simulation duration steps"),
    seed: int = Query(12345, description="Random seed for fair comparison")
):
    """Run fair counterfactual twin comparison on identical parameters and return empirical metrics."""
    metrics = sim_service.run_counterfactual_comparison(scenario=scenario, steps=steps, seed=seed)
    return metrics

@router.post("/compare/run")
def run_comparison_test(
    scenario: str = Query("rush_hour", description="Scenario for twin comparison"),
    steps: int = Query(600, description="Simulation duration steps"),
    seed: int = Query(12345, description="Random seed for fair comparison")
):
    """Explicit endpoint to trigger fair comparison experiment test."""
    metrics = sim_service.run_counterfactual_comparison(scenario=scenario, steps=steps, seed=seed)
    return metrics

@router.get("/decisions")
def get_decision_history(limit: int = 50):
    """Retrieve decision audit log from SQLite database."""
    decisions = sim_service.db.get_recent_decisions(limit=limit)
    return {"status": "success", "count": len(decisions), "decisions": decisions}

@router.get("/safety")
def get_safety_status():
    """Retrieve Safety Shield current rule statuses, audit stats, and guardrail rules."""
    stats = sim_service.safety_shield.get_shield_stats()
    return {
        "sensor_fault": sim_service.break_it_active,
        "safety_shield_active": True,
        "min_green_s": sim_service.safety_shield.min_green,
        "max_green_s": sim_service.safety_shield.max_green,
        "mode": "FALLBACK_MODE" if sim_service.break_it_active else "NORMAL_AI_CONTROL",
        "rules": sim_service.safety_shield.RULES,
        "audit_stats": stats
    }

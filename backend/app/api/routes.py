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

# =========================================================================
# INTERACTIVE AMBULANCE & SIREN TRIGGER ENDPOINTS
# =========================================================================

@router.post("/ambulance/spawn")
def spawn_ambulance(
    origin: str = Query("N", description="Origin approach: N, S, E, W"),
    destination: str = Query("S", description="Destination approach: N, S, E, W"),
    vehicle_id: str = Query("ambulance_108", description="Unique vehicle ID")
):
    """Spawns interactive ambulance on requested origin approach route."""
    res = sim_service.spawn_ambulance(origin=origin, destination=destination, vehicle_id=vehicle_id)
    return res

@router.post("/ambulance/siren")
def set_ambulance_siren(
    active: bool = Query(True, description="Siren state: true for ON (Emergency Priority), false for OFF (Normal Mode)")
):
    """Toggles ambulance siren ON or OFF with safe clearance sequence."""
    res = sim_service.set_ambulance_siren(siren_on=active)
    return res

@router.post("/ambulance/cancel")
def cancel_ambulance_emergency():
    """Cancels active ambulance mission and releases emergency signal priority."""
    res = sim_service.cancel_ambulance_emergency()
    return res

@router.get("/ambulance/status")
def get_ambulance_status():
    """Returns live telemetry, ETA, route progress, and siren state machine status."""
    status = sim_service.get_ambulance_status()
    return status

# =========================================================================
# BRIDGE STRUCTURAL CAPACITY & POLICE EARLY WARNING ENDPOINTS
# =========================================================================

@router.get("/bridge/status")
def get_bridge_status():
    """Returns real-time bridge PCU structural load and police alert status."""
    return sim_service.get_bridge_status()

@router.post("/bridge/surge")
def trigger_bridge_surge(
    amount: float = Query(22.0, description="Amount of PCU vehicular live-load to inject on the bridge")
):
    """Simulate heavy bridge overload surge to test automated police warning dispatch."""
    res = sim_service.trigger_bridge_surge(amount=amount)
    return res

@router.post("/bridge/clear")
def clear_bridge_load():
    """Clears bridge traffic congestion and resets structural load to safe levels."""
    res = sim_service.clear_bridge()
    return res

# =========================================================================
# SMART NO-PARKING e-CHALLAN & REVENUE BILLING ENDPOINTS
# =========================================================================

@router.get("/parking/status")
def get_parking_enforcement_status():
    """Returns active no-parking violations, e-challans issued, and revenue collected."""
    return sim_service.get_parking_status()

@router.post("/parking/trigger")
def trigger_parking_violation(
    vehicle_plate: Optional[str] = Query(None, description="Vehicle registration plate (e.g., TN-33-AX-8912)"),
    vehicle_type: str = Query("car", description="Vehicle type: car, auto, motorcycle, bus, truck"),
    zone_id: str = Query("NP_BROUGH_RD", description="Zone ID: NP_BROUGH_RD, NP_MANIKOONDU, NP_CAUVERY_ENTRY")
):
    """Detects unauthorized parking in No-Parking zone, issues automated e-Challan and bills offender."""
    res = sim_service.trigger_parking_violation(
        vehicle_plate=vehicle_plate,
        vehicle_type=vehicle_type,
        zone_id=zone_id
    )
    return res

@router.post("/parking/clear")
def clear_parking_violation(
    challan_id: str = Query(..., description="Challan ID of the vehicle obstruction to clear")
):
    """Dispatches traffic towing unit to remove vehicle and restore traffic flow."""
    res = sim_service.clear_parking_violation(challan_id=challan_id)
    return res

@router.post("/parking/pay")
def pay_parking_challan(
    challan_id: str = Query(..., description="Challan ID to pay online")
):
    """Marks e-Challan fine as paid and credits revenue."""
    res = sim_service.pay_challan(challan_id=challan_id)
    return res


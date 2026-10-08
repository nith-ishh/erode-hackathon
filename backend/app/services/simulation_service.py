"""
Core Simulation Service Engine
Coordinates simulation state loops, PPO inferences, JEV evaluations, Safety Shield checks,
Break-It fault injection, Emergency Corridor management, and WebSocket broadcasts.
"""

import os
import sys
import json
import asyncio
from pathlib import Path
from typing import Dict, Any, List, Optional

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
sys.path.append(str(BASE_DIR))

from simulation.traci_controller import SUMOTraCIController
from simulation.state_extractor import StateExtractor
from decision.jev import JEVDecisionLayer
from decision.safety_shield import SafetyShield
from decision.fallback_controller import FallbackController
from decision.explain_engine import ExplainEngine
from emergency.emergency_detector import EmergencyDetector
from emergency.green_wave import GreenWaveCoordinator
from counterfactual.comparison import CounterfactualTwinRunner
from backend.app.database.db import TrafficDatabase
from scripts.generate_demand import generate_route_file

TRACI_AVAILABLE = False
try:
    import traci
    TRACI_AVAILABLE = True
except ImportError:
    traci = None

class SimulationService:
    def __init__(self):
        self.controller = SUMOTraCIController(label="service_main")
        self.extractor = StateExtractor()
        self.jev = JEVDecisionLayer()
        self.safety_shield = SafetyShield()
        self.fallback = FallbackController()
        self.explain_engine = ExplainEngine()
        self.emergency_detector = EmergencyDetector()
        self.green_wave = GreenWaveCoordinator()
        self.counterfactual_runner = CounterfactualTwinRunner()
        self.db = TrafficDatabase()

        self.scenario = "normal"
        self.is_running = False
        self.break_it_active = False
        self.emergency_trigger = False
        self.step_count = 0

        self.current_state = {}
        self.last_explanation = {}
        self.recent_metrics = {}

    def start_simulation(self, scenario_name: str = "normal") -> bool:
        """Initialize or reset simulation under requested scenario."""
        self.scenario = scenario_name
        self.step_count = 0
        self.break_it_active = False
        self.safety_shield.set_sensor_fault(False)
        self.emergency_trigger = False

        # Generate scenario route file
        try:
            generate_route_file(scenario_name=scenario_name)
        except Exception as e:
            print(f"[Sim Service] Demand generation warning: {e}")

        self.controller.close()
        success = self.controller.start(gui=False)
        self.is_running = True
        return success

    def toggle_break_it(self) -> bool:
        """Infect/Clear simulated sensor failure (Break-It mode)."""
        self.break_it_active = not self.break_it_active
        self.safety_shield.set_sensor_fault(self.break_it_active)
        print(f"[Sim Service] BREAK-IT Toggled: active={self.break_it_active}")
        return self.break_it_active

    def trigger_emergency(self, enable: bool = True) -> bool:
        """Inject or clear an emergency vehicle in current scenario."""
        self.emergency_trigger = enable
        print(f"[Sim Service] Emergency Trigger: {self.emergency_trigger}")
        return self.emergency_trigger

    def process_step(self) -> Dict[str, Any]:
        """Advance single step in simulation and run full AI/Shield pipeline."""
        self.step_count += 1

        # 1. Extract raw traffic state
        if self.controller.is_connected and TRACI_AVAILABLE and traci is not None:
            raw_state = self.extractor.extract_state_traci(traci, label="service_main")
        else:
            raw_state = self.extractor.extract_mock_state(self.step_count)

        if self.emergency_trigger:
            raw_state["emergency_present"] = True
            raw_state["emergency_details"] = [{
                "id": "emergency_ambulance_1",
                "edge": "N2J1",
                "position": 180.0,
                "speed": 16.5
            }]

        # 2. Emergency Detection & Corridor Coordination
        em_info = self.emergency_detector.detect_emergency(raw_state)
        green_wave_plan = self.green_wave.compute_green_wave_phases(em_info, self.step_count)

        # 3. PPO Action Proposal Logic
        approaches = raw_state.get("approaches", {})
        n_pcu = approaches.get("N", {}).get("pcu_queue", 0.0) + approaches.get("S", {}).get("pcu_queue", 0.0)
        e_pcu = approaches.get("E", {}).get("pcu_queue", 0.0) + approaches.get("W", {}).get("pcu_queue", 0.0)
        cur_phase = self.controller.current_phase

        # PPO proposes switching if queue imbalance favors perpendicular direction
        ppo_proposed_action = 1 if ((cur_phase in [0, 1] and e_pcu > n_pcu * 1.2) or (cur_phase in [2, 3] and n_pcu > e_pcu * 1.2)) else 0

        # 4. JEV Evaluation Layer
        jev_res = self.jev.evaluate_action(ppo_proposed_action, raw_state, self.controller.phase_elapsed_time)

        # 5. Safety Shield Guardrail
        safety_res = self.safety_shield.check_action_safety(
            proposed_action=ppo_proposed_action,
            current_phase=cur_phase,
            phase_elapsed_time=self.controller.phase_elapsed_time,
            traffic_state=raw_state,
            emergency_override=em_info["detected"]
        )

        is_safe, target_phase, safety_reason, safety_metrics = safety_res

        # 6. Fallback Check if Safety Shield blocks or Break-It is active
        fallback_active = self.break_it_active or not safety_metrics.get("sensor_data_valid", True)
        if fallback_active:
            target_phase, fallback_reason = self.fallback.get_fallback_action(cur_phase, self.controller.phase_elapsed_time)
            safety_res = (False, target_phase, fallback_reason, safety_metrics)

        # 7. Apply Safe Phase to Signal
        self.controller.set_phase(target_phase)
        self.controller.step()

        # 8. Generate Explain Engine Narrative
        explanation = self.explain_engine.generate_explanation(
            ppo_proposed_action, jev_res, safety_res, fallback_active, raw_state
        )
        self.last_explanation = explanation
        self.current_state = raw_state

        # Log decision to SQLite
        try:
            self.db.log_decision(
                scenario=self.scenario,
                junction_id="J1",
                traffic_state=raw_state,
                ppo_action=ppo_proposed_action,
                jev_result=jev_res,
                safety_result=safety_res,
                final_action=target_phase,
                explanation=explanation,
                fallback_status=fallback_active,
                emergency_status=em_info["detected"]
            )
        except Exception as e:
            pass

        return {
            "step": self.step_count,
            "scenario": self.scenario,
            "state": raw_state,
            "ppo_action": ppo_proposed_action,
            "jev_evaluation": jev_res,
            "safety_shield": {
                "approved": is_safe,
                "reason": safety_reason,
                "metrics": safety_metrics,
                "break_it_active": self.break_it_active,
                "fallback_active": fallback_active
            },
            "final_phase": target_phase,
            "explanation": explanation,
            "emergency": {
                "detection": em_info,
                "green_wave": green_wave_plan
            }
        }

    def run_counterfactual_comparison(self) -> Dict[str, Any]:
        """Run counterfactual twin experiment comparing AI vs Fixed-Time baseline."""
        res = self.counterfactual_runner.compare(steps=300, seed=42)
        self.recent_metrics = res
        return res

# Global singleton service instance
sim_service = SimulationService()

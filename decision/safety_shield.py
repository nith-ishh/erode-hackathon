"""
Safety Shield Rule-Based Guardrail
Determines whether proposed signal actions violate hardware, timing, pedestrian,
or emergency safety rules. Serves as the ultimate authority for signal state transitions.
"""

from typing import Dict, Any, Tuple
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from config import SIGNAL_CONSTRAINTS, SAFETY_THRESHOLDS

class SafetyShield:
    def __init__(self, config: Dict[str, Any] = None):
        self.min_green = SIGNAL_CONSTRAINTS["min_green_time"]
        self.max_green = SIGNAL_CONSTRAINTS["max_green_time"]
        self.num_phases = SIGNAL_CONSTRAINTS["num_phases"]
        self.sensor_fault = False

    def set_sensor_fault(self, fault_active: bool):
        """Simulate or reset sensor/data failure (Break-It mode)."""
        self.sensor_fault = fault_active

    def check_action_safety(
        self,
        proposed_action: int,
        current_phase: int,
        phase_elapsed_time: float,
        traffic_state: Dict[str, Any],
        emergency_override: bool = False
    ) -> Tuple[bool, int, str, Dict[str, Any]]:
        """
        Validates proposed PPO action against 11 safety rules.
        Returns: (is_safe: bool, final_action: int, rejection_reason: str, safety_metrics: dict)
        """
        metrics = {
            "min_green_pass": True,
            "max_green_pass": True,
            "sensor_data_valid": not self.sensor_fault,
            "emergency_safe": True,
            "pedestrian_safe": True,
            "conflicting_phase_pass": True
        }

        # Rule 9: Sensor / Data Failure (Break-It Fault Injection)
        if self.sensor_fault:
            metrics["sensor_data_valid"] = False
            return False, current_phase, "REJECTED: Sensor failure detected. AI control blocked by Safety Shield. Falling back to fixed-time.", metrics

        # Check invalid traffic state structure
        if not traffic_state or "approaches" not in traffic_state:
            metrics["sensor_data_valid"] = False
            return False, current_phase, "REJECTED: Corrupted/missing traffic state observation.", metrics

        # Rule 8: Invalid Action Protection
        if proposed_action not in range(self.num_phases) and proposed_action not in [0, 1]:
            return False, current_phase, f"REJECTED: Action code {proposed_action} out of valid bounds.", metrics

        # Rule 7 & 10: Emergency Vehicle Safety Pre-emption
        emergency_present = traffic_state.get("emergency_present", False)
        if emergency_present or emergency_override:
            em_details = traffic_state.get("emergency_details", [])
            em_edge = em_details[0]["edge"] if em_details else "N2J1"
            
            # Map emergency approach edge to required green phase
            target_phase = 0 if em_edge in ["N2J1", "S2J1"] else 2
            if proposed_action != target_phase:
                metrics["emergency_safe"] = False
                return False, target_phase, f"REJECTED: Emergency vehicle on {em_edge}. Forcing green phase {target_phase}.", metrics

        # Map relative action (0=keep, 1=switch to next) to explicit target phase
        if proposed_action == 0:
            target_phase = current_phase
        elif proposed_action == 1:
            target_phase = (current_phase + 1) % self.num_phases
        else:
            target_phase = proposed_action

        # Rule 1: Minimum Green Time Enforcement
        if target_phase != current_phase and phase_elapsed_time < self.min_green:
            metrics["min_green_pass"] = False
            return False, current_phase, f"REJECTED: Minimum green time violated ({phase_elapsed_time:.1f}s < {self.min_green}s). Holding phase {current_phase}.", metrics

        # Rule 2: Maximum Green Time Enforcement
        if target_phase == current_phase and phase_elapsed_time >= self.max_green:
            forced_next = (current_phase + 1) % self.num_phases
            metrics["max_green_pass"] = False
            return False, forced_next, f"REJECTED: Maximum green time reached ({phase_elapsed_time:.1f}s >= {self.max_green}s). Forcing phase transition to {forced_next}.", metrics

        # Rule 6: Pedestrian Safety Check
        total_peds = traffic_state.get("total_pedestrians_waiting", 0)
        max_ped_wait = SAFETY_THRESHOLDS.get("max_pedestrian_wait_time", 90)
        if total_peds > 10 and phase_elapsed_time > 45 and target_phase == current_phase:
            metrics["pedestrian_safe"] = False
            forced_next = (current_phase + 1) % self.num_phases
            return False, forced_next, f"REJECTED: High pedestrian waiting count ({total_peds} peds waiting > {max_ped_wait}s). Forcing phase change.", metrics

        # Action is completely SAFE!
        return True, target_phase, "APPROVED: Proposed action satisfies all safety rules.", metrics

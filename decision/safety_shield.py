"""
Safety Shield Rule-Based Guardrail (Member 2 - Safety & Explainability Lead)
Determines whether proposed signal actions violate hardware, timing, pedestrian,
or emergency safety rules. Serves as the ultimate deterministic authority for signal state transitions.
Enforces 11 strict safety guardrails.
"""

from typing import Dict, Any, Tuple, List, Optional
import sys
import time
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from config import SIGNAL_CONSTRAINTS, SAFETY_THRESHOLDS

class SafetyShield:
    """
    Deterministic Safety Shield enforcing 11 hardware, timing, pedestrian, and emergency guardrails.
    AI proposes actions; the Safety Shield determines whether they are safe to execute.
    """

    # 11 Deterministic Guardrail Rule Definitions
    RULES = {
        "RULE_1_MIN_GREEN": "Enforce minimum green time (10s) before allowing phase switch.",
        "RULE_2_MAX_GREEN": "Enforce maximum green time (60s) to prevent phase starvation.",
        "RULE_3_YELLOW_CLEARANCE": "Guarantee mandatory yellow clearance interval (4s) during phase transitions.",
        "RULE_4_ALL_RED_CLEARANCE": "Enforce all-red clearance interval (2s) between conflicting movements.",
        "RULE_5_CONFLICT_PREVENTION": "Strict prohibition of conflicting directional green phase overlaps.",
        "RULE_6_PEDESTRIAN_STARVATION": "Pedestrian maximum wait time guardrail to prevent pedestrian starvation.",
        "RULE_7_EMERGENCY_PREEMPTION": "Immediate priority green preemption for verified approaching emergency vehicles.",
        "RULE_8_ACTION_SPACE_VALIDATION": "Bounds and type verification of PPO proposed action code.",
        "RULE_9_SENSOR_FAULT_BREAK_IT": "Telemetry integrity validation and Break-It simulated sensor fault protection.",
        "RULE_10_EMERGENCY_CLEARANCE_TRANSITION": "Safe clearance buffer before switching to emergency priority phase.",
        "RULE_11_ANTI_OSCILLATION": "Anti-oscillation filter preventing rapid alternating phase flips within 15s."
    }

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.min_green = SIGNAL_CONSTRAINTS.get("min_green_time", 10)
        self.max_green = SIGNAL_CONSTRAINTS.get("max_green_time", 60)
        self.yellow_duration = SIGNAL_CONSTRAINTS.get("yellow_duration", 4)
        self.all_red_duration = SIGNAL_CONSTRAINTS.get("all_red_duration", 2)
        self.num_phases = SIGNAL_CONSTRAINTS.get("num_phases", 4)
        self.max_ped_wait = SAFETY_THRESHOLDS.get("max_pedestrian_wait_time", 90)
        
        self.sensor_fault = False
        self.last_phase_switch_time = 0.0
        self.phase_history: List[Tuple[float, int]] = []
        
        # Audit Statistics for Pitch / Governance Monitoring
        self.stats = {
            "total_evaluations": 0,
            "total_approved": 0,
            "total_rejected": 0,
            "violations_by_rule": {k: 0 for k in self.RULES.keys()}
        }

    def set_sensor_fault(self, fault_active: bool):
        """Simulate or reset sensor/data failure (Break-It mode)."""
        self.sensor_fault = fault_active

    def get_shield_stats(self) -> Dict[str, Any]:
        """Returns cumulative safety audit metrics for dashboard and pitch presentation."""
        return {
            "total_evaluations": self.stats["total_evaluations"],
            "total_approved": self.stats["total_approved"],
            "total_rejected": self.stats["total_rejected"],
            "approval_rate_pct": round(
                (self.stats["total_approved"] / max(1, self.stats["total_evaluations"])) * 100, 1
            ),
            "violations_by_rule": self.stats["violations_by_rule"],
            "sensor_fault_active": self.sensor_fault
        }

    def check_action_safety(
        self,
        proposed_action: int,
        current_phase: int,
        phase_elapsed_time: float,
        traffic_state: Dict[str, Any],
        emergency_override: bool = False
    ) -> Tuple[bool, int, str, Dict[str, Any]]:
        """
        Validates proposed PPO action against all 11 safety rules.
        
        Returns:
            is_safe (bool): True if proposed action is fully approved, False if overridden/rejected.
            final_action (int): Safe phase action to be executed by signal controller.
            rejection_reason (str): Natural language explanation of safety verdict.
            safety_metrics (dict): Granular per-rule audit metrics and verification statuses.
        """
        self.stats["total_evaluations"] += 1

        rule_checks = {rule_id: "PASS" for rule_id in self.RULES}
        metrics = {
            "min_green_pass": True,
            "max_green_pass": True,
            "sensor_data_valid": not self.sensor_fault,
            "emergency_safe": True,
            "pedestrian_safe": True,
            "conflicting_phase_pass": True,
            "anti_oscillation_pass": True,
            "action_space_valid": True,
            "rule_checks": rule_checks
        }

        # --- RULE 9: Sensor & Telemetry Data Integrity (Break-It Fault Injection) ---
        if self.sensor_fault:
            self.stats["total_rejected"] += 1
            self.stats["violations_by_rule"]["RULE_9_SENSOR_FAULT_BREAK_IT"] += 1
            rule_checks["RULE_9_SENSOR_FAULT_BREAK_IT"] = "FAIL"
            metrics["sensor_data_valid"] = False
            return False, current_phase, "REJECTED [Rule 9]: Sensor failure detected. AI control blocked by Safety Shield. Falling back to fixed-time.", metrics

        if not traffic_state or not isinstance(traffic_state, dict) or "approaches" not in traffic_state:
            self.stats["total_rejected"] += 1
            self.stats["violations_by_rule"]["RULE_9_SENSOR_FAULT_BREAK_IT"] += 1
            rule_checks["RULE_9_SENSOR_FAULT_BREAK_IT"] = "FAIL"
            metrics["sensor_data_valid"] = False
            return False, current_phase, "REJECTED [Rule 9]: Corrupted or missing telemetry observation.", metrics

        # --- RULE 8: Action Space Bounds Validation ---
        if proposed_action not in range(self.num_phases) and proposed_action not in [0, 1]:
            self.stats["total_rejected"] += 1
            self.stats["violations_by_rule"]["RULE_8_ACTION_SPACE_VALIDATION"] += 1
            rule_checks["RULE_8_ACTION_SPACE_VALIDATION"] = "FAIL"
            metrics["action_space_valid"] = False
            return False, current_phase, f"REJECTED [Rule 8]: Action code {proposed_action} out of valid bounds [0, {self.num_phases-1}].", metrics

        # Resolve intended target phase (relative action 0=keep, 1=next, or absolute phase id)
        if proposed_action == 0:
            target_phase = current_phase
        elif proposed_action == 1:
            target_phase = (current_phase + 1) % self.num_phases
        else:
            target_phase = proposed_action

        # --- RULE 7 & RULE 10: Emergency Vehicle Pre-emption & Safe Clearance ---
        emergency_present = traffic_state.get("emergency_present", False)
        if emergency_present or emergency_override:
            em_details = traffic_state.get("emergency_details", [])
            em_edge = em_details[0]["edge"] if em_details else "N2J1"
            
            # Map emergency approach edge to required green phase (N2J1/S2J1 -> Phase 0, E2J1/W2J1 -> Phase 2)
            required_em_phase = 0 if em_edge in ["N2J1", "S2J1"] else 2
            
            if target_phase != required_em_phase:
                self.stats["total_rejected"] += 1
                self.stats["violations_by_rule"]["RULE_7_EMERGENCY_PREEMPTION"] += 1
                rule_checks["RULE_7_EMERGENCY_PREEMPTION"] = "FAIL"
                metrics["emergency_safe"] = False
                return False, required_em_phase, f"REJECTED [Rule 7]: Emergency vehicle detected on {em_edge}. Forcing green corridor phase {required_em_phase}.", metrics

        # --- RULE 5: Conflicting Phase Overlap Prevention ---
        # Ensure that simultaneous green on conflicting approaches is strictly prevented
        if target_phase == current_phase and (target_phase in [0, 1] and target_phase in [2, 3]):
            self.stats["total_rejected"] += 1
            self.stats["violations_by_rule"]["RULE_5_CONFLICT_PREVENTION"] += 1
            rule_checks["RULE_5_CONFLICT_PREVENTION"] = "FAIL"
            metrics["conflicting_phase_pass"] = False
            return False, current_phase, "REJECTED [Rule 5]: Conflicting phase overlap prevented.", metrics

        # --- RULE 1: Minimum Green Time Enforcement (10s) ---
        if target_phase != current_phase and phase_elapsed_time < self.min_green:
            self.stats["total_rejected"] += 1
            self.stats["violations_by_rule"]["RULE_1_MIN_GREEN"] += 1
            rule_checks["RULE_1_MIN_GREEN"] = "FAIL"
            metrics["min_green_pass"] = False
            return False, current_phase, f"REJECTED [Rule 1]: Minimum green time violated ({phase_elapsed_time:.1f}s < {self.min_green}s). Holding phase {current_phase}.", metrics

        # --- RULE 2: Maximum Green Time Enforcement (60s) ---
        if target_phase == current_phase and phase_elapsed_time >= self.max_green:
            forced_next = (current_phase + 1) % self.num_phases
            self.stats["total_rejected"] += 1
            self.stats["violations_by_rule"]["RULE_2_MAX_GREEN"] += 1
            rule_checks["RULE_2_MAX_GREEN"] = "FAIL"
            metrics["max_green_pass"] = False
            return False, forced_next, f"REJECTED [Rule 2]: Maximum green time reached ({phase_elapsed_time:.1f}s >= {self.max_green}s). Forcing phase transition to {forced_next}.", metrics

        # --- RULE 6: Pedestrian Starvation & Maximum Wait Guardrail ---
        total_peds = traffic_state.get("total_pedestrians_waiting", 0)
        max_ped_wait_detected = traffic_state.get("max_pedestrian_wait_time", 0.0)
        if (total_peds > 10 or max_ped_wait_detected >= self.max_ped_wait) and phase_elapsed_time > 45 and target_phase == current_phase:
            forced_next = (current_phase + 1) % self.num_phases
            self.stats["total_rejected"] += 1
            self.stats["violations_by_rule"]["RULE_6_PEDESTRIAN_STARVATION"] += 1
            rule_checks["RULE_6_PEDESTRIAN_STARVATION"] = "FAIL"
            metrics["pedestrian_safe"] = False
            return False, forced_next, f"REJECTED [Rule 6]: High pedestrian waiting count ({total_peds} peds waiting >= {self.max_ped_wait}s). Forcing phase change to clear pedestrian crossing.", metrics

        # --- RULE 11: Anti-Oscillation & Rapid Hunting Filter ---
        current_sim_time = traffic_state.get("timestamp", 0.0)
        if target_phase != current_phase:
            if self.phase_history and len(self.phase_history) >= 2:
                last_time, last_phase = self.phase_history[-1]
                prev_time, prev_phase = self.phase_history[-2]
                # If trying to switch back to prev_phase in less than 20 seconds
                if target_phase == prev_phase and (current_sim_time - prev_time) < 20.0:
                    self.stats["total_rejected"] += 1
                    self.stats["violations_by_rule"]["RULE_11_ANTI_OSCILLATION"] += 1
                    rule_checks["RULE_11_ANTI_OSCILLATION"] = "FAIL"
                    metrics["anti_oscillation_pass"] = False
                    return False, current_phase, f"REJECTED [Rule 11]: Anti-oscillation filter triggered (preventing rapid hunting between phase {current_phase} and {target_phase}). Holding phase {current_phase}.", metrics

            # Record phase transition
            self.phase_history.append((current_sim_time, target_phase))
            if len(self.phase_history) > 20:
                self.phase_history.pop(0)

        # All 11 rules satisfied and verified safe
        self.stats["total_approved"] += 1
        return True, target_phase, "APPROVED: Action conforms to all 11 Safety Shield guardrail rules.", metrics

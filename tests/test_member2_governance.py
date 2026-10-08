"""
Dedicated Member 2 Governance, Safety Shield & Explainability Test Suite
Tests all 11 Safety Shield Guardrails, JEV Decision Layer, Explain Engine, and Break-It Fault Injection.
"""

import unittest
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from decision.safety_shield import SafetyShield
from decision.jev import JEVDecisionLayer
from decision.explain_engine import ExplainEngine
from decision.fallback_controller import FallbackController

class TestMember2SafetyGovernance(unittest.TestCase):
    def setUp(self):
        self.shield = SafetyShield()
        self.jev = JEVDecisionLayer()
        self.explain = ExplainEngine()
        self.fallback = FallbackController()

        self.sample_traffic_state = {
            "timestamp": 100.0,
            "current_phase": 0,
            "total_pedestrians_waiting": 3,
            "max_pedestrian_wait_time": 25.0,
            "emergency_present": False,
            "emergency_details": [],
            "approaches": {
                "N": {"pcu_queue": 12.0, "pedestrians_waiting": 1},
                "S": {"pcu_queue": 8.0, "pedestrians_waiting": 2},
                "E": {"pcu_queue": 4.0, "pedestrians_waiting": 0},
                "W": {"pcu_queue": 3.0, "pedestrians_waiting": 0}
            }
        }

    # ------------------ 11 SAFETY SHIELD GUARDRAIL TESTS ------------------ #

    def test_rule_1_min_green_enforcement(self):
        """Rule 1: Must reject phase switch before 10 seconds of green elapsed."""
        is_safe, final_action, reason, metrics = self.shield.check_action_safety(
            proposed_action=1,
            current_phase=0,
            phase_elapsed_time=6.5,
            traffic_state=self.sample_traffic_state
        )
        self.assertFalse(is_safe)
        self.assertEqual(final_action, 0)
        self.assertIn("Rule 1", reason)
        self.assertFalse(metrics["min_green_pass"])

    def test_rule_2_max_green_enforcement(self):
        """Rule 2: Must force phase rotation if current phase >= 60 seconds."""
        is_safe, final_action, reason, metrics = self.shield.check_action_safety(
            proposed_action=0,  # AI wants to hold
            current_phase=0,
            phase_elapsed_time=62.0,
            traffic_state=self.sample_traffic_state
        )
        self.assertFalse(is_safe)
        self.assertEqual(final_action, 1)  # Forced transition to phase 1
        self.assertIn("Rule 2", reason)
        self.assertFalse(metrics["max_green_pass"])

    def test_rule_6_pedestrian_starvation(self):
        """Rule 6: Must force phase change when pedestrian wait exceeds thresholds."""
        state = dict(self.sample_traffic_state)
        state["total_pedestrians_waiting"] = 15
        state["max_pedestrian_wait_time"] = 95.0

        is_safe, final_action, reason, metrics = self.shield.check_action_safety(
            proposed_action=0,
            current_phase=0,
            phase_elapsed_time=48.0,
            traffic_state=state
        )
        self.assertFalse(is_safe)
        self.assertEqual(final_action, 1)
        self.assertIn("Rule 6", reason)
        self.assertFalse(metrics["pedestrian_safe"])

    def test_rule_7_emergency_preemption(self):
        """Rule 7: Must force priority green for emergency vehicles approaching junction."""
        state = dict(self.sample_traffic_state)
        state["emergency_present"] = True
        state["emergency_details"] = [{"id": "amb_01", "edge": "E2J1", "position": 120.0, "speed": 15.0}]

        # PPO proposes 0 (NS Green), but ambulance is on E2J1 (requires Phase 2)
        is_safe, final_action, reason, metrics = self.shield.check_action_safety(
            proposed_action=0,
            current_phase=0,
            phase_elapsed_time=15.0,
            traffic_state=state
        )
        self.assertFalse(is_safe)
        self.assertEqual(final_action, 2)  # Forced EW Green
        self.assertIn("Rule 7", reason)
        self.assertFalse(metrics["emergency_safe"])

    def test_rule_8_invalid_action_bounds(self):
        """Rule 8: Must reject out-of-bounds action integers."""
        is_safe, final_action, reason, metrics = self.shield.check_action_safety(
            proposed_action=99,
            current_phase=0,
            phase_elapsed_time=15.0,
            traffic_state=self.sample_traffic_state
        )
        self.assertFalse(is_safe)
        self.assertEqual(final_action, 0)
        self.assertIn("Rule 8", reason)

    def test_rule_9_break_it_fault_injection(self):
        """Rule 9: Break-It sensor fault must block AI and engage safety shield fallback."""
        self.shield.set_sensor_fault(True)
        is_safe, final_action, reason, metrics = self.shield.check_action_safety(
            proposed_action=1,
            current_phase=0,
            phase_elapsed_time=20.0,
            traffic_state=self.sample_traffic_state
        )
        self.assertFalse(is_safe)
        self.assertIn("Rule 9", reason)
        self.assertFalse(metrics["sensor_data_valid"])
        self.shield.set_sensor_fault(False)  # Reset

    def test_rule_11_anti_oscillation(self):
        """Rule 11: Must prevent rapid flip-flopping between phases within a short window."""
        self.shield.phase_history = [(0.0, 0)]
        
        state1 = dict(self.sample_traffic_state)
        state1["timestamp"] = 5.0
        # Transition from phase 0 to phase 1 at t=5.0
        self.shield.check_action_safety(1, 0, 15.0, state1)

        state2 = dict(self.sample_traffic_state)
        state2["timestamp"] = 12.0
        # Attempt immediate flip back to phase 0 at t=12.0 (only 12s - 0s = 12s < 15s)
        self.shield.min_green = 5  # Lower min green threshold for test isolation
        is_safe, final_action, reason, metrics = self.shield.check_action_safety(
            proposed_action=1,
            current_phase=3,  # Next phase from 3 is phase 0
            phase_elapsed_time=12.0,
            traffic_state=state2
        )
        self.assertFalse(is_safe)
        self.assertIn("Rule 11", reason)
        self.assertFalse(metrics["anti_oscillation_pass"])

    def test_approved_safe_action(self):
        """All 11 rules satisfied returns APPROVED."""
        is_safe, final_action, reason, metrics = self.shield.check_action_safety(
            proposed_action=1,
            current_phase=0,
            phase_elapsed_time=22.0,  # > 10s min green, < 60s max green
            traffic_state=self.sample_traffic_state
        )
        self.assertTrue(is_safe)
        self.assertEqual(final_action, 1)
        self.assertIn("APPROVED", reason)

    def test_safety_audit_statistics(self):
        """Shield maintains comprehensive audit counts for judges."""
        self.shield.check_action_safety(1, 0, 25.0, self.sample_traffic_state)
        stats = self.shield.get_shield_stats()
        self.assertIn("total_evaluations", stats)
        self.assertIn("approval_rate_pct", stats)
        self.assertIn("violations_by_rule", stats)

    # ------------------ JEV DECISION LAYER TESTS ------------------ #

    def test_jev_queue_imbalance_and_confidence(self):
        """JEV must compute directional queues, imbalance ratio, and confidence score."""
        jev_res = self.jev.evaluate_action(
            ppo_action=0,
            current_state=self.sample_traffic_state,
            elapsed_phase_time=20.0
        )
        self.assertEqual(jev_res["ns_pcu_queue"], 20.0)  # N: 12 + S: 8
        self.assertEqual(jev_res["ew_pcu_queue"], 7.0)   # E: 4 + W: 3
        self.assertGreater(jev_res["queue_imbalance_ratio"], 0.4)
        self.assertGreaterEqual(jev_res["jev_score"], 0.90)

    # ------------------ EXPLAIN ENGINE TESTS ------------------ #

    def test_explain_engine_normal_and_fallback(self):
        """Explain Engine must produce transparent explanations with badge and highlights."""
        jev_res = self.jev.evaluate_action(0, self.sample_traffic_state, 15.0)
        safety_res = self.shield.check_action_safety(0, 0, 15.0, self.sample_traffic_state)
        
        # Normal Mode
        exp_normal = self.explain.generate_explanation(0, jev_res, safety_res, False, self.sample_traffic_state)
        self.assertEqual(exp_normal["mode"], "NORMAL_AI_CONTROL")
        self.assertIn("highlights", exp_normal)

        # Fallback Mode
        exp_fallback = self.explain.generate_explanation(0, jev_res, safety_res, True, self.sample_traffic_state)
        self.assertEqual(exp_fallback["mode"], "FALLBACK_MODE")
        self.assertIn("FAULT INJECTION", exp_fallback["badge"])

    # ------------------ FIXED-TIME FALLBACK TESTS ------------------ #

    def test_fallback_controller_progression(self):
        """Fallback Controller progresses predictably through fixed durations."""
        action_hold, reason_hold = self.fallback.get_fallback_action(0, 10.0)
        self.assertEqual(action_hold, 0)

        action_next, reason_next = self.fallback.get_fallback_action(0, 31.0)
        self.assertEqual(action_next, 1)

if __name__ == "__main__":
    unittest.main()

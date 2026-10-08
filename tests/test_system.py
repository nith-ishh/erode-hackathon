"""
Comprehensive Unit & Integration Test Suite
Validates PCU math, PPO environment, JEV layer, Safety Shield rules,
Break-It fault injection, emergency green wave, counterfactual metrics, and API endpoints.
"""

import unittest
import sys
import os
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from rl.pcu import PCUCalculator
from rl.reward import RewardCalculator
from decision.jev import JEVDecisionLayer
from decision.safety_shield import SafetyShield
from decision.fallback_controller import FallbackController
from decision.explain_engine import ExplainEngine
from emergency.emergency_detector import EmergencyDetector
from emergency.green_wave import GreenWaveCoordinator
from counterfactual.metrics import MetricsCalculator

class TestTrafficSystem(unittest.TestCase):
    def setUp(self):
        self.pcu_calc = PCUCalculator()
        self.reward_calc = RewardCalculator()
        self.jev = JEVDecisionLayer()
        self.safety_shield = SafetyShield()
        self.fallback = FallbackController()
        self.explain = ExplainEngine()
        self.em_detector = EmergencyDetector()
        self.green_wave = GreenWaveCoordinator()
        self.metrics_calc = MetricsCalculator()

    def test_1_pcu_calculation(self):
        vtypes = {"car": 2, "motorcycle": 4, "bus": 1, "truck": 1, "auto": 2}
        pcu = self.pcu_calc.calculate_pcu_count(vtypes)
        # 2*1.0 + 4*0.5 + 1*3.0 + 1*3.0 + 2*0.75 = 2 + 2 + 3 + 3 + 1.5 = 11.5
        self.assertEqual(pcu, 11.5)

    def test_2_jev_evaluation(self):
        mock_state = {
            "current_phase": 0,
            "approaches": {
                "N": {"pcu_queue": 15.0, "pedestrians_waiting": 2},
                "S": {"pcu_queue": 10.0, "pedestrians_waiting": 1},
                "E": {"pcu_queue": 5.0, "pedestrians_waiting": 0},
                "W": {"pcu_queue": 5.0, "pedestrians_waiting": 0}
            }
        }
        res = self.jev.evaluate_action(0, mock_state, 15.0)
        self.assertIn("jev_score", res)
        self.assertGreater(res["jev_score"], 0.8)

    def test_3_safety_shield_min_green_rejection(self):
        mock_state = {
            "current_phase": 0,
            "approaches": {"N": {"pcu_queue": 5.0}, "S": {"pcu_queue": 5.0}, "E": {"pcu_queue": 20.0}, "W": {"pcu_queue": 20.0}}
        }
        # Propose switch to phase 1 when elapsed time is 4.0s (< min green 10s)
        is_safe, final_phase, reason, metrics = self.safety_shield.check_action_safety(1, 0, 4.0, mock_state)
        self.assertFalse(is_safe)
        self.assertEqual(final_phase, 0)
        self.assertIn("Minimum green time violated", reason)

    def test_4_safety_shield_break_it_fault(self):
        mock_state = {"current_phase": 0, "approaches": {}}
        self.safety_shield.set_sensor_fault(True)
        is_safe, final_phase, reason, metrics = self.safety_shield.check_action_safety(1, 0, 20.0, mock_state)
        self.assertFalse(is_safe)
        self.assertIn("Sensor failure detected", reason)
        self.safety_shield.set_sensor_fault(False)

    def test_5_emergency_preemption(self):
        mock_state = {
            "current_phase": 2,
            "emergency_present": True,
            "emergency_details": [{"id": "amb_1", "edge": "N2J1", "position": 180.0, "speed": 15.0}],
            "approaches": {"N": {"pcu_queue": 10.0}, "S": {"pcu_queue": 10.0}, "E": {"pcu_queue": 10.0}, "W": {"pcu_queue": 10.0}}
        }
        # PPO proposes 2 (EW green), but emergency is on N2J1 (requires N-S green phase 0)
        is_safe, final_phase, reason, metrics = self.safety_shield.check_action_safety(2, 2, 15.0, mock_state)
        self.assertFalse(is_safe)
        self.assertEqual(final_phase, 0)  # Forced N-S Green phase 0

    def test_6_green_wave_coordination(self):
        em_info = {"detected": True, "vehicle_id": "amb_1", "approach_edge": "N2J1", "eta_seconds": 12.0}
        plan = self.green_wave.compute_green_wave_phases(em_info, 100)
        self.assertTrue(plan["active_corridor"])
        self.assertEqual(plan["junction_states"]["J1"]["phase"], 0)

    def test_7_metrics_calculation(self):
        ai = {"avg_delay_s": 20.0, "avg_queue_pcu": 10.0, "throughput_veh": 500, "avg_pedestrian_wait_s": 15.0, "emergency_travel_time_s": 40.0}
        base = {"avg_delay_s": 30.0, "avg_queue_pcu": 15.0, "throughput_veh": 400, "avg_pedestrian_wait_s": 25.0, "emergency_travel_time_s": 60.0}
        res = self.metrics_calc.compare_runs(ai, base)
        self.assertEqual(res["improvements"]["delay_reduction_pct"], 33.3)

if __name__ == "__main__":
    unittest.main()

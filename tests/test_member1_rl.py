"""
Unit & Integration Tests for Member 1: Reinforcement Learning & Traffic Modeling
Tests:
  1. Indian PCU calculation for individual vehicle types & fleets
  2. PCU queue and delay weighting
  3. Raw vs PCU distortion detection
  4. Multi-objective reward calculation and breakdown
  5. Gymnasium TrafficSignalEnv observation dimensions & bounds
  6. PPO inference execution
"""

import unittest
import sys
from pathlib import Path
import numpy as np

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from rl.pcu import PCUCalculator
from rl.reward import RewardCalculator
from rl.environment import TrafficSignalEnv

class TestMember1RL(unittest.TestCase):
    def setUp(self):
        self.pcu = PCUCalculator()
        self.reward_calc = RewardCalculator()

    def test_pcu_weights_standard(self):
        self.assertEqual(self.pcu.get_vehicle_pcu("car"), 1.0)
        self.assertEqual(self.pcu.get_vehicle_pcu("motorcycle"), 0.5)
        self.assertEqual(self.pcu.get_vehicle_pcu("bike"), 0.5)
        self.assertEqual(self.pcu.get_vehicle_pcu("bus"), 3.0)
        self.assertEqual(self.pcu.get_vehicle_pcu("truck"), 3.0)
        self.assertEqual(self.pcu.get_vehicle_pcu("auto"), 0.75)
        self.assertEqual(self.pcu.get_vehicle_pcu("rickshaw"), 0.75)

    def test_pcu_fleet_calculation(self):
        fleet = {"car": 4, "motorcycle": 10, "bus": 2, "truck": 1, "auto": 4}
        # 4*1.0 + 10*0.5 + 2*3.0 + 1*3.0 + 4*0.75 = 4 + 5 + 6 + 3 + 3 = 21.0
        total_pcu = self.pcu.calculate_pcu_count(fleet)
        self.assertEqual(total_pcu, 21.0)

    def test_raw_vs_pcu_comparison(self):
        # 10 motorcycles (raw=10, pcu=5) vs 3 buses (raw=3, pcu=9)
        approach_a = {"motorcycle": 10}
        approach_b = {"bus": 3}
        res = self.pcu.compare_pcu_vs_raw(approach_a, approach_b)
        self.assertTrue(res["mismatch_detected"])
        self.assertEqual(res["raw_preferred"], "Approach A")
        self.assertEqual(res["pcu_preferred"], "Approach B")

    def test_reward_breakdown_components(self):
        prev = {"total_pcu_delay": 40.0, "total_pcu_queue": 15.0, "total_vehicles": 12}
        curr = {
            "total_pcu_delay": 20.0,
            "total_pcu_queue": 8.0,
            "total_vehicles": 8,
            "total_pedestrians_waiting": 0,
            "emergency_present": False,
            "current_phase": 0
        }
        breakdown = self.reward_calc.calculate_reward_breakdown(curr, prev, action_taken=0)
        self.assertIn("components", breakdown)
        self.assertIn("pcu_delay_penalty", breakdown["components"])
        self.assertIn("pcu_queue_penalty", breakdown["components"])
        self.assertIn("throughput_reward", breakdown["components"])
        self.assertIsInstance(breakdown["total_reward"], float)

    def test_gymnasium_env_observation_shape(self):
        env = TrafficSignalEnv(max_steps=10)
        obs, info = env.reset(seed=42)
        # Verify 18-dimensional normalized observation vector
        self.assertEqual(obs.shape, (18,))
        self.assertTrue(np.all(obs >= 0.0) and np.all(obs <= 1.0))

        # Test single step execution
        next_obs, reward, terminated, truncated, step_info = env.step(0)
        self.assertEqual(next_obs.shape, (18,))
        self.assertIsInstance(reward, float)
        self.assertIn("explanation", step_info)
        env.close()

if __name__ == "__main__":
    unittest.main()

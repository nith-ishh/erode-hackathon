"""
Unit & Integration Tests for Member 1: Reinforcement Learning & Traffic Modeling
Tests:
  1. Indian PCU calculation for individual vehicle types & fleets
  2. PCU queue, delay weighting, and composite approach pressure
  3. Raw vs PCU distortion detection in mixed traffic
  4. Multi-objective reward calculation and component breakdown
  5. Gymnasium TrafficSignalEnv observation dimensions & bounds
  6. PPO model inference execution
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
from config import PPO_CONFIG

class TestMember1RL(unittest.TestCase):
    def setUp(self):
        self.pcu = PCUCalculator()
        self.reward_calc = RewardCalculator()

    def test_1_pcu_weights_standard(self):
        """Test standard Indian PCU values for individual vehicle categories."""
        self.assertEqual(self.pcu.get_vehicle_pcu("car"), 1.0)
        self.assertEqual(self.pcu.get_vehicle_pcu("motorcycle"), 0.5)
        self.assertEqual(self.pcu.get_vehicle_pcu("bike"), 0.5)
        self.assertEqual(self.pcu.get_vehicle_pcu("bus"), 3.0)
        self.assertEqual(self.pcu.get_vehicle_pcu("truck"), 3.0)
        self.assertEqual(self.pcu.get_vehicle_pcu("auto"), 0.75)
        self.assertEqual(self.pcu.get_vehicle_pcu("rickshaw"), 0.75)
        self.assertEqual(self.pcu.get_vehicle_pcu("ambulance"), 1.0)

    def test_2_pcu_fleet_and_queue_delay(self):
        """Test fleet count, queued vehicles PCU, and waiting time delay calculations."""
        fleet = {"car": 4, "motorcycle": 10, "bus": 2, "truck": 1, "auto": 4}
        # 4*1.0 + 10*0.5 + 2*3.0 + 1*3.0 + 4*0.75 = 4 + 5 + 6 + 3 + 3 = 21.0
        total_pcu = self.pcu.calculate_pcu_count(fleet)
        self.assertEqual(total_pcu, 21.0)

        # Queued vehicles calculation
        queued = [
            {"type": "bus"},
            {"type": "motorcycle"},
            {"type": "auto"}
        ]
        # 3.0 + 0.5 + 0.75 = 4.25
        queue_pcu = self.pcu.calculate_pcu_queue(queued)
        self.assertEqual(queue_pcu, 4.25)

        # Delay calculation: sum(waiting_time * pcu)
        delayed_vehs = [
            {"type": "bus", "waiting_time": 10.0},        # 10 * 3.0 = 30.0
            {"type": "motorcycle", "waiting_time": 20.0}  # 20 * 0.5 = 10.0
        ]
        delay_pcu = self.pcu.calculate_pcu_delay(delayed_vehs)
        self.assertEqual(delay_pcu, 40.0)

        # Approach pressure composite score
        app_data = {"pcu_queue": 10.0, "pcu_delay": 60.0, "pedestrians_waiting": 5}
        # 10.0 + (60.0 / 30.0) + (5 * 0.2) = 10.0 + 2.0 + 1.0 = 13.0
        pressure = self.pcu.calculate_approach_pcu_pressure(app_data)
        self.assertEqual(pressure, 13.0)

    def test_3_raw_vs_pcu_distortion_detection(self):
        """Test dilemma comparison showing how raw vehicle counts fail compared to PCU."""
        # Approach A: 10 motorcycles (raw=10, pcu=5.0)
        # Approach B: 3 buses (raw=3, pcu=9.0)
        approach_a = {"motorcycle": 10}
        approach_b = {"bus": 3}
        res = self.pcu.compare_pcu_vs_raw(approach_a, approach_b)
        self.assertTrue(res["mismatch_detected"])
        self.assertEqual(res["raw_preferred"], "Approach A")
        self.assertEqual(res["pcu_preferred"], "Approach B")
        self.assertIn("CRITICAL MISMATCH", res["explanation"])

    def test_4_reward_breakdown_components(self):
        """Test multi-objective PPO reward calculation and individual components."""
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
        self.assertIn("pedestrian_wait_penalty", breakdown["components"])
        self.assertIn("phase_switch_penalty", breakdown["components"])
        self.assertIn("emergency_priority_reward", breakdown["components"])
        self.assertIsInstance(breakdown["total_reward"], float)

    def test_5_gymnasium_env_observation_and_action(self):
        """Test Gymnasium TrafficSignalEnv observation dimensions, bounds, and transitions."""
        env = TrafficSignalEnv(max_steps=10, mock_mode=True)
        obs, info = env.reset(seed=42)
        
        # Verify 18-dimensional normalized observation vector in [0.0, 1.0]
        self.assertEqual(obs.shape, (18,))
        self.assertTrue(np.all(obs >= 0.0) and np.all(obs <= 1.0))
        self.assertEqual(env.action_space.n, 2)

        # Test single step execution
        next_obs, reward, terminated, truncated, step_info = env.step(0)
        self.assertEqual(next_obs.shape, (18,))
        self.assertTrue(np.all(next_obs >= 0.0) and np.all(next_obs <= 1.0))
        self.assertIsInstance(reward, float)
        self.assertIn("explanation", step_info)
        self.assertIn("safety_result", step_info)
        env.close()

    def test_6_ppo_inference_execution(self):
        """Test loading trained PPO model and executing policy prediction."""
        try:
            from stable_baselines3 import PPO
        except ImportError:
            self.skipTest("Stable-Baselines3 is not installed.")

        model_path = Path(PPO_CONFIG["model_dir"]) / "ppo_traffic_model.zip"
        if not model_path.exists():
            self.skipTest(f"PPO model not found at {model_path}.")

        model = PPO.load(str(model_path))
        env = TrafficSignalEnv(max_steps=5, mock_mode=True)
        obs, info = env.reset(seed=42)

        # Test prediction
        action, _states = model.predict(obs, deterministic=True)
        self.assertIn(int(action), [0, 1])

        # Step with predicted action
        obs, reward, term, trunc, info = env.step(int(action))
        self.assertIsInstance(reward, float)
        env.close()

if __name__ == "__main__":
    unittest.main()

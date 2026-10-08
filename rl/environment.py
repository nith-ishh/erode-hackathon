"""
Custom Gymnasium Environment for Indian Mixed-Traffic Signal Control
Wraps SUMO TraCI / State Extractor into a standard Gymnasium RL interface.
"""

import sys
import numpy as np
from pathlib import Path
from typing import Dict, Any, Tuple, Optional

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

import gymnasium as gym
from gymnasium import spaces

from simulation.traci_controller import SUMOTraCIController
from simulation.state_extractor import StateExtractor
from decision.jev import JEVDecisionLayer
from decision.safety_shield import SafetyShield
from decision.explain_engine import ExplainEngine
from rl.reward import RewardCalculator
from config import SIGNAL_CONSTRAINTS

class TrafficSignalEnv(gym.Env):
    """
    Gymnasium Environment for 4-way Mixed Traffic Signal Control.
    Observations:
        - 4 approach PCU queues (N, S, E, W) normalized [0, 1]
        - 4 approach vehicle counts normalized [0, 1]
        - 4 approach pedestrian wait counts normalized [0, 1]
        - Current phase (one-hot, 4 dimensions)
        - Elapsed phase time normalized [0, 1]
        - Emergency vehicle presence (binary, 0/1)
        Total observation dim = 4 + 4 + 4 + 4 + 1 + 1 = 18.
    Actions:
        - Discrete(2): 0 = Keep phase, 1 = Switch to next phase
    """
    metadata = {"render_modes": ["human"]}

    def __init__(self, sumocfg_path: Optional[str] = None, use_gui: bool = False, max_steps: int = 3600):
        super().__init__()
        self.max_steps = max_steps
        self.controller = SUMOTraCIController(sumocfg_path=sumocfg_path, use_gui=use_gui, label="rl_env")
        self.extractor = StateExtractor()
        self.jev = JEVDecisionLayer()
        self.safety_shield = SafetyShield()
        self.explain_engine = ExplainEngine()
        self.reward_calc = RewardCalculator()

        # Define Observation & Action Spaces
        self.observation_space = spaces.Box(
            low=0.0, high=1.0, shape=(18,), dtype=np.float32
        )
        self.action_space = spaces.Discrete(2)

        self.current_step = 0
        self.last_state = {}

    def _get_observation(self, state: Dict[str, Any]) -> np.ndarray:
        """Normalizes and flattens traffic state into 18-dim vector."""
        approaches = state.get("approaches", {})

        pcu_queues = [
            approaches.get("N", {}).get("pcu_queue", 0.0) / 100.0,
            approaches.get("S", {}).get("pcu_queue", 0.0) / 100.0,
            approaches.get("E", {}).get("pcu_queue", 0.0) / 100.0,
            approaches.get("W", {}).get("pcu_queue", 0.0) / 100.0,
        ]

        veh_counts = [
            approaches.get("N", {}).get("vehicle_count", 0) / 50.0,
            approaches.get("S", {}).get("vehicle_count", 0) / 50.0,
            approaches.get("E", {}).get("vehicle_count", 0) / 50.0,
            approaches.get("W", {}).get("vehicle_count", 0) / 50.0,
        ]

        peds_waiting = [
            approaches.get("N", {}).get("pedestrians_waiting", 0) / 20.0,
            approaches.get("S", {}).get("pedestrians_waiting", 0) / 20.0,
            approaches.get("E", {}).get("pedestrians_waiting", 0) / 20.0,
            approaches.get("W", {}).get("pedestrians_waiting", 0) / 20.0,
        ]

        # One-hot current phase (4 dims)
        phase = state.get("current_phase", 0) % 4
        phase_onehot = [1.0 if i == phase else 0.0 for i in range(4)]

        # Elapsed phase time normalized to max green
        elapsed = min(1.0, self.controller.phase_elapsed_time / SIGNAL_CONSTRAINTS["max_green_time"])

        # Emergency binary flag
        emergency = 1.0 if state.get("emergency_present", False) else 0.0

        obs_vector = np.array(
            pcu_queues + veh_counts + peds_waiting + phase_onehot + [elapsed, emergency],
            dtype=np.float32
        )
        return np.clip(obs_vector, 0.0, 1.0)

    def reset(self, seed: Optional[int] = None, options: Optional[Dict[str, Any]] = None) -> Tuple[np.ndarray, Dict[str, Any]]:
        super().reset(seed=seed)
        self.controller.close()
        self.controller.start(seed=seed if seed else 42)
        
        self.current_step = 0
        state = self.extractor.extract_state_traci(traci, label="rl_env") if self.controller.is_connected else self.extractor.extract_mock_state(0)
        self.last_state = state
        
        obs = self._get_observation(state)
        return obs, {"state": state}

    def step(self, action: int) -> Tuple[np.ndarray, float, bool, bool, Dict[str, Any]]:
        self.current_step += 1

        # 1. PPO Action -> JEV Evaluation
        jev_res = self.jev.evaluate_action(action, self.last_state, self.controller.phase_elapsed_time)

        # 2. JEV -> Safety Shield
        safety_res = self.safety_shield.check_action_safety(
            proposed_action=action,
            current_phase=self.controller.current_phase,
            phase_elapsed_time=self.controller.phase_elapsed_time,
            traffic_state=self.last_state
        )

        is_safe, final_phase, reason, metrics = safety_res

        # 3. Apply safe action to signal controller
        self.controller.set_phase(final_phase)
        self.controller.step()

        # 4. Extract updated state
        current_state = self.extractor.extract_state_traci(traci, label="rl_env") if self.controller.is_connected else self.extractor.extract_mock_state(self.current_step)

        # 5. Compute PPO Reward
        reward = self.reward_calc.calculate_reward(current_state, self.last_state, action, safety_rejected=not is_safe)
        
        # 6. Generate explanation
        explanation = self.explain_engine.generate_explanation(action, jev_res, safety_res, False, current_state)

        self.last_state = current_state
        obs = self._get_observation(current_state)

        terminated = self.current_step >= self.max_steps
        truncated = False

        info = {
            "state": current_state,
            "jev_evaluation": jev_res,
            "safety_result": safety_res,
            "explanation": explanation
        }

        return obs, reward, terminated, truncated, info

    def close(self):
        self.controller.close()

"""
PPO Modular Reward Calculator
Computes reward signal based on PCU delay reduction, queue minimization,
throughput, pedestrian fairness, emergency priority, and phase stability.
"""

from typing import Dict, Any
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from config import REWARD_WEIGHTS

class RewardCalculator:
    def __init__(self, weights: Dict[str, float] = None):
        self.w = weights if weights else REWARD_WEIGHTS

    def calculate_reward(
        self,
        current_state: Dict[str, Any],
        prev_state: Dict[str, Any],
        action_taken: int,
        safety_rejected: bool = False
    ) -> float:
        """
        Calculates step reward based on state transition and action outcome.
        Returns component break-down and scalar reward value.
        """
        curr_pcu_delay = current_state.get("total_pcu_delay", 0.0)
        curr_pcu_queue = current_state.get("total_pcu_queue", 0.0)
        curr_peds = current_state.get("total_pedestrians_waiting", 0)
        emergency = current_state.get("emergency_present", False)

        prev_pcu_delay = prev_state.get("total_pcu_delay", curr_pcu_delay)
        
        # 1. Delay reduction (or increase penalty)
        delay_delta = curr_pcu_delay - prev_pcu_delay
        delay_component = self.w.get("pcu_delay_penalty", -1.0) * (curr_pcu_delay / 10.0)
        
        # 2. Queue length penalty
        queue_component = self.w.get("pcu_queue_penalty", -0.5) * (curr_pcu_queue / 5.0)
        
        # 3. Pedestrian waiting penalty
        ped_component = self.w.get("pedestrian_wait_penalty", -0.8) * curr_peds
        
        # 4. Action switching penalty (avoid rapid flickers)
        switch_component = self.w.get("phase_switch_penalty", -2.0) if action_taken == 1 else 0.0
        
        # 5. Safety violation penalty
        safety_component = self.w.get("safety_violation_penalty", -50.0) if safety_rejected else 0.0
        
        # 6. Emergency priority reward
        emergency_component = 0.0
        if emergency:
            # Check if current phase aligns with emergency direction
            em_details = current_state.get("emergency_details", [])
            if em_details:
                em_edge = em_details[0].get("edge", "")
                cur_phase = current_state.get("current_phase", 0)
                if (em_edge in ["N2J1", "S2J1"] and cur_phase == 0) or (em_edge in ["E2J1", "W2J1"] and cur_phase == 2):
                    emergency_component = self.w.get("emergency_priority_reward", 10.0)

        total_reward = (
            delay_component +
            queue_component +
            ped_component +
            switch_component +
            safety_component +
            emergency_component
        )

        return round(total_reward, 3)

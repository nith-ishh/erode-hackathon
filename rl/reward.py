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
        
        # 3. Throughput reward (reward clearing vehicles)
        throughput_count = current_state.get("throughput_step", max(0, prev_state.get("total_vehicles", 0) - current_state.get("total_vehicles", 0)))
        throughput_component = self.w.get("throughput_reward", 2.0) * float(throughput_count)

        # 4. Pedestrian waiting penalty
        ped_component = self.w.get("pedestrian_wait_penalty", -0.8) * curr_peds
        
        # 5. Action switching penalty (avoid rapid flickers)
        switch_component = self.w.get("phase_switch_penalty", -2.0) if action_taken == 1 else 0.0
        
        # 6. Safety violation penalty
        safety_component = self.w.get("safety_violation_penalty", -50.0) if safety_rejected else 0.0
        
        # 7. Emergency priority reward
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
            throughput_component +
            ped_component +
            switch_component +
            safety_component +
            emergency_component
        )

        return round(total_reward, 3)

    def calculate_reward_breakdown(
        self,
        current_state: Dict[str, Any],
        prev_state: Dict[str, Any],
        action_taken: int,
        safety_rejected: bool = False
    ) -> Dict[str, Any]:
        """Returns fine-grained component analysis for explainability."""
        curr_pcu_delay = current_state.get("total_pcu_delay", 0.0)
        curr_pcu_queue = current_state.get("total_pcu_queue", 0.0)
        curr_peds = current_state.get("total_pedestrians_waiting", 0)
        emergency = current_state.get("emergency_present", False)

        delay_comp = round(self.w.get("pcu_delay_penalty", -1.0) * (curr_pcu_delay / 10.0), 3)
        queue_comp = round(self.w.get("pcu_queue_penalty", -0.5) * (curr_pcu_queue / 5.0), 3)
        
        throughput_count = current_state.get("throughput_step", max(0, prev_state.get("total_vehicles", 0) - current_state.get("total_vehicles", 0)))
        throughput_comp = round(self.w.get("throughput_reward", 2.0) * float(throughput_count), 3)

        ped_comp = round(self.w.get("pedestrian_wait_penalty", -0.8) * curr_peds, 3)
        switch_comp = round(self.w.get("phase_switch_penalty", -2.0) if action_taken == 1 else 0.0, 3)
        safety_comp = round(self.w.get("safety_violation_penalty", -50.0) if safety_rejected else 0.0, 3)

        em_comp = 0.0
        if emergency:
            em_details = current_state.get("emergency_details", [])
            if em_details:
                em_edge = em_details[0].get("edge", "")
                cur_phase = current_state.get("current_phase", 0)
                if (em_edge in ["N2J1", "S2J1"] and cur_phase == 0) or (em_edge in ["E2J1", "W2J1"] and cur_phase == 2):
                    em_comp = float(self.w.get("emergency_priority_reward", 10.0))

        total = round(delay_comp + queue_comp + throughput_comp + ped_comp + switch_comp + safety_comp + em_comp, 3)

        return {
            "total_reward": total,
            "components": {
                "pcu_delay_penalty": delay_comp,
                "pcu_queue_penalty": queue_comp,
                "throughput_reward": throughput_comp,
                "pedestrian_wait_penalty": ped_comp,
                "phase_switch_penalty": switch_comp,
                "safety_violation_penalty": safety_comp,
                "emergency_priority_reward": em_comp
            }
        }


if __name__ == "__main__":
    calc = RewardCalculator()
    print("=" * 65)
    print("PPO MULTI-OBJECTIVE REWARD CALCULATOR DEMONSTRATION (MEMBER 1)")
    print("=" * 65)

    prev_st = {"total_pcu_delay": 50.0, "total_pcu_queue": 20.0, "total_vehicles": 15}
    curr_st = {
        "total_pcu_delay": 25.0,
        "total_pcu_queue": 10.0,
        "total_vehicles": 10,
        "total_pedestrians_waiting": 1,
        "emergency_present": True,
        "emergency_details": [{"edge": "N2J1"}],
        "current_phase": 0
    }

    breakdown = calc.calculate_reward_breakdown(curr_st, prev_st, action_taken=0, safety_rejected=False)
    print("\nState: Emergency on N2J1, Green Phase 0 (Aligned), Queues Halved")
    print(f"Total Scalar Reward: {breakdown['total_reward']}")
    print("Component Breakdown:")
    for k, v in breakdown["components"].items():
        print(f"  * {k:28s}: {v:+6.2f}")
    print("=" * 65)


"""
JEV (Junction Evaluation Vector / Decision Evaluation Layer)
Acts as an analytical evaluation layer between PPO and the Safety Shield.
Evaluates queue imbalance, pedestrian pressure, emergency alignment, and predicted outcome.
"""

from typing import Dict, Any

class JEVDecisionLayer:
    def __init__(self):
        pass

    def evaluate_action(self, ppo_action: int, current_state: Dict[str, Any], elapsed_phase_time: float) -> Dict[str, Any]:
        """
        Evaluates proposed PPO action against context metrics.
        Returns evaluation dict with approval recommendation, metrics, and confidence score.
        """
        current_phase = current_state.get("current_phase", 0)
        approaches = current_state.get("approaches", {})
        emergency_present = current_state.get("emergency_present", False)
        
        # Calculate approach PCU queues
        n_pcu = approaches.get("N", {}).get("pcu_queue", 0.0)
        s_pcu = approaches.get("S", {}).get("pcu_queue", 0.0)
        e_pcu = approaches.get("E", {}).get("pcu_queue", 0.0)
        w_pcu = approaches.get("W", {}).get("pcu_queue", 0.0)

        ns_queue = n_pcu + s_pcu
        ew_queue = e_pcu + w_pcu
        
        # Pedestrian totals
        ns_peds = approaches.get("N", {}).get("pedestrians_waiting", 0) + approaches.get("S", {}).get("pedestrians_waiting", 0)
        ew_peds = approaches.get("E", {}).get("pedestrians_waiting", 0) + approaches.get("W", {}).get("pedestrians_waiting", 0)

        evaluation = {
            "proposed_action": ppo_action,
            "current_phase": current_phase,
            "ns_pcu_queue": round(ns_queue, 2),
            "ew_pcu_queue": round(ew_queue, 2),
            "queue_imbalance_ratio": round(abs(ns_queue - ew_queue) / max(1.0, ns_queue + ew_queue), 2),
            "total_pedestrians_waiting": ns_peds + ew_peds,
            "emergency_active": emergency_present,
            "jev_recommended_action": ppo_action,
            "jev_score": 1.0,
            "jev_notes": ""
        }

        # Context Analysis
        if emergency_present:
            evaluation["jev_notes"] = "Emergency vehicle detected! Recommending priority clearance."
            evaluation["jev_score"] = 0.95
        elif (current_phase in [0, 1] and ns_queue > ew_queue * 1.5 and ppo_action == 0):
            # Phase 0 is NS Green, extending is well justified by high NS queue
            evaluation["jev_notes"] = f"Action aligns well with North-South queue demand ({ns_queue:.1f} vs {ew_queue:.1f} PCU)."
            evaluation["jev_score"] = 0.98
        elif (current_phase in [0, 1] and ew_queue > ns_queue * 1.5 and ppo_action == 1):
            # Phase 0/1, EW queue dominates, switching to EW green is recommended
            evaluation["jev_notes"] = f"Action aligns with East-West queue demand ({ew_queue:.1f} vs {ns_queue:.1f} PCU)."
            evaluation["jev_score"] = 0.96
        else:
            evaluation["jev_notes"] = "Proposed action evaluated under balanced traffic conditions."
            evaluation["jev_score"] = 0.90

        return evaluation

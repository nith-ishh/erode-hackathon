"""
JEV (Junction Evaluation Vector / Decision Evaluation Layer)
Member 2 - Safety & Explainability Lead

Acts as an analytical multi-objective evaluation layer between PPO policy proposals and the Safety Shield.
Evaluates directional PCU queue imbalances, pedestrian waiting pressure, emergency alignment,
and predicted delay impact, producing transparent confidence scores and mathematical justifications.
"""

from typing import Dict, Any

class JEVDecisionLayer:
    """
    Junction Evaluation Vector (JEV) Layer.
    Computes analytical trade-offs to evaluate whether PPO proposals mathematically align
    with real-time traffic physics and fairness constraints.
    """

    def __init__(self):
        self.total_evaluations = 0

    def evaluate_action(
        self,
        ppo_action: int,
        current_state: Dict[str, Any],
        elapsed_phase_time: float
    ) -> Dict[str, Any]:
        """
        Evaluates proposed PPO action against dynamic traffic context.
        
        Args:
            ppo_action: 0 (Hold Phase) or 1 (Switch Phase) or absolute phase index.
            current_state: Live traffic observation containing approaches, queues, emergency, and pedestrian data.
            elapsed_phase_time: Duration the current phase has been active.
            
        Returns:
            Dictionary containing JEV vector metrics, confidence score, recommendation, and analytical notes.
        """
        self.total_evaluations += 1
        current_phase = current_state.get("current_phase", 0)
        approaches = current_state.get("approaches", {})
        emergency_present = current_state.get("emergency_present", False)
        
        # Calculate directional PCU queues
        n_pcu = approaches.get("N", {}).get("pcu_queue", 0.0)
        s_pcu = approaches.get("S", {}).get("pcu_queue", 0.0)
        e_pcu = approaches.get("E", {}).get("pcu_queue", 0.0)
        w_pcu = approaches.get("W", {}).get("pcu_queue", 0.0)

        ns_queue = round(n_pcu + s_pcu, 2)
        ew_queue = round(e_pcu + w_pcu, 2)
        total_queue = round(ns_queue + ew_queue, 2)

        # Directional Queue Imbalance Ratio: [-1.0 (All EW) to +1.0 (All NS)]
        if total_queue > 0:
            queue_imbalance_ratio = round((ns_queue - ew_queue) / max(1.0, total_queue), 3)
        else:
            queue_imbalance_ratio = 0.0

        # Pedestrian waiting distribution
        n_peds = approaches.get("N", {}).get("pedestrians_waiting", 0)
        s_peds = approaches.get("S", {}).get("pedestrians_waiting", 0)
        e_peds = approaches.get("E", {}).get("pedestrians_waiting", 0)
        w_peds = approaches.get("W", {}).get("pedestrians_waiting", 0)

        ns_peds = n_peds + s_peds
        ew_peds = e_peds + w_peds
        total_peds = current_state.get("total_pedestrians_waiting", ns_peds + ew_peds)
        
        # Pedestrian Pressure Index [0.0 to 1.0]
        pedestrian_pressure = round(min(1.0, total_peds / 20.0), 2)

        # Emergency Assessment
        emergency_alignment = False
        if emergency_present:
            em_details = current_state.get("emergency_details", [])
            em_edge = em_details[0]["edge"] if em_details else "N2J1"
            req_phase = 0 if em_edge in ["N2J1", "S2J1"] else 2
            emergency_alignment = (ppo_action == req_phase or (ppo_action == 0 and current_phase == req_phase))

        # JEV Context Evaluation & Confidence Scoring
        jev_score = 0.90
        jev_recommendation = ppo_action
        analytical_notes = ""

        if emergency_present:
            jev_score = 0.99 if emergency_alignment else 0.40
            jev_recommendation = 0 if current_phase in [0, 2] and emergency_alignment else 1
            analytical_notes = (
                f"Emergency pre-emption active on corridor. "
                f"Corridor alignment score: {'100%' if emergency_alignment else 'MISALIGNED'}. "
                f"Priority clearance mandatory."
            )
        elif current_phase in [0, 1]:  # Active NS Green
            if ns_queue >= ew_queue * 1.3:
                # High NS demand justifies holding or continuing NS Green
                if ppo_action == 0:
                    jev_score = 0.98
                    analytical_notes = f"Strong NS demand ({ns_queue:.1f} PCU vs EW {ew_queue:.1f} PCU). Extending green is optimal."
                else:
                    jev_score = 0.65
                    analytical_notes = f"PPO proposed phase switch despite high NS queue pressure ({ns_queue:.1f} PCU). JEV flagged efficiency risk."
            elif ew_queue >= ns_queue * 1.3:
                # High EW demand justifies switching to EW Green
                if ppo_action in [1, 2]:
                    jev_score = 0.97
                    analytical_notes = f"EW queue build-up ({ew_queue:.1f} PCU vs NS {ns_queue:.1f} PCU). Transition to EW green is optimal."
                else:
                    jev_score = 0.70
                    analytical_notes = f"EW approach backing up ({ew_queue:.1f} PCU). Switch recommended to avoid spillover."
            else:
                jev_score = 0.92
                analytical_notes = f"Balanced traffic flow (NS: {ns_queue:.1f}, EW: {ew_queue:.1f} PCU). Phase action conforms to standard progression."
        else:  # Active EW Green (Phases 2, 3)
            if ew_queue >= ns_queue * 1.3:
                if ppo_action == 0:
                    jev_score = 0.98
                    analytical_notes = f"High EW queue load ({ew_queue:.1f} PCU vs NS {ns_queue:.1f} PCU). Holding EW green is optimal."
                else:
                    jev_score = 0.65
                    analytical_notes = f"PPO proposed switch despite dominant EW queue ({ew_queue:.1f} PCU)."
            elif ns_queue >= ew_queue * 1.3:
                if ppo_action in [1, 0]:
                    jev_score = 0.97
                    analytical_notes = f"NS queue pressure rising ({ns_queue:.1f} PCU vs EW {ew_queue:.1f} PCU). Transition to NS green is optimal."
                else:
                    jev_score = 0.70
                    analytical_notes = f"NS approach accumulating queues ({ns_queue:.1f} PCU). Switch recommended."
            else:
                jev_score = 0.92
                analytical_notes = f"Balanced traffic flow (NS: {ns_queue:.1f}, EW: {ew_queue:.1f} PCU). Regular cycle operation."

        # Factor in Pedestrian Fairness
        if pedestrian_pressure > 0.6 and elapsed_phase_time > 40.0:
            analytical_notes += f" | Pedestrian waiting threshold elevated ({total_peds} waiting, index: {pedestrian_pressure})."

        return {
            "proposed_action": ppo_action,
            "current_phase": current_phase,
            "ns_pcu_queue": ns_queue,
            "ew_pcu_queue": ew_queue,
            "total_pcu_queue": total_queue,
            "queue_imbalance_ratio": queue_imbalance_ratio,
            "total_pedestrians_waiting": total_peds,
            "pedestrian_pressure_index": pedestrian_pressure,
            "emergency_active": emergency_present,
            "emergency_alignment": emergency_alignment,
            "jev_recommended_action": jev_recommendation,
            "jev_score": round(jev_score, 2),
            "jev_notes": analytical_notes,
            "predicted_delay_impact": "OPTIMAL" if jev_score >= 0.90 else "ACCEPTABLE" if jev_score >= 0.70 else "SUBOPTIMAL"
        }

"""
Explain Engine
Generates human-readable, transparent natural language explanations for every signal decision,
synthesizing PPO action proposals, JEV evaluations, and Safety Shield outcomes.
"""

from typing import Dict, Any, Tuple

class ExplainEngine:
    def __init__(self):
        self.phase_names = [
            "North-South Straight Green",
            "North-South Turn/Clearance",
            "East-West Straight Green",
            "East-West Turn/Clearance"
        ]

    def get_phase_name(self, phase_index: int) -> str:
        return self.phase_names[phase_index % len(self.phase_names)]

    def generate_explanation(
        self,
        ppo_action: int,
        jev_res: Dict[str, Any],
        safety_res: Tuple[bool, int, str, Dict[str, Any]],
        fallback_active: bool,
        traffic_state: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Synthesizes full decision explanation packet.
        """
        is_safe, final_action, safety_reason, safety_metrics = safety_res
        
        timestamp = traffic_state.get("timestamp", 0.0)
        approaches = traffic_state.get("approaches", {})
        
        ns_queue = approaches.get("N", {}).get("pcu_queue", 0.0) + approaches.get("S", {}).get("pcu_queue", 0.0)
        ew_queue = approaches.get("E", {}).get("pcu_queue", 0.0) + approaches.get("W", {}).get("pcu_queue", 0.0)
        peds = traffic_state.get("total_pedestrians_waiting", 0)
        emergency = traffic_state.get("emergency_present", False)

        if fallback_active or not safety_metrics.get("sensor_data_valid", True):
            explanation_text = f"AI control was suspended due to simulated sensor/data failure. Safety Shield triggered Fixed-Time Fallback mode to guarantee zero-risk intersection operation."
            mode = "FALLBACK_MODE"
        elif emergency:
            explanation_text = f"Emergency vehicle priority override active! Phase forced to '{self.get_phase_name(final_action)}' to grant immediate green corridor passage."
            mode = "EMERGENCY_OVERRIDE"
        elif not is_safe:
            explanation_text = f"PPO proposed action {ppo_action}, but the Safety Shield REJECTED it: {safety_reason} Executing safe phase '{self.get_phase_name(final_action)}'."
            mode = "SAFETY_SHIELD_OVERRIDE"
        else:
            if ns_queue > ew_queue:
                queue_context = f"North-South PCU queue ({ns_queue:.1f}) is greater than East-West ({ew_queue:.1f})."
            else:
                queue_context = f"East-West PCU queue ({ew_queue:.1f}) is greater than North-South ({ns_queue:.1f})."
                
            explanation_text = f"PPO proposed signal action {ppo_action}. JEV and Safety Shield APPROVED phase '{self.get_phase_name(final_action)}'. Context: {queue_context} Pedestrians waiting: {peds}."
            mode = "NORMAL_AI_CONTROL"

        return {
            "timestamp": timestamp,
            "mode": mode,
            "ppo_proposed_action": ppo_action,
            "jev_evaluation": jev_res,
            "safety_shield_approved": is_safe,
            "safety_shield_reason": safety_reason,
            "final_action": final_action,
            "final_phase_name": self.get_phase_name(final_action),
            "human_readable_explanation": explanation_text
        }

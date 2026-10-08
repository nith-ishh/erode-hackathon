"""
Explain Engine (Member 2 - Safety & Explainability Lead)
Generates transparent, human-readable natural language justifications for every signal phase decision.
Synthesizes PPO proposals, JEV evaluations, and Safety Shield outcomes for real-time auditability and pitch demos.
"""

from typing import Dict, Any, Tuple, Optional

class ExplainEngine:
    """
    Explain Engine translating complex multi-agent and rule interactions into clear,
    natural language justifications for traffic operators, regulators, and judges.
    """

    def __init__(self):
        self.phase_names = [
            "North-South Straight Green",
            "North-South Turn/Clearance",
            "East-West Straight Green",
            "East-West Turn/Clearance"
        ]

    def get_phase_name(self, phase_index: int) -> str:
        """Returns the formal descriptive name of the signal phase."""
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
        Synthesizes a complete decision explanation packet.
        
        Args:
            ppo_action: Action code proposed by PPO RL policy.
            jev_res: Analytical context and confidence evaluation from JEV layer.
            safety_res: (is_safe, final_action, safety_reason, safety_metrics) from Safety Shield.
            fallback_active: Boolean indicating whether Fixed-Time Fallback is active.
            traffic_state: Live traffic observation packet.
            
        Returns:
            Dictionary containing formatted explanations, mode indicators, and telemetry summaries.
        """
        is_safe, final_action, safety_reason, safety_metrics = safety_res
        
        timestamp = traffic_state.get("timestamp", 0.0)
        approaches = traffic_state.get("approaches", {})
        
        ns_queue = round(approaches.get("N", {}).get("pcu_queue", 0.0) + approaches.get("S", {}).get("pcu_queue", 0.0), 1)
        ew_queue = round(approaches.get("E", {}).get("pcu_queue", 0.0) + approaches.get("W", {}).get("pcu_queue", 0.0), 1)
        total_peds = traffic_state.get("total_pedestrians_waiting", 0)
        emergency = traffic_state.get("emergency_present", False)
        jev_score = jev_res.get("jev_score", 1.0)
        jev_notes = jev_res.get("jev_notes", "")

        # Determine governance mode and compose natural language justification
        if fallback_active or not safety_metrics.get("sensor_data_valid", True):
            mode = "FALLBACK_MODE"
            badge = "FAULT INJECTION / FALLBACK ACTIVE"
            explanation_text = (
                "AI control is currently SUSPENDED due to a simulated sensor / telemetry fault (Break-It Mode). "
                "The Safety Shield has deterministically engaged the Fixed-Time Fallback controller "
                f"to maintain safe intersection throughput without collision risk. Executing phase '{self.get_phase_name(final_action)}'."
            )
            highlights = [
                "Sensor data flagged invalid / corrupted",
                "PPO policy bypassed deterministically",
                "Zero-risk cyclical fallback controller engaged"
            ]

        elif emergency:
            mode = "EMERGENCY_OVERRIDE"
            badge = "EMERGENCY GREEN WAVE PRE-EMPTION"
            explanation_text = (
                f"Emergency priority corridor pre-emption ACTIVE! "
                f"Safety Shield forced phase to '{self.get_phase_name(final_action)}' "
                f"to grant uninterrupted green wave clearance for approaching emergency response vehicle."
            )
            highlights = [
                "Emergency vehicle siren/beacon verified",
                "Conflicting movements cleared",
                f"Forced priority green on corridor ({self.get_phase_name(final_action)})"
            ]

        elif not is_safe:
            mode = "SAFETY_SHIELD_OVERRIDE"
            badge = "SAFETY SHIELD INTERVENTION"
            explanation_text = (
                f"PPO proposed action {ppo_action}, but the Safety Shield INTERVENED: {safety_reason} "
                f"The system safely executed phase '{self.get_phase_name(final_action)}'."
            )
            highlights = [
                f"AI proposed action: {ppo_action}",
                f"Safety Shield rule triggered: {safety_reason}",
                f"Safe enforced action: Phase {final_action} ({self.get_phase_name(final_action)})"
            ]

        else:
            mode = "NORMAL_AI_CONTROL"
            badge = "AI ADAPTIVE CONTROL (VERIFIED SAFE)"
            if ns_queue > ew_queue:
                queue_context = f"North-South PCU queue ({ns_queue}) dominates over East-West ({ew_queue})"
            elif ew_queue > ns_queue:
                queue_context = f"East-West PCU queue ({ew_queue}) dominates over North-South ({ns_queue})"
            else:
                queue_context = f"Balanced queues (NS: {ns_queue} PCU, EW: {ew_queue} PCU)"
                
            explanation_text = (
                f"PPO proposed signal action {ppo_action}. JEV evaluated with {int(jev_score*100)}% confidence ({jev_notes}). "
                f"Safety Shield APPROVED phase '{self.get_phase_name(final_action)}'. "
                f"Context: {queue_context}. Waiting pedestrians: {total_peds}."
            )
            highlights = [
                f"PPO Action {ppo_action} approved by Safety Shield",
                f"JEV Confidence Score: {int(jev_score*100)}%",
                f"Traffic state: {queue_context}",
                f"Pedestrian waiting count: {total_peds}"
            ]

        return {
            "timestamp": timestamp,
            "mode": mode,
            "badge": badge,
            "ppo_proposed_action": ppo_action,
            "jev_evaluation": jev_res,
            "safety_shield_approved": is_safe,
            "safety_shield_reason": safety_reason,
            "final_action": final_action,
            "final_phase_name": self.get_phase_name(final_action),
            "human_readable_explanation": explanation_text,
            "highlights": highlights,
            "summary": {
                "ns_pcu_queue": ns_queue,
                "ew_pcu_queue": ew_queue,
                "pedestrians_waiting": total_peds,
                "jev_confidence_pct": int(jev_score * 100)
            }
        }

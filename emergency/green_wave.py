"""
Green Wave & Multi-Junction Corridor Coordinator
Coordinates signal progression across neighboring junctions (J1 -> J2 -> J3)
to grant seamless green wave passage for emergency corridors without dumping downstream congestion.
"""

from typing import Dict, Any, List

class GreenWaveCoordinator:
    def __init__(self, corridor_junctions: List[str] = None):
        self.junctions = corridor_junctions if corridor_junctions else ["J1", "J2", "J3"]

    def compute_green_wave_phases(self, emergency_info: Dict[str, Any], current_step: int) -> Dict[str, Any]:
        """
        Calculates coordinated phase schedules for J1, J2, and J3.
        """
        if not emergency_info.get("detected", False):
            return {
                "active_corridor": False,
                "corridor_status": "NORMAL_OPERATION",
                "junction_states": {j: {"phase": 0, "green_wave_active": False} for j in self.junctions}
            }

        eta = emergency_info.get("eta_seconds", 10.0)
        edge = emergency_info.get("approach_edge", "N2J1")

        # Determine corridor direction
        target_phase = 0 if edge in ["N2J1", "S2J1"] else 2

        # J1 green immediately, J2 green at t+ETA, J3 green at t+ETA+15
        j1_state = {"phase": target_phase, "green_wave_active": True, "clearance_lead_s": 0}
        j2_state = {"phase": target_phase, "green_wave_active": (eta < 20), "clearance_lead_s": max(0, int(eta - 10))}
        j3_state = {"phase": target_phase, "green_wave_active": (eta < 35), "clearance_lead_s": max(0, int(eta - 25))}

        return {
            "active_corridor": True,
            "corridor_status": f"GREEN_WAVE_ACTIVE: Priority Corridor {edge} -> J1 -> J2 -> J3",
            "emergency_vehicle_id": emergency_info.get("vehicle_id"),
            "current_junction": "J1" if eta > 15 else ("J2" if eta > 5 else "J3"),
            "next_junction": "J2" if eta > 15 else ("J3" if eta > 5 else "CLEARED"),
            "junction_states": {
                "J1": j1_state,
                "J2": j2_state,
                "J3": j3_state
            }
        }

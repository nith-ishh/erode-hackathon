"""
Emergency Vehicle Detector & Priority Verifier
Detects approaching emergency vehicles (ambulances, fire engines, rescue),
verifies priority credentials, and tracks distance/approach lane.
"""

from typing import Dict, Any, List

class EmergencyDetector:
    def __init__(self):
        self.authorized_priority_classes = ["emergency", "authority", "ambulance"]

    def detect_emergency(self, traffic_state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Scans traffic state for active emergency vehicles and siren status.
        Only grants verified_priority if siren is active.
        """
        em_present = traffic_state.get("emergency_present", False)
        em_details = traffic_state.get("emergency_details", [])

        if not em_present or not em_details:
            return {
                "detected": False,
                "verified_priority": False,
                "vehicle_id": None,
                "approach_edge": None,
                "distance_to_stopline": 999.0,
                "eta_seconds": 999.0,
                "siren_active": False
            }

        target_em = em_details[0]
        v_id = target_em.get("id", "emergency_ambulance_1")
        edge = target_em.get("edge", "N2J1")
        pos = target_em.get("position", 150.0)
        speed = target_em.get("speed", 15.0)
        siren = target_em.get("siren_active", True)

        # Distance to junction stopline (edge length ~250m)
        distance = max(0.0, 250.0 - pos)
        eta = round(distance / max(1.0, speed), 1)

        # SIREN CHECK: Only request emergency signal pre-emption when Siren is ON!
        # When Siren is OFF: Vehicle is present, but receives normal traffic treatment.
        return {
            "detected": bool(siren),
            "vehicle_present": True,
            "verified_priority": bool(siren),
            "vehicle_id": v_id,
            "approach_edge": edge,
            "distance_to_stopline": round(distance, 1),
            "eta_seconds": eta,
            "siren_active": bool(siren),
            "status": "PRIORITY_AUTHORIZED" if siren else "MONITORING_SIREN_OFF"
        }

_detector_instance = EmergencyDetector()

def detect_emergency(traffic_state_or_mgr: Any) -> Dict[str, Any]:
    """Module-level convenience wrapper for detecting emergency."""
    if hasattr(traffic_state_or_mgr, 'get_status'):
        status = traffic_state_or_mgr.get_status()
        traffic_state = {
            "emergency_present": status.get("active", False),
            "emergency_details": [{
                "id": status.get("vehicle_id"),
                "edge": status.get("current_edge"),
                "position": 250.0 - (status.get("distance_to_stopline_m") or 100.0),
                "speed": status.get("speed_mps") or 15.0,
                "siren_active": status.get("siren_active", False)
            }] if status.get("active") else []
        }
        return _detector_instance.detect_emergency(traffic_state)
    elif isinstance(traffic_state_or_mgr, dict):
        return _detector_instance.detect_emergency(traffic_state_or_mgr)
    return {
        "detected": False,
        "verified_priority": False,
        "vehicle_id": None,
        "approach_edge": None,
        "distance_to_stopline": 999.0,
        "eta_seconds": 999.0,
        "siren_active": False,
        "status": "NO_EMERGENCY"
    }


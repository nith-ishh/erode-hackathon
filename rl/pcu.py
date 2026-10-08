"""
Passenger Car Unit (PCU) Calculation Engine
Computes PCU-weighted traffic state metrics for Indian mixed traffic,
including PCU queue lengths, PCU delay, and PCU approach density.
"""

from typing import Dict, List, Any
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent))
from config import PCU_WEIGHTS

class PCUCalculator:
    def __init__(self, custom_weights: Dict[str, float] = None):
        self.weights = custom_weights if custom_weights else PCU_WEIGHTS

    def get_vehicle_pcu(self, vtype_id: str) -> float:
        """Returns PCU weight for a specific vehicle type ID."""
        vtype_lower = vtype_id.lower()
        if "motorcycle" in vtype_lower or "bike" in vtype_lower or "two_wheeler" in vtype_lower:
            return self.weights.get("motorcycle", 0.5)
        elif "bus" in vtype_lower:
            return self.weights.get("bus", 3.0)
        elif "truck" in vtype_lower:
            return self.weights.get("truck", 3.0)
        elif "auto" in vtype_lower or "rickshaw" in vtype_lower:
            return self.weights.get("auto", 0.75)
        elif "emergency" in vtype_lower or "ambulance" in vtype_lower:
            return self.weights.get("emergency", 1.0)
        else:
            return self.weights.get("car", 1.0)

    def calculate_pcu_count(self, vehicle_type_counts: Dict[str, int]) -> float:
        """Calculate total PCU sum given counts of each vehicle type."""
        total_pcu = 0.0
        for vtype, count in vehicle_type_counts.items():
            total_pcu += self.get_vehicle_pcu(vtype) * count
        return round(total_pcu, 2)

    def calculate_pcu_queue(self, queued_vehicles: List[Dict[str, Any]]) -> float:
        """
        Calculate total PCU queue for a list of queued vehicle objects.
        Each vehicle object dictionary should contain 'type' or 'vtype'.
        """
        total_pcu = 0.0
        for veh in queued_vehicles:
            vtype = veh.get("type", veh.get("vtype", "car"))
            total_pcu += self.get_vehicle_pcu(vtype)
        return round(total_pcu, 2)

    def calculate_pcu_delay(self, vehicle_list: List[Dict[str, Any]]) -> float:
        """
        Calculate total PCU-weighted waiting time / delay across vehicles.
        pcu_delay = sum(wait_time_i * pcu_i)
        """
        total_pcu_delay = 0.0
        for veh in vehicle_list:
            vtype = veh.get("type", veh.get("vtype", "car"))
            wait_time = veh.get("waiting_time", 0.0)
            pcu = self.get_vehicle_pcu(vtype)
            total_pcu_delay += wait_time * pcu
        return round(total_pcu_delay, 2)

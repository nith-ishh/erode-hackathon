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

    def calculate_approach_pcu_pressure(self, approach_data: Dict[str, Any]) -> float:
        """
        Calculates holistic queue pressure for an approach combining PCU queue length,
        delay weight, and pedestrian interference.
        """
        pcu_queue = approach_data.get("pcu_queue", 0.0)
        pcu_delay = approach_data.get("pcu_delay", 0.0)
        peds = approach_data.get("pedestrians_waiting", 0)
        
        # Composite PCU pressure score
        pressure = pcu_queue * 1.0 + (pcu_delay / 30.0) + (peds * 0.2)
        return round(pressure, 2)

    def compare_pcu_vs_raw(self, approach_a_counts: Dict[str, int], approach_b_counts: Dict[str, int]) -> Dict[str, Any]:
        """
        Demonstrates the critical difference between raw vehicle counts vs PCU weighting
        in Indian mixed traffic conditions (e.g. 2-wheelers vs heavy buses).
        """
        raw_a = sum(approach_a_counts.values())
        raw_b = sum(approach_b_counts.values())
        pcu_a = self.calculate_pcu_count(approach_a_counts)
        pcu_b = self.calculate_pcu_count(approach_b_counts)

        raw_preferred = "Approach A" if raw_a >= raw_b else "Approach B"
        pcu_preferred = "Approach A" if pcu_a >= pcu_b else "Approach B"
        misaligned = raw_preferred != pcu_preferred

        explanation = (
            f"Raw count favors {raw_preferred} ({max(raw_a, raw_b)} vs {min(raw_a, raw_b)} vehicles), "
            f"but Indian PCU weighting favors {pcu_preferred} ({max(pcu_a, pcu_b):.1f} vs {min(pcu_a, pcu_b):.1f} PCU). "
            f"{'CRITICAL MISMATCH: Traditional controllers fail here!' if misaligned else 'Aligns with volume.'}"
        )

        return {
            "approach_a": {"raw_count": raw_a, "pcu_count": pcu_a, "counts": approach_a_counts},
            "approach_b": {"raw_count": raw_b, "pcu_count": pcu_b, "counts": approach_b_counts},
            "raw_preferred": raw_preferred,
            "pcu_preferred": pcu_preferred,
            "mismatch_detected": misaligned,
            "explanation": explanation
        }


if __name__ == "__main__":
    calc = PCUCalculator()
    print("=" * 65)
    print("INDIAN MIXED-TRAFFIC PCU CALCULATION DEMONSTRATION (MEMBER 1)")
    print("=" * 65)
    
    # Classic Indian traffic dilemma:
    # Approach A: 12 Motorcycles + 2 Autos (High count, low road occupancy)
    # Approach B: 4 Heavy Buses + 2 Trucks (Low count, massive road occupancy)
    north = {"motorcycle": 12, "auto": 2}
    east = {"bus": 4, "truck": 2}

    result = calc.compare_pcu_vs_raw(north, east)
    print(f"\n[North Approach]: {north}")
    print(f"  -> Raw Vehicle Count: {result['approach_a']['raw_count']} vehicles")
    print(f"  -> PCU-Weighted Load: {result['approach_a']['pcu_count']} PCU")

    print(f"\n[East Approach]: {east}")
    print(f"  -> Raw Vehicle Count: {result['approach_b']['raw_count']} vehicles")
    print(f"  -> PCU-Weighted Load: {result['approach_b']['pcu_count']} PCU")

    print("\n[Verdict]:")
    print(f"  * Traditional Fixed/Raw-Count Controller selects: {result['raw_preferred']}")
    print(f"  * Indian Mixed-Traffic PCU AI Controller selects:   {result['pcu_preferred']}")
    print(f"  * Policy Distortion Caught: {result['mismatch_detected']}")
    print(f"  * Analysis: {result['explanation']}")
    print("=" * 65)


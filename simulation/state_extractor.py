"""
TraCI Traffic State Extractor
Extracts live detailed state from SUMO through TraCI, including vehicle counts,
queue length, waiting times, PCU-weighted loads, pedestrian waiting counts,
and emergency vehicle detection.
"""

import sys
import math
from pathlib import Path
from typing import Dict, Any, List

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from rl.pcu import PCUCalculator

class StateExtractor:
    def __init__(self, pcu_calc: PCUCalculator = None):
        self.pcu_calc = pcu_calc if pcu_calc else PCUCalculator()
        self.approaches = ["N", "S", "E", "W"]
        self.inbound_edges = {
            "N": "N2J1",
            "S": "S2J1",
            "E": "E2J1",
            "W": "W2J1"
        }

    def extract_state_traci(self, traci_instance, label: str = "default", junction_id: str = "J1") -> Dict[str, Any]:
        """Extract live traffic state from an active TraCI connection."""
        try:
            import traci
            traci.switch(label)
        except Exception:
            return self.extract_mock_state()

        state = {
            "timestamp": traci.simulation.getTime(),
            "junction_id": junction_id,
            "current_phase": traci.trafficlight.getPhase(junction_id),
            "approaches": {},
            "total_pcu_queue": 0.0,
            "total_pcu_delay": 0.0,
            "total_vehicles": 0,
            "total_pedestrians_waiting": 0,
            "emergency_present": False,
            "emergency_details": []
        }

        # Check for emergency vehicles in simulation
        all_veh_ids = traci.vehicle.getIDList()
        for v_id in all_veh_ids:
            vtype = traci.vehicle.getTypeID(v_id)
            if "emergency" in vtype.lower() or "ambulance" in vtype.lower():
                state["emergency_present"] = True
                edge_id = traci.vehicle.getRoadID(v_id)
                pos = traci.vehicle.getLanePosition(v_id)
                speed = traci.vehicle.getSpeed(v_id)
                state["emergency_details"].append({
                    "id": v_id,
                    "edge": edge_id,
                    "position": pos,
                    "speed": speed
                })

        # Process each approach
        for app_name, edge_id in self.inbound_edges.items():
            lane_ids = [f"{edge_id}_1", f"{edge_id}_2"]
            veh_list = []
            queue_veh_list = []
            vtype_counts = {}

            for lane_id in lane_ids:
                v_in_lane = traci.lane.getLastStepVehicleIDs(lane_id)
                for v_id in v_in_lane:
                    vtype = traci.vehicle.getTypeID(v_id)
                    speed = traci.vehicle.getSpeed(v_id)
                    wait = traci.vehicle.getAccumulatedWaitingTime(v_id)
                    
                    vtype_counts[vtype] = vtype_counts.get(vtype, 0) + 1
                    veh_info = {"id": v_id, "type": vtype, "speed": speed, "waiting_time": wait}
                    veh_list.append(veh_info)
                    
                    if speed < 0.1:  # Queued/Stopped vehicle
                        queue_veh_list.append(veh_info)

            pcu_queue = self.pcu_calc.calculate_pcu_queue(queue_veh_list)
            pcu_delay = self.pcu_calc.calculate_pcu_delay(veh_list)
            pcu_count = self.pcu_calc.calculate_pcu_count(vtype_counts)

            # Pedestrian waiting on sidewalk (lane 0)
            sidewalk_id = f"{edge_id}_0"
            ped_count = len(traci.lane.getLastStepPersonIDs(sidewalk_id))

            state["approaches"][app_name] = {
                "edge_id": edge_id,
                "vehicle_count": len(veh_list),
                "queue_count": len(queue_veh_list),
                "vtype_counts": vtype_counts,
                "pcu_count": pcu_count,
                "pcu_queue": pcu_queue,
                "pcu_delay": pcu_delay,
                "pedestrians_waiting": ped_count
            }

            state["total_pcu_queue"] += pcu_queue
            state["total_pcu_delay"] += pcu_delay
            state["total_vehicles"] += len(veh_list)
            state["total_pedestrians_waiting"] += ped_count

        state["total_pcu_queue"] = round(state["total_pcu_queue"], 2)
        state["total_pcu_delay"] = round(state["total_pcu_delay"], 2)
        return state

    def extract_mock_state(self, step: int = 0) -> Dict[str, Any]:
        """Generates realistic state data for testing or mock fallback mode."""
        import random
        random.seed(step)
        
        state = {
            "timestamp": float(step),
            "junction_id": "J1",
            "current_phase": (step // 30) % 4,
            "approaches": {},
            "total_pcu_queue": 0.0,
            "total_pcu_delay": 0.0,
            "total_vehicles": 0,
            "total_pedestrians_waiting": 0,
            "emergency_present": (step > 120 and step < 180),
            "emergency_details": []
        }

        if state["emergency_present"]:
            state["emergency_details"].append({
                "id": "emergency_1",
                "edge": "N2J1",
                "position": 180.0,
                "speed": 15.0
            })

        for app in self.approaches:
            veh_count = random.randint(3, 15)
            queue_count = random.randint(1, veh_count)
            vtype_counts = {"car": int(veh_count*0.4), "motorcycle": int(veh_count*0.4), "bus": int(veh_count*0.1), "auto": int(veh_count*0.1)}
            
            pcu_count = self.pcu_calc.calculate_pcu_count(vtype_counts)
            pcu_queue = pcu_count * (queue_count / max(1, veh_count))
            pcu_delay = pcu_queue * random.uniform(5.0, 20.0)
            peds = random.randint(0, 5)

            state["approaches"][app] = {
                "edge_id": f"{app}2J1",
                "vehicle_count": veh_count,
                "queue_count": queue_count,
                "vtype_counts": vtype_counts,
                "pcu_count": pcu_count,
                "pcu_queue": round(pcu_queue, 2),
                "pcu_delay": round(pcu_delay, 2),
                "pedestrians_waiting": peds
            }

            state["total_pcu_queue"] += pcu_queue
            state["total_pcu_delay"] += pcu_delay
            state["total_vehicles"] += veh_count
            state["total_pedestrians_waiting"] += peds

        state["total_pcu_queue"] = round(state["total_pcu_queue"], 2)
        state["total_pcu_delay"] = round(state["total_pcu_delay"], 2)
        return state

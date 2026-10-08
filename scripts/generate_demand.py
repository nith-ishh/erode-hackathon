"""
Dynamic SUMO Traffic Demand Generator
Generates XML route files (junction.rou.xml) containing mixed Indian traffic flows,
pedestrian crossings, and emergency vehicle arrivals calibrated against Delhi traffic density profiles.
"""

import os
import sys
import json
import random
import xml.etree.ElementTree as ET
from xml.dom import minidom
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
ROUTES_DIR = BASE_DIR / "simulation" / "sumo" / "routes"
PROCESSED_DATA_PATH = BASE_DIR / "data" / "processed" / "traffic_patterns.json"

ROUTES_DIR.mkdir(parents=True, exist_ok=True)

def load_calibration_data():
    """Load traffic calibration profiles."""
    if PROCESSED_DATA_PATH.exists():
        with open(PROCESSED_DATA_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    else:
        from process_dataset import process_raw_dataset
        return process_raw_dataset()

def generate_route_file(scenario_name="normal", duration_steps=3600, seed=42):
    """Generate junction.rou.xml for the given scenario."""
    random.seed(seed)
    calibration = load_calibration_data()
    
    scenario_cfg = calibration["scenarios"].get(scenario_name, calibration["scenarios"]["normal"])
    v_mix = calibration["vehicle_mix"]
    
    routes_elem = ET.Element("routes")
    
    # Define route paths through 4-way junction J1
    # 12 origin-destination movements
    route_paths = [
        ("r_N_S", "N2J1 J12S"),
        ("r_N_W", "N2J1 J12W"),
        ("r_N_E", "N2J1 J12E"),
        ("r_S_N", "S2J1 J12N"),
        ("r_S_E", "S2J1 J12E"),
        ("r_S_W", "S2J1 J12W"),
        ("r_E_W", "E2J1 J12W"),
        ("r_E_N", "E2J1 J12N"),
        ("r_E_S", "E2J1 J12S"),
        ("r_W_E", "W2J1 J12E"),
        ("r_W_S", "W2J1 J12S"),
        ("r_W_N", "W2J1 J12N")
    ]
    
    for r_id, r_edges in route_paths:
        ET.SubElement(routes_elem, "route", id=r_id, edges=r_edges)
        
    # Generate vehicle flows based on calibrated arrival rates
    arr_rate = scenario_cfg["arrival_rate_veh_per_sec"]
    v_types = list(v_mix.keys())
    v_weights = [v_mix[vt] for vt in v_types]
    
    veh_count = 0
    step = 0
    while step < duration_steps:
        # Determine next arrival interval using exponential distribution
        interval = random.expovariate(arr_rate)
        step += max(1, int(interval))
        if step >= duration_steps:
            break
            
        veh_count += 1
        veh_id = f"veh_{scenario_name}_{veh_count}"
        selected_vtype = random.choices(v_types, weights=v_weights, k=1)[0]
        selected_route = random.choice(route_paths)[0]
        
        ET.SubElement(routes_elem, "vehicle", id=veh_id, type=selected_vtype, route=selected_route, depart=str(step))

    # Add emergency vehicles at designated intervals
    emergency_prob = scenario_cfg.get("emergency_probability", 0.02)
    em_count = 0
    for em_step in range(120, duration_steps, 300):
        if random.random() < (emergency_prob * 10):  # Guaranteed sample points for demo
            em_count += 1
            em_id = f"emergency_{em_count}"
            em_route = random.choice(["r_N_S", "r_S_N", "r_E_W", "r_W_E"])
            ET.SubElement(routes_elem, "vehicle", id=em_id, type="emergency", route=em_route, depart=str(em_step), speedFactor="1.3")

    # Add Pedestrian Flows
    ped_rate = scenario_cfg.get("pedestrian_rate_per_sec", 0.1)
    ped_count = 0
    ped_edges = [
        ("N2J1", "J12S"),
        ("S2J1", "J12N"),
        ("E2J1", "J12W"),
        ("W2J1", "J12E")
    ]
    
    p_step = 0
    while p_step < duration_steps:
        p_interval = random.expovariate(ped_rate)
        p_step += max(1, int(p_interval))
        if p_step >= duration_steps:
            break
        ped_count += 1
        p_id = f"ped_{ped_count}"
        from_edge, to_edge = random.choice(ped_edges)
        
        person = ET.SubElement(routes_elem, "person", id=p_id, depart=str(p_step))
        ET.SubElement(person, "walk", edges=f"{from_edge} {to_edge}", busStop="")

    filepath = ROUTES_DIR / "junction.rou.xml"
    rough_string = ET.tostring(routes_elem, 'utf-8')
    reparsed = minidom.parseString(rough_string)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(reparsed.toprettyxml(indent="  "))
    print(f"Generated route file for scenario '{scenario_name}': {filepath} ({veh_count} vehicles, {em_count} emergency, {ped_count} peds)")
    return filepath

if __name__ == "__main__":
    scenario = sys.argv[1] if len(sys.argv) > 1 else "normal"
    generate_route_file(scenario_name=scenario)

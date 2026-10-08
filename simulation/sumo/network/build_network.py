"""
SUMO 4-Way Junction Network Builder & Route Generator
Generates XML network node, edge, connection, traffic light, and route files
for Indian mixed-traffic simulation including pedestrians and emergency vehicles.
"""

import os
import sys
import xml.etree.ElementTree as ET
from xml.dom import minidom
from pathlib import Path

NETWORK_DIR = Path(__file__).resolve().parent
SUMO_DIR = NETWORK_DIR.parent
ROUTES_DIR = SUMO_DIR / "routes"

def prettify(elem):
    """Return a pretty-printed XML string for the Element."""
    rough_string = ET.tostring(elem, 'utf-8')
    reparsed = minidom.parseString(rough_string)
    return reparsed.toprettyxml(indent="  ")

def generate_node_file():
    """Generate XML nodes for 4-way junction J1 and boundary nodes."""
    nodes = ET.Element("nodes")
    
    # Center 4-way traffic light junction
    ET.SubElement(nodes, "node", id="J1", x="0.0", y="0.0", type="traffic_light", tl="J1")
    
    # Peripheral nodes
    ET.SubElement(nodes, "node", id="N", x="0.0", y="250.0", type="priority")
    ET.SubElement(nodes, "node", id="S", x="0.0", y="-250.0", type="priority")
    ET.SubElement(nodes, "node", id="E", x="250.0", y="0.0", type="priority")
    ET.SubElement(nodes, "node", id="W", x="-250.0", y="0.0", type="priority")
    
    filepath = NETWORK_DIR / "junction.nod.xml"
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(prettify(nodes))
    print(f"Generated node file: {filepath}")

def generate_edge_file():
    """Generate XML edges with 3 lanes each and sidewalk lane for pedestrians."""
    edges = ET.Element("edges")
    
    edge_list = [
        ("N2J1", "N", "J1", "3", "13.89"),
        ("J12N", "J1", "N", "3", "13.89"),
        ("S2J1", "S", "J1", "3", "13.89"),
        ("J12S", "J1", "S", "3", "13.89"),
        ("E2J1", "E", "J1", "3", "13.89"),
        ("J12E", "J1", "E", "3", "13.89"),
        ("W2J1", "W", "J1", "3", "13.89"),
        ("J12W", "J1", "W", "3", "13.89"),
    ]
    
    for edge_id, from_node, to_node, num_lanes, speed in edge_list:
        edge = ET.SubElement(edges, "edge", id=edge_id, **{"from": from_node, "to": to_node, "numLanes": num_lanes, "speed": speed})
        # Add sidewalk to lane 0 for pedestrians
        ET.SubElement(edge, "lane", index="0", allow="pedestrian", width="2.5")
        ET.SubElement(edge, "lane", index="1", allow="passenger motorcycle bus truck authority custom1", width="3.2")
        ET.SubElement(edge, "lane", index="2", allow="passenger motorcycle bus truck authority custom1", width="3.2")
        
    filepath = NETWORK_DIR / "junction.edg.xml"
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(prettify(edges))
    print(f"Generated edge file: {filepath}")

def generate_additional_vtypes():
    """Generate vtypes.add.xml containing Indian mixed-traffic vehicle specifications."""
    additional = ET.Element("additional")
    
    vtypes = [
        {"id": "car", "vClass": "passenger", "length": "4.5", "width": "1.8", "maxSpeed": "15.0", "color": "0.2,0.4,0.9", "accel": "2.5", "decel": "4.5"},
        {"id": "motorcycle", "vClass": "motorcycle", "length": "2.0", "width": "0.8", "maxSpeed": "18.0", "color": "0.9,0.8,0.1", "accel": "3.5", "decel": "5.0"},
        {"id": "bus", "vClass": "bus", "length": "10.0", "width": "2.5", "maxSpeed": "11.0", "color": "0.8,0.2,0.2", "accel": "1.5", "decel": "3.5"},
        {"id": "truck", "vClass": "truck", "length": "9.0", "width": "2.4", "maxSpeed": "10.0", "color": "0.2,0.7,0.2", "accel": "1.2", "decel": "3.0"},
        {"id": "auto", "vClass": "custom1", "length": "2.8", "width": "1.3", "maxSpeed": "12.0", "color": "1.0,0.5,0.0", "accel": "2.0", "decel": "4.0"},
        {"id": "emergency", "vClass": "authority", "length": "6.0", "width": "2.2", "maxSpeed": "22.0", "color": "1.0,1.0,1.0", "accel": "3.5", "decel": "5.5", "guiShape": "emergency"}
    ]
    
    for v in vtypes:
        ET.SubElement(additional, "vType", **v)
        
    filepath = ROUTES_DIR / "vtypes.add.xml"
    ROUTES_DIR.mkdir(parents=True, exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(prettify(additional))
    print(f"Generated vehicle types file: {filepath}")

def generate_sumo_config():
    """Generate junction.sumocfg pointing to relative net, routes, and vtypes."""
    config = ET.Element("configuration")
    input_elem = ET.SubElement(config, "input")
    ET.SubElement(input_elem, "net-file", value="network/junction.net.xml")
    ET.SubElement(input_elem, "route-files", value="routes/junction.rou.xml")
    ET.SubElement(input_elem, "additional-files", value="routes/vtypes.add.xml")
    
    time_elem = ET.SubElement(config, "time")
    ET.SubElement(time_elem, "begin", value="0")
    ET.SubElement(time_elem, "end", value="3600")
    ET.SubElement(time_elem, "step-length", value="1.0")
    
    report_elem = ET.SubElement(config, "report")
    ET.SubElement(report_elem, "no-step-log", value="true")
    
    filepath = SUMO_DIR / "junction.sumocfg"
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(prettify(config))
    print(f"Generated SUMO config: {filepath}")

if __name__ == "__main__":
    generate_node_file()
    generate_edge_file()
    generate_additional_vtypes()
    generate_sumo_config()

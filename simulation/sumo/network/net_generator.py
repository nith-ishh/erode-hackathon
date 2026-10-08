"""
SUMO Complete Network XML Generator (Netconvert Integrated)
Creates a complete, valid SUMO network XML (junction.net.xml) for a 4-way intersection
with traffic light control, pedestrian crossings, and lane connections.
"""

import os
import sys
import subprocess
from pathlib import Path
import xml.etree.ElementTree as ET

NETWORK_DIR = Path(__file__).resolve().parent

def build_network_with_netconvert():
    """Use SUMO's netconvert binary to compile node and edge XML files into junction.net.xml."""
    # Find netconvert executable in system path or site-packages
    netconvert_bin = "netconvert"
    
    python_sp = Path(sys.executable).parent / "lib" / "site-packages"
    candidate_netconvert = python_sp / "sumo" / "bin" / "netconvert.exe"
    if candidate_netconvert.exists():
        netconvert_bin = str(candidate_netconvert)

    nod_file = NETWORK_DIR / "junction.nod.xml"
    edg_file = NETWORK_DIR / "junction.edg.xml"
    out_file = NETWORK_DIR / "junction.net.xml"

    cmd = [
        netconvert_bin,
        "--node-files", str(nod_file),
        "--edge-files", str(edg_file),
        "--output-file", str(out_file),
        "--crossings.guess", "true",
        "--sidewalks.guess", "true",
        "--tls.all", "true"
    ]
    
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, check=True)
        print(f"netconvert compiled junction.net.xml successfully using {netconvert_bin}!")
        return True
    except Exception as e:
        print(f"netconvert build info: {e}")
        return False

if __name__ == "__main__":
    from build_network import generate_node_file, generate_edge_file, generate_additional_vtypes, generate_sumo_config
    generate_node_file()
    generate_edge_file()
    generate_additional_vtypes()
    generate_sumo_config()
    build_network_with_netconvert()

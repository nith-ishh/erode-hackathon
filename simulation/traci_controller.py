"""
TraCI Interface Controller
Manages SUMO simulation lifecycle, phase switching, emergency override, and execution state.
"""

import os
import sys
import time
from pathlib import Path
from typing import Dict, Any, List, Optional

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from config import SIMULATION, SIGNAL_CONSTRAINTS

# Attempt to import traci & sumolib
TRACI_AVAILABLE = False
try:
    import traci
    import sumolib
    TRACI_AVAILABLE = True
except ImportError:
    pass

class SUMOTraCIController:
    def __init__(self, sumocfg_path: Optional[str] = None, use_gui: bool = False, label: str = "default"):
        self.sumocfg_path = sumocfg_path or str(BASE_DIR / "simulation" / "sumo" / "junction.sumocfg")
        self.use_gui = use_gui
        self.label = label
        self.is_connected = False
        self.current_step = 0
        self.primary_junction_id = SIMULATION["primary_junction_id"]
        
        # State tracking for signals
        self.current_phase = 0
        self.phase_elapsed_time = 0

    def get_sumo_binary(self, gui: bool = False) -> str:
        """Locates sumo / sumo-gui binary executable."""
        binary_name = "sumo-gui.exe" if gui else "sumo.exe"
        python_sp = Path(sys.executable).parent / "lib" / "site-packages"
        candidate = python_sp / "sumo" / "bin" / binary_name
        if candidate.exists():
            return str(candidate)
        return "sumo-gui" if gui else "sumo"

    def start(self, gui: Optional[bool] = None, seed: int = 42) -> bool:
        """Start SUMO simulation via TraCI."""
        if not TRACI_AVAILABLE:
            print("[TraCI Controller] TraCI not installed/available. Running in Simulation Mock Mode.")
            self.is_connected = False
            return False

        gui_flag = self.use_gui if gui is None else gui
        sumo_binary = self.get_sumo_binary(gui=gui_flag)

        sumo_cmd = [
            sumo_binary,
            "-c", self.sumocfg_path,
            "--step-length", str(SIMULATION["step_length"]),
            "--seed", str(seed),
            "--no-warnings", "true",
            "--no-step-log", "true"
        ]

        try:
            traci.start(sumo_cmd, label=self.label)
            self.is_connected = True
            self.current_step = 0
            self.current_phase = 0
            self.phase_elapsed_time = 0
            print(f"[TraCI Controller] Started official SUMO engine instance '{self.label}' successfully!")
            return True
        except Exception as e:
            print(f"[TraCI Controller] TraCI start attempt info: {e}")
            self.is_connected = False
            return False

    def step(self) -> int:
        """Advance simulation by 1 step."""
        if self.is_connected:
            try:
                traci.switch(self.label)
                traci.simulationStep()
                self.current_step += 1
                self.phase_elapsed_time += 1
            except Exception as e:
                print(f"[TraCI Controller] Step error: {e}")
                self.is_connected = False
        else:
            self.current_step += 1
            self.phase_elapsed_time += 1
            
        return self.current_step

    def set_phase(self, phase_index: int):
        """Set traffic signal phase for primary junction J1."""
        if phase_index != self.current_phase:
            self.current_phase = phase_index
            self.phase_elapsed_time = 0
            
        if self.is_connected:
            try:
                traci.switch(self.label)
                traci.trafficlight.setPhase(self.primary_junction_id, phase_index)
            except Exception as e:
                print(f"[TraCI Controller] Set phase error: {e}")

    def close(self):
        """Close SUMO TraCI connection."""
        if self.is_connected:
            try:
                traci.switch(self.label)
                traci.close()
                print(f"[TraCI Controller] Closed SUMO instance '{self.label}'.")
            except Exception as e:
                pass
            self.is_connected = False

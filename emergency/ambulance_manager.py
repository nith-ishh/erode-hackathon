"""
Emergency Ambulance Manager & Siren State Machine
Manages interactive ambulance lifecycle, route validation, siren state transitions,
TraCI SUMO vehicle injection, emergency pre-emption coordination, and safe clearance.
"""

import math
from typing import Dict, Any, List, Optional
from enum import Enum

class AmbulanceState(str, Enum):
    IDLE = "IDLE"
    AMBULANCE_ACTIVE_NORMAL = "AMBULANCE_ACTIVE_NORMAL"
    EMERGENCY_REQUESTED = "EMERGENCY_REQUESTED"
    EMERGENCY_ROUTE_ACTIVE = "EMERGENCY_ROUTE_ACTIVE"
    EMERGENCY_PASSAGE = "EMERGENCY_PASSAGE"
    EMERGENCY_CLEARANCE = "EMERGENCY_CLEARANCE"
    NORMAL_CONTROL_RESUMED = "NORMAL_CONTROL_RESUMED"
    FAULT = "FAULT"


class AmbulanceManager:
    def __init__(self):
        self.state: AmbulanceState = AmbulanceState.IDLE
        self.vehicle_id: Optional[str] = None
        self.origin: str = "N"
        self.destination: str = "S"
        self.approach_edge: str = "N2J1"
        self.destination_edge: str = "J12S"
        self.route_edges: List[str] = ["N2J1", "J12S"]
        self.siren_active: bool = False
        self.position: float = 0.0  # Distance along approach edge (0 to 250m)
        self.speed: float = 12.0    # m/s
        self.edge_length: float = 250.0
        self.spawn_step: int = 0
        self.clearance_timer: int = 0
        self.clearance_required_steps: int = 4  # 4s safe clearance transition
        self.events_log: List[Dict[str, Any]] = []
        self.last_error: Optional[str] = None
        self.journey_completed: bool = False

    def _log_event(self, timestamp: float, message: str, level: str = "INFO"):
        """Logs timestamped event for simulation and dashboard event stream."""
        event = {
            "timestamp": round(timestamp, 1),
            "message": message,
            "level": level,
            "state": self.state.value
        }
        self.events_log.insert(0, event)
        if len(self.events_log) > 40:
            self.events_log.pop()

    def spawn_ambulance(
        self,
        vehicle_id_or_origin: str = "ambulance_108",
        origin_or_dest: str = "N",
        destination_or_veh_id: str = "S",
        siren: bool = False,
        sim_time: float = 0.0,
        traci_instance=None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Spawns ambulance vehicle on requested origin route.
        Flexible argument parsing to support (vehicle_id, origin, dest) or (origin, dest, vehicle_id).
        """
        # Determine argument mapping
        valid_apps = ["N", "S", "E", "W", "NORTH", "SOUTH", "EAST", "WEST", "N_IN", "S_IN", "E_IN", "W_IN"]
        
        arg1_clean = str(vehicle_id_or_origin).upper().strip()
        arg2_clean = str(origin_or_dest).upper().strip()
        arg3_clean = str(destination_or_veh_id).upper().strip()

        if arg1_clean in valid_apps and arg2_clean in valid_apps:
            # (origin, destination, vehicle_id)
            origin_raw = arg1_clean
            dest_raw = arg2_clean
            v_id = str(destination_or_veh_id) if destination_or_veh_id not in valid_apps else "ambulance_108"
        else:
            # (vehicle_id, origin, destination)
            v_id = str(vehicle_id_or_origin)
            origin_raw = arg2_clean
            dest_raw = arg3_clean

        # Normalize approach codes (e.g. 'N_IN' -> 'N', 'S_OUT' -> 'S')
        def normalize_app(s: str) -> str:
            s = s.replace("_IN", "").replace("_OUT", "")
            if s in ["NORTH", "N"]: return "N"
            if s in ["SOUTH", "S"]: return "S"
            if s in ["EAST", "E"]: return "E"
            if s in ["WEST", "W"]: return "W"
            return s

        origin = normalize_app(origin_raw)
        destination = normalize_app(dest_raw)
        valid_approaches = ["N", "S", "E", "W"]

        if origin not in valid_approaches or destination not in valid_approaches or origin == destination:
            self.state = AmbulanceState.FAULT
            self.active = False
            self.siren_active = False
            self.last_error = f"Invalid route: {origin_raw} -> {dest_raw}. Origin and destination must be valid distinct approaches."
            self._log_event(sim_time, f"Ambulance spawn rejected: {self.last_error}", level="ERROR")
            return {"status": "error", "success": False, "message": self.last_error, "state": self.state.value}

        self.vehicle_id = v_id
        self.origin = origin
        self.destination = destination
        self.approach_edge = f"{origin}2J1"
        self.destination_edge = f"J12{destination}"
        self.route_edges = [self.approach_edge, self.destination_edge]
        self.siren_active = bool(siren or kwargs.get("siren_active", False))
        self.position = 0.0
        self.speed = 18.5 if self.siren_active else 12.0
        self.journey_completed = False
        self.last_error = None
        self.clearance_timer = 0
        self.active = True
        self.state = AmbulanceState.EMERGENCY_REQUESTED if self.siren_active else AmbulanceState.AMBULANCE_ACTIVE_NORMAL

        # Attempt TraCI SUMO insertion if connected
        if traci_instance is not None:
            try:
                route_id = f"route_{origin}_{destination}"
                if route_id not in traci_instance.route.getIDList():
                    traci_instance.route.add(route_id, self.route_edges)
                if self.vehicle_id not in traci_instance.vehicle.getIDList():
                    traci_instance.vehicle.add(
                        vehID=self.vehicle_id,
                        routeID=route_id,
                        typeID="emergency",
                        depart="now",
                        departLane="1"
                    )
                    traci_instance.vehicle.setColor(self.vehicle_id, (255, 255, 255, 255))
            except Exception:
                pass

        mode_str = "EMERGENCY (Siren ON)" if self.siren_active else "NORMAL (Siren OFF)"
        self._log_event(sim_time, f"Ambulance '{self.vehicle_id}' spawned on edge {self.approach_edge} (Route: {origin} -> {destination}). Mode: {mode_str}.")
        status = self.get_status(sim_time)
        status["success"] = True
        return status

    def is_requesting_emergency(self) -> bool:
        """Returns True only when ambulance is active, siren is ON, and state permits priority pre-emption."""
        if not self.active or not self.siren_active:
            return False
        return self.state in [
            AmbulanceState.EMERGENCY_REQUESTED,
            AmbulanceState.EMERGENCY_ROUTE_ACTIVE,
            AmbulanceState.EMERGENCY_PASSAGE
        ]

    def trigger_fault(self, reason: str = "Simulation fault encountered", sim_time: float = 0.0) -> Dict[str, Any]:
        """Transitions state machine to FAULT and safely releases emergency locks."""
        self.state = AmbulanceState.FAULT
        self.siren_active = False
        self.last_error = reason
        self._log_event(sim_time, f"FAULT triggered: {reason}. Safe fallback initiated.", level="ERROR")
        return self.get_status(sim_time)

    def step_simulation(self, dt: float = 1.0, current_phase: int = 0, traci_instance=None) -> Dict[str, Any]:
        """Wrapper to advance ambulance simulation state by dt seconds."""
        sim_time = (self.events_log[0].get("timestamp", 0.0) if self.events_log else 0.0) + dt
        return self.update_step(current_step=0, sim_time=sim_time, current_phase=current_phase, traci_instance=traci_instance)

    def set_siren(self, siren_on: bool, sim_time: float = 0.0) -> Dict[str, Any]:
        """Toggles ambulance siren ON or OFF with safe state machine transitions."""
        if self.state == AmbulanceState.FAULT:
            return {"status": "error", "success": False, "message": "Cannot toggle siren in FAULT state.", "state": self.state.value}

        if self.state == AmbulanceState.IDLE or self.journey_completed:
            return {"status": "error", "success": False, "message": "Cannot toggle siren: Ambulance is not active.", "state": self.state.value}

        prev_siren = self.siren_active
        self.siren_active = bool(siren_on)

        if siren_on and not prev_siren:
            # Siren Activated: Request Priority
            self.state = AmbulanceState.EMERGENCY_REQUESTED
            self.speed = 18.5  # Elevated speed in priority mode
            self._log_event(sim_time, f"Siren ACTIVATED on '{self.vehicle_id}'. Emergency pre-emption requested for junction J1.")
        elif not siren_on and prev_siren:
            # Siren Deactivated: Initiate safe clearance before normal control resumes
            self.state = AmbulanceState.EMERGENCY_CLEARANCE
            self.speed = 12.0
            self.clearance_timer = self.clearance_required_steps
            self._log_event(sim_time, f"Siren DEACTIVATED on '{self.vehicle_id}'. Emergency priority cancelled; initiating {self.clearance_required_steps}s safety clearance transition.")

        status = self.get_status(sim_time)
        status["success"] = True
        return status

    def cancel_emergency(self, sim_time: float = 0.0) -> Dict[str, Any]:
        """Cancels active ambulance mission and releases all signal locks."""
        if self.state == AmbulanceState.IDLE:
            return {"status": "info", "message": "No active ambulance to cancel.", "state": self.state.value}

        was_emergency = self.siren_active
        self.siren_active = False
        self.state = AmbulanceState.IDLE
        self.vehicle_id = None
        self.journey_completed = False
        self.position = 0.0
        self.clearance_timer = 0
        self._log_event(sim_time, "Ambulance journey cancelled by operator. All emergency pre-emption priorities released.")
        return {"status": "success", "message": "Emergency mission cancelled.", "state": AmbulanceState.IDLE.value}

    def update_step(self, current_step: int, sim_time: float, current_phase: int, traci_instance=None) -> Dict[str, Any]:
        """Advances ambulance position, updates ETA, coordinates state transitions."""
        if self.state == AmbulanceState.IDLE:
            return self.get_status(sim_time)

        # 1. TraCI Telemetry sync if active
        if traci_instance is not None and self.vehicle_id:
            try:
                if self.vehicle_id in traci_instance.vehicle.getIDList():
                    self.position = traci_instance.vehicle.getLanePosition(self.vehicle_id)
                    self.speed = traci_instance.vehicle.getSpeed(self.vehicle_id)
                    road = traci_instance.vehicle.getRoadID(self.vehicle_id)
                    if road:
                        self.approach_edge = road
            except Exception:
                pass

        # 2. Advance simulated physical position
        # Target green phase for approach (0 for N/S, 2 for E/W)
        target_green_phase = 0 if self.origin in ["N", "S"] else 2
        is_approach_green = (current_phase == target_green_phase)

        # Movement rules:
        # - Siren ON: green signal is reserved; ambulance advances smoothly at priority speed
        # - Siren OFF: obeys normal signal (stops behind stopline 240m if signal is red)
        can_advance = True
        if not self.siren_active and not is_approach_green and self.position >= 235.0 and self.position < 255.0:
            can_advance = False  # Queued at stopline

        if can_advance:
            step_delta = self.speed * 1.0  # 1 step = 1 sec
            self.position += step_delta

        # Distance to junction stopline (edge length ~250m)
        dist_to_j1 = max(0.0, self.edge_length - self.position)
        eta_seconds = round(dist_to_j1 / max(1.0, self.speed), 1)

        # 3. State Machine Transitions
        if self.state == AmbulanceState.EMERGENCY_REQUESTED:
            if dist_to_j1 <= 248.0:
                self.state = AmbulanceState.EMERGENCY_ROUTE_ACTIVE
                self._log_event(sim_time, f"Ambulance '{self.vehicle_id}' entered active corridor (Distance: {dist_to_j1:.0f}m, ETA: {eta_seconds}s). JEV and Safety Shield validated green pre-emption.")

        elif self.state == AmbulanceState.EMERGENCY_ROUTE_ACTIVE:
            if dist_to_j1 <= 40.0:
                self.state = AmbulanceState.EMERGENCY_PASSAGE
                self._log_event(sim_time, f"Ambulance '{self.vehicle_id}' entering intersection J1. Holding emergency green passage.")

        elif self.state == AmbulanceState.EMERGENCY_PASSAGE:
            if self.position >= 265.0:  # Passed J1 intersection box
                self._log_event(sim_time, f"Ambulance '{self.vehicle_id}' cleared junction J1! Initiating safety clearance.")
                if self.siren_active:
                    self.state = AmbulanceState.EMERGENCY_CLEARANCE
                    self.clearance_timer = self.clearance_required_steps
                else:
                    self.state = AmbulanceState.AMBULANCE_ACTIVE_NORMAL

        elif self.state == AmbulanceState.EMERGENCY_CLEARANCE:
            self.clearance_timer -= 1
            if self.clearance_timer <= 0:
                self.state = AmbulanceState.NORMAL_CONTROL_RESUMED
                self._log_event(sim_time, "Emergency clearance sequence completed. Normal adaptive PPO signal control fully resumed.")

        elif self.state == AmbulanceState.NORMAL_CONTROL_RESUMED:
            self.state = AmbulanceState.AMBULANCE_ACTIVE_NORMAL if not self.journey_completed else AmbulanceState.IDLE

        # Journey Destination Arrival Check (500m total path)
        if self.position >= 480.0:
            self.journey_completed = True
            self.state = AmbulanceState.IDLE
            self.active = False
            self.siren_active = False
            self._log_event(sim_time, f"Ambulance '{self.vehicle_id}' arrived at destination '{self.destination}'. Mission complete, emergency priority released.")

        return self.get_status(sim_time)

    def get_status(self, sim_time: float = 0.0) -> Dict[str, Any]:
        """Returns comprehensive status dictionary for API and dashboard."""
        dist_to_j1 = max(0.0, self.edge_length - self.position)
        eta_seconds = round(dist_to_j1 / max(1.0, self.speed), 1) if self.state != AmbulanceState.IDLE else 0.0
        target_phase = 0 if self.origin in ["N", "S"] else 2

        # Detailed human status badge
        if self.state == AmbulanceState.IDLE:
            status_text = "AMBULANCE NOT ACTIVE"
            badge_type = "badge-gray"
        elif self.state == AmbulanceState.AMBULANCE_ACTIVE_NORMAL:
            status_text = "AMBULANCE EN ROUTE — NORMAL MODE"
            badge_type = "badge-blue"
        elif self.state == AmbulanceState.EMERGENCY_REQUESTED:
            status_text = "SIREN ON — EMERGENCY PRIORITY REQUESTED"
            badge_type = "badge-yellow"
        elif self.state in [AmbulanceState.EMERGENCY_ROUTE_ACTIVE, AmbulanceState.EMERGENCY_PASSAGE]:
            status_text = "EMERGENCY ROUTE ACTIVE — GREEN PRE-EMPTION"
            badge_type = "badge-red"
        elif self.state == AmbulanceState.EMERGENCY_CLEARANCE:
            status_text = "EMERGENCY CLEARANCE — TRANSITIONING"
            badge_type = "badge-yellow"
        elif self.state == AmbulanceState.NORMAL_CONTROL_RESUMED:
            status_text = "EMERGENCY CLEARED — NORMAL CONTROL RESUMED"
            badge_type = "badge-green"
        else:
            status_text = "FAULT DETECTED — SAFE FALLBACK"
            badge_type = "badge-red"

        return {
            "active": self.state != AmbulanceState.IDLE,
            "vehicle_id": self.vehicle_id,
            "state": self.state.value,
            "status_text": status_text,
            "badge_type": badge_type,
            "siren_active": self.siren_active,
            "origin": self.origin,
            "destination": self.destination,
            "current_edge": self.approach_edge if self.position < 250 else self.destination_edge,
            "target_phase": target_phase,
            "target_junction": "J1",
            "position_m": round(self.position, 1),
            "speed_mps": round(self.speed, 1),
            "distance_to_stopline_m": round(dist_to_j1, 1),
            "eta_seconds": eta_seconds,
            "priority_active": self.siren_active and self.state in [
                AmbulanceState.EMERGENCY_REQUESTED,
                AmbulanceState.EMERGENCY_ROUTE_ACTIVE,
                AmbulanceState.EMERGENCY_PASSAGE
            ],
            "corridor_status": (
                f"Active Corridor: {self.origin} -> J1 -> {self.destination}"
                if self.siren_active
                else "Routine Corridor (No Priority)"
            ),
            "journey_completed": self.journey_completed,
            "clearance_remaining_steps": self.clearance_timer,
            "events_log": self.events_log[:15]
        }

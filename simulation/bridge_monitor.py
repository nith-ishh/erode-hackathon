"""
Bridge Structural Capacity & Overload Early Warning Monitor
Monitors live vehicular live-load / PCU density on critical bridges (e.g., Cauvery River Bridge, Erode).
When capacity approaches or exceeds safety limits, automatically dispatches urgent warnings
to nearby traffic police patrols / municipal authorities, and triggers adaptive signal metering.
"""

import time
from typing import Dict, Any, Optional

class BridgeOverloadMonitor:
    def __init__(
        self,
        bridge_id: str = "B1_CAUVERY",
        bridge_name: str = "Cauvery River Bridge (Erode - Pallipalayam Corridor)",
        safe_capacity_pcu: float = 45.0,
        critical_capacity_pcu: float = 55.0,
        length_meters: float = 420.0
    ):
        self.bridge_id = bridge_id
        self.bridge_name = bridge_name
        self.safe_capacity_pcu = safe_capacity_pcu
        self.critical_capacity_pcu = critical_capacity_pcu
        self.length_meters = length_meters
        
        # Authority & Police Dispatch Settings
        self.police_post = "Cauvery Bridge Traffic Police Outpost (Unit-4)"
        self.officer_in_charge = "Special Sub-Inspector S. Murugesan (Badge #TN-ERD-412)"
        self.control_room = "Erode Central Traffic Police Control Room (VHF Ch. 7)"
        self.hotline = "+91 424 222 3400"
        
        # State
        self.current_load_pcu = 18.5
        self.injected_surge = 0.0
        self.alert_active = False
        self.alert_level = "NORMAL"  # NORMAL, WARNING, CRITICAL_OVERLOAD
        self.last_alert_time: Optional[float] = None
        self.alert_count = 0
        self.downstream_evacuation_priority = False
        self.upstream_metering_active = False

    def trigger_surge(self, amount: float = 22.0) -> Dict[str, Any]:
        """Manually inject heavy vehicular surge on the bridge for simulation/demonstration."""
        self.injected_surge = max(0.0, self.injected_surge + amount)
        return {
            "status": "success",
            "message": f"Injected +{amount:.1f} PCU traffic surge onto {self.bridge_name}",
            "current_surge": self.injected_surge
        }

    def clear_bridge(self) -> Dict[str, Any]:
        """Clear traffic congestion and reset bridge load to baseline free-flow."""
        self.injected_surge = 0.0
        self.current_load_pcu = 15.0
        self.alert_active = False
        self.alert_level = "NORMAL"
        self.downstream_evacuation_priority = False
        self.upstream_metering_active = False
        return {
            "status": "success",
            "message": f"Bridge corridor evacuated. Structural load normalized."
        }

    def update(self, step: int, approaches: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculates live bridge load based on North approach queue + live surge,
        evaluates safety limits, and raises police alerts when threshold is exceeded.
        """
        # North approach directly connects to Cauvery Bridge in Erode network
        north_queue = approaches.get("N", {}).get("pcu_queue", 8.0)
        north_vehicles = approaches.get("N", {}).get("vehicle_count", 6)
        
        # Calculate dynamic bridge PCU load (baseline traffic + queue spillback + surge)
        baseline_load = 12.0 + (north_queue * 1.4) + (north_vehicles * 0.8)
        self.current_load_pcu = round(baseline_load + self.injected_surge, 1)
        
        # Gradually dissipate manual surge if vehicles are moving
        if self.injected_surge > 0:
            self.injected_surge = max(0.0, round(self.injected_surge - 0.4, 2))
            
        load_pct = round((self.current_load_pcu / self.safe_capacity_pcu) * 100.0, 1)
        
        # Evaluate alert thresholds
        if load_pct >= 95.0 or self.current_load_pcu >= self.safe_capacity_pcu:
            self.alert_level = "CRITICAL_OVERLOAD"
            self.alert_active = True
            self.downstream_evacuation_priority = True
            self.upstream_metering_active = True
            if self.last_alert_time is None:
                self.last_alert_time = time.time()
                self.alert_count += 1
        elif load_pct >= 75.0:
            self.alert_level = "WARNING"
            self.alert_active = True
            self.downstream_evacuation_priority = True
            self.upstream_metering_active = False
            if self.last_alert_time is None:
                self.last_alert_time = time.time()
                self.alert_count += 1
        else:
            self.alert_level = "NORMAL"
            self.alert_active = False
            self.downstream_evacuation_priority = False
            self.upstream_metering_active = False
            self.last_alert_time = None

        return self.get_status()

    def get_status(self) -> Dict[str, Any]:
        """Returns comprehensive bridge status, load metrics, and police dispatch payload."""
        load_pct = round((self.current_load_pcu / self.safe_capacity_pcu) * 100.0, 1)
        
        police_dispatch = None
        if self.alert_active:
            police_dispatch = {
                "alert_id": f"BRG-ALT-{self.bridge_id[-4:]}-{self.alert_count:04d}",
                "severity": "CRITICAL" if self.alert_level == "CRITICAL_OVERLOAD" else "HIGH_WARNING",
                "target_police_unit": self.police_post,
                "officer_on_duty": self.officer_in_charge,
                "control_room_notified": True,
                "hotline": self.hotline,
                "dispatch_message": (
                    f"URGENT: {self.bridge_name} capacity at {load_pct}% ({self.current_load_pcu}/{self.safe_capacity_pcu} PCU). "
                    f"Structural stress risk! Deploy patrol unit to meter Karungalpalayam entrance and clear J1 exit."
                ),
                "radio_channel": "VHF Channel 7 (Erode Traffic Police Net)",
                "recommended_action": (
                    "1. Dispatch traffic constable to bridge ingress ramp.\n"
                    "2. Divert multi-axle heavy commercial vehicles via Outer Ring Road.\n"
                    "3. Maintain priority green downstream on J1 to evacuate stalled queue."
                )
            }

        return {
            "bridge_id": self.bridge_id,
            "bridge_name": self.bridge_name,
            "length_meters": self.length_meters,
            "safe_capacity_pcu": self.safe_capacity_pcu,
            "critical_capacity_pcu": self.critical_capacity_pcu,
            "current_load_pcu": self.current_load_pcu,
            "load_percentage": load_pct,
            "alert_level": self.alert_level,
            "alert_active": self.alert_active,
            "police_post": self.police_post,
            "officer_in_charge": self.officer_in_charge,
            "police_dispatch": police_dispatch,
            "upstream_metering_active": self.upstream_metering_active,
            "downstream_evacuation_priority": self.downstream_evacuation_priority,
            "total_alerts_issued": self.alert_count
        }

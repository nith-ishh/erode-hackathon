"""
Smart No-Parking & Illegal Obstruction e-Challan & Billing Enforcement Engine
Detects vehicles parking in designated No-Parking zones or blocking travel lanes.
Calculates legal fines (Section 122/177 Motor Vehicles Act), generates electronic e-Challans,
dispatches SMS billing notices, and tracks clearance and revenue.
"""

import time
import random
from typing import Dict, Any, List, Optional

class NoParkingEnforcer:
    def __init__(self):
        self.designated_zones = {
            "NP_BROUGH_RD": {
                "name": "Brough Road Commercial Clearway",
                "approach": "W",
                "max_allowed_stop_sec": 10,
                "fine_amount": 1000.0,
                "towing_charge": 500.0
            },
            "NP_MANIKOONDU": {
                "name": "Manikoondu Clock Tower Junction Curb",
                "approach": "E",
                "max_allowed_stop_sec": 15,
                "fine_amount": 1000.0,
                "towing_charge": 500.0
            },
            "NP_CAUVERY_ENTRY": {
                "name": "Cauvery Bridge Approach Ingress Ramp",
                "approach": "N",
                "max_allowed_stop_sec": 5,
                "fine_amount": 1500.0,
                "towing_charge": 500.0
            }
        }
        
        # In-memory violation records
        self.active_violations: Dict[str, Dict[str, Any]] = {}
        self.challan_history: List[Dict[str, Any]] = []
        self.challan_counter = 1042
        
        # Revenue and impact statistics
        self.total_fines_billed = 0.0
        self.total_fines_collected = 0.0
        self.total_violations_detected = 0
        self.total_cleared = 0

    def trigger_illegal_parking(
        self,
        vehicle_plate: Optional[str] = None,
        vehicle_type: str = "car",
        zone_id: str = "NP_BROUGH_RD",
        owner_name: Optional[str] = None,
        owner_phone: Optional[str] = None
    ) -> Dict[str, Any]:
        """Manually or dynamically trigger an unauthorized parking obstruction."""
        if zone_id not in self.designated_zones:
            zone_id = "NP_BROUGH_RD"
            
        zone_info = self.designated_zones[zone_id]
        
        # Generate realistic Tamil Nadu vehicle registration plate if not provided
        if not vehicle_plate:
            series = random.choice(["AX", "BZ", "CB", "DM", "EP"])
            num = random.randint(1000, 9999)
            vehicle_plate = f"TN-33-{series}-{num}"
            
        if not owner_name:
            names = ["R. Karthikeyan", "S. Senthil Kumar", "M. Anitha", "P. Vijay Anand", "K. Saravanan"]
            owner_name = random.choice(names)
            
        if not owner_phone:
            owner_phone = f"+91 984{random.randint(10, 99)} {random.randint(10000, 99999)}"

        self.challan_counter += 1
        challan_id = f"CH-TN33-{time.strftime('%Y')}-{self.challan_counter:05d}"
        
        base_fine = zone_info["fine_amount"]
        towing_fee = zone_info["towing_charge"]
        total_fine = base_fine + towing_fee
        
        timestamp_str = time.strftime("%Y-%m-%d %H:%M:%S")
        
        sms_text = (
            f"TAMIL NADU POLICE e-CHALLAN: Vehicle {vehicle_plate} has been cited for "
            f"Illegal Parking & Traffic Choking at {zone_info['name']}. "
            f"Total Fine: Rs. {int(total_fine)} (Sec 122/177 M.V. Act). "
            f"Billed to owner: {owner_name}. Pay immediately via echallan.parivahan.gov.in (Challan ID: {challan_id})."
        )
        
        violation = {
            "challan_id": challan_id,
            "vehicle_plate": vehicle_plate,
            "vehicle_type": vehicle_type,
            "owner_name": owner_name,
            "owner_phone": owner_phone,
            "zone_id": zone_id,
            "zone_name": zone_info["name"],
            "approach": zone_info["approach"],
            "stopped_since_step": 0,
            "duration_seconds": 32,
            "base_fine": base_fine,
            "towing_fee": towing_fee,
            "total_fine": total_fine,
            "status": "BILLED_AND_DISPATCHED",
            "sms_dispatch_status": "SENT_VIA_SMS_GATEWAY",
            "sms_text": sms_text,
            "timestamp": timestamp_str,
            "traffic_impact": f"Reduced roadway capacity by 45%. Artificial PCU delay: +8.5s."
        }
        
        self.active_violations[challan_id] = violation
        self.challan_history.insert(0, violation)
        self.total_violations_detected += 1
        self.total_fines_billed += total_fine
        
        return {
            "status": "success",
            "message": f"e-Challan {challan_id} issued and billed to {vehicle_plate} at {zone_info['name']}.",
            "violation": violation
        }

    def clear_violation(self, challan_id: str) -> Dict[str, Any]:
        """Tows or moves the vehicle, clearing the lane bottleneck."""
        if challan_id in self.active_violations:
            violation = self.active_violations.pop(challan_id)
            violation["status"] = "OBSTRUCTION_CLEARED_TOWED"
            self.total_cleared += 1
            return {
                "status": "success",
                "message": f"Obstruction {challan_id} cleared by Erode Traffic Tow Unit. Travel lane restored.",
                "challan_id": challan_id
            }
        return {"status": "error", "message": f"Violation {challan_id} not found."}

    def pay_challan(self, challan_id: str) -> Dict[str, Any]:
        """Simulate offender paying the e-challan fine online."""
        for rec in self.challan_history:
            if rec["challan_id"] == challan_id:
                if rec.get("payment_status") != "PAID":
                    rec["payment_status"] = "PAID"
                    rec["status"] = "PAID_ONLINE"
                    self.total_fines_collected += rec["total_fine"]
                    return {
                        "status": "success",
                        "message": f"Challan {challan_id} marked as PAID. Receipt issued.",
                        "challan": rec
                    }
                else:
                    return {"status": "info", "message": f"Challan {challan_id} is already paid."}
        return {"status": "error", "message": f"Challan {challan_id} not found."}

    def update(self, step: int, approaches: Dict[str, Any]) -> Dict[str, Any]:
        """Update active parking violations duration & increment time."""
        for challan_id, viol in list(self.active_violations.items()):
            viol["duration_seconds"] += 1
            
        return self.get_status()

    def get_status(self) -> Dict[str, Any]:
        """Returns live active violations, summary statistics, and recent challan log."""
        return {
            "active_violations_count": len(self.active_violations),
            "active_violations": list(self.active_violations.values()),
            "recent_challans": self.challan_history[:15],
            "total_violations_detected": self.total_violations_detected,
            "total_cleared": self.total_cleared,
            "total_fines_billed": self.total_fines_billed,
            "total_fines_collected": self.total_fines_collected,
            "zones": list(self.designated_zones.values())
        }

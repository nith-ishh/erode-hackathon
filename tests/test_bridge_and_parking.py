"""
Unit Tests for Bridge Capacity Early Warning & Smart No-Parking e-Challan Systems
Verifies structural safety limits, automated police alerts, e-Challan generation,
fine calculations under Motor Vehicles Act, and revenue billing.
"""

import unittest
from simulation.bridge_monitor import BridgeOverloadMonitor
from simulation.no_parking_enforcer import NoParkingEnforcer

class TestBridgeOverloadMonitor(unittest.TestCase):
    def setUp(self):
        self.monitor = BridgeOverloadMonitor(
            bridge_id="B1_CAUVERY",
            safe_capacity_pcu=45.0,
            critical_capacity_pcu=55.0
        )

    def test_baseline_and_normal_load(self):
        approaches = {"N": {"pcu_queue": 2.0, "vehicle_count": 3}}
        status = self.monitor.update(step=1, approaches=approaches)
        self.assertEqual(status["bridge_id"], "B1_CAUVERY")
        self.assertEqual(status["alert_level"], "NORMAL")
        self.assertFalse(status["alert_active"])
        self.assertIsNone(status["police_dispatch"])

    def test_warning_threshold_and_police_alert(self):
        # Trigger surge to push bridge into warning range (>= 75%)
        self.monitor.trigger_surge(amount=18.0)
        approaches = {"N": {"pcu_queue": 10.0, "vehicle_count": 8}}
        status = self.monitor.update(step=5, approaches=approaches)
        
        self.assertTrue(status["load_percentage"] >= 75.0)
        self.assertIn(status["alert_level"], ["WARNING", "CRITICAL_OVERLOAD"])
        self.assertTrue(status["alert_active"])
        self.assertIsNotNone(status["police_dispatch"])
        self.assertIn("Cauvery Bridge", status["police_dispatch"]["target_police_unit"])
        self.assertTrue(status["downstream_evacuation_priority"])

    def test_critical_overload_and_metering(self):
        # Severe surge exceeding safe capacity
        self.monitor.trigger_surge(amount=35.0)
        approaches = {"N": {"pcu_queue": 15.0, "vehicle_count": 10}}
        status = self.monitor.update(step=10, approaches=approaches)
        
        self.assertEqual(status["alert_level"], "CRITICAL_OVERLOAD")
        self.assertTrue(status["upstream_metering_active"])
        self.assertTrue(status["downstream_evacuation_priority"])
        self.assertEqual(status["police_dispatch"]["severity"], "CRITICAL")
        self.assertIn("Murugesan", status["police_dispatch"]["officer_on_duty"])

    def test_clear_bridge(self):
        self.monitor.trigger_surge(amount=30.0)
        self.monitor.update(step=12, approaches={"N": {"pcu_queue": 10.0, "vehicle_count": 6}})
        self.assertTrue(self.monitor.alert_active)
        
        clear_res = self.monitor.clear_bridge()
        self.assertEqual(clear_res["status"], "success")
        self.assertFalse(self.monitor.alert_active)
        self.assertEqual(self.monitor.alert_level, "NORMAL")


class TestNoParkingEnforcer(unittest.TestCase):
    def setUp(self):
        self.enforcer = NoParkingEnforcer()

    def test_trigger_violation_and_echallan_generation(self):
        res = self.enforcer.trigger_illegal_parking(
            vehicle_plate="TN-33-AX-8912",
            vehicle_type="car",
            zone_id="NP_BROUGH_RD",
            owner_name="R. Karthikeyan"
        )
        self.assertEqual(res["status"], "success")
        viol = res["violation"]
        self.assertEqual(viol["vehicle_plate"], "TN-33-AX-8912")
        self.assertEqual(viol["owner_name"], "R. Karthikeyan")
        self.assertTrue(viol["challan_id"].startswith("CH-TN33-"))
        self.assertEqual(viol["total_fine"], 1500.0)  # 1000 fine + 500 towing
        self.assertIn("echallan.parivahan.gov.in", viol["sms_text"])

    def test_clear_violation_towing(self):
        res = self.enforcer.trigger_illegal_parking(vehicle_plate="TN-33-BZ-4501", zone_id="NP_MANIKOONDU")
        challan_id = res["violation"]["challan_id"]
        self.assertIn(challan_id, self.enforcer.active_violations)
        
        clear_res = self.enforcer.clear_violation(challan_id=challan_id)
        self.assertEqual(clear_res["status"], "success")
        self.assertNotIn(challan_id, self.enforcer.active_violations)
        self.assertEqual(self.enforcer.total_cleared, 1)

    def test_pay_challan(self):
        res = self.enforcer.trigger_illegal_parking(vehicle_plate="TN-33-EP-9999", zone_id="NP_BROUGH_RD")
        challan_id = res["violation"]["challan_id"]
        
        pay_res = self.enforcer.pay_challan(challan_id=challan_id)
        self.assertEqual(pay_res["status"], "success")
        self.assertEqual(self.enforcer.total_fines_collected, 1500.0)

    def test_get_status_summary(self):
        self.enforcer.trigger_illegal_parking(zone_id="NP_BROUGH_RD")
        self.enforcer.trigger_illegal_parking(zone_id="NP_CAUVERY_ENTRY")
        status = self.enforcer.get_status()
        self.assertEqual(status["active_violations_count"], 2)
        self.assertEqual(len(status["recent_challans"]), 2)
        self.assertTrue(status["total_fines_billed"] >= 3000.0)


if __name__ == "__main__":
    unittest.main()

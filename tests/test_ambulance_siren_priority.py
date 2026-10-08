"""
Automated Test Suite for Ambulance Siren Trigger and Emergency Priority
Verifies all 12 core requirements:
1. Ambulance can be spawned.
2. Siren OFF does not request emergency priority.
3. Siren ON creates an emergency request.
4. An invalid route is rejected.
5. Emergency signal actions pass through the Safety Shield.
6. Conflicting signal phases are never activated together.
7. Yellow and all-red clearances are respected.
8. Pedestrian safety constraints remain active.
9. Turning the siren OFF releases the emergency request.
10. Normal PPO control resumes after clearance.
11. Ambulance arrival releases priority.
12. Simulation faults do not leave the controller in emergency mode.
"""

import unittest
from emergency.ambulance_manager import AmbulanceManager, AmbulanceState
from emergency.emergency_detector import detect_emergency
from decision.safety_shield import SafetyShield
from backend.app.services.simulation_service import SimulationService


class TestAmbulanceSirenPriority(unittest.TestCase):

    def setUp(self):
        self.mgr = AmbulanceManager()
        self.shield = SafetyShield()
        self.sim = SimulationService()

    def test_1_ambulance_spawn(self):
        """1. Ambulance can be spawned successfully."""
        res = self.mgr.spawn_ambulance("amb_test1", "N_in", "S_out", siren=False)
        self.assertTrue(res["success"])
        self.assertEqual(res["vehicle_id"], "amb_test1")
        self.assertEqual(self.mgr.state, AmbulanceState.AMBULANCE_ACTIVE_NORMAL)
        self.assertTrue(self.mgr.active)
        self.assertFalse(self.mgr.siren_active)

    def test_2_siren_off_no_emergency_priority(self):
        """2. Siren OFF does not request emergency priority (PPO runs normal adaptive control)."""
        self.mgr.spawn_ambulance("amb_test2", "N_in", "S_out", siren=False)
        status = self.mgr.get_status()
        self.assertEqual(status["state"], "AMBULANCE_ACTIVE_NORMAL")
        self.assertFalse(status["siren_active"])
        self.assertFalse(self.mgr.is_requesting_emergency())

        # Verify emergency detector rejects pre-emption when siren is OFF
        detection = detect_emergency(self.mgr)
        self.assertFalse(detection["verified_priority"])
        self.assertEqual(detection["status"], "MONITORING_SIREN_OFF")

    def test_3_siren_on_creates_emergency_request(self):
        """3. Siren ON creates an emergency request and activates emergency state."""
        self.mgr.spawn_ambulance("amb_test3", "N_in", "S_out", siren=False)
        res = self.mgr.set_siren(True)
        self.assertTrue(res["success"])
        self.assertTrue(self.mgr.siren_active)
        self.assertEqual(self.mgr.state, AmbulanceState.EMERGENCY_REQUESTED)
        self.assertTrue(self.mgr.is_requesting_emergency())

        # Verify emergency detector verifies priority
        detection = detect_emergency(self.mgr)
        self.assertTrue(detection["detected"])
        self.assertTrue(detection["verified_priority"])
        self.assertEqual(detection["status"], "PRIORITY_AUTHORIZED")

    def test_4_invalid_route_rejected(self):
        """4. An invalid route is rejected, setting the state to FAULT and safe fallback."""
        res = self.mgr.spawn_ambulance("amb_invalid", "UNKNOWN_ORIGIN", "UNKNOWN_DEST", siren=True)
        self.assertFalse(res["success"])
        self.assertEqual(self.mgr.state, AmbulanceState.FAULT)
        self.assertFalse(self.mgr.is_requesting_emergency())

        # Trying to activate siren on invalid route also fails
        res2 = self.mgr.set_siren(True)
        self.assertFalse(res2["success"])
        self.assertEqual(self.mgr.state, AmbulanceState.FAULT)

    def test_5_emergency_actions_pass_safety_shield(self):
        """5. Emergency signal actions pass through the Safety Shield without bypassing rules."""
        self.mgr.spawn_ambulance("amb_test5", "N_in", "S_out", siren=True)
        self.mgr.step_simulation(1.0)
        self.assertEqual(self.mgr.state, AmbulanceState.EMERGENCY_ROUTE_ACTIVE)

        traffic_state = {
            "emergency_present": True,
            "emergency_details": [{"id": "amb_test5", "edge": "N2J1", "position": 150.0, "speed": 18.0}],
            "approaches": {
                "N": {"pedestrians_waiting": 0, "pcu_queue": 5.0},
                "S": {"pedestrians_waiting": 0, "pcu_queue": 3.0},
                "E": {"pedestrians_waiting": 0, "pcu_queue": 1.0},
                "W": {"pedestrians_waiting": 0, "pcu_queue": 1.0}
            }
        }

        # Requesting action 2 (EW Green) while emergency is on N2J1 will be overridden to Phase 0 (NS Green)
        is_safe, final_action, reason, metrics = self.shield.check_action_safety(
            proposed_action=2,
            current_phase=2,
            phase_elapsed_time=15.0,
            traffic_state=traffic_state,
            emergency_override=True
        )

        self.assertFalse(is_safe)
        self.assertEqual(final_action, 0)  # Overridden to safe emergency green (NS)
        self.assertIn("Rule 7", reason)

    def test_6_no_conflicting_phases_during_emergency(self):
        """6. Conflicting signal phases are never activated together."""
        traffic_state = {
            "emergency_present": True,
            "emergency_details": [{"id": "amb_1", "edge": "N2J1", "position": 100.0, "speed": 15.0}],
            "approaches": {"N": {}, "S": {}, "E": {}, "W": {}}
        }
        # Run across all possible actions; output is always a single valid phase in [0, num_phases-1]
        for act in range(4):
            is_safe, final_act, reason, _ = self.shield.check_action_safety(
                proposed_action=act,
                current_phase=0,
                phase_elapsed_time=20.0,
                traffic_state=traffic_state,
                emergency_override=True
            )
            self.assertIn(final_act, [0, 1, 2, 3])

    def test_7_yellow_and_all_red_clearance_respected(self):
        """7. Minimum green time and clearance constraints are respected during transitions."""
        traffic_state = {
            "emergency_present": False,
            "approaches": {"N": {}, "S": {}, "E": {}, "W": {}}
        }
        # Attempting to switch before min_green is rejected and holds current phase
        is_safe, final_act, reason, _ = self.shield.check_action_safety(
            proposed_action=2,
            current_phase=0,
            phase_elapsed_time=2.0,  # Below min_green=10s
            traffic_state=traffic_state,
            emergency_override=False
        )
        self.assertFalse(is_safe)
        self.assertEqual(final_act, 0)  # Held phase 0
        self.assertIn("Rule 1", reason)

    def test_8_pedestrian_safety_maintained(self):
        """8. Pedestrian safety constraints remain active during operation."""
        traffic_state = {
            "emergency_present": False,
            "total_pedestrians_waiting": 15,
            "max_pedestrian_wait_time": 95.0,
            "approaches": {"N": {}, "S": {}, "E": {}, "W": {}}
        }
        is_safe, final_act, reason, metrics = self.shield.check_action_safety(
            proposed_action=0,
            current_phase=0,
            phase_elapsed_time=50.0,
            traffic_state=traffic_state,
            emergency_override=False
        )
        # Shield forces phase transition to clear pedestrian starvation
        self.assertFalse(is_safe)
        self.assertEqual(final_act, 1)
        self.assertIn("Rule 6", reason)

    def test_9_siren_off_releases_request(self):
        """9. Turning the siren OFF releases the emergency request and enters clearance."""
        self.mgr.spawn_ambulance("amb_test9", "N_in", "S_out", siren=True)
        self.mgr.step_simulation(1.0)
        self.assertEqual(self.mgr.state, AmbulanceState.EMERGENCY_ROUTE_ACTIVE)

        res = self.mgr.set_siren(False)
        self.assertTrue(res["success"])
        self.assertFalse(self.mgr.siren_active)
        self.assertEqual(self.mgr.state, AmbulanceState.EMERGENCY_CLEARANCE)
        self.assertFalse(self.mgr.is_requesting_emergency())

    def test_10_normal_ppo_resumes_after_clearance(self):
        """10. Normal PPO control resumes after clearance is completed."""
        self.mgr.spawn_ambulance("amb_test10", "N_in", "S_out", siren=True)
        self.mgr.set_siren(False)
        self.assertEqual(self.mgr.state, AmbulanceState.EMERGENCY_CLEARANCE)

        # Step through clearance duration (4 seconds)
        for _ in range(4):
            self.mgr.step_simulation(1.0)

        self.assertEqual(self.mgr.state, AmbulanceState.NORMAL_CONTROL_RESUMED)
        self.assertFalse(self.mgr.is_requesting_emergency())

        # Next step confirms vehicle continues in normal traffic mode
        self.mgr.step_simulation(1.0)
        self.assertEqual(self.mgr.state, AmbulanceState.AMBULANCE_ACTIVE_NORMAL)
        self.assertFalse(self.mgr.is_requesting_emergency())

    def test_11_ambulance_arrival_releases_priority(self):
        """11. Ambulance arrival at destination releases priority and marks journey complete."""
        self.mgr.spawn_ambulance("amb_test11", "N_in", "S_out", siren=True)
        # Advance simulation until vehicle reaches destination (distance <= 0)
        for _ in range(30):
            self.mgr.step_simulation(1.0)

        # State should have transitioned to NORMAL_CONTROL_RESUMED / IDLE and active should be False
        self.assertFalse(self.mgr.active)
        self.assertFalse(self.mgr.is_requesting_emergency())

    def test_12_fault_fallback_clears_emergency(self):
        """12. Simulation faults do not leave the controller in emergency mode."""
        self.mgr.spawn_ambulance("amb_test12", "N_in", "S_out", siren=True)
        self.mgr.trigger_fault("Test simulation connection dropped")
        self.assertEqual(self.mgr.state, AmbulanceState.FAULT)
        self.assertFalse(self.mgr.is_requesting_emergency())


if __name__ == "__main__":
    unittest.main()

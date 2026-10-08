"""
Dedicated Member 4 Full-Stack & Impact Dashboard Test Suite
Tests Counterfactual Twin Comparison, Empirical Metrics Math, SQLite Database, and Backend REST/WebSocket Endpoints.
"""

import unittest
import sys
import os
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from counterfactual.comparison import CounterfactualTwinRunner
from counterfactual.metrics import MetricsCalculator
from backend.app.database.db import TrafficDatabase
from backend.app.services.simulation_service import SimulationService

class TestMember4FullStack(unittest.TestCase):
    def setUp(self):
        self.twin_runner = CounterfactualTwinRunner()
        self.metrics_calc = MetricsCalculator()
        self.test_db_path = BASE_DIR / "backend" / "app" / "database" / "test_traffic.db"
        self.db = TrafficDatabase(db_path=str(self.test_db_path))

    def tearDown(self):
        if self.test_db_path.exists():
            try:
                os.remove(self.test_db_path)
            except Exception:
                pass

    def test_1_counterfactual_comparison_execution(self):
        """Counterfactual twin runs side-by-side simulation and produces valid comparisons."""
        res = self.twin_runner.compare(steps=50, seed=42)
        self.assertIn("ai_metrics", res)
        self.assertIn("baseline_metrics", res)
        self.assertIn("improvements", res)
        
        # Verify improvement structure
        imp = res["improvements"]
        self.assertIn("delay_reduction_pct", imp)
        self.assertIn("queue_reduction_pct", imp)
        self.assertIn("emergency_time_saved_pct", imp)
        self.assertGreater(imp["delay_reduction_pct"], 0)

    def test_2_metrics_math_accuracy(self):
        """Metrics calculator computes delay reduction, queue reduction, and throughput accurately."""
        ai_data = {
            "avg_delay_s": 20.0,
            "avg_queue_pcu": 10.0,
            "throughput_veh": 500,
            "avg_pedestrian_wait_s": 15.0,
            "emergency_travel_time_s": 35.0
        }
        base_data = {
            "avg_delay_s": 30.0,
            "avg_queue_pcu": 16.0,
            "throughput_veh": 400,
            "avg_pedestrian_wait_s": 30.0,
            "emergency_travel_time_s": 70.0
        }

        res = self.metrics_calc.compare_runs(ai_data, base_data)
        imp = res["improvements"]
        # Delay: (30 - 20) / 30 = 33.3%
        self.assertAlmostEqual(imp["delay_reduction_pct"], 33.3, places=1)
        # Queue: (16 - 10) / 16 = 37.5%
        self.assertAlmostEqual(imp["queue_reduction_pct"], 37.5, places=1)
        # Emergency Time: (70 - 35) / 70 = 50.0%
        self.assertAlmostEqual(imp["emergency_time_saved_pct"], 50.0, places=1)

    def test_3_sqlite_database_logging_and_retrieval(self):
        """SQLite database records decisions and retrieves audit history."""
        sample_state = {"timestamp": 12.0, "total_pcu_queue": 15.0, "total_pcu_delay": 20.0}
        jev_res = {"jev_score": 0.98, "jev_notes": "Optimal alignment"}
        safety_res = (True, 0, "APPROVED", {})
        explanation = {"human_readable_explanation": "North-South extended due to queue load."}

        self.db.log_decision(
            scenario="normal",
            junction_id="J1",
            traffic_state=sample_state,
            ppo_action=0,
            jev_result=jev_res,
            safety_result=safety_res,
            final_action=0,
            explanation=explanation,
            fallback_status=False,
            emergency_status=False
        )

        decisions = self.db.get_recent_decisions(limit=10)
        self.assertEqual(len(decisions), 1)
        self.assertEqual(decisions[0]["scenario"], "normal")
        self.assertEqual(decisions[0]["final_action"], 0)
        self.assertEqual(decisions[0]["ppo_action"], 0)

    def test_4_simulation_service_step_pipeline(self):
        """Simulation service executes full step processing cleanly."""
        service = SimulationService()
        step_payload = service.process_step()
        self.assertIn("step", step_payload)
        self.assertIn("scenario", step_payload)
        self.assertIn("state", step_payload)
        self.assertIn("safety_shield", step_payload)
        self.assertIn("explanation", step_payload)

if __name__ == "__main__":
    unittest.main()

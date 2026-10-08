"""
SQLite Database Layer
Stores detailed decision audit logs, Safety Shield interventions, Break-It events,
and experiment metrics for reproducibility and explainability.
"""

import sqlite3
import json
import time
from pathlib import Path
from typing import Dict, Any, List, Optional

BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
sys_db_path = BASE_DIR / "backend" / "app" / "database" / "traffic.db"
sys_db_path.parent.mkdir(parents=True, exist_ok=True)

class TrafficDatabase:
    def __init__(self, db_path: Optional[str] = None):
        self.db_path = str(db_path) if db_path else str(sys_db_path)
        self.init_db()

    def get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS decision_logs (
                decision_id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp REAL,
                scenario TEXT,
                junction_id TEXT,
                traffic_state TEXT,
                pcu_state TEXT,
                ppo_action INTEGER,
                jev_result TEXT,
                safety_result TEXT,
                final_action INTEGER,
                explanation TEXT,
                fallback_status INTEGER,
                emergency_status INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            """)

            cursor.execute("""
            CREATE TABLE IF NOT EXISTS experiment_metrics (
                experiment_id INTEGER PRIMARY KEY AUTOINCREMENT,
                scenario TEXT,
                timestamp REAL,
                ai_metrics TEXT,
                baseline_metrics TEXT,
                improvements TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            """)
            conn.commit()

    def log_decision(
        self,
        scenario: str,
        junction_id: str,
        traffic_state: Dict[str, Any],
        ppo_action: int,
        jev_result: Dict[str, Any],
        safety_result: Any,
        final_action: int,
        explanation: Dict[str, Any],
        fallback_status: bool,
        emergency_status: bool
    ):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            pcu_state = {
                "total_pcu_queue": traffic_state.get("total_pcu_queue", 0.0),
                "total_pcu_delay": traffic_state.get("total_pcu_delay", 0.0),
            }

            cursor.execute("""
            INSERT INTO decision_logs (
                timestamp, scenario, junction_id, traffic_state, pcu_state,
                ppo_action, jev_result, safety_result, final_action,
                explanation, fallback_status, emergency_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                traffic_state.get("timestamp", time.time()),
                scenario,
                junction_id,
                json.dumps(traffic_state),
                json.dumps(pcu_state),
                ppo_action,
                json.dumps(jev_result),
                json.dumps(safety_result),
                final_action,
                json.dumps(explanation),
                1 if fallback_status else 0,
                1 if emergency_status else 0
            ))
            conn.commit()

    def get_recent_decisions(self, limit: int = 50) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM decision_logs ORDER BY decision_id DESC LIMIT ?", (limit,))
            rows = cursor.fetchall()
            results = []
            for r in rows:
                results.append({
                    "decision_id": r["decision_id"],
                    "timestamp": r["timestamp"],
                    "scenario": r["scenario"],
                    "junction_id": r["junction_id"],
                    "ppo_action": r["ppo_action"],
                    "final_action": r["final_action"],
                    "explanation": json.loads(r["explanation"]) if r["explanation"] else {},
                    "fallback_status": bool(r["fallback_status"]),
                    "emergency_status": bool(r["emergency_status"])
                })
            return results

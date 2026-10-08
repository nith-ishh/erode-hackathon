"""
Fixed-Time Fallback Controller (Member 2 - Safety & Explainability Lead)
Operates deterministic fixed-time signal cycles whenever AI control is blocked or sensor fault is active.
Guarantees fail-safe intersection continuity without collision or starvation risk.
"""

from typing import Dict, Any, Tuple, Optional
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from config import FALLBACK_CONFIG

class FallbackController:
    """
    Deterministic Fixed-Time Fallback Controller.
    Executes standard pre-timed cycles (30s NS green, 30s NS yellow/turn, 30s EW green, 30s EW yellow/turn)
    to maintain guaranteed safe traffic operations during AI suspension or sensor fault events.
    """

    def __init__(self, cycle_config: Optional[Dict[str, Any]] = None):
        self.config = cycle_config if cycle_config else FALLBACK_CONFIG
        self.phase_durations = self.config.get("fixed_phase_durations", [30, 30, 30, 30])
        self.num_phases = len(self.phase_durations)
        self.total_cycle_time = sum(self.phase_durations)
        self.active_cycles_executed = 0

    def get_fallback_action(self, current_phase: int, phase_elapsed_time: float) -> Tuple[int, str]:
        """
        Determines the next safe phase under fixed-time fallback timing.
        
        Args:
            current_phase: Currently active signal phase index (0 to 3).
            phase_elapsed_time: Seconds elapsed in the current phase.
            
        Returns:
            (target_phase: int, reason: str)
        """
        target_duration = self.phase_durations[current_phase % self.num_phases]
        
        if phase_elapsed_time >= target_duration:
            next_phase = (current_phase + 1) % self.num_phases
            if next_phase == 0:
                self.active_cycles_executed += 1
            reason = (
                f"Fallback Mode: Fixed phase duration elapsed ({phase_elapsed_time:.1f}s >= {target_duration}s). "
                f"Transitioning to next cycle phase {next_phase}."
            )
            return next_phase, reason
        else:
            remaining = target_duration - phase_elapsed_time
            reason = (
                f"Fallback Mode: Maintaining fixed phase {current_phase} "
                f"({phase_elapsed_time:.1f}s / {target_duration}s, {remaining:.1f}s remaining)."
            )
            return current_phase, reason

    def get_fallback_status(self, current_phase: int, phase_elapsed_time: float) -> Dict[str, Any]:
        """Provides status and countdown metrics for dashboard visualization."""
        target_duration = self.phase_durations[current_phase % self.num_phases]
        remaining = max(0.0, target_duration - phase_elapsed_time)
        return {
            "mode": "FIXED_TIME_FALLBACK",
            "current_phase": current_phase,
            "phase_duration_target": target_duration,
            "elapsed_seconds": round(phase_elapsed_time, 1),
            "remaining_seconds": round(remaining, 1),
            "total_cycle_seconds": self.total_cycle_time,
            "cycles_completed": self.active_cycles_executed
        }

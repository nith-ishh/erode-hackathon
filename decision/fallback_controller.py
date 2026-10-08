"""
Fixed-Time Fallback Controller
Operates standard fixed-time signal cycles when AI control is blocked or sensor fault is active.
"""

from typing import Dict, Any, Tuple
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from config import FALLBACK_CONFIG

class FallbackController:
    def __init__(self, cycle_config: Dict[str, Any] = None):
        self.config = cycle_config if cycle_config else FALLBACK_CONFIG
        self.phase_durations = self.config["fixed_phase_durations"]
        self.num_phases = len(self.phase_durations)

    def get_fallback_action(self, current_phase: int, phase_elapsed_time: float) -> Tuple[int, str]:
        """
        Determines the next safe phase under fixed-time fallback.
        """
        target_duration = self.phase_durations[current_phase % self.num_phases]
        if phase_elapsed_time >= target_duration:
            next_phase = (current_phase + 1) % self.num_phases
            reason = f"Fallback Mode: Fixed green time elapsed ({phase_elapsed_time:.1f}s >= {target_duration}s). Transitioning to phase {next_phase}."
            return next_phase, reason
        else:
            reason = f"Fallback Mode: Maintaining phase {current_phase} ({phase_elapsed_time:.1f}s / {target_duration}s)."
            return current_phase, reason

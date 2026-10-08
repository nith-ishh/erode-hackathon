import sys
from pathlib import Path

config_dir = Path(__file__).resolve().parent
if str(config_dir) not in sys.path:
    sys.path.insert(0, str(config_dir))

from default_config import (
    SIMULATION,
    SIGNAL_CONSTRAINTS,
    PCU_WEIGHTS,
    SAFETY_THRESHOLDS,
    PPO_CONFIG,
    REWARD_WEIGHTS,
    FALLBACK_CONFIG,
    SERVER_CONFIG,
    BASE_DIR
)

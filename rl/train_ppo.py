"""
PPO Agent Training Script
Trains Stable-Baselines3 PPO on TrafficSignalEnv and saves trained model weights.
"""

import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from rl.environment import TrafficSignalEnv
from config import PPO_CONFIG

def train_ppo_agent(total_timesteps: int = 10000):
    print("=" * 60)
    print("Starting PPO Reinforcement Learning Training...")
    print("=" * 60)

    try:
        from stable_baselines3 import PPO
        from stable_baselines3.common.env_checker import check_env
    except ImportError:
        print("[Train PPO] Stable-Baselines3 is not installed yet. Skipping actual SB3 training call.")
        return False

    env = TrafficSignalEnv(max_steps=500)
    
    # Optional environment validation check
    try:
        check_env(env, warn=True)
        print("[Train PPO] Gymnasium Environment structure validated successfully!")
    except Exception as e:
        print(f"[Train PPO] Environment validation info: {e}")

    model_dir = Path(PPO_CONFIG["model_dir"])
    model_dir.mkdir(parents=True, exist_ok=True)
    model_path = model_dir / "ppo_traffic_model"

    model = PPO(
        policy="MlpPolicy",
        env=env,
        learning_rate=PPO_CONFIG["learning_rate"],
        n_steps=64,
        batch_size=32,
        n_epochs=PPO_CONFIG["n_epochs"],
        gamma=PPO_CONFIG["gamma"],
        gae_lambda=PPO_CONFIG["gae_lambda"],
        clip_range=PPO_CONFIG["clip_range"],
        ent_coef=PPO_CONFIG["ent_coef"],
        verbose=1
    )

    print(f"Training PPO for {total_timesteps} timesteps...")
    model.learn(total_timesteps=total_timesteps)
    
    model.save(str(model_path))
    print(f"PPO Model training complete! Saved to {model_path}.zip")
    env.close()
    return True

if __name__ == "__main__":
    timesteps = int(sys.argv[1]) if len(sys.argv) > 1 else 2000
    train_ppo_agent(total_timesteps=timesteps)

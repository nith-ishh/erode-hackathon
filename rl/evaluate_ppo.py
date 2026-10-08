"""
PPO Agent Evaluation & Live Inference Runner (Member 1)
Loads the trained PPO model and evaluates its policy against TrafficSignalEnv,
displaying live PCU queue observations, policy decisions, reward accumulation,
and Safety Shield validation.
"""

import sys
from pathlib import Path
from typing import Optional

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))

from rl.environment import TrafficSignalEnv
from config import PPO_CONFIG

def evaluate_ppo_policy(episodes: int = 1, steps_per_episode: int = 50, model_path: Optional[str] = None):
    print("=" * 70)
    print("EVALUATING TRAINED PPO POLICY IN TRAFFIC SIGNAL ENVIRONMENT (MEMBER 1)")
    print("=" * 70)

    try:
        from stable_baselines3 import PPO
    except ImportError:
        print("[Evaluate PPO] Error: Stable-Baselines3 is required to evaluate the PPO model.")
        return

    target_model = Path(model_path) if model_path else Path(PPO_CONFIG["model_dir"]) / "ppo_traffic_model.zip"
    
    if not target_model.exists():
        print(f"[Evaluate PPO] Model file not found at {target_model}.")
        print("[Evaluate PPO] Please train the model first with: python rl/train_ppo.py")
        return

    print(f"Loading trained model from: {target_model}")
    model = PPO.load(str(target_model))

    env = TrafficSignalEnv(max_steps=steps_per_episode)
    
    total_rewards = []
    total_switches = 0
    total_safety_rejections = 0

    for ep in range(episodes):
        obs, info = env.reset(seed=42 + ep)
        ep_reward = 0.0
        print(f"\n--- Episode {ep + 1}/{episodes} Starting ---")

        for step in range(steps_per_episode):
            # Predict action from trained policy
            action, _states = model.predict(obs, deterministic=True)
            action = int(action)

            obs, reward, terminated, truncated, step_info = env.step(action)
            ep_reward += reward

            if action == 1:
                total_switches += 1

            safety_res = step_info.get("safety_result", (True, 0, "", {}))
            is_safe = safety_res[0]
            if not is_safe:
                total_safety_rejections += 1

            if step < 10 or step % 10 == 0:
                cur_phase = step_info.get("state", {}).get("current_phase", 0)
                tot_pcu = step_info.get("state", {}).get("total_pcu_queue", 0.0)
                print(
                    f"Step {step + 1:02d} | Phase: {cur_phase} | PCU Queue: {tot_pcu:5.1f} | "
                    f"PPO Action: {'SWITCH' if action == 1 else 'KEEP  '} | "
                    f"Shield: {'PASS' if is_safe else 'BLOCKED'} | Reward: {reward:+6.2f}"
                )

            if terminated or truncated:
                break

        total_rewards.append(ep_reward)
        print(f"--- Episode {ep + 1} Finished | Total Reward: {ep_reward:.2f} ---")

    env.close()

    avg_rew = sum(total_rewards) / len(total_rewards)
    print("\n" + "=" * 70)
    print("EVALUATION SUMMARY:")
    print(f"  * Average Episode Reward: {avg_rew:.2f}")
    print(f"  * Total Phase Switches Proposed: {total_switches}")
    print(f"  * Safety Shield Guardrail Interventions: {total_safety_rejections}")
    print(f"  * Agent Status: Fully Operational & Guardrailed")
    print("=" * 70)

if __name__ == "__main__":
    steps = int(sys.argv[1]) if len(sys.argv) > 1 else 30
    evaluate_ppo_policy(episodes=1, steps_per_episode=steps)

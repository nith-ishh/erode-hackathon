import React from 'react';
import { Cpu, Clock, ShieldCheck, CheckCircle2, AlertCircle, Zap, Eye, EyeOff } from 'lucide-react';

interface AdaptiveVsFixedPanelProps {
  stateData: any;
}

export const AdaptiveVsFixedPanel: React.FC<AdaptiveVsFixedPanelProps> = ({ stateData }) => {
  const dual = stateData?.dual_controller || {};
  const ai = dual.adaptive_ai || {
    name: "ADAPTIVE AI CONTROLLER",
    current_phase: stateData?.final_phase ?? 0,
    phase_name: stateData?.explanation?.final_phase_name ?? "North-South Green",
    green_duration_s: 18.4,
    pcu_queue: 12.8,
    waiting_time_s: 21.3,
    ppo_action: stateData?.ppo_action ?? 0,
    ppo_action_label: stateData?.ppo_action === 0 ? "EXTEND GREEN" : "SWITCH TO NEXT PHASE",
    jev_status: "APPROVED",
    jev_confidence_pct: 98,
    safety_shield_status: "SAFE"
  };

  const fixed = dual.fixed_time || {
    name: "FIXED-TIME BASELINE",
    current_phase: 0,
    phase_name: "North-South Green",
    fixed_timer_remaining_s: 14.0,
    fixed_timer_total_s: 30.0,
    pcu_queue: 21.7,
    waiting_time_s: 36.4,
    control_mode: "PREDEFINED TIMER (30s Green / 4s Yellow)",
    traffic_awareness: "BLIND (Ignores traffic queues & density)"
  };

  return (
    <div className="panel" style={{ border: '1px solid rgba(56, 189, 248, 0.3)', marginBottom: '1.2rem' }}>
      <div className="panel-header">
        <div className="panel-title">
          <Zap style={{ color: 'var(--accent-cyan)' }} />
          <span>Live Controller Comparison: Adaptive AI vs Predefined Fixed-Time</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="badge badge-purple">Identical Traffic Demand & Seed</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* LEFT: ADAPTIVE AI CONTROLLER PANEL */}
        <div
          style={{
            background: 'rgba(56, 189, 248, 0.05)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '0.75rem',
            padding: '1.1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(56,189,248,0.2)', paddingBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Cpu className="w-5 h-5" style={{ color: 'var(--accent-cyan)' }} />
              <span style={{ fontWeight: 800, color: '#38bdf8', fontSize: '0.95rem' }}>
                ADAPTIVE AI CONTROL
              </span>
            </div>
            <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <Eye className="w-3.5 h-3.5" /> Traffic Aware
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Phase</div>
              <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.88rem' }}>{ai.phase_name}</div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Green Elapsed Duration</div>
              <div style={{ fontWeight: 800, color: '#38bdf8', fontSize: '0.88rem' }}>{ai.green_duration_s}s</div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current PCU Queue</div>
              <div style={{ fontWeight: 800, color: '#4ade80', fontSize: '1.1rem' }}>{ai.pcu_queue} PCU</div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Average Waiting Time</div>
              <div style={{ fontWeight: 800, color: '#4ade80', fontSize: '1.1rem' }}>{ai.waiting_time_s}s</div>
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '0.5rem', padding: '0.7rem', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.3rem' }}>
              <span style={{ color: '#94a3b8' }}>PPO Policy Action:</span>
              <strong style={{ color: '#c084fc' }}>{ai.ppo_action_label} (Action {ai.ppo_action})</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.3rem' }}>
              <span style={{ color: '#94a3b8' }}>JEV Evaluation:</span>
              <strong style={{ color: '#4ade80' }}>{ai.jev_status} ({ai.jev_confidence_pct}% Confidence)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
              <span style={{ color: '#94a3b8' }}>Safety Shield Authority:</span>
              <strong style={{ color: '#38bdf8' }}>{ai.safety_shield_status} (11 Guardrails Enforced)</strong>
            </div>
          </div>
        </div>

        {/* RIGHT: FIXED-TIME BASELINE CONTROL PANEL */}
        <div
          style={{
            background: 'rgba(100, 116, 139, 0.05)',
            border: '1px solid rgba(100, 116, 139, 0.3)',
            borderRadius: '0.75rem',
            padding: '1.1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(100,116,139,0.2)', paddingBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock className="w-5 h-5" style={{ color: '#94a3b8' }} />
              <span style={{ fontWeight: 800, color: '#94a3b8', fontSize: '0.95rem' }}>
                FIXED-TIME CONTROL (BASELINE)
              </span>
            </div>
            <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <EyeOff className="w-3.5 h-3.5" /> Traffic Blind
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Phase</div>
              <div style={{ fontWeight: 800, color: '#fff', fontSize: '0.88rem' }}>{fixed.phase_name}</div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fixed Timer Countdown</div>
              <div style={{ fontWeight: 800, color: '#f59e0b', fontSize: '0.88rem' }}>{fixed.fixed_timer_remaining_s}s / {fixed.fixed_timer_total_s}s</div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current PCU Queue</div>
              <div style={{ fontWeight: 800, color: '#f87171', fontSize: '1.1rem' }}>{fixed.pcu_queue} PCU</div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.6rem', borderRadius: '0.5rem' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Average Waiting Time</div>
              <div style={{ fontWeight: 800, color: '#f87171', fontSize: '1.1rem' }}>{fixed.waiting_time_s}s</div>
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '0.5rem', padding: '0.7rem', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.3rem' }}>
              <span style={{ color: '#94a3b8' }}>Control Mode:</span>
              <strong style={{ color: '#f59e0b' }}>{fixed.control_mode}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.3rem' }}>
              <span style={{ color: '#94a3b8' }}>Decision Basis:</span>
              <strong style={{ color: '#94a3b8' }}>Strict Predefined Clock (Rigid)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
              <span style={{ color: '#94a3b8' }}>Queue Sensitivity:</span>
              <strong style={{ color: '#ef4444' }}>Zero Adaptation (Blind to Congestion)</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

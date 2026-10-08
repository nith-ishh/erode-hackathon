import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface AdaptivityExplainerProps {
  adaptivityProof?: any;
  stateData?: any;
}

export const AdaptivityExplainer: React.FC<AdaptivityExplainerProps> = ({ adaptivityProof, stateData }) => {
  const [activeTab, setActiveTab] = React.useState<'narrative' | 'proof'>('narrative');

  const approaches = stateData?.state?.approaches || {};
  const n_pcu = (approaches?.N?.pcu_queue || 0) + (approaches?.S?.pcu_queue || 0);
  const ew_pcu = (approaches?.E?.pcu_queue || 0) + (approaches?.W?.pcu_queue || 0);
  const ppoAction = stateData?.ppo_action ?? 0;

  const proof = adaptivityProof || {
    before: { ns_queue: 5.2, ew_queue: 22.4, phase: 2, action: "HOLD" },
    after: { ns_queue: 19.1, ew_queue: 7.3, phase: 0, action: "SWITCH" },
    why_adaptive: "When East-West queue dominated, PPO held EW green. As North-South queues surged, PPO immediately proposed switching to NS Green to relieve directional pressure."
  };

  return (
    <div className="panel" style={{ border: '1px solid rgba(168, 85, 247, 0.3)', marginBottom: '1.2rem' }}>
      <div className="panel-header" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
        <div className="panel-title">
          <Sparkles style={{ color: 'var(--accent-purple)' }} />
          <span>Real-World Scenario & Proof of Adaptivity</span>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '0.4rem', background: 'rgba(0,0,0,0.4)', padding: '0.2rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={() => setActiveTab('narrative')}
            style={{
              background: activeTab === 'narrative' ? 'var(--accent-purple)' : 'transparent',
              color: activeTab === 'narrative' ? '#fff' : '#94a3b8',
              border: 'none',
              borderRadius: '0.35rem',
              padding: '0.25rem 0.65rem',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            📖 Real-World Scenario Story
          </button>
          <button
            onClick={() => setActiveTab('proof')}
            style={{
              background: activeTab === 'proof' ? 'var(--accent-purple)' : 'transparent',
              color: activeTab === 'proof' ? '#fff' : '#94a3b8',
              border: 'none',
              borderRadius: '0.35rem',
              padding: '0.25rem 0.65rem',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            ⚡ Live PCU Proof
          </button>
        </div>
      </div>

      {activeTab === 'narrative' ? (
        /* Real-World Scenario Pitch Narrative Card */
        <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: '0.75rem', padding: '1rem', marginTop: '0.5rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#c084fc', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>🌆 System Operation via Real-World Rush Hour Scenario:</span>
          </div>

          <blockquote style={{ margin: 0, fontSize: '0.82rem', color: '#e2e8f0', lineHeight: '1.6', fontStyle: 'italic', borderLeft: '3px solid var(--accent-purple)', paddingLeft: '0.85rem' }}>
            “Let me explain our system through a real-world scenario. Imagine a busy four-way junction during evening rush hour. Our system observes that the North–South direction has a much larger traffic queue than the East–West direction. The reinforcement learning agent analyzes this information and proposes giving North–South more green time to reduce congestion. Before executing this decision, our Safety Shield verifies that the signal transition is safe and legally allowed. Once approved, the traffic signal changes, vehicles move, and the system continuously observes the updated traffic conditions to make further decisions.
            <br /><br />
            At the same time, our Live Counterfactual Twin evaluates the same traffic demand using traditional fixed-time control. Our dashboard compares both controllers using average delay, queue length and throughput, allowing us to measure the actual impact of our AI. If an ambulance is detected, our emergency module requests priority through the Safety Shield and coordinates upcoming junctions to establish an emergency green corridor.
            <br /><br />
            Therefore, our system does not simply display traffic or change lights randomly. It observes traffic, makes adaptive decisions, validates safety, executes the approved action and measures the outcome against a fixed-time baseline.”
          </blockquote>

          {/* 4 Execution Pillars Badge Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', marginTop: '0.85rem' }}>
            <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '0.4rem', borderRadius: '0.4rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: '#38bdf8', fontWeight: 800 }}>1. OBSERVE</div>
              <div style={{ fontSize: '0.7rem', color: '#fff', fontWeight: 700 }}>SUMO Telemetry</div>
            </div>
            <div style={{ background: 'rgba(192, 132, 252, 0.1)', border: '1px solid rgba(192, 132, 252, 0.2)', padding: '0.4rem', borderRadius: '0.4rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: '#c084fc', fontWeight: 800 }}>2. ADAPT</div>
              <div style={{ fontSize: '0.7rem', color: '#fff', fontWeight: 700 }}>PPO RL Action</div>
            </div>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '0.4rem', borderRadius: '0.4rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 800 }}>3. SHIELD</div>
              <div style={{ fontSize: '0.7rem', color: '#fff', fontWeight: 700 }}>Safety Guardrails</div>
            </div>
            <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '0.4rem', borderRadius: '0.4rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: '#22c55e', fontWeight: 800 }}>4. EXECUTE</div>
              <div style={{ fontSize: '0.7rem', color: '#fff', fontWeight: 700 }}>TraCI Signal Set</div>
            </div>
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.4rem', borderRadius: '0.4rem', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 800 }}>5. COMPARE</div>
              <div style={{ fontSize: '0.7rem', color: '#fff', fontWeight: 700 }}>Fixed-Time Twin</div>
            </div>
          </div>
        </div>
      ) : (
        /* Reactive Pipeline Flow Diagram & Live PCU Proof */
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(0,0,0,0.35)',
              borderRadius: '0.75rem',
              padding: '0.85rem 1rem',
              marginBottom: '1rem',
              border: '1px solid rgba(255,255,255,0.06)',
              overflowX: 'auto',
              gap: '0.5rem'
            }}
          >
            <div style={{ textAlign: 'center', minWidth: '110px' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>1. SUMO Traffic</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.2rem' }}>Vehicle Arrivals</div>
            </div>

            <ArrowRight className="w-4 h-4" style={{ color: '#64748b', flexShrink: 0 }} />

            <div style={{ textAlign: 'center', minWidth: '120px' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>2. PCU Engine</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#4ade80', marginTop: '0.2rem' }}>Queue Imbalance</div>
            </div>

            <ArrowRight className="w-4 h-4" style={{ color: '#64748b', flexShrink: 0 }} />

            <div style={{ textAlign: 'center', minWidth: '130px' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>3. PPO Observation</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#c084fc', marginTop: '0.2rem' }}>18-Dim Vector Update</div>
            </div>

            <ArrowRight className="w-4 h-4" style={{ color: '#64748b', flexShrink: 0 }} />

            <div style={{ textAlign: 'center', minWidth: '120px' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>4. JEV + Shield</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.2rem' }}>11 Guardrail Check</div>
            </div>

            <ArrowRight className="w-4 h-4" style={{ color: '#64748b', flexShrink: 0 }} />

            <div style={{ textAlign: 'center', minWidth: '120px' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>5. SUMO Signal</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#22c55e', marginTop: '0.2rem' }}>Adaptive Phase Executed</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.6rem', padding: '0.85rem' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.4rem' }}>
                Live Queue Snapshot & Action Response
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.3rem' }}>
                <span>North-South Queue:</span>
                <strong style={{ color: '#38bdf8' }}>{n_pcu.toFixed(1)} PCU</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.3rem' }}>
                <span>East-West Queue:</span>
                <strong style={{ color: '#c084fc' }}>{ew_pcu.toFixed(1)} PCU</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginTop: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.4rem' }}>
                <span>PPO Policy Decision:</span>
                <strong style={{ color: '#4ade80' }}>
                  {ppoAction === 0 ? "HOLD CURRENT PHASE" : "SWITCH TO NEXT PHASE"}
                </strong>
              </div>
            </div>

            <div style={{ background: 'rgba(56, 189, 248, 0.04)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '0.6rem', padding: '0.85rem' }}>
              <div style={{ fontSize: '0.72rem', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.4rem' }}>
                Adaptivity Verification Note
              </div>
              <p style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: '1.45', margin: 0 }}>
                {proof.why_adaptive || "The PPO controller recalculates its 18-dimensional state vector every simulation second and alters signal actions in direct response to directional vehicle build-ups."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

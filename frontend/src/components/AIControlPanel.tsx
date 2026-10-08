import React from 'react';
import { Brain, MessageSquare, Scale, Users } from 'lucide-react';

interface AIControlPanelProps {
  stateData: any;
}

export const AIControlPanel: React.FC<AIControlPanelProps> = ({ stateData }) => {
  const ppoAction = stateData?.ppo_action ?? 0;
  const jev = stateData?.jev_evaluation || {};
  const explanation = stateData?.explanation || {};
  const highlights = explanation.highlights || [];
  const badge = explanation.badge || 'AI ADAPTIVE CONTROL';

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">
          <Brain style={{ color: 'var(--accent-purple)' }} />
          <span>PPO RL Brain & JEV Evaluation Layer</span>
        </div>
        <span className="badge badge-purple">{badge}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* PPO Proposed Action Card */}
        <div style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.2)', borderRadius: '0.75rem', padding: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
              PPO Policy Proposed Action
            </span>
            <span className="badge badge-purple">Action Code {ppoAction}</span>
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: 'white' }}>
            {ppoAction === 0 ? 'Extend / Maintain Current Green Phase' : 'Transition to Next Signal Phase'}
          </div>
        </div>

        {/* JEV Multi-Objective Vector Card */}
        <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '0.75rem', padding: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Scale className="w-4 h-4" style={{ color: '#38bdf8' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                JEV Junction Evaluation Vector
              </span>
            </div>
            <span className="badge badge-green">
              Confidence: {((jev.jev_score ?? 0.95) * 100).toFixed(0)}%
            </span>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', margin: '0.4rem 0', fontSize: '0.75rem' }}>
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.35rem 0.5rem', borderRadius: '0.35rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>NS vs EW Imbalance: </span>
              <span style={{ color: '#38bdf8', fontWeight: 700 }}>{jev.queue_imbalance_ratio ?? 0.0}</span>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.35rem 0.5rem', borderRadius: '0.35rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Ped Pressure Index: </span>
              <span style={{ color: '#fbbf24', fontWeight: 700 }}>{jev.pedestrian_pressure_index ?? 0.15}</span>
            </div>
          </div>

          <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.4', margin: 0 }}>
            {jev.jev_notes || 'Action aligns with North-South queue demand and pedestrian crossing priorities.'}
          </p>
        </div>

        {/* Explain Engine Card */}
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '0.75rem', padding: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem', color: 'var(--accent-cyan)' }}>
            <MessageSquare className="w-4 h-4" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
              Explain Engine Natural Language Justification
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'white', fontWeight: 500, lineHeight: '1.45', fontStyle: 'italic', margin: '0 0 0.5rem 0' }}>
            "{explanation.human_readable_explanation || 'North-South green was extended because the PCU-weighted queue on North-South is significantly higher than East-West.'}"
          </p>

          {highlights.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.4rem' }}>
              {highlights.map((h: string, idx: number) => (
                <div key={idx} style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ color: '#38bdf8' }}>•</span> {h}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

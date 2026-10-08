import React from 'react';
import { Brain, MessageSquare } from 'lucide-react';

interface AIControlPanelProps {
  stateData: any;
}

export const AIControlPanel: React.FC<AIControlPanelProps> = ({ stateData }) => {
  const ppoAction = stateData?.ppo_action ?? 0;
  const jev = stateData?.jev_evaluation || {};
  const explanation = stateData?.explanation || {};

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">
          <Brain style={{ color: 'var(--accent-purple)' }} />
          <span>PPO RL Brain & JEV Decision Evaluation</span>
        </div>
        <span className="badge badge-purple">PPO + JEV Layer</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* PPO Proposed Action Card */}
        <div style={{ background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.2)', borderRadius: '0.75rem', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
              PPO Proposed Action
            </span>
            <span className="badge badge-purple">Action Code {ppoAction}</span>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>
            {ppoAction === 0 ? 'Extend / Maintain Current Green Phase' : 'Transition to Next Signal Phase'}
          </div>
        </div>

        {/* JEV Decision Evaluation Card */}
        <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '0.75rem', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
              JEV Evaluation Layer
            </span>
            <span className="badge badge-green">
              Confidence: {((jev.jev_score || 0.95) * 100).toFixed(0)}%
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.4' }}>
            {jev.jev_notes || 'Action aligns with North-South queue demand and pedestrian crossing priorities.'}
          </p>
        </div>

        {/* Explain Engine Card */}
        <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '0.75rem', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--accent-cyan)' }}>
            <MessageSquare className="w-4 h-4" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>
              Explain Engine Narrative
            </span>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'white', fontWeight: 500, lineHeight: '1.5', fontFamily: 'var(--font-sans)' }}>
            "{explanation.human_readable_explanation || 'North-South green was extended because the PCU-weighted queue on North-South is significantly higher than East-West.'}"
          </p>
        </div>
      </div>
    </div>
  );
};

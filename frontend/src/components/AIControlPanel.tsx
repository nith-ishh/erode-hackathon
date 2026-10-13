import React from 'react';
import { Brain, MessageSquare, Scale, Cpu } from 'lucide-react';

interface AIControlPanelProps {
  stateData: any;
}

export const AIControlPanel: React.FC<AIControlPanelProps> = ({ stateData }) => {
  const ppoAction = stateData?.ppo_action ?? 0;
  const jev = stateData?.jev_evaluation || {};
  const explanation = stateData?.explanation || {};
  const highlights = explanation.highlights || [];
  const badge = explanation.badge || 'AI ADAPTIVE CONTROL';
  const confidencePct = Math.round((jev.jev_score ?? 0.95) * 100);

  return (
    <div className="panel" style={{ border: '1px solid #e2e8f0' }}>
      <div className="panel-header">
        <div className="panel-title">
          <Brain className="w-5 h-5" style={{ color: 'var(--accent-purple)' }} />
          <span>PPO RL Brain & JEV Evaluation Layer</span>
        </div>
        <span className="badge badge-purple">{badge}</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {/* PPO Proposed Action Card */}
        <div style={{ background: '#f3e8ff', border: '1px solid #d8b4fe', borderRadius: '0.85rem', padding: '0.95rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#6b21a8', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>
              PPO Policy Proposed Action
            </span>
            <span className="badge badge-purple" style={{ fontSize: '0.7rem', fontWeight: 800 }}>Action Code {ppoAction}</span>
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#581c87', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Cpu className="w-4 h-4 text-purple-700" />
            <span>{ppoAction === 0 ? 'Extend / Maintain Current Green Phase' : 'Transition to Next Signal Phase'}</span>
          </div>
        </div>

        {/* JEV Multi-Objective Vector Card */}
        <div style={{ background: '#e0f2fe', border: '1px solid #7dd3fc', borderRadius: '0.85rem', padding: '0.95rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Scale className="w-4 h-4" style={{ color: '#0284c7' }} />
              <span style={{ fontSize: '0.75rem', color: '#0369a1', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em' }}>
                JEV Junction Evaluation Vector
              </span>
            </div>
            <span className="badge badge-green" style={{ fontSize: '0.7rem', fontWeight: 800 }}>
              Confidence: {confidencePct}%
            </span>
          </div>

          {/* Confidence Progress Bar */}
          <div style={{ width: '100%', height: '5px', background: '#bae6fd', borderRadius: '3px', margin: '0.4rem 0 0.6rem 0', overflow: 'hidden' }}>
            <div style={{ width: `${confidencePct}%`, height: '100%', background: 'linear-gradient(90deg, #0284c7, #16a34a)', borderRadius: '3px' }}></div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem', margin: '0.4rem 0', fontSize: '0.75rem' }}>
            <div style={{ background: '#ffffff', padding: '0.45rem 0.65rem', borderRadius: '0.4rem', border: '1px solid #bae6fd' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>NS vs EW Imbalance: </span>
              <span style={{ color: '#0284c7', fontWeight: 800 }}>{jev.queue_imbalance_ratio ?? 0.0}</span>
            </div>
            <div style={{ background: '#ffffff', padding: '0.45rem 0.65rem', borderRadius: '0.4rem', border: '1px solid #bae6fd' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Ped Pressure Index: </span>
              <span style={{ color: '#b45309', fontWeight: 800 }}>{jev.pedestrian_pressure_index ?? 0.15}</span>
            </div>
          </div>

          <p style={{ fontSize: '0.8rem', color: '#0f172a', lineHeight: '1.45', margin: '0.2rem 0 0 0', fontWeight: 600 }}>
            {jev.jev_notes || 'Action aligns with North-South queue demand and pedestrian crossing priorities.'}
          </p>
        </div>

        {/* Explain Engine Card */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.85rem', padding: '0.95rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.4rem', color: '#0284c7' }}>
            <MessageSquare className="w-4 h-4" />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Explain Engine Natural Language Justification
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 600, lineHeight: '1.45', fontStyle: 'italic', margin: '0 0 0.5rem 0' }}>
            "{explanation.human_readable_explanation || 'North-South green was extended because the PCU-weighted queue on North-South is significantly higher than East-West.'}"
          </p>

          {highlights.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
              {highlights.map((h: string, idx: number) => (
                <div key={idx} style={{ fontSize: '0.75rem', color: '#334155', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ color: '#0284c7', fontWeight: 900 }}>•</span> {h}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Terminal, Shield, CheckCircle, Clock } from 'lucide-react';

interface LiveDecisionLogProps {
  logs?: any[];
}

export const LiveDecisionLog: React.FC<LiveDecisionLogProps> = ({ logs = [] }) => {
  return (
    <div className="panel" style={{ border: '1px solid rgba(34, 197, 94, 0.25)', marginBottom: '1.2rem' }}>
      <div className="panel-header">
        <div className="panel-title">
          <Terminal style={{ color: 'var(--accent-green)' }} />
          <span>Live PPO & Safety Shield Decision Stream (Closed-Loop Telemetry)</span>
        </div>
        <span className="badge badge-green">Real-Time Events</span>
      </div>

      <div
        style={{
          background: 'rgba(0,0,0,0.5)',
          borderRadius: '0.6rem',
          padding: '0.75rem',
          maxHeight: '220px',
          overflowY: 'auto',
          fontFamily: 'monospace',
          fontSize: '0.75rem',
          border: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.45rem'
        }}
      >
        {logs.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
            Streaming live simulation decisions...
          </div>
        ) : (
          logs.map((event, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                paddingBottom: '0.35rem',
                color: idx === 0 ? '#4ade80' : '#cbd5e1'
              }}
            >
              <span style={{ color: '#38bdf8', fontWeight: 700, whiteSpace: 'nowrap' }}>
                [{event.timestamp}s]
              </span>
              <div style={{ flex: 1 }}>
                <div>
                  <strong style={{ color: '#fff' }}>{event.traffic_event}</strong> →{' '}
                  <span style={{ color: '#c084fc' }}>PPO Action: {event.ppo_action_label}</span> |{' '}
                  <span style={{ color: '#4ade80' }}>JEV: {event.jev_score_pct}%</span> |{' '}
                  <span style={{ color: event.safety_shield_status === 'SAFE' ? '#22c55e' : '#f87171' }}>
                    Shield: {event.safety_shield_status}
                  </span>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                  ↳ Executed: <strong style={{ color: '#38bdf8' }}>{event.final_phase_name}</strong> — {event.explanation}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { AlertTriangle, Cpu, Activity, Siren } from 'lucide-react';

interface HeaderProps {
  scenario: string;
  onScenarioChange: (s: string) => void;
  breakItActive: boolean;
  onToggleBreakIt: () => void;
  emergencyActive: boolean;
  onToggleEmergency: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  scenario,
  onScenarioChange,
  breakItActive,
  onToggleBreakIt,
  emergencyActive,
  onToggleEmergency
}) => {
  return (
    <header className="panel" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Cpu className="w-8 h-8" style={{ color: 'var(--accent-cyan)' }} />
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #38bdf8, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                AI-Based Adaptive Signal Control
              </h1>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Trustworthy, Explainable, Safety-Shielded Indian Mixed-Traffic Digital Twin
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Scenario Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
            <select
              value={scenario}
              onChange={(e) => onScenarioChange(e.target.value)}
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.85rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="normal">Normal Traffic</option>
              <option value="rush_hour">Rush Hour</option>
              <option value="high_density">High Density</option>
              <option value="incident">Incident / Congestion</option>
            </select>
          </div>

          {/* Emergency Corridor Toggle */}
          <button
            onClick={onToggleEmergency}
            className={`badge ${emergencyActive ? 'badge-red' : 'badge-purple'}`}
            style={{ padding: '0.6rem 1rem', cursor: 'pointer', border: 'none', borderRadius: '0.5rem', fontWeight: 700 }}
          >
            <Siren className="w-4 h-4" />
            {emergencyActive ? 'Emergency Corridor: ACTIVE' : 'Trigger Ambulance'}
          </button>

          {/* BREAK-IT Fault Injection Button */}
          <button
            onClick={onToggleBreakIt}
            className={`btn-break-it ${breakItActive ? 'active' : ''}`}
          >
            <AlertTriangle className="w-5 h-5" />
            {breakItActive ? 'RESET FAULT' : 'BREAK-IT'}
          </button>
        </div>
      </div>

      {breakItActive && (
        <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertTriangle style={{ color: '#ef4444' }} />
          <span style={{ fontWeight: 700, color: '#f87171', fontSize: '0.9rem' }}>
            CRITICAL DEMO MOMENT: Sensor Failure Injected! Safety Shield blocked PPO control. Fixed-Time Fallback ACTIVE to preserve safe intersection operation.
          </span>
        </div>
      )}
    </header>
  );
};

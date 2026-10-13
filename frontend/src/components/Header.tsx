import React from 'react';
import { AlertTriangle, Activity, Siren, ShieldCheck, Radio } from 'lucide-react';

const TrafficLightIcon: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <svg 
    width="28" 
    height="28" 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ display: 'block', filter: 'drop-shadow(0 2px 6px rgba(2, 132, 199, 0.3))', ...style }}
  >
    <rect x="6.5" y="1.5" width="11" height="21" rx="3.5" fill="#0f172a" stroke="#0284c7" strokeWidth="1.5" />
    <circle cx="12" cy="5.5" r="2.3" fill="#ef4444" />
    <circle cx="12" cy="5.5" r="1.1" fill="#fca5a5" opacity="0.95" />
    <circle cx="12" cy="12" r="2.3" fill="#f59e0b" />
    <circle cx="12" cy="12" r="1.1" fill="#fde68a" opacity="0.95" />
    <circle cx="12" cy="18.5" r="2.3" fill="#10b981" />
    <circle cx="12" cy="18.5" r="1.1" fill="#a7f3d0" opacity="0.95" />
  </svg>
);

interface HeaderProps {
  scenario: string;
  onScenarioChange: (s: string) => void;
  breakItActive: boolean;
  onToggleBreakIt: () => void;
  emergencyActive: boolean;
  onToggleEmergency: () => void;
  connectionMode?: string;
  step?: number;
}

export const Header: React.FC<HeaderProps> = ({
  scenario,
  onScenarioChange,
  breakItActive,
  onToggleBreakIt,
  emergencyActive,
  onToggleEmergency,
  connectionMode = 'ws',
  step = 0
}) => {
  return (
    <header className="panel" style={{ padding: '1.15rem 1.5rem', marginBottom: '0.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem' }}>
        
        {/* Left Branding & System Identifier */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem' }}>
          <div style={{ position: 'relative', background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.15) 0%, rgba(124, 58, 237, 0.15) 100%)', border: '1px solid rgba(14, 165, 233, 0.35)', padding: '0.65rem 0.75rem', borderRadius: '0.9rem', boxShadow: '0 4px 14px rgba(14, 165, 233, 0.15)' }}>
            <TrafficLightIcon />
            <span style={{ position: 'absolute', top: '-3px', right: '-3px', width: '11px', height: '11px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></span>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #0284c7 0%, #4f46e5 50%, #7c3aed 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                ESCE
              </h1>
              <span className="badge badge-green" style={{ fontSize: '0.68rem', padding: '0.25rem 0.65rem' }}>
                <ShieldCheck className="w-3.5 h-3.5" />
                SAFETY SHIELD GOVERNED
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500, marginTop: '0.12rem' }}>
              Indian Mixed-Traffic Digital Twin — PPO RL Policy & Deterministic Safety Shield Governance
            </p>
          </div>
        </div>

        {/* Right Controls & Scenario Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          
          {/* Live Telemetry Indicator & Step Counter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.45rem 0.85rem', borderRadius: '0.65rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Radio className="w-3.5 h-3.5" style={{ color: connectionMode === 'ws' ? '#10b981' : '#0284c7', animation: 'pulse 1.5s infinite' }} />
              <span>{connectionMode === 'ws' ? 'WebSocket Live (1000ms)' : 'Polling'}</span>
            </div>
            <span style={{ color: '#cbd5e1' }}>|</span>
            <div>Step: <strong style={{ color: '#0284c7', fontFamily: 'var(--font-mono)' }}>#{step}</strong></div>
          </div>

          {/* Scenario Selector Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#ffffff', border: '1px solid #cbd5e1', padding: '0.3rem 0.75rem', borderRadius: '0.65rem', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)' }}>
            <Activity className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Scenario:</span>
            <select
              value={scenario}
              onChange={(e) => onScenarioChange(e.target.value)}
              style={{
                background: 'transparent',
                color: '#0f172a',
                border: 'none',
                fontSize: '0.85rem',
                fontWeight: 800,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="normal" style={{ background: '#ffffff', color: '#0f172a' }}>🚗 Normal Flow</option>
              <option value="rush_hour" style={{ background: '#ffffff', color: '#0f172a' }}>🏙️ Rush Hour Surge</option>
              <option value="high_density" style={{ background: '#ffffff', color: '#0f172a' }}>🚦 Heavy PCU Density</option>
              <option value="incident" style={{ background: '#ffffff', color: '#0f172a' }}>🚨 Incident / Congestion</option>
            </select>
          </div>

          {/* Siren Emergency Corridor Toggle */}
          <button
            onClick={onToggleEmergency}
            className={`badge ${emergencyActive ? 'badge-red' : 'badge-purple'}`}
            style={{
              padding: '0.6rem 1.15rem',
              cursor: 'pointer',
              borderRadius: '0.65rem',
              fontWeight: 800,
              fontSize: '0.8rem',
              boxShadow: emergencyActive ? '0 0 24px rgba(239, 68, 68, 0.7)' : '0 0 15px rgba(168, 85, 247, 0.25)',
              transition: 'all 0.3s ease'
            }}
          >
            <Siren className="w-4 h-4" />
            {emergencyActive ? '🚨 SIREN ON: PRIORITY CORRIDOR' : '🔔 TRIGGER SIREN'}
          </button>

          {/* BREAK-IT Fault Injection Button */}
          <button
            onClick={onToggleBreakIt}
            className={`btn-break-it ${breakItActive ? 'active' : ''}`}
          >
            <AlertTriangle className="w-4 h-4" />
            {breakItActive ? 'RESET SENSOR FAULT' : '⚡ BREAK-IT DEMO'}
          </button>
        </div>
      </div>

      {/* Sensor Failure Banner */}
      {breakItActive && (
        <div style={{ marginTop: '1rem', padding: '0.85rem 1.25rem', background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.15) 100%)', border: '1px solid rgba(239, 68, 68, 0.5)', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', animation: 'pulse-red 2s infinite' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#fca5a5', fontWeight: 800, fontSize: '0.9rem' }}>
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span>DEMO FAULT INJECTED: Camera Sensor Failure Detected! Safety Shield overrides PPO RL policy & engages Fail-Safe Fixed Control.</span>
          </div>
          <span className="badge badge-red" style={{ fontSize: '0.75rem' }}>FAIL-SAFE FALLBACK ENGAGED</span>
        </div>
      )}
    </header>
  );
};

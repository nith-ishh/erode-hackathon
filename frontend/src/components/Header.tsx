import React from 'react';
import { AlertTriangle, Cpu, Activity, Siren, PlusCircle, Play, ShieldAlert } from 'lucide-react';

interface HeaderProps {
  scenario: string;
  onScenarioChange: (s: string) => void;
  breakItActive: boolean;
  onToggleBreakIt: () => void;
  emergencyActive: boolean;
  onToggleEmergency: () => void;
  onSurgeTraffic?: (dir: string) => void;
  onRunTest?: () => void;
  isRunningTest?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  scenario,
  onScenarioChange,
  breakItActive,
  onToggleBreakIt,
  emergencyActive,
  onToggleEmergency,
  onSurgeTraffic,
  onRunTest,
  isRunningTest = false
}) => {
  return (
    <header className="panel" style={{ marginBottom: '1.2rem', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Cpu className="w-8 h-8" style={{ color: 'var(--accent-cyan)' }} />
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #38bdf8, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                AI-Based Adaptive Signal Control
              </h1>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Trustworthy, Explainable, Safety-Shielded Indian Mixed-Traffic Digital Twin
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
          {/* Scenario Selector (6 Real Scenarios) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Activity className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
            <select
              value={scenario}
              onChange={(e) => onScenarioChange(e.target.value)}
              style={{
                background: 'rgba(15, 23, 42, 0.9)',
                color: 'white',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '0.45rem 0.8rem',
                borderRadius: '0.5rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="normal">Normal Traffic</option>
              <option value="rush_hour">Rush Hour</option>
              <option value="heavy_ew">Heavy East-West</option>
              <option value="heavy_ns">Heavy North-South</option>
              <option value="pedestrian_heavy">Pedestrian Heavy</option>
              <option value="emergency">Emergency Corridor</option>
            </select>
          </div>

          {/* Live Demand Surge Buttons (Proof of Adaptivity) */}
          <button
            onClick={() => onSurgeTraffic && onSurgeTraffic('EW')}
            title="Inject +15 PCU to East-West queue"
            style={{
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#38bdf8',
              padding: '0.45rem 0.75rem',
              borderRadius: '0.5rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            <PlusCircle className="w-3.5 h-3.5" /> +Surge EW
          </button>

          <button
            onClick={() => onSurgeTraffic && onSurgeTraffic('NS')}
            title="Inject +15 PCU to North-South queue"
            style={{
              background: 'rgba(168, 85, 247, 0.12)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              color: '#c084fc',
              padding: '0.45rem 0.75rem',
              borderRadius: '0.5rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem'
            }}
          >
            <PlusCircle className="w-3.5 h-3.5" /> +Surge NS
          </button>

          {/* Fair Comparison Test Trigger */}
          <button
            onClick={onRunTest}
            disabled={isRunningTest}
            style={{
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              border: '1px solid rgba(56, 189, 248, 0.5)',
              color: '#fff',
              padding: '0.45rem 0.85rem',
              borderRadius: '0.5rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: isRunningTest ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <Play className="w-3.5 h-3.5" /> {isRunningTest ? 'Running Test...' : 'Run Adaptive vs Fixed Test'}
          </button>

          {/* Emergency Corridor Toggle */}
          <button
            onClick={onToggleEmergency}
            className={`badge ${emergencyActive ? 'badge-red' : 'badge-purple'}`}
            style={{ padding: '0.5rem 0.85rem', cursor: 'pointer', border: 'none', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.78rem' }}
          >
            <Siren className="w-3.5 h-3.5" />
            {emergencyActive ? 'Ambulance: ACTIVE' : 'Trigger Ambulance'}
          </button>

          {/* BREAK SYSTEM / Break-It Fault Injection Button */}
          <button
            onClick={onToggleBreakIt}
            className={`btn-break-it ${breakItActive ? 'active' : ''}`}
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem' }}
          >
            <ShieldAlert className="w-4 h-4" />
            {breakItActive ? 'RESET SYSTEM' : 'BREAK SYSTEM'}
          </button>
        </div>
      </div>

      {breakItActive && (
        <div style={{ marginTop: '0.8rem', padding: '0.7rem 1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertTriangle style={{ color: '#ef4444' }} />
          <span style={{ fontWeight: 700, color: '#f87171', fontSize: '0.85rem' }}>
            CRITICAL HACKATHON DEMO: Fault Injected! Safety Shield detected corrupted sensor telemetry. PPO CONTROL BLOCKED. Fixed-Time Fallback ACTIVE to guarantee zero intersection risk.
          </span>
        </div>
      )}
    </header>
  );
};

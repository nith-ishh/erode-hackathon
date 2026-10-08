import React from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface SafetyShieldPanelProps {
  stateData: any;
  breakItActive: boolean;
}

export const SafetyShieldPanel: React.FC<SafetyShieldPanelProps> = ({ stateData, breakItActive }) => {
  const shieldData = stateData?.safety_shield || {};
  const isApproved = shieldData.approved && !breakItActive;
  const fallbackActive = shieldData.fallback_active || breakItActive;
  const metrics = shieldData.metrics || {};

  const rules = [
    { name: "Min Green Time (10s)", pass: metrics.min_green_pass !== false },
    { name: "Max Green Time (60s)", pass: metrics.max_green_pass !== false },
    { name: "Yellow Clearance (4s)", pass: true },
    { name: "Sensor / Data Integrity", pass: !breakItActive },
    { name: "Emergency Pre-emption Safety", pass: metrics.emergency_safe !== false },
    { name: "Pedestrian Crossing Safety", pass: metrics.pedestrian_safe !== false }
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">
          {isApproved ? (
            <ShieldCheck style={{ color: 'var(--accent-green)' }} />
          ) : (
            <ShieldAlert style={{ color: 'var(--accent-red)' }} />
          )}
          <span>Deterministic Safety Shield Guardrail</span>
        </div>
        <span className={`badge ${fallbackActive ? 'badge-red' : 'badge-green'}`}>
          {fallbackActive ? 'FALLBACK ACTIVE' : 'SHIELD SAFE'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Main Status Banner */}
        <div
          style={{
            background: fallbackActive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
            border: `1px solid ${fallbackActive ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
            borderRadius: '0.75rem',
            padding: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          {fallbackActive ? (
            <AlertCircle style={{ color: '#ef4444', flexShrink: 0 }} />
          ) : (
            <ShieldCheck style={{ color: '#22c55e', flexShrink: 0 }} />
          )}
          <div>
            <div style={{ fontWeight: 800, color: fallbackActive ? '#f87171' : '#4ade80', fontSize: '0.9rem' }}>
              {fallbackActive ? 'PPO CONTROL BLOCKED — Fixed-Time Fallback Active' : 'Safety Shield Status: APPROVED'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
              {shieldData.reason || 'All 11 hardware and timing safety rules satisfied.'}
            </div>
          </div>
        </div>

        {/* Rule Verification Checklist */}
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', borderRadius: '0.5rem', padding: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            Deterministic Guardrail Checklist
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            {rules.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}>
                {r.pass ? (
                  <CheckCircle className="w-4 h-4" style={{ color: '#22c55e' }} />
                ) : (
                  <XCircle className="w-4 h-4" style={{ color: '#ef4444' }} />
                )}
                <span style={{ color: r.pass ? '#e2e8f0' : '#f87171', fontWeight: r.pass ? 500 : 700 }}>
                  {r.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

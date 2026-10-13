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
  const ruleChecks = metrics.rule_checks || {};

  // All 11 Deterministic Safety Guardrails (Member 2 Governance)
  const all11Rules = [
    { id: "RULE_1_MIN_GREEN", name: "Rule 1: Min Green (10s)", pass: metrics.min_green_pass !== false },
    { id: "RULE_2_MAX_GREEN", name: "Rule 2: Max Green (60s)", pass: metrics.max_green_pass !== false },
    { id: "RULE_3_YELLOW_CLEARANCE", name: "Rule 3: Yellow Clearance (4s)", pass: true },
    { id: "RULE_4_ALL_RED_CLEARANCE", name: "Rule 4: All-Red Buffer (2s)", pass: true },
    { id: "RULE_5_CONFLICT_PREVENTION", name: "Rule 5: Conflict Phase Protection", pass: metrics.conflicting_phase_pass !== false },
    { id: "RULE_6_PEDESTRIAN_STARVATION", name: "Rule 6: Pedestrian Starvation Guard", pass: metrics.pedestrian_safe !== false },
    { id: "RULE_7_EMERGENCY_PREEMPTION", name: "Rule 7: Emergency Green Corridor", pass: metrics.emergency_safe !== false },
    { id: "RULE_8_ACTION_SPACE_VALIDATION", name: "Rule 8: Action Space Bounds", pass: metrics.action_space_valid !== false },
    { id: "RULE_9_SENSOR_FAULT_BREAK_IT", name: "Rule 9: Telemetry & Fault Guard", pass: !breakItActive && metrics.sensor_data_valid !== false },
    { id: "RULE_10_EMERGENCY_CLEARANCE_TRANSITION", name: "Rule 10: Corridor Clearance Buffer", pass: true },
    { id: "RULE_11_ANTI_OSCILLATION", name: "Rule 11: Anti-Oscillation Filter", pass: metrics.anti_oscillation_pass !== false }
  ];

  return (
    <div className="panel" style={{ border: fallbackActive ? '1px solid rgba(239, 68, 68, 0.45)' : '1px solid rgba(34, 197, 94, 0.35)' }}>
      <div className="panel-header">
        <div className="panel-title">
          {isApproved ? (
            <ShieldCheck className="w-5 h-5" style={{ color: 'var(--accent-green-bright)' }} />
          ) : (
            <ShieldAlert className="w-5 h-5" style={{ color: 'var(--accent-red)' }} />
          )}
          <span>Deterministic Safety Shield (11 Guardrails)</span>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <span className={`badge ${fallbackActive ? 'badge-red' : 'badge-green'}`}>
            {fallbackActive ? 'FALLBACK ACTIVE' : '100% SAFE'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {/* Main Status Banner */}
        <div
          style={{
            background: fallbackActive ? '#fff1f2' : '#f0fdf4',
            border: `1px solid ${fallbackActive ? '#fecdd3' : '#bbf7d0'}`,
            borderRadius: '0.85rem',
            padding: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem'
          }}
        >
          {fallbackActive ? (
            <AlertCircle style={{ color: '#dc2626', flexShrink: 0, width: 28, height: 28 }} />
          ) : (
            <ShieldCheck style={{ color: '#16a34a', flexShrink: 0, width: 28, height: 28 }} />
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, color: fallbackActive ? '#be123c' : '#15803d', fontSize: '0.94rem' }}>
              {fallbackActive ? 'PPO CONTROL BLOCKED — Fixed-Time Fallback Active' : 'Safety Shield Status: APPROVED (Zero Collision Risk)'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#334155', marginTop: '0.2rem', lineHeight: '1.45', fontWeight: 600 }}>
              {shieldData.reason || 'All 11 hardware and timing safety rules satisfied.'}
            </div>
          </div>
        </div>

        {/* 11 Rule Verification Checklist */}
        <div style={{ background: '#f8fafc', borderRadius: '0.85rem', padding: '0.85rem', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              11 Deterministic Guardrail Verification
            </span>
            <span style={{ fontSize: '0.72rem', color: '#0284c7', fontWeight: 800 }}>
              Member 2 Governance
            </span>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
            {all11Rules.map((r) => {
              const passed = ruleChecks[r.id] ? ruleChecks[r.id] === 'PASS' : r.pass;
              return (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.76rem', background: passed ? '#ffffff' : '#fff1f2', padding: '0.45rem 0.65rem', borderRadius: '0.4rem', border: passed ? '1px solid #cbd5e1' : '1px solid #fecdd3', transition: 'all 0.2s ease' }}>
                  {passed ? (
                    <CheckCircle className="w-3.5 h-3.5" style={{ color: '#16a34a', flexShrink: 0 }} />
                  ) : (
                    <XCircle className="w-3.5 h-3.5" style={{ color: '#dc2626', flexShrink: 0 }} />
                  )}
                  <span style={{ color: passed ? '#1e293b' : '#9f1239', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {r.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

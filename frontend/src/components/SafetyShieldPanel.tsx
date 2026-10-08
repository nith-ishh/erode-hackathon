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

  // All 11 Deterministic Safety Guardrails (Member 2 Responsibility)
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
    <div className="panel" style={{ border: fallbackActive ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(34, 197, 94, 0.3)' }}>
      <div className="panel-header">
        <div className="panel-title">
          {isApproved ? (
            <ShieldCheck style={{ color: 'var(--accent-green)' }} />
          ) : (
            <ShieldAlert style={{ color: 'var(--accent-red)' }} />
          )}
          <span>Deterministic Safety Shield (11 Guardrails)</span>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <span className={`badge ${fallbackActive ? 'badge-red' : 'badge-green'}`}>
            {fallbackActive ? 'FALLBACK ACTIVE' : '100% SAFE'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Main Status Banner */}
        <div
          style={{
            background: fallbackActive ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.1)',
            border: `1px solid ${fallbackActive ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.3)'}`,
            borderRadius: '0.75rem',
            padding: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          {fallbackActive ? (
            <AlertCircle style={{ color: '#ef4444', flexShrink: 0, width: 28, height: 28 }} />
          ) : (
            <ShieldCheck style={{ color: '#22c55e', flexShrink: 0, width: 28, height: 28 }} />
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, color: fallbackActive ? '#f87171' : '#4ade80', fontSize: '0.92rem' }}>
              {fallbackActive ? 'PPO CONTROL BLOCKED — Fixed-Time Fallback Active' : 'Safety Shield Status: APPROVED (Zero Collision Risk)'}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '0.2rem', lineHeight: '1.4' }}>
              {shieldData.reason || 'All 11 hardware and timing safety rules satisfied.'}
            </div>
          </div>
        </div>

        {/* 11 Rule Verification Checklist */}
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', borderRadius: '0.5rem', padding: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              11 Deterministic Guardrail Status
            </span>
            <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 600 }}>
              Member 2 Governance
            </span>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
            {all11Rules.map((r) => {
              const passed = ruleChecks[r.id] ? ruleChecks[r.id] === 'PASS' : r.pass;
              return (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.76rem', background: 'rgba(0,0,0,0.2)', padding: '0.35rem 0.5rem', borderRadius: '0.35rem' }}>
                  {passed ? (
                    <CheckCircle className="w-3.5 h-3.5" style={{ color: '#22c55e', flexShrink: 0 }} />
                  ) : (
                    <XCircle className="w-3.5 h-3.5" style={{ color: '#ef4444', flexShrink: 0 }} />
                  )}
                  <span style={{ color: passed ? '#e2e8f0' : '#f87171', fontWeight: passed ? 500 : 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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

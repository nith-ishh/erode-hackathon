import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, Radio, ArrowUpRight, Zap, CheckCircle2, ShieldCheck } from 'lucide-react';

interface BridgeCapacityAlertPanelProps {
  bridgeData?: any;
}

export const BridgeCapacityAlertPanel: React.FC<BridgeCapacityAlertPanelProps> = ({ bridgeData }) => {
  const [isSurging, setIsSurging] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const bridge = bridgeData || {
    bridge_name: "Cauvery River Bridge (Erode - Pallipalayam Corridor)",
    safe_capacity_pcu: 45.0,
    current_load_pcu: 21.0,
    load_percentage: 46.7,
    alert_level: "NORMAL",
    alert_active: false,
    police_post: "Cauvery Bridge Traffic Police Outpost (Unit-4)",
    officer_in_charge: "Special Sub-Inspector S. Murugesan (Badge #TN-ERD-412)",
    downstream_evacuation_priority: false,
    upstream_metering_active: false
  };

  const loadPct = bridge.load_percentage || 0;
  const isCritical = bridge.alert_level === 'CRITICAL_OVERLOAD' || loadPct >= 90;
  const isWarning = bridge.alert_level === 'WARNING' || (loadPct >= 75 && loadPct < 90);

  const handleSimulateSurge = async () => {
    setIsSurging(true);
    try {
      await fetch('http://127.0.0.1:8000/api/bridge/surge?amount=24.0', { method: 'POST' });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSurging(false);
    }
  };

  const handleClearBridge = async () => {
    setIsClearing(true);
    try {
      await fetch('http://127.0.0.1:8000/api/bridge/clear', { method: 'POST' });
    } catch (e) {
      console.error(e);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="panel" style={{
      border: isCritical ? '2px solid #ef4444' : isWarning ? '2px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: isCritical ? '0 0 25px rgba(239, 68, 68, 0.25)' : isWarning ? '0 0 20px rgba(245, 158, 11, 0.2)' : 'none',
      transition: 'all 0.5s ease',
      marginBottom: '1.5rem'
    }}>
      {/* Header Bar */}
      <div className="panel-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
        <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {isCritical ? (
            <ShieldAlert className="w-5 h-5" style={{ color: '#ef4444', animation: 'pulse 1s infinite' }} />
          ) : isWarning ? (
            <AlertTriangle className="w-5 h-5" style={{ color: '#f59e0b' }} />
          ) : (
            <ShieldCheck className="w-5 h-5" style={{ color: '#22c55e' }} />
          )}
          <div>
            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'white' }}>Bridge Structural Capacity & Police Early Warning</span>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{bridge.bridge_name}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span className={`badge ${isCritical ? 'badge-red' : isWarning ? 'badge-yellow' : 'badge-green'}`} style={{ padding: '0.4rem 0.8rem', fontWeight: 800 }}>
            {isCritical ? 'CRITICAL STRUCTURAL OVERLOAD' : isWarning ? 'CAPACITY WARNING' : 'SAFE CAPACITY'}
          </span>
          <span className="badge badge-blue" style={{ fontSize: '0.75rem' }}>
            Limit: {bridge.safe_capacity_pcu} PCU
          </span>
        </div>
      </div>

      {/* Main Grid: Gauge & Police Dispatch Beacon */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.2rem', marginTop: '1rem' }}>
        {/* Left Column: Live Load Progress Meter */}
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Vehicular Live-Load:</span>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 900, color: isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#38bdf8' }}>
                {bridge.current_load_pcu?.toFixed(1)}
              </span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}> / {bridge.safe_capacity_pcu} PCU</span>
              <span style={{ marginLeft: '0.5rem', fontWeight: 800, fontSize: '1rem', color: isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#22c55e' }}>
                ({loadPct}%)
              </span>
            </div>
          </div>

          {/* Graphical Progress Bar */}
          <div style={{ width: '100%', height: '14px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '7px', overflow: 'hidden', position: 'relative' }}>
            <div
              style={{
                width: `${Math.min(100, loadPct)}%`,
                height: '100%',
                background: isCritical
                  ? 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)'
                  : isWarning
                  ? 'linear-gradient(90deg, #22c55e 0%, #f59e0b 100%)'
                  : 'linear-gradient(90deg, #0284c7 0%, #22c55e 100%)',
                borderRadius: '7px',
                transition: 'width 0.8s ease'
              }}
            />
            {/* 75% Warning Marker */}
            <div style={{ position: 'absolute', left: '75%', top: 0, bottom: 0, width: '2px', background: 'rgba(245, 158, 11, 0.8)' }} title="75% Warning Limit" />
            {/* 90% Critical Marker */}
            <div style={{ position: 'absolute', left: '90%', top: 0, bottom: 0, width: '2px', background: 'rgba(239, 68, 68, 0.8)' }} title="90% Critical Overload" />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
            <span>0 PCU (Empty)</span>
            <span style={{ color: '#f59e0b' }}>75% Warning</span>
            <span style={{ color: '#ef4444' }}>90% Overload Risk</span>
            <span>50 PCU Max</span>
          </div>

          {/* Adaptive Signal Countermeasures Triggered */}
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <div style={{
              flex: 1,
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              background: bridge.downstream_evacuation_priority ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              border: bridge.downstream_evacuation_priority ? '1px solid #22c55e' : '1px solid rgba(255, 255, 255, 0.05)',
              fontSize: '0.75rem'
            }}>
              <div style={{ color: bridge.downstream_evacuation_priority ? '#22c55e' : 'var(--text-muted)', fontWeight: 700 }}>
                {bridge.downstream_evacuation_priority ? '✓ ACTIVE' : 'STANDBY'}
              </div>
              <div style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 600 }}>Downstream Green Wave Evacuation</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Accelerates exit flow off the bridge</div>
            </div>

            <div style={{
              flex: 1,
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              background: bridge.upstream_metering_active ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.03)',
              border: bridge.upstream_metering_active ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.05)',
              fontSize: '0.75rem'
            }}>
              <div style={{ color: bridge.upstream_metering_active ? '#ef4444' : 'var(--text-muted)', fontWeight: 700 }}>
                {bridge.upstream_metering_active ? '⚠️ ENGAGED' : 'STANDBY'}
              </div>
              <div style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 600 }}>Upstream Ramp Ingress Metering</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Restricts heavy vehicles entering bridge</div>
            </div>
          </div>
        </div>

        {/* Right Column: Police Dispatch Beacon & Actions */}
        <div style={{
          background: isCritical ? 'rgba(239, 68, 68, 0.08)' : isWarning ? 'rgba(245, 158, 11, 0.08)' : 'rgba(15, 23, 42, 0.6)',
          padding: '1rem',
          borderRadius: '0.75rem',
          border: isCritical ? '1px solid #ef4444' : isWarning ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: isCritical ? '#ef4444' : isWarning ? '#f59e0b' : '#38bdf8', fontWeight: 800, fontSize: '0.85rem' }}>
                <Radio className="w-4 h-4" style={{ animation: (isCritical || isWarning) ? 'pulse 0.8s infinite' : 'none' }} />
                <span>POLICE & AUTHORITY DISPATCH FEED</span>
              </div>
              <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>VHF CH-7</span>
            </div>

            <div style={{ fontSize: '0.8rem', color: '#fff', marginBottom: '0.3rem' }}>
              <strong>Assigned Unit:</strong> {bridge.police_post}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              <strong>Duty Officer:</strong> {bridge.officer_in_charge}
            </div>

            {bridge.police_dispatch ? (
              <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '0.6rem', borderRadius: '0.5rem', borderLeft: '3px solid #ef4444', marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: 700 }}>
                  🚨 {bridge.police_dispatch.dispatch_message}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                  Control Room Hotline: <strong style={{ color: '#fff' }}>{bridge.police_dispatch.hotline}</strong>
                </div>
              </div>
            ) : (
              <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '0.6rem', borderRadius: '0.5rem', borderLeft: '3px solid #22c55e', fontSize: '0.75rem', color: '#86efac', marginBottom: '0.75rem' }}>
                <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
                Structural live load within normal parameters. Police patrol on routine monitoring.
              </div>
            )}
          </div>

          {/* Interactive Simulation Controls */}
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              onClick={handleSimulateSurge}
              disabled={isSurging}
              className="btn btn-secondary"
              style={{
                flex: 1,
                padding: '0.5rem',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                borderColor: '#ef4444'
              }}
            >
              <Zap className="w-3.5 h-3.5" />
              {isSurging ? 'Simulating...' : 'Simulate Bridge Surge (+24 PCU)'}
            </button>

            <button
              onClick={handleClearBridge}
              disabled={isClearing}
              className="btn btn-primary"
              style={{
                flex: 1,
                padding: '0.5rem',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                background: '#0284c7'
              }}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              {isClearing ? 'Clearing...' : 'Clear / Evacuate Bridge'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

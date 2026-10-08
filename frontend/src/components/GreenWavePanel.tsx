import React from 'react';
import { Siren, CheckCircle2 } from 'lucide-react';

interface GreenWavePanelProps {
  emergencyData: any;
}

export const GreenWavePanel: React.FC<GreenWavePanelProps> = ({ emergencyData }) => {
  const detection = emergencyData?.detection || {};
  const isDetected = detection.detected || false;

  const junctions = [
    { id: 'J1', name: 'Primary Junction (J1)', status: isDetected ? 'GREEN CORRIDOR ACTIVE' : 'AI ADAPTIVE', active: true },
    { id: 'J2', name: 'Nehru Cross (J2)', status: isDetected ? 'GREEN WAVE COORDINATED' : 'STANDBY', active: isDetected },
    { id: 'J3', name: 'Outer Ring (J3)', status: isDetected ? 'PRE-EMPTION SCHEDULED' : 'STANDBY', active: isDetected },
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <div className="panel-title">
          <Siren style={{ color: '#ef4444' }} />
          <span>Feature 4: Emergency Green Corridor & Green Wave Coordination</span>
        </div>
        <span className={`badge ${isDetected ? 'badge-red' : 'badge-green'}`}>
          {isDetected ? 'EMERGENCY PRE-EMPTION ACTIVE' : 'MONITORING'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Status Card */}
        <div
          style={{
            background: isDetected ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.03)',
            border: `1px solid ${isDetected ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
            borderRadius: '0.75rem',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ fontWeight: 800, color: isDetected ? '#f87171' : 'white', fontSize: '1rem' }}>
              {isDetected ? `Ambulance Priority Verified (${detection.vehicle_id})` : 'No Emergency Vehicles Detected'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              {isDetected
                ? `Approach Edge: ${detection.approach_edge} | Distance: ${detection.distance_to_stopline}m | ETA: ${detection.eta_seconds}s`
                : 'System listening for siren authorization & camera priority signals.'}
            </div>
          </div>
          {isDetected && (
            <div className="badge badge-red" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
              ETA: {detection.eta_seconds}s
            </div>
          )}
        </div>

        {/* Multi-Junction Corridor Progression */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', alignItems: 'center' }}>
          {junctions.map((j) => (
            <div
              key={j.id}
              style={{
                background: j.active ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${j.active ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255, 255, 255, 0.05)'}`,
                borderRadius: '0.75rem',
                padding: '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3rem',
                position: 'relative'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, color: 'var(--accent-cyan)', fontSize: '0.9rem' }}>{j.id}</span>
                <CheckCircle2 className="w-4 h-4" style={{ color: j.active ? '#22c55e' : '#64748b' }} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white' }}>{j.name}</span>
              <span style={{ fontSize: '0.7rem', color: j.active ? '#4ade80' : 'var(--text-muted)', fontWeight: 700 }}>
                {j.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

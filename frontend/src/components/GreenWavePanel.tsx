import React from 'react';
import { Siren, CheckCircle2, Navigation } from 'lucide-react';

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
    <div className="panel" style={{ border: isDetected ? '1px solid #fecdd3' : '1px solid #e2e8f0' }}>
      <div className="panel-header">
        <div className="panel-title">
          <Siren className="w-5 h-5" style={{ color: '#dc2626' }} />
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
            background: isDetected ? '#fff1f2' : '#f8fafc',
            border: `1px solid ${isDetected ? '#fecdd3' : '#e2e8f0'}`,
            borderRadius: '0.85rem',
            padding: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Navigation className="w-6 h-6 text-cyan-600" />
            <div>
              <div style={{ fontWeight: 800, color: isDetected ? '#be123c' : '#0f172a', fontSize: '1.02rem' }}>
                {isDetected ? `Ambulance Priority Corridor Active (${detection.vehicle_id || 'AMB-108'})` : 'Routine Monitoring — Siren Standby'}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '0.2rem', fontWeight: 600 }}>
                {isDetected
                  ? `Approach Edge: ${detection.approach_edge || 'N_in'} | Distance: ${detection.distance_to_stopline || 120}m | ETA: ${detection.eta_seconds || 4}s`
                  : 'System listening for siren authorization & camera priority signals.'}
              </div>
            </div>
          </div>

          {isDetected && (
            <div className="badge badge-red" style={{ fontSize: '0.9rem', padding: '0.55rem 1.1rem', boxShadow: '0 4px 14px rgba(225, 29, 72, 0.3)' }}>
              ETA: {detection.eta_seconds || 4}s
            </div>
          )}
        </div>

        {/* Multi-Junction Corridor Progression */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', alignItems: 'center' }}>
          {junctions.map((j) => (
            <div
              key={j.id}
              style={{
                background: j.active ? '#f0fdf4' : '#ffffff',
                border: `1px solid ${j.active ? '#bbf7d0' : '#e2e8f0'}`,
                borderRadius: '0.85rem',
                padding: '0.9rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                position: 'relative',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 900, color: '#0284c7', fontSize: '0.92rem' }}>{j.id}</span>
                <CheckCircle2 className="w-4 h-4" style={{ color: j.active ? '#16a34a' : '#94a3b8' }} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>{j.name}</span>
              <span style={{ fontSize: '0.72rem', color: j.active ? '#15803d' : '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {j.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { 
  Siren, 
  Truck, 
  Power, 
  XCircle, 
  MapPin, 
  Clock, 
  Gauge, 
  ShieldCheck, 
  Play, 
  Activity,
  CheckCircle2
} from 'lucide-react';

interface AmbulanceControlPanelProps {
  ambulanceData?: any;
  emergencyData?: any;
  onRefresh?: () => void;
}

export const AmbulanceControlPanel: React.FC<AmbulanceControlPanelProps> = ({ 
  ambulanceData, 
  emergencyData: _emergencyData 
}) => {
  const [vehicleId, setVehicleId] = useState<string>('amb_01');
  const [origin, setOrigin] = useState<string>('N_in');
  const [destination, setDestination] = useState<string>('S_out');
  const [loading, setLoading] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const amb = ambulanceData || {};
  const active = amb.active || false;
  const sirenActive = amb.siren_active || false;
  const state = amb.state || 'IDLE';
  const eta = amb.eta_seconds ?? '--';
  const travelTime = amb.travel_time_seconds ?? 0;
  const distance = amb.distance_to_stopline_m ?? '--';
  const speed = amb.speed_mps ?? 0;
  const currentEdge = amb.current_edge || '--';
  const route = amb.route || ['N_in', 'S_out'];
  const eventLog: string[] = amb.event_log || [];
  const safetyStatus = amb.safety_shield_approved ? 'APPROVED BY SHIELD' : 'PENDING / BLOCKED';

  const showFeedback = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleSpawn = async (withSiren: boolean = false) => {
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/ambulance/spawn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_id: vehicleId,
          origin: origin,
          destination: destination,
          siren: withSiren
        })
      });
      const data = await res.json();
      if (data.status === 'ok') {
        showFeedback(`Ambulance "${vehicleId}" spawned (${withSiren ? 'Siren ON' : 'Siren OFF - Normal'})`);
      } else {
        showFeedback(`Spawn failed: ${data.message || 'Error'}`);
      }
    } catch (err: any) {
      showFeedback(`Spawn error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSiren = async (enableSiren: boolean) => {
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/ambulance/siren', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_id: vehicleId,
          siren: enableSiren
        })
      });
      const data = await res.json();
      if (data.status === 'ok') {
        showFeedback(`Siren toggled to: ${enableSiren ? 'ON (Emergency Priority Requested)' : 'OFF (Safe Clearance Transitioning)'}`);
      } else {
        showFeedback(`Siren toggle failed: ${data.message}`);
      }
    } catch (err: any) {
      showFeedback(`Siren toggle error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/ambulance/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicle_id: vehicleId })
      });
      const data = await res.json();
      if (data.status === 'ok') {
        showFeedback('Emergency priority cancelled & cleared.');
      } else {
        showFeedback(`Cancel failed: ${data.message}`);
      }
    } catch (err: any) {
      showFeedback(`Cancel error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // State color mapping
  const getStateBadge = (st: string) => {
    switch (st) {
      case 'EMERGENCY_ROUTE_ACTIVE':
      case 'EMERGENCY_PASSAGE':
        return { label: st.replace(/_/g, ' '), bg: 'rgba(239, 68, 68, 0.2)', border: '#ef4444', color: '#fca5a5' };
      case 'EMERGENCY_REQUESTED':
        return { label: 'EMERGENCY REQUESTED', bg: 'rgba(234, 179, 8, 0.2)', border: '#eab308', color: '#fde047' };
      case 'EMERGENCY_CLEARANCE':
        return { label: 'EMERGENCY CLEARANCE IN PROGRESS', bg: 'rgba(249, 115, 22, 0.2)', border: '#f97316', color: '#fdba74' };
      case 'AMBULANCE_ACTIVE_NORMAL':
        return { label: 'AMBULANCE EN ROUTE — NORMAL MODE', bg: 'rgba(56, 189, 248, 0.2)', border: '#38bdf8', color: '#7dd3fc' };
      case 'NORMAL_CONTROL_RESUMED':
        return { label: 'NORMAL CONTROL RESUMED', bg: 'rgba(34, 197, 94, 0.2)', border: '#22c55e', color: '#86efac' };
      case 'FAULT':
        return { label: 'FAULT / ROUTE REJECTED', bg: 'rgba(225, 29, 72, 0.2)', border: '#e11d48', color: '#fda4af' };
      default:
        return { label: 'AMBULANCE NOT ACTIVE (IDLE)', bg: 'rgba(148, 163, 184, 0.1)', border: '#64748b', color: '#94a3b8' };
    }
  };

  const badgeInfo = getStateBadge(state);

  return (
    <div className="panel" style={{ width: '100%', marginBottom: '1.5rem', border: sirenActive ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)' }}>
      {/* Panel Header */}
      <div className="panel-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
        <div className="panel-title" style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            background: sirenActive ? '#ef4444' : '#334155',
            padding: '0.4rem',
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: sirenActive ? '0 0 15px rgba(239, 68, 68, 0.6)' : 'none',
            animation: sirenActive ? 'pulse 1s infinite' : 'none'
          }}>
            <Siren className="w-5 h-5" style={{ color: 'white' }} />
          </div>
          <span>Emergency Ambulance Control & Siren Priority Manager</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span 
            style={{
              background: badgeInfo.bg,
              border: `1px solid ${badgeInfo.border}`,
              color: badgeInfo.color,
              padding: '0.4rem 0.85rem',
              borderRadius: '9999px',
              fontWeight: 800,
              fontSize: '0.75rem',
              letterSpacing: '0.05em'
            }}
          >
            {badgeInfo.label}
          </span>
          <span className={`badge ${sirenActive ? 'badge-red' : 'badge-green'}`} style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}>
            SIREN: {sirenActive ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>

      {actionMessage && (
        <div style={{ margin: '0.75rem 0', padding: '0.6rem 1rem', borderRadius: '0.5rem', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid #38bdf8', color: '#e0f2fe', fontSize: '0.85rem' }}>
          {actionMessage}
        </div>
      )}

      {/* Main Grid: Left Controls & Configuration, Right Telemetry & Corridor */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '1.25rem', marginTop: '1rem' }}>
        
        {/* Left Column: Interactive Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Spawn & Route Configuration */}
          <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Truck className="w-4 h-4" /> 1. Vehicle & Route Configuration
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Vehicle ID</label>
                <input 
                  type="text" 
                  value={vehicleId} 
                  onChange={(e) => setVehicleId(e.target.value)}
                  style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '0.375rem', padding: '0.4rem 0.6rem', color: 'white', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Origin Approach</label>
                <select 
                  value={origin} 
                  onChange={(e) => setOrigin(e.target.value)}
                  style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '0.375rem', padding: '0.4rem 0.6rem', color: 'white', fontSize: '0.85rem' }}
                >
                  <option value="N_in">North (N_in)</option>
                  <option value="S_in">South (S_in)</option>
                  <option value="E_in">East (E_in)</option>
                  <option value="W_in">West (W_in)</option>
                  <option value="INVALID_ROAD">Invalid Road (Test Fault)</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Destination Approach</label>
              <select 
                value={destination} 
                onChange={(e) => setDestination(e.target.value)}
                style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '0.375rem', padding: '0.4rem 0.6rem', color: 'white', fontSize: '0.85rem' }}
              >
                <option value="S_out">South Exit (S_out)</option>
                <option value="N_out">North Exit (N_out)</option>
                <option value="E_out">East Exit (E_out)</option>
                <option value="W_out">West Exit (W_out)</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              <button 
                onClick={() => handleSpawn(false)} 
                disabled={loading}
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
              >
                <Truck className="w-3.5 h-3.5" /> Spawn (Siren OFF)
              </button>

              <button 
                onClick={() => handleSpawn(true)} 
                disabled={loading}
                className="btn"
                style={{ fontSize: '0.8rem', padding: '0.6rem', background: '#ef4444', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', fontWeight: 700 }}
              >
                <Play className="w-3.5 h-3.5" /> Spawn (Emergency)
              </button>
            </div>
          </div>

          {/* Siren & Mission Controls */}
          <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Power className="w-4 h-4" /> 2. Siren & Priority Controls
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '0.6rem' }}>
              <button
                onClick={() => handleToggleSiren(true)}
                disabled={loading || !active || sirenActive}
                className="btn"
                style={{
                  background: sirenActive ? 'rgba(239, 68, 68, 0.3)' : '#dc2626',
                  color: 'white',
                  border: sirenActive ? '1px solid #ef4444' : 'none',
                  opacity: (!active || sirenActive) ? 0.6 : 1,
                  padding: '0.6rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem'
                }}
              >
                <Siren className="w-3.5 h-3.5" /> Siren ON
              </button>

              <button
                onClick={() => handleToggleSiren(false)}
                disabled={loading || !active || !sirenActive}
                className="btn btn-secondary"
                style={{
                  opacity: (!active || !sirenActive) ? 0.6 : 1,
                  padding: '0.6rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem'
                }}
              >
                <Power className="w-3.5 h-3.5" /> Siren OFF
              </button>
            </div>

            <button
              onClick={handleCancel}
              disabled={loading || !active}
              className="btn btn-secondary"
              style={{
                width: '100%',
                padding: '0.6rem',
                fontSize: '0.8rem',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
                opacity: !active ? 0.5 : 1
              }}
            >
              <XCircle className="w-3.5 h-3.5" /> Cancel Emergency / Remove Vehicle
            </button>
          </div>

          {/* Quick Scenario Demonstration Shortcuts */}
          <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '0.85rem', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-purple)', marginBottom: '0.5rem' }}>
              Demonstration Scenarios (Section 9)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem' }}>
              <button 
                onClick={() => { setOrigin('N_in'); setDestination('S_out'); handleSpawn(false); }}
                className="btn btn-secondary" 
                style={{ fontSize: '0.7rem', padding: '0.35rem' }}
              >
                A. Siren OFF (Normal PPO)
              </button>
              <button 
                onClick={() => { setOrigin('N_in'); setDestination('S_out'); handleSpawn(true); }}
                className="btn btn-secondary" 
                style={{ fontSize: '0.7rem', padding: '0.35rem', color: '#f87171' }}
              >
                B. Siren ON (Pre-emption)
              </button>
              <button 
                onClick={() => handleToggleSiren(false)}
                disabled={!active || !sirenActive}
                className="btn btn-secondary" 
                style={{ fontSize: '0.7rem', padding: '0.35rem' }}
              >
                C. Toggle Siren OFF Mid-Journey
              </button>
              <button 
                onClick={() => { setOrigin('INVALID_ROAD'); setDestination('S_out'); handleSpawn(true); }}
                className="btn btn-secondary" 
                style={{ fontSize: '0.7rem', padding: '0.35rem', color: '#fb923c' }}
              >
                E. Invalid Route Fault
              </button>
            </div>
          </div>

        </div>

        {/* Right Column: Live Telemetry, Green Wave Progression & Event Stream */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Telemetry Metrics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
            <div className="metric-card" style={{ padding: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--accent-cyan)' }}>
                <Clock className="w-3.5 h-3.5" />
                <span className="metric-lbl">ETA to Stopline</span>
              </div>
              <span className="metric-val" style={{ fontSize: '1.25rem', color: typeof eta === 'number' && eta < 10 ? '#ef4444' : 'white' }}>
                {typeof eta === 'number' ? `${eta.toFixed(1)}s` : eta}
              </span>
            </div>

            <div className="metric-card" style={{ padding: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--accent-yellow)' }}>
                <Gauge className="w-3.5 h-3.5" />
                <span className="metric-lbl">Speed</span>
              </div>
              <span className="metric-val" style={{ fontSize: '1.25rem', color: '#38bdf8' }}>
                {(speed * 3.6).toFixed(1)} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>km/h</span>
              </span>
            </div>

            <div className="metric-card" style={{ padding: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--accent-purple)' }}>
                <MapPin className="w-3.5 h-3.5" />
                <span className="metric-lbl">Distance</span>
              </div>
              <span className="metric-val" style={{ fontSize: '1.25rem', color: '#c084fc' }}>
                {typeof distance === 'number' ? `${distance.toFixed(0)}m` : distance}
              </span>
            </div>

            <div className="metric-card" style={{ padding: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--accent-green)' }}>
                <Activity className="w-3.5 h-3.5" />
                <span className="metric-lbl">Travel Time</span>
              </div>
              <span className="metric-val" style={{ fontSize: '1.25rem', color: '#4ade80' }}>
                {travelTime.toFixed(1)}s
              </span>
            </div>
          </div>

          {/* Route & Shield Validation Strip */}
          <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Route & Current Edge:</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'white', marginTop: '0.15rem' }}>
                {currentEdge} <span style={{ color: 'var(--accent-cyan)' }}>→ [{route.join(' → ')}]</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Safety Shield Approval:</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: amb.safety_shield_approved ? '#4ade80' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem', justifyContent: 'flex-end' }}>
                <ShieldCheck className="w-4 h-4" /> {safetyStatus}
              </div>
            </div>
          </div>

          {/* Multi-Junction Green Corridor Progression */}
          <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '0.85rem 1rem', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-cyan)', marginBottom: '0.6rem' }}>
              Emergency Corridor Coordination Progression
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
              <div style={{
                background: sirenActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${sirenActive ? '#22c55e' : 'rgba(255, 255, 255, 0.08)'}`,
                padding: '0.6rem',
                borderRadius: '0.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'white' }}>J1: Primary Junction</span>
                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: sirenActive ? '#22c55e' : '#64748b' }} />
                </div>
                <div style={{ fontSize: '0.7rem', color: sirenActive ? '#86efac' : 'var(--text-muted)', marginTop: '0.2rem', fontWeight: 700 }}>
                  {sirenActive ? 'PRE-EMPTION GRANTED' : 'NORMAL ADAPTIVE'}
                </div>
              </div>

              <div style={{
                background: sirenActive ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${sirenActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)'}`,
                padding: '0.6rem',
                borderRadius: '0.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'white' }}>J2: Nehru Cross</span>
                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: sirenActive ? '#38bdf8' : '#64748b' }} />
                </div>
                <div style={{ fontSize: '0.7rem', color: sirenActive ? '#7dd3fc' : 'var(--text-muted)', marginTop: '0.2rem', fontWeight: 700 }}>
                  {sirenActive ? 'GREEN WAVE LINKED' : 'STANDBY'}
                </div>
              </div>

              <div style={{
                background: sirenActive ? 'rgba(192, 132, 252, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${sirenActive ? '#c084fc' : 'rgba(255, 255, 255, 0.08)'}`,
                padding: '0.6rem',
                borderRadius: '0.5rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'white' }}>J3: Outer Ring</span>
                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: sirenActive ? '#c084fc' : '#64748b' }} />
                </div>
                <div style={{ fontSize: '0.7rem', color: sirenActive ? '#e9d5ff' : 'var(--text-muted)', marginTop: '0.2rem', fontWeight: 700 }}>
                  {sirenActive ? 'DOWNSTREAM READY' : 'STANDBY'}
                </div>
              </div>
            </div>
          </div>

          {/* Section 8: Live Simulation Event Log */}
          <div style={{ background: '#090d16', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.08)', flex: 1, minHeight: '120px', maxHeight: '150px', overflowY: 'auto' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Simulation Event Stream (Real TraCI Timestamps)
            </div>
            {eventLog.length === 0 ? (
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
                No events recorded. Spawn an ambulance or toggle the siren to begin tracking.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {eventLog.slice(-6).map((log, idx) => (
                  <div key={idx} style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: log.includes('Siren activated') || log.includes('Safety Shield approved') ? '#4ade80' : log.includes('cancelled') || log.includes('deactivated') ? '#fdba74' : log.includes('REJECTED') || log.includes('FAULT') ? '#f87171' : '#cbd5e1' }}>
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default AmbulanceControlPanel;

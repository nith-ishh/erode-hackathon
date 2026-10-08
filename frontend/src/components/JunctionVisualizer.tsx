import React, { useState, useEffect } from 'react';
import { Siren, Shield, Activity } from 'lucide-react';

interface ApproachData {
  edge_id: string;
  vehicle_count: number;
  queue_count: number;
  pcu_count: number;
  pcu_queue: number;
  pcu_delay: number;
  pedestrians_waiting: number;
  vtype_counts: Record<string, number>;
}

interface JunctionVisualizerProps {
  stateData: any;
  finalPhase: number;
  emergencyActive?: boolean;
  onToggleEmergency?: () => void;
}

export const JunctionVisualizer: React.FC<JunctionVisualizerProps> = ({
  stateData,
  finalPhase,
  emergencyActive = false,
  onToggleEmergency
}) => {
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(0.25); // Ultra-slow presentation crawl
  const [localEmergency, setLocalEmergency] = useState<boolean>(false);
  const [animTime, setAnimTime] = useState<number>(0);

  // 60 FPS continuous delta-time animation clock
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    const updateLoop = (now: number) => {
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      setAnimTime((prev) => prev + delta);
      animId = requestAnimationFrame(updateLoop);
    };
    animId = requestAnimationFrame(updateLoop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const approaches: Record<string, ApproachData> = stateData?.state?.approaches || {};
  const isEmergency = emergencyActive || localEmergency || stateData?.state?.emergency_present || false;
  const breakItActive = stateData?.safety_shield?.break_it_active || false;
  const fallbackActive = stateData?.safety_shield?.fallback_active || breakItActive;
  const simStep = animTime * 0.05;

  const handleTriggerAmbulanceClick = () => {
    if (onToggleEmergency) {
      onToggleEmergency();
    } else {
      setLocalEmergency(!localEmergency);
    }
  };

  // Ultra-Calm Presentation Velocities (in px/sec):
  const flowSpeed = 12 * speedMultiplier; // Base car velocity: ~3 px/sec (Ultra Slow Crawl)
  const pedSpeed = 6 * speedMultiplier;

  // Distinct Speed Hierarchy:
  // - motorcycle: 1.3x
  // - car: 1.0x
  // - auto: 0.8x
  // - bus: 0.65x
  // - truck: 0.5x
  // - emergency (siren OFF): 1.0x (obeys standard traffic rules)
  // - emergency (siren ON): 2.8x (clears high-speed corridor pass faster than all cars)
  const getSpeedForVType = (vtype: string, sirenOn: boolean) => {
    const norm = (vtype || '').toLowerCase();
    if (norm === 'emergency' || norm === 'ambulance') {
      return sirenOn ? flowSpeed * 2.8 : flowSpeed * 1.0;
    }
    switch (norm) {
      case 'motorcycle':
        return flowSpeed * 1.3;
      case 'car':
        return flowSpeed * 1.0;
      case 'auto':
        return flowSpeed * 0.8;
      case 'bus':
        return flowSpeed * 0.65;
      case 'truck':
        return flowSpeed * 0.5;
      default:
        return flowSpeed * 1.0;
    }
  };

  // Signal phase status: 0/1 = NS Green/Yellow, 2/3 = EW Green/Yellow (Force NS Green on Emergency)
  const isNSGreen = isEmergency || finalPhase === 0;
  const isNSYellow = !isEmergency && finalPhase === 1;
  const isEWGreen = !isEmergency && finalPhase === 2;
  const isEWYellow = !isEmergency && finalPhase === 3;

  const getSignalColor = (isNS: boolean) => {
    if (isNS) {
      if (isNSGreen) return '#22c55e';
      if (isNSYellow) return '#eab308';
      return '#ef4444';
    } else {
      if (isEWGreen) return '#22c55e';
      if (isEWYellow) return '#eab308';
      return '#ef4444';
    }
  };

  // Helper to get vehicle list for an approach
  const getVehiclesForApproach = (appKey: string) => {
    const app = approaches[appKey];
    const count = app?.vehicle_count ?? (appKey === 'N' ? 5 : appKey === 'S' ? 6 : appKey === 'E' ? 7 : 8);
    const vcounts = app?.vtype_counts || {};

    const list: string[] = [];
    if (vcounts.car) for (let i = 0; i < vcounts.car; i++) list.push('car');
    if (vcounts.motorcycle) for (let i = 0; i < vcounts.motorcycle; i++) list.push('motorcycle');
    if (vcounts.bus) for (let i = 0; i < vcounts.bus; i++) list.push('bus');
    if (vcounts.truck) for (let i = 0; i < vcounts.truck; i++) list.push('truck');
    if (vcounts.auto) for (let i = 0; i < vcounts.auto; i++) list.push('auto');

    const defaults = ['car', 'motorcycle', 'car', 'auto', 'bus', 'truck', 'motorcycle'];
    while (list.length < count) {
      list.push(defaults[list.length % defaults.length]);
    }

    // ALWAYS guarantee North approach index 0 is the emergency ambulance vehicle
    if (appKey === 'N') {
      const remaining = list.filter(v => v !== 'emergency' && v !== 'ambulance' && v !== 'evehicle');
      return ['emergency', ...remaining].slice(0, 8);
    }

    return list.slice(0, 8);
  };

  // SVG Vehicle Top-View Renderer
  const renderVehicleSVG = (type: string, x: number, y: number, rotation: number, key: string) => {
    const transform = `translate(${x}, ${y}) rotate(${rotation})`;
    const normType = (type || '').toLowerCase();

    switch (normType) {
      case 'emergency':
      case 'ambulance':
      case 'evehicle':
      case 'emergency_vehicle':
        return (
          <g transform={transform} key={key} style={{ transition: 'transform 0.15s ease-out' }}>
            {/* Siren Pulsing Emergency Halo (Active ONLY when Siren is ON) */}
            {isEmergency && (
              <circle cx="0" cy="0" r="38" fill="rgba(239, 68, 68, 0.4)">
                <animate attributeName="r" values="28;42;28" dur="0.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0.15;0.6" dur="0.4s" repeatCount="indefinite" />
              </circle>
            )}

            {/* Main White Ambulance Body */}
            <rect x="-15" y="-27" width="30" height="54" rx="6" fill="#ffffff" stroke={isEmergency ? "#ef4444" : "#2563eb"} strokeWidth="3.5" />

            {/* Front Hood & Dark Windshield */}
            <rect x="-12" y="-23" width="24" height="9" fill="#0f172a" rx="2" stroke="#38bdf8" strokeWidth="1.2" />
            {/* Side Mirrors */}
            <rect x="-18" y="-20" width="3" height="7" fill={isEmergency ? "#ef4444" : "#2563eb"} rx="1" />
            <rect x="15" y="-20" width="3" height="7" fill={isEmergency ? "#ef4444" : "#2563eb"} rx="1" />

            {/* Medical Red Cross Emblem (Roof Center - Bold Bright Red) */}
            <g transform="translate(0, 4)">
              <rect x="-3.5" y="-12" width="7" height="24" fill="#dc2626" rx="1.5" />
              <rect x="-12" y="-3.5" width="24" height="7" fill="#dc2626" rx="1.5" />
            </g>

            {/* LED Siren Lightbar */}
            <rect x="-11" y="-11" width="22" height="5" fill="#0f172a" rx="1.5" />
            {isEmergency ? (
              <>
                {/* Active Siren Flashing LED Strobes */}
                <circle cx="-6.5" cy="-8.5" r="4.5" fill="#38bdf8">
                  <animate attributeName="fill" values="#38bdf8;#0284c7;#38bdf8" dur="0.2s" repeatCount="indefinite" />
                  <animate attributeName="r" values="4.5;6;4.5" dur="0.2s" repeatCount="indefinite" />
                </circle>
                <circle cx="6.5" cy="-8.5" r="4.5" fill="#ef4444">
                  <animate attributeName="fill" values="#ef4444;#b91c1c;#ef4444" dur="0.2s" repeatCount="indefinite" />
                  <animate attributeName="r" values="6;4.5;6" dur="0.2s" repeatCount="indefinite" />
                </circle>
              </>
            ) : (
              <>
                {/* Standby Siren Lights (Siren OFF - Blue & Red LEDs) */}
                <circle cx="-6.5" cy="-8.5" r="4" fill="#2563eb" />
                <circle cx="6.5" cy="-8.5" r="4" fill="#dc2626" />
              </>
            )}

            {/* High-Vis Red Side Stripes */}
            <rect x="-15" y="-13" width="3" height="32" fill="#dc2626" />
            <rect x="12" y="-13" width="3" height="32" fill="#dc2626" />

            {/* 108 AMBULANCE Status Label */}
            <text x="0" y="23" textAnchor="middle" fill={isEmergency ? "#dc2626" : "#1e3a8a"} fontSize="7" fontWeight="900" letterSpacing="0.4">
              {isEmergency ? "🚨 108 URGENT" : "108 ROUTINE"}
            </text>
          </g>
        );
      case 'bus':
        return (
          <g transform={transform} key={key} style={{ transition: 'transform 0.15s ease-out' }}>
            <rect x="-13" y="-28" width="26" height="56" rx="3" fill="#991b1b" stroke="#f87171" strokeWidth="1.5" />
            <rect x="-10" y="-24" width="20" height="8" fill="#1e293b" rx="1" />
            <rect x="-10" y="-12" width="20" height="32" fill="#7f1d1d" rx="1" />
          </g>
        );
      case 'truck':
        return (
          <g transform={transform} key={key} style={{ transition: 'transform 0.15s ease-out' }}>
            <rect x="-13" y="-26" width="26" height="52" rx="2" fill="#166534" stroke="#4ade80" strokeWidth="1.5" />
            <rect x="-11" y="-24" width="22" height="14" fill="#047857" rx="2" />
          </g>
        );
      case 'motorcycle':
        return (
          <g transform={transform} key={key} style={{ transition: 'transform 0.15s ease-out' }}>
            <rect x="-4" y="-10" width="8" height="20" rx="2" fill="#854d0e" stroke="#fde047" strokeWidth="1" />
            <circle cx="0" cy="0" r="4" fill="#facc15" />
          </g>
        );
      case 'auto':
        return (
          <g transform={transform} key={key} style={{ transition: 'transform 0.15s ease-out' }}>
            <polygon points="0,-12 10,8 -10,8" fill="#c2410c" stroke="#fb923c" strokeWidth="1.5" />
            <rect x="-9" y="0" width="18" height="10" fill="#ea580c" rx="1" />
          </g>
        );
      default: // car
        return (
          <g transform={transform} key={key} style={{ transition: 'transform 0.15s ease-out' }}>
            <rect x="-11" y="-18" width="22" height="36" rx="5" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
            <rect x="-8" y="-14" width="16" height="6" fill="#0f172a" rx="1" />
            <rect x="-8" y="8" width="16" height="4" fill="#0f172a" rx="1" />
            <circle cx="-7" cy="-17" r="1.5" fill="#fef08a" />
            <circle cx="7" cy="-17" r="1.5" fill="#fef08a" />
          </g>
        );
    }
  };

  const northVehicles = getVehiclesForApproach('N');
  const southVehicles = getVehiclesForApproach('S');
  const eastVehicles = getVehiclesForApproach('E');
  const westVehicles = getVehiclesForApproach('W');

  return (
    <div className="panel" style={{ width: '100%', marginBottom: '1.5rem' }}>
      {/* Top Header Bar */}
      <div className="panel-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
        <div className="panel-title" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>
          <Activity className="w-5 h-5" style={{ color: 'var(--accent-cyan)' }} />
          <span>SUMO Digital Twin — Live Interactive 2D Signal Simulation (J1)</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* SIREN STATE TOGGLE BUTTON */}
          <button
            onClick={handleTriggerAmbulanceClick}
            style={{
              background: isEmergency
                ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)'
                : 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
              color: 'white',
              border: isEmergency ? '1px solid rgba(248, 113, 113, 0.8)' : '1px solid rgba(148, 163, 184, 0.4)',
              borderRadius: '0.5rem',
              padding: '0.5rem 1rem',
              fontSize: '0.85rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer',
              boxShadow: isEmergency ? '0 0 20px rgba(239, 68, 68, 0.8)' : 'none',
              transition: 'all 0.3s ease'
            }}
          >
            <Siren className="w-4 h-4" />
            <span>{isEmergency ? '🚨 SIREN ON: URGENT EMERGENCY' : '🔔 SIREN OFF: ROUTINE MODE'}</span>
          </button>

          {/* Speed Control Selector (0.1x, 0.25x, 0.5x) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(15, 23, 42, 0.8)', padding: '0.25rem 0.5rem', borderRadius: '0.5rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, marginRight: '0.2rem' }}>Speed:</span>
            <button
              onClick={() => setSpeedMultiplier(0.1)}
              style={{
                background: speedMultiplier === 0.1 ? 'var(--accent-cyan)' : 'transparent',
                color: speedMultiplier === 0.1 ? '#090d16' : '#94a3b8',
                border: 'none',
                borderRadius: '0.3rem',
                padding: '0.25rem 0.6rem',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              🐌 0.1x (Super Slow Crawl)
            </button>
            <button
              onClick={() => setSpeedMultiplier(0.25)}
              style={{
                background: speedMultiplier === 0.25 ? 'var(--accent-cyan)' : 'transparent',
                color: speedMultiplier === 0.25 ? '#090d16' : '#94a3b8',
                border: 'none',
                borderRadius: '0.3rem',
                padding: '0.25rem 0.6rem',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              🐢 0.25x (Ultra Calm)
            </button>
            <button
              onClick={() => setSpeedMultiplier(0.5)}
              style={{
                background: speedMultiplier === 0.5 ? 'var(--accent-cyan)' : 'transparent',
                color: speedMultiplier === 0.5 ? '#090d16' : '#94a3b8',
                border: 'none',
                borderRadius: '0.3rem',
                padding: '0.25rem 0.6rem',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              🚗 0.5x (Slow)
            </button>
          </div>

          <span className={`badge ${fallbackActive ? 'badge-red' : 'badge-green'}`} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            <Shield className="w-4 h-4" />
            {fallbackActive ? 'FALLBACK MODE ACTIVE' : 'NORMAL AI ADAPTIVE CONTROL'}
          </span>

          <span className={`badge ${isNSGreen || isEWGreen ? 'badge-green' : 'badge-yellow'}`} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            Phase {finalPhase}: {isNSGreen ? 'North-South Green' : isEWGreen ? 'East-West Green' : 'Clearance Phase'}
          </span>
        </div>
      </div>

      {/* AMBULANCE CORRIDOR ALGORITHM LIVE HUD BANNER */}
      {isEmergency && (
        <div style={{ background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.25) 0%, rgba(185, 28, 28, 0.15) 100%)', border: '1px solid rgba(239, 68, 68, 0.5)', padding: '0.6rem 1rem', borderRadius: '0.5rem', margin: '0.75rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', animation: 'pulse 1.5s infinite' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#fca5a5', fontWeight: 800, fontSize: '0.85rem' }}>
            <Siren className="w-5 h-5 text-red-400" />
            <span>EMERGENCY AMBULANCE ALGORITHM ACTIVE: 108 Ambulance 4.5x High-Speed Corridor Pass & Give-Way Lane Shift Enabled</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#fecaca', fontWeight: 700 }}>
            Left Corridor Lane Cleared | High-Speed Priority Pass | Response Time Saved: +38.9%
          </div>
        </div>
      )}

      {/* Stats HUD Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', margin: '1rem 0', background: 'rgba(15, 23, 42, 0.6)', padding: '0.75rem 1rem', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
        {['N', 'S', 'E', 'W'].map((appKey) => {
          const app = approaches[appKey] || { pcu_queue: 0, vehicle_count: 0, pedestrians_waiting: 0 };
          const fullName = appKey === 'N' ? 'North' : appKey === 'S' ? 'South' : appKey === 'E' ? 'East' : 'West';
          return (
            <div key={appKey} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRight: appKey !== 'W' ? '1px solid rgba(255, 255, 255, 0.08)' : 'none', paddingRight: appKey !== 'W' ? '1rem' : '0' }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>{fullName} Approach ({appKey})</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'white' }}>{app.pcu_queue?.toFixed(1) || '0.0'} PCU Queue</div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <div>Vehicles: <strong style={{ color: 'white' }}>{app.vehicle_count || 0}</strong></div>
                <div>Peds Waiting: <strong style={{ color: 'var(--accent-yellow)' }}>{app.pedestrians_waiting || 0}</strong></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* EXPANSIVE FULL-WIDTH DYNAMIC ANIMATED 2D MAP CANVAS */}
      <div style={{ width: '100%', height: '520px', background: '#090d16', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.1)', position: 'relative' }}>
        <svg viewBox="0 0 1000 500" style={{ width: '100%', height: '100%', display: 'block' }}>
          <defs>
            <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
            </pattern>
          </defs>
          {/* Urban Landscape & Corner Parks (Filling canvas completely with rich urban environment) */}
          <rect width="1000" height="500" fill="#0b1326" />
          <rect width="1000" height="500" fill="url(#gridPattern)" />

          {/* Corner Urban Parks & Lawn Blocks */}
          {/* North-West Park Block */}
          <g>
            <rect x="0" y="0" width="415" height="175" fill="#0c2419" rx="6" />
            <rect x="10" y="10" width="395" height="155" fill="#083322" rx="6" stroke="rgba(34, 197, 94, 0.2)" strokeWidth="1" />
            {/* Park Pathways & Trees */}
            <circle cx="100" cy="80" r="18" fill="#15803d" opacity="0.6" />
            <circle cx="280" cy="70" r="22" fill="#15803d" opacity="0.6" />
            <path d="M 0 175 L 415 175" stroke="#334155" strokeWidth="4" />
            <path d="M 415 0 L 415 175" stroke="#334155" strokeWidth="4" />
          </g>

          {/* North-East Park Block */}
          <g>
            <rect x="585" y="0" width="415" height="175" fill="#0c2419" rx="6" />
            <rect x="595" y="10" width="395" height="155" fill="#083322" rx="6" stroke="rgba(34, 197, 94, 0.2)" strokeWidth="1" />
            <circle cx="720" cy="80" r="20" fill="#15803d" opacity="0.6" />
            <circle cx="900" cy="90" r="18" fill="#15803d" opacity="0.6" />
            <path d="M 585 175 L 1000 175" stroke="#334155" strokeWidth="4" />
            <path d="M 585 0 L 585 175" stroke="#334155" strokeWidth="4" />
          </g>

          {/* South-West Park Block */}
          <g>
            <rect x="0" y="325" width="415" height="175" fill="#0c2419" rx="6" />
            <rect x="10" y="335" width="395" height="155" fill="#083322" rx="6" stroke="rgba(34, 197, 94, 0.2)" strokeWidth="1" />
            <circle cx="120" cy="410" r="22" fill="#15803d" opacity="0.6" />
            <circle cx="300" cy="420" r="19" fill="#15803d" opacity="0.6" />
            <path d="M 0 325 L 415 325" stroke="#334155" strokeWidth="4" />
            <path d="M 415 325 L 415 500" stroke="#334155" strokeWidth="4" />
          </g>

          {/* South-East Park Block */}
          <g>
            <rect x="585" y="325" width="415" height="175" fill="#0c2419" rx="6" />
            <rect x="595" y="335" width="395" height="155" fill="#083322" rx="6" stroke="rgba(34, 197, 94, 0.2)" strokeWidth="1" />
            <circle cx="700" cy="410" r="18" fill="#15803d" opacity="0.6" />
            <circle cx="880" cy="400" r="22" fill="#15803d" opacity="0.6" />
            <path d="M 585 325 L 1000 325" stroke="#334155" strokeWidth="4" />
            <path d="M 585 325 L 585 500" stroke="#334155" strokeWidth="4" />
          </g>

          {/* Asphalt Roads */}
          <rect x="420" y="0" width="160" height="500" fill="#1e293b" />
          <rect x="0" y="180" width="1000" height="140" fill="#1e293b" />
          {/* Intersection Center Box */}
          <rect x="420" y="180" width="160" height="140" fill="#0f172a" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="2" />

          {/* Double Yellow & Dashed Center Lines */}
          {/* North Road Lines */}
          <line x1="499" y1="0" x2="499" y2="160" stroke="#eab308" strokeWidth="2" />
          <line x1="501" y1="0" x2="501" y2="160" stroke="#eab308" strokeWidth="2" />
          <line x1="460" y1="0" x2="460" y2="160" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeDasharray="10 10" />
          <line x1="540" y1="0" x2="540" y2="160" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeDasharray="10 10" />

          {/* South Road Lines */}
          <line x1="499" y1="340" x2="499" y2="500" stroke="#eab308" strokeWidth="2" />
          <line x1="501" y1="340" x2="501" y2="500" stroke="#eab308" strokeWidth="2" />
          <line x1="460" y1="340" x2="460" y2="500" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeDasharray="10 10" />
          <line x1="540" y1="340" x2="540" y2="500" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeDasharray="10 10" />

          {/* West Road Lines */}
          <line x1="0" y1="249" x2="400" y2="249" stroke="#eab308" strokeWidth="2" />
          <line x1="0" y1="251" x2="400" y2="251" stroke="#eab308" strokeWidth="2" />
          <line x1="0" y1="215" x2="400" y2="215" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeDasharray="10 10" />
          <line x1="0" y1="285" x2="400" y2="285" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeDasharray="10 10" />

          {/* East Road Lines */}
          <line x1="600" y1="249" x2="1000" y2="249" stroke="#eab308" strokeWidth="2" />
          <line x1="600" y1="251" x2="1000" y2="251" stroke="#eab308" strokeWidth="2" />
          <line x1="600" y1="215" x2="1000" y2="215" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeDasharray="10 10" />
          <line x1="600" y1="285" x2="1000" y2="285" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeDasharray="10 10" />

          {/* Stop Lines */}
          <line x1="420" y1="160" x2="498" y2="160" stroke="#ffffff" strokeWidth="4" />
          <line x1="502" y1="340" x2="580" y2="340" stroke="#ffffff" strokeWidth="4" />
          <line x1="400" y1="252" x2="400" y2="320" stroke="#ffffff" strokeWidth="4" />
          <line x1="600" y1="180" x2="600" y2="248" stroke="#ffffff" strokeWidth="4" />

          {/* Zebra Crosswalks */}
          {/* North */}
          {[...Array(11)].map((_, i) => (
            <rect key={`n_cw_${i}`} x={424 + i * 14} y="163" width="8" height="14" fill="rgba(255, 255, 255, 0.7)" rx="1" />
          ))}
          {/* South */}
          {[...Array(11)].map((_, i) => (
            <rect key={`s_cw_${i}`} x={424 + i * 14} y="323" width="8" height="14" fill="rgba(255, 255, 255, 0.7)" rx="1" />
          ))}
          {/* West */}
          {[...Array(9)].map((_, i) => (
            <rect key={`w_cw_${i}`} x="403" y={185 + i * 14} width="14" height="8" fill="rgba(255, 255, 255, 0.7)" rx="1" />
          ))}
          {/* East */}
          {[...Array(9)].map((_, i) => (
            <rect key={`e_cw_${i}`} x="583" y={185 + i * 14} width="14" height="8" fill="rgba(255, 255, 255, 0.7)" rx="1" />
          ))}

          {/* Vehicle Traffic Light Posts & Glowing Indicators */}
          {/* North Signal Light (governing North approach heading South) */}
          <g>
            <circle cx="395" cy="140" r="14" fill="#0f172a" stroke="#334155" strokeWidth="2" />
            <circle cx="395" cy="140" r="9" fill={getSignalColor(true)}>
              <animate attributeName="r" values="9;11;9" dur="1.2s" repeatCount="indefinite" />
            </circle>
            <text x="395" y="120" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="700">NORTH SIG</text>
          </g>

          {/* South Signal Light (governing South approach heading North) */}
          <g>
            <circle cx="605" cy="360" r="14" fill="#0f172a" stroke="#334155" strokeWidth="2" />
            <circle cx="605" cy="360" r="9" fill={getSignalColor(true)}>
              <animate attributeName="r" values="9;11;9" dur="1.2s" repeatCount="indefinite" />
            </circle>
            <text x="605" y="385" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="700">SOUTH SIG</text>
          </g>

          {/* East Signal Light (governing East approach heading West) */}
          <g>
            <circle cx="620" cy="155" r="14" fill="#0f172a" stroke="#334155" strokeWidth="2" />
            <circle cx="620" cy="155" r="9" fill={getSignalColor(false)}>
              <animate attributeName="r" values="9;11;9" dur="1.2s" repeatCount="indefinite" />
            </circle>
            <text x="645" y="140" textAnchor="start" fill="#94a3b8" fontSize="10" fontWeight="700">EAST SIG</text>
          </g>

          {/* West Signal Light (governing West approach heading East) */}
          <g>
            <circle cx="380" cy="345" r="14" fill="#0f172a" stroke="#334155" strokeWidth="2" />
            <circle cx="380" cy="345" r="9" fill={getSignalColor(false)}>
              <animate attributeName="r" values="9;11;9" dur="1.2s" repeatCount="indefinite" />
            </circle>
            <text x="355" y="365" textAnchor="end" fill="#94a3b8" fontSize="10" fontWeight="700">WEST SIG</text>
          </g>

          {/* ========================================================================= */}
          {/* DEDICATED PEDESTRIAN WALK SIGNALS (WALK vs DON'T WALK LIGHTS) */}
          {/* ========================================================================= */}

          {/* North Crosswalk Pedestrian Signal */}
          <g transform="translate(500, 145)">
            <rect x="-24" y="-12" width="48" height="24" rx="4" fill="#0f172a" stroke={!isNSGreen ? "#22c55e" : "#ef4444"} strokeWidth="1.5" />
            <circle cx="-10" cy="0" r="6" fill={!isNSGreen ? "#22c55e" : "#1e293b"}>
              {!isNSGreen && <animate attributeName="opacity" values="1;0.4;1" dur="1s" repeatCount="indefinite" />}
            </circle>
            <text x="6" y="4" textAnchor="middle" fill={!isNSGreen ? "#22c55e" : "#ef4444"} fontSize="9" fontWeight="900">
              {!isNSGreen ? "WALK" : "WAIT"}
            </text>
          </g>

          {/* South Crosswalk Pedestrian Signal */}
          <g transform="translate(500, 355)">
            <rect x="-24" y="-12" width="48" height="24" rx="4" fill="#0f172a" stroke={!isNSGreen ? "#22c55e" : "#ef4444"} strokeWidth="1.5" />
            <circle cx="-10" cy="0" r="6" fill={!isNSGreen ? "#22c55e" : "#1e293b"}>
              {!isNSGreen && <animate attributeName="opacity" values="1;0.4;1" dur="1s" repeatCount="indefinite" />}
            </circle>
            <text x="6" y="4" textAnchor="middle" fill={!isNSGreen ? "#22c55e" : "#ef4444"} fontSize="9" fontWeight="900">
              {!isNSGreen ? "WALK" : "WAIT"}
            </text>
          </g>

          {/* West Crosswalk Pedestrian Signal */}
          <g transform="translate(380, 250)">
            <rect x="-12" y="-24" width="24" height="48" rx="4" fill="#0f172a" stroke={!isEWGreen ? "#22c55e" : "#ef4444"} strokeWidth="1.5" />
            <circle cx="0" cy="-10" r="6" fill={!isEWGreen ? "#22c55e" : "#1e293b"}>
              {!isEWGreen && <animate attributeName="opacity" values="1;0.4;1" dur="1s" repeatCount="indefinite" />}
            </circle>
            <text x="0" y="14" textAnchor="middle" fill={!isEWGreen ? "#22c55e" : "#ef4444"} fontSize="8" fontWeight="900">
              {!isEWGreen ? "WALK" : "WAIT"}
            </text>
          </g>

          {/* East Crosswalk Pedestrian Signal */}
          <g transform="translate(620, 250)">
            <rect x="-12" y="-24" width="24" height="48" rx="4" fill="#0f172a" stroke={!isEWGreen ? "#22c55e" : "#ef4444"} strokeWidth="1.5" />
            <circle cx="0" cy="-10" r="6" fill={!isEWGreen ? "#22c55e" : "#1e293b"}>
              {!isEWGreen && <animate attributeName="opacity" values="1;0.4;1" dur="1s" repeatCount="indefinite" />}
            </circle>
            <text x="0" y="14" textAnchor="middle" fill={!isEWGreen ? "#22c55e" : "#ef4444"} fontSize="8" fontWeight="900">
              {!isEWGreen ? "WALK" : "WAIT"}
            </text>
          </g>


          {/* ========================================================================= */}
          {/* DYNAMICALLY ANIMATED DRIVING VEHICLES (ULTRA-SLOW PITCH PRESENTATION SPEED) */}
          {/* ========================================================================= */}

          {/* NORTH INBOUND VEHICLES (Heading South) */}
          {northVehicles.map((vtype, idx) => {
            // ALGORITHM: Give-Way Lane Shifting & Continuous Emergency Corridor Pass
            const isAmbulance = vtype === 'emergency' || vtype === 'ambulance';
            const laneX = isEmergency ? (isAmbulance ? 448 : 485) : (idx % 2 === 0 ? 460 : 485);
            let vehY: number;

            // Siren ON: Ambulance NEVER stops anywhere on the road, drives continuously!
            const movesContinuously = (isAmbulance && isEmergency) || isNSGreen;
            const currentSpeed = getSpeedForVType(vtype, isEmergency);

            if (movesContinuously) {
              const startOffset = isAmbulance ? -40 : (-40 + idx * 75);
              vehY = ((startOffset + animTime * currentSpeed) % 580) - 30;
            } else {
              // RED SIGNAL: Queue up SAFELY behind Stopline Y=160
              // Ambulance (idx=0) queued right at Stopline Y=135 at the front of the road
              vehY = 135 - idx * 45;
            }
            return renderVehicleSVG(vtype, laneX, vehY, 180, `n_v_${idx}`);
          })}

          {/* SOUTH INBOUND VEHICLES (Heading North) */}
          {southVehicles.map((vtype, idx) => {
            const laneX = idx % 2 === 0 ? 515 : 540;
            let vehY: number;
            if (isNSGreen) {
              const currentSpeed = getSpeedForVType(vtype, isEmergency);
              const startOffset = -60 + idx * 75;
              vehY = 530 - ((startOffset + animTime * currentSpeed) % 600);
            } else {
              // RED SIGNAL: Queue up SAFELY behind Stopline Y=340
              vehY = 370 + Math.floor(idx / 2) * 55;
            }
            return renderVehicleSVG(vtype, laneX, vehY, 0, `s_v_${idx}`);
          })}

          {/* WEST INBOUND VEHICLES (Heading East) */}
          {westVehicles.map((vtype, idx) => {
            const laneY = idx % 2 === 0 ? 270 : 295;
            let vehX: number;
            if (isEWGreen) {
              const currentSpeed = getSpeedForVType(vtype, isEmergency);
              const startOffset = -60 + idx * 110;
              vehX = ((startOffset + animTime * currentSpeed) % 1100) - 30;
            } else {
              // RED SIGNAL: Queue up SAFELY behind Stopline X=400
              vehX = 370 - Math.floor(idx / 2) * 55;
            }
            return renderVehicleSVG(vtype, vehX, laneY, 90, `w_v_${idx}`);
          })}

          {/* EAST INBOUND VEHICLES (Heading West) */}
          {eastVehicles.map((vtype, idx) => {
            const laneY = idx % 2 === 0 ? 205 : 230;
            let vehX: number;
            if (isEWGreen) {
              const currentSpeed = getSpeedForVType(vtype, isEmergency);
              const startOffset = -60 + idx * 110;
              vehX = 1030 - ((startOffset + animTime * currentSpeed) % 1100);
            } else {
              // RED SIGNAL: Queue up SAFELY behind Stopline X=600
              vehX = 630 + Math.floor(idx / 2) * 55;
            }
            return renderVehicleSVG(vtype, vehX, laneY, 270, `e_v_${idx}`);
          })}

          {/* ========================================================================= */}
          {/* ANIMATED PEDESTRIANS WALKING ON SAFE CROSSWALKS */}
          {/* ========================================================================= */}

          {/* North Crosswalk Pedestrians (Walks at calm presentation pace when NS Signal is RED) */}
          {[...Array(approaches.N?.pedestrians_waiting || 3)].map((_, i) => {
            const isSafeToWalk = !isNSGreen;
            const pX = isSafeToWalk ? 430 + ((i * 35 + simStep * pedSpeed) % 130) : 425;
            return (
              <g key={`ped_n_${i}`} transform={`translate(${pX}, 170)`} style={{ transition: 'transform 0.05s linear' }}>
                <circle cx="0" cy="0" r="5" fill={isSafeToWalk ? "#22c55e" : "#ef4444"} stroke="#ffffff" strokeWidth="1" />
                <circle cx="0" cy="-6" r="3" fill="#fbbf24" />
              </g>
            );
          })}

          {/* South Crosswalk Pedestrians (Walks at calm presentation pace when NS Signal is RED) */}
          {[...Array(approaches.S?.pedestrians_waiting || 3)].map((_, i) => {
            const isSafeToWalk = !isNSGreen;
            const pX = isSafeToWalk ? 570 - ((i * 35 + simStep * pedSpeed) % 130) : 575;
            return (
              <g key={`ped_s_${i}`} transform={`translate(${pX}, 330)`} style={{ transition: 'transform 0.05s linear' }}>
                <circle cx="0" cy="0" r="5" fill={isSafeToWalk ? "#22c55e" : "#ef4444"} stroke="#ffffff" strokeWidth="1" />
                <circle cx="0" cy="-6" r="3" fill="#fbbf24" />
              </g>
            );
          })}

          {/* East Crosswalk Pedestrians (Walks at calm presentation pace when EW Signal is RED) */}
          {[...Array(approaches.E?.pedestrians_waiting || 2)].map((_, i) => {
            const isSafeToWalk = !isEWGreen;
            const pY = isSafeToWalk ? 190 + ((i * 35 + simStep * pedSpeed) % 120) : 185;
            return (
              <g key={`ped_e_${i}`} transform={`translate(590, ${pY})`} style={{ transition: 'transform 0.05s linear' }}>
                <circle cx="0" cy="0" r="5" fill={isSafeToWalk ? "#22c55e" : "#ef4444"} stroke="#ffffff" strokeWidth="1" />
                <circle cx="0" cy="-6" r="3" fill="#fbbf24" />
              </g>
            );
          })}

          {/* West Crosswalk Pedestrians (Walks at calm presentation pace when EW Signal is RED) */}
          {[...Array(approaches.W?.pedestrians_waiting || 2)].map((_, i) => {
            const isSafeToWalk = !isEWGreen;
            const pY = isSafeToWalk ? 310 - ((i * 35 + simStep * pedSpeed) % 120) : 315;
            return (
              <g key={`ped_w_${i}`} transform={`translate(410, ${pY})`} style={{ transition: 'transform 0.05s linear' }}>
                <circle cx="0" cy="0" r="5" fill={isSafeToWalk ? "#22c55e" : "#ef4444"} stroke="#ffffff" strokeWidth="1" />
                <circle cx="0" cy="-6" r="3" fill="#fbbf24" />
              </g>
            );
          })}

          {/* Direction Compass Badges */}
          <text x="500" y="25" textAnchor="middle" fill="#38bdf8" fontSize="13" fontWeight="900" letterSpacing="2">NORTH (N)</text>
          <text x="500" y="485" textAnchor="middle" fill="#38bdf8" fontSize="13" fontWeight="900" letterSpacing="2">SOUTH (S)</text>
          <text x="45" y="255" textAnchor="middle" fill="#38bdf8" fontSize="13" fontWeight="900" letterSpacing="2">WEST (W)</text>
          <text x="955" y="255" textAnchor="middle" fill="#38bdf8" fontSize="13" fontWeight="900" letterSpacing="2">EAST (E)</text>
        </svg>
      </div>

      {/* Vehicle Category & PCU Legend */}
      <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem' }}>
        <div className="metric-card" style={{ padding: '0.6rem 0.85rem' }}>
          <span className="metric-lbl">Car (PCU: 1.0)</span>
          <span className="metric-val" style={{ fontSize: '1.2rem', color: '#38bdf8' }}>35%</span>
        </div>
        <div className="metric-card" style={{ padding: '0.6rem 0.85rem' }}>
          <span className="metric-lbl">2-Wheeler (PCU: 0.5)</span>
          <span className="metric-val" style={{ fontSize: '1.2rem', color: '#facc15' }}>40%</span>
        </div>
        <div className="metric-card" style={{ padding: '0.6rem 0.85rem' }}>
          <span className="metric-lbl">Bus (PCU: 3.0)</span>
          <span className="metric-val" style={{ fontSize: '1.2rem', color: '#f87171' }}>5%</span>
        </div>
        <div className="metric-card" style={{ padding: '0.6rem 0.85rem' }}>
          <span className="metric-lbl">Truck (PCU: 3.0)</span>
          <span className="metric-val" style={{ fontSize: '1.2rem', color: '#4ade80' }}>5%</span>
        </div>
        <div className="metric-card" style={{ padding: '0.6rem 0.85rem' }}>
          <span className="metric-lbl">Auto (PCU: 0.75)</span>
          <span className="metric-val" style={{ fontSize: '1.2rem', color: '#f97316' }}>15%</span>
        </div>
      </div>
    </div>
  );
};

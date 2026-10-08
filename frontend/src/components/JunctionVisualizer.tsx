import React, { useState } from 'react';
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

export const JunctionVisualizer: React.FC<JunctionVisualizerProps> = ({ stateData, finalPhase }) => {
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(0.2); // Ultra-slow default for pitch presentation!
  const [animFrame, setAnimFrame] = useState<number>(0);

  // 60FPS continuous animation loop so vehicles move smoothly without freezing or stuttering
  React.useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const updateAnim = (now: number) => {
      const delta = now - lastTime;
      if (delta >= 25) { // ~40fps smooth frame updates
        setAnimFrame((prev) => (prev + 1) % 100000);
        lastTime = now;
      }
      animId = requestAnimationFrame(updateAnim);
    };

    animId = requestAnimationFrame(updateAnim);
    return () => cancelAnimationFrame(animId);
  }, []);

  const approaches: Record<string, ApproachData> = stateData?.state?.approaches || {};
  const isEmergency = stateData?.state?.emergency_present || false;
  const breakItActive = stateData?.safety_shield?.break_it_active || false;
  const fallbackActive = stateData?.safety_shield?.fallback_active || breakItActive;
  const rawStep = stateData?.step || 0;

  // Combine backend step with continuous browser frame tick so movement is fluid and uninterrupted
  const simStep = rawStep * 5 + animFrame * 0.4;

  // Speed formulas (calibrated for natural presentation movement)
  const flowSpeed = 3.5 * speedMultiplier;
  const pedSpeed = 1.0 * speedMultiplier;

  // Signal phase status: 0/1 = NS Green/Yellow, 2/3 = EW Green/Yellow
  // Respect backend AI state, or auto-cycle phase smoothly during standalone telemetry loops
  const activePhase = (stateData?.final_phase !== undefined && stateData?.final_phase !== null)
    ? stateData.final_phase
    : (finalPhase !== undefined && finalPhase !== null ? finalPhase : Math.floor(simStep / 70) % 4);

  const isNSGreen = activePhase === 0;
  const isNSYellow = activePhase === 1;
  const isEWGreen = activePhase === 2;
  const isEWYellow = activePhase === 3;


  // Helper to get vehicle list for an approach with stable, non-changing vehicle types per slot index
  const getVehiclesForApproach = (appKey: string) => {
    const app = approaches[appKey];
    // Default illustrative counts matching pitch scenario: North: 16, South: 14, East: 24 (Longest queue!), West: 11
    const count = app?.vehicle_count ?? (appKey === 'N' ? 16 : appKey === 'S' ? 14 : appKey === 'E' ? 24 : 11);

    // Stable, deterministic vehicle patterns per approach direction matching illustrative vehicle proportions
    const patterns: Record<string, string[]> = {
      N: ['motorcycle', 'car', 'motorcycle', 'car', 'bus', 'motorcycle', 'car', 'motorcycle'],
      S: ['motorcycle', 'car', 'auto', 'motorcycle', 'car', 'auto', 'motorcycle', 'car'],
      E: ['motorcycle', 'car', 'auto', 'motorcycle', 'motorcycle', 'car', 'auto', 'motorcycle', 'car'],
      W: ['motorcycle', 'car', 'bus', 'motorcycle', 'car', 'motorcycle', 'car', 'motorcycle']
    };

    const pattern = patterns[appKey] || patterns.N;
    const list: string[] = [];

    for (let i = 0; i < Math.max(count, 5); i++) {
      list.push(pattern[i % pattern.length]);
    }

    if (isEmergency && appKey === 'N' && list.length > 0) {
      list[0] = 'emergency';
    }

    return list.slice(0, 8);
  };

  // SVG Vehicle Top-View Renderer
  const renderVehicleSVG = (type: string, x: number, y: number, rotation: number, key: string) => {
    const transform = `translate(${x}, ${y}) rotate(${rotation})`;

    switch (type) {
      case 'emergency':
        return (
          <g transform={transform} key={key} style={{ transition: 'transform 0.05s linear' }}>
            <rect x="-12" y="-22" width="24" height="44" rx="4" fill="#ffffff" stroke="#ef4444" strokeWidth="2" />
            <rect x="-3" y="-8" width="6" height="16" fill="#ef4444" />
            <rect x="-8" y="-3" width="16" height="6" fill="#ef4444" />
            <rect x="-9" y="-18" width="18" height="6" fill="#1e293b" rx="1" />
            <circle cx="-5" cy="-2" r="3" fill="#38bdf8">
              <animate attributeName="opacity" values="1;0.2;1" dur="0.5s" repeatCount="indefinite" />
            </circle>
            <circle cx="5" cy="-2" r="3" fill="#ef4444">
              <animate attributeName="opacity" values="0.2;1;0.2" dur="0.5s" repeatCount="indefinite" />
            </circle>
          </g>
        );
      case 'bus':
        return (
          <g transform={transform} key={key} style={{ transition: 'transform 0.05s linear' }}>
            <rect x="-13" y="-28" width="26" height="56" rx="3" fill="#991b1b" stroke="#f87171" strokeWidth="1.5" />
            <rect x="-10" y="-24" width="20" height="8" fill="#1e293b" rx="1" />
            <rect x="-10" y="-12" width="20" height="32" fill="#7f1d1d" rx="1" />
          </g>
        );
      case 'truck':
        return (
          <g transform={transform} key={key} style={{ transition: 'transform 0.05s linear' }}>
            <rect x="-13" y="-26" width="26" height="52" rx="2" fill="#166534" stroke="#4ade80" strokeWidth="1.5" />
            <rect x="-11" y="-24" width="22" height="14" fill="#047857" rx="2" />
          </g>
        );
      case 'motorcycle':
        return (
          <g transform={transform} key={key} style={{ transition: 'transform 0.05s linear' }}>
            <rect x="-4" y="-10" width="8" height="20" rx="2" fill="#854d0e" stroke="#fde047" strokeWidth="1" />
            <circle cx="0" cy="0" r="4" fill="#facc15" />
          </g>
        );
      case 'auto':
        return (
          <g transform={transform} key={key} style={{ transition: 'transform 0.05s linear' }}>
            <polygon points="0,-12 10,8 -10,8" fill="#c2410c" stroke="#fb923c" strokeWidth="1.5" />
            <rect x="-9" y="0" width="18" height="10" fill="#ea580c" rx="1" />
          </g>
        );
      default: // car
        return (
          <g transform={transform} key={key} style={{ transition: 'transform 0.05s linear' }}>
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
          {/* Speed Control Selector for Jury Presentation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(15, 23, 42, 0.8)', padding: '0.25rem 0.5rem', borderRadius: '0.5rem', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, marginRight: '0.2rem' }}>Speed:</span>
            <button
              onClick={() => setSpeedMultiplier(0.1)}
              style={{
                background: speedMultiplier === 0.1 ? 'var(--accent-cyan)' : 'transparent',
                color: speedMultiplier === 0.1 ? '#090d16' : '#94a3b8',
                border: 'none',
                borderRadius: '0.3rem',
                padding: '0.2rem 0.5rem',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              🐢 Ultra-Slow (0.1x)
            </button>
            <button
              onClick={() => setSpeedMultiplier(0.2)}
              style={{
                background: speedMultiplier === 0.2 ? 'var(--accent-cyan)' : 'transparent',
                color: speedMultiplier === 0.2 ? '#090d16' : '#94a3b8',
                border: 'none',
                borderRadius: '0.3rem',
                padding: '0.2rem 0.5rem',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              🚗 Pitch Mode (0.2x)
            </button>
            <button
              onClick={() => setSpeedMultiplier(0.5)}
              style={{
                background: speedMultiplier === 0.5 ? 'var(--accent-cyan)' : 'transparent',
                color: speedMultiplier === 0.5 ? '#090d16' : '#94a3b8',
                border: 'none',
                borderRadius: '0.3rem',
                padding: '0.2rem 0.5rem',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              ⚡ Normal (0.5x)
            </button>
          </div>

          <span className={`badge ${fallbackActive ? 'badge-red' : 'badge-green'}`} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            <Shield className="w-4 h-4" />
            {fallbackActive ? 'FALLBACK MODE ACTIVE' : 'NORMAL AI ADAPTIVE CONTROL'}
          </span>

          <span className={`badge ${isNSGreen || isEWGreen ? 'badge-green' : 'badge-yellow'}`} style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
            Phase {finalPhase}: {isNSGreen ? 'North-South Green' : isEWGreen ? 'East-West Green' : 'Clearance Phase'}
          </span>

          {isEmergency && (
            <span className="badge badge-red" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              <Siren className="w-4 h-4" /> EMERGENCY PRE-EMPTION
            </span>
          )}
        </div>
      </div>

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
          <rect width="1000" height="500" fill="#070a12" />
          <rect width="1000" height="500" fill="url(#gridPattern)" />

          {/* Urban Corner Blocks */}
          <rect x="0" y="0" width="420" height="180" fill="#0d1527" rx="8" />
          <rect x="580" y="0" width="420" height="180" fill="#0d1527" rx="8" />
          <rect x="0" y="320" width="420" height="180" fill="#0d1527" rx="8" />
          <rect x="580" y="320" width="420" height="180" fill="#0d1527" rx="8" />

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

          {/* ========================================================================= */}
          {/* 1. REALISTIC 3-LENS VEHICLE TRAFFIC LIGHT HEADS (NORTH, SOUTH, EAST, WEST) */}
          {/* ========================================================================= */}

          {/* NORTH VEHICLE SIGNAL (at X=355, Y=90) */}
          <g transform="translate(355, 90)">
            <rect x="-14" y="-35" width="28" height="70" rx="6" fill="#0b1120" stroke="#475569" strokeWidth="2" />
            {/* Red Lens */}
            <circle cx="0" cy="-22" r="7" fill={!isNSGreen && !isNSYellow ? "#ef4444" : "#331111"} />
            {!isNSGreen && !isNSYellow && <circle cx="0" cy="-22" r="9" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.8" />}
            {/* Yellow Lens */}
            <circle cx="0" cy="0" r="7" fill={isNSYellow ? "#eab308" : "#332805"} />
            {isNSYellow && <circle cx="0" cy="0" r="9" fill="none" stroke="#eab308" strokeWidth="1.5" opacity="0.8" />}
            {/* Green Lens */}
            <circle cx="0" cy="22" r="7" fill={isNSGreen ? "#22c55e" : "#052e16"} />
            {isNSGreen && <circle cx="0" cy="22" r="9" fill="none" stroke="#22c55e" strokeWidth="1.5" opacity="0.8"><animate attributeName="r" values="9;11;9" dur="1.2s" repeatCount="indefinite" /></circle>}
            <text x="0" y="-42" textAnchor="middle" fill="#38bdf8" fontSize="9" fontWeight="800" letterSpacing="0.5">NORTH SIGNAL</text>
            <text x="0" y="48" textAnchor="middle" fill={isNSGreen ? "#22c55e" : isNSYellow ? "#eab308" : "#ef4444"} fontSize="8.5" fontWeight="900">
              {isNSGreen ? "GREEN" : isNSYellow ? "YELLOW" : "RED"}
            </text>
          </g>

          {/* SOUTH VEHICLE SIGNAL (at X=645, Y=410) */}
          <g transform="translate(645, 410)">
            <rect x="-14" y="-35" width="28" height="70" rx="6" fill="#0b1120" stroke="#475569" strokeWidth="2" />
            {/* Red Lens */}
            <circle cx="0" cy="-22" r="7" fill={!isNSGreen && !isNSYellow ? "#ef4444" : "#331111"} />
            {!isNSGreen && !isNSYellow && <circle cx="0" cy="-22" r="9" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.8" />}
            {/* Yellow Lens */}
            <circle cx="0" cy="0" r="7" fill={isNSYellow ? "#eab308" : "#332805"} />
            {isNSYellow && <circle cx="0" cy="0" r="9" fill="none" stroke="#eab308" strokeWidth="1.5" opacity="0.8" />}
            {/* Green Lens */}
            <circle cx="0" cy="22" r="7" fill={isNSGreen ? "#22c55e" : "#052e16"} />
            {isNSGreen && <circle cx="0" cy="22" r="9" fill="none" stroke="#22c55e" strokeWidth="1.5" opacity="0.8"><animate attributeName="r" values="9;11;9" dur="1.2s" repeatCount="indefinite" /></circle>}
            <text x="0" y="-42" textAnchor="middle" fill="#38bdf8" fontSize="9" fontWeight="800" letterSpacing="0.5">SOUTH SIGNAL</text>
            <text x="0" y="48" textAnchor="middle" fill={isNSGreen ? "#22c55e" : isNSYellow ? "#eab308" : "#ef4444"} fontSize="8.5" fontWeight="900">
              {isNSGreen ? "GREEN" : isNSYellow ? "YELLOW" : "RED"}
            </text>
          </g>

          {/* EAST VEHICLE SIGNAL (at X=660, Y=125) */}
          <g transform="translate(660, 125)">
            <rect x="-14" y="-35" width="28" height="70" rx="6" fill="#0b1120" stroke="#475569" strokeWidth="2" />
            {/* Red Lens */}
            <circle cx="0" cy="-22" r="7" fill={!isEWGreen && !isEWYellow ? "#ef4444" : "#331111"} />
            {!isEWGreen && !isEWYellow && <circle cx="0" cy="-22" r="9" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.8" />}
            {/* Yellow Lens */}
            <circle cx="0" cy="0" r="7" fill={isEWYellow ? "#eab308" : "#332805"} />
            {isEWYellow && <circle cx="0" cy="0" r="9" fill="none" stroke="#eab308" strokeWidth="1.5" opacity="0.8" />}
            {/* Green Lens */}
            <circle cx="0" cy="22" r="7" fill={isEWGreen ? "#22c55e" : "#052e16"} />
            {isEWGreen && <circle cx="0" cy="22" r="9" fill="none" stroke="#22c55e" strokeWidth="1.5" opacity="0.8"><animate attributeName="r" values="9;11;9" dur="1.2s" repeatCount="indefinite" /></circle>}
            <text x="0" y="-42" textAnchor="middle" fill="#38bdf8" fontSize="9" fontWeight="800" letterSpacing="0.5">EAST SIGNAL</text>
            <text x="0" y="48" textAnchor="middle" fill={isEWGreen ? "#22c55e" : isEWYellow ? "#eab308" : "#ef4444"} fontSize="8.5" fontWeight="900">
              {isEWGreen ? "GREEN" : isEWYellow ? "YELLOW" : "RED"}
            </text>
          </g>

          {/* WEST VEHICLE SIGNAL (at X=340, Y=375) */}
          <g transform="translate(340, 375)">
            <rect x="-14" y="-35" width="28" height="70" rx="6" fill="#0b1120" stroke="#475569" strokeWidth="2" />
            {/* Red Lens */}
            <circle cx="0" cy="-22" r="7" fill={!isEWGreen && !isEWYellow ? "#ef4444" : "#331111"} />
            {!isEWGreen && !isEWYellow && <circle cx="0" cy="-22" r="9" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.8" />}
            {/* Yellow Lens */}
            <circle cx="0" cy="0" r="7" fill={isEWYellow ? "#eab308" : "#332805"} />
            {isEWYellow && <circle cx="0" cy="0" r="9" fill="none" stroke="#eab308" strokeWidth="1.5" opacity="0.8" />}
            {/* Green Lens */}
            <circle cx="0" cy="22" r="7" fill={isEWGreen ? "#22c55e" : "#052e16"} />
            {isEWGreen && <circle cx="0" cy="22" r="9" fill="none" stroke="#22c55e" strokeWidth="1.5" opacity="0.8"><animate attributeName="r" values="9;11;9" dur="1.2s" repeatCount="indefinite" /></circle>}
            <text x="0" y="-42" textAnchor="middle" fill="#38bdf8" fontSize="9" fontWeight="800" letterSpacing="0.5">WEST SIGNAL</text>
            <text x="0" y="48" textAnchor="middle" fill={isEWGreen ? "#22c55e" : isEWYellow ? "#eab308" : "#ef4444"} fontSize="8.5" fontWeight="900">
              {isEWGreen ? "GREEN" : isEWYellow ? "YELLOW" : "RED"}
            </text>
          </g>

          {/* ========================================================================= */}
          {/* 2. DEDICATED PEDESTRIAN WALK / STOP SIGNALS (ON SIDEWALK CURBS) */}
          {/* ========================================================================= */}

          {/* North Zebra Crosswalk Pedestrian Heads (West & East Curbs) */}
          <g transform="translate(412, 170)">
            <rect x="-10" y="-12" width="20" height="24" rx="3" fill="#030712" stroke={!isNSGreen ? "#22c55e" : "#ef4444"} strokeWidth="1.5" />
            <circle cx="0" cy="-4" r="3.5" fill={!isNSGreen ? "#032e14" : "#ef4444"} />
            <circle cx="0" cy="4" r="3.5" fill={!isNSGreen ? "#22c55e" : "#032e14"}>
              {!isNSGreen && <animate attributeName="opacity" values="1;0.4;1" dur="1s" repeatCount="indefinite" />}
            </circle>
            <text x="-16" y="3" textAnchor="end" fill={!isNSGreen ? "#22c55e" : "#ef4444"} fontSize="8" fontWeight="900">{!isNSGreen ? "WALK" : "STOP"}</text>
          </g>

          <g transform="translate(588, 170)">
            <rect x="-10" y="-12" width="20" height="24" rx="3" fill="#030712" stroke={!isNSGreen ? "#22c55e" : "#ef4444"} strokeWidth="1.5" />
            <circle cx="0" cy="-4" r="3.5" fill={!isNSGreen ? "#032e14" : "#ef4444"} />
            <circle cx="0" cy="4" r="3.5" fill={!isNSGreen ? "#22c55e" : "#032e14"}>
              {!isNSGreen && <animate attributeName="opacity" values="1;0.4;1" dur="1s" repeatCount="indefinite" />}
            </circle>
            <text x="16" y="3" textAnchor="start" fill={!isNSGreen ? "#22c55e" : "#ef4444"} fontSize="8" fontWeight="900">{!isNSGreen ? "WALK" : "STOP"}</text>
          </g>

          {/* South Zebra Crosswalk Pedestrian Heads (West & East Curbs) */}
          <g transform="translate(412, 330)">
            <rect x="-10" y="-12" width="20" height="24" rx="3" fill="#030712" stroke={!isNSGreen ? "#22c55e" : "#ef4444"} strokeWidth="1.5" />
            <circle cx="0" cy="-4" r="3.5" fill={!isNSGreen ? "#032e14" : "#ef4444"} />
            <circle cx="0" cy="4" r="3.5" fill={!isNSGreen ? "#22c55e" : "#032e14"}>
              {!isNSGreen && <animate attributeName="opacity" values="1;0.4;1" dur="1s" repeatCount="indefinite" />}
            </circle>
            <text x="-16" y="3" textAnchor="end" fill={!isNSGreen ? "#22c55e" : "#ef4444"} fontSize="8" fontWeight="900">{!isNSGreen ? "WALK" : "STOP"}</text>
          </g>

          <g transform="translate(588, 330)">
            <rect x="-10" y="-12" width="20" height="24" rx="3" fill="#030712" stroke={!isNSGreen ? "#22c55e" : "#ef4444"} strokeWidth="1.5" />
            <circle cx="0" cy="-4" r="3.5" fill={!isNSGreen ? "#032e14" : "#ef4444"} />
            <circle cx="0" cy="4" r="3.5" fill={!isNSGreen ? "#22c55e" : "#032e14"}>
              {!isNSGreen && <animate attributeName="opacity" values="1;0.4;1" dur="1s" repeatCount="indefinite" />}
            </circle>
            <text x="16" y="3" textAnchor="start" fill={!isNSGreen ? "#22c55e" : "#ef4444"} fontSize="8" fontWeight="900">{!isNSGreen ? "WALK" : "STOP"}</text>
          </g>

          {/* West Zebra Crosswalk Pedestrian Heads (North & South Curbs) */}
          <g transform="translate(400, 168)">
            <rect x="-12" y="-10" width="24" height="20" rx="3" fill="#030712" stroke={!isEWGreen ? "#22c55e" : "#ef4444"} strokeWidth="1.5" />
            <circle cx="-4" cy="0" r="3.5" fill={!isEWGreen ? "#032e14" : "#ef4444"} />
            <circle cx="4" cy="0" r="3.5" fill={!isEWGreen ? "#22c55e" : "#032e14"}>
              {!isEWGreen && <animate attributeName="opacity" values="1;0.4;1" dur="1s" repeatCount="indefinite" />}
            </circle>
            <text x="0" y="-14" textAnchor="middle" fill={!isEWGreen ? "#22c55e" : "#ef4444"} fontSize="8" fontWeight="900">{!isEWGreen ? "WALK" : "STOP"}</text>
          </g>

          <g transform="translate(400, 332)">
            <rect x="-12" y="-10" width="24" height="20" rx="3" fill="#030712" stroke={!isEWGreen ? "#22c55e" : "#ef4444"} strokeWidth="1.5" />
            <circle cx="-4" cy="0" r="3.5" fill={!isEWGreen ? "#032e14" : "#ef4444"} />
            <circle cx="4" cy="0" r="3.5" fill={!isEWGreen ? "#22c55e" : "#032e14"}>
              {!isEWGreen && <animate attributeName="opacity" values="1;0.4;1" dur="1s" repeatCount="indefinite" />}
            </circle>
            <text x="0" y="22" textAnchor="middle" fill={!isEWGreen ? "#22c55e" : "#ef4444"} fontSize="8" fontWeight="900">{!isEWGreen ? "WALK" : "STOP"}</text>
          </g>

          {/* East Zebra Crosswalk Pedestrian Heads (North & South Curbs) */}
          <g transform="translate(600, 168)">
            <rect x="-12" y="-10" width="24" height="20" rx="3" fill="#030712" stroke={!isEWGreen ? "#22c55e" : "#ef4444"} strokeWidth="1.5" />
            <circle cx="-4" cy="0" r="3.5" fill={!isEWGreen ? "#032e14" : "#ef4444"} />
            <circle cx="4" cy="0" r="3.5" fill={!isEWGreen ? "#22c55e" : "#032e14"}>
              {!isEWGreen && <animate attributeName="opacity" values="1;0.4;1" dur="1s" repeatCount="indefinite" />}
            </circle>
            <text x="0" y="-14" textAnchor="middle" fill={!isEWGreen ? "#22c55e" : "#ef4444"} fontSize="8" fontWeight="900">{!isEWGreen ? "WALK" : "STOP"}</text>
          </g>

          <g transform="translate(600, 332)">
            <rect x="-12" y="-10" width="24" height="20" rx="3" fill="#030712" stroke={!isEWGreen ? "#22c55e" : "#ef4444"} strokeWidth="1.5" />
            <circle cx="-4" cy="0" r="3.5" fill={!isEWGreen ? "#032e14" : "#ef4444"} />
            <circle cx="4" cy="0" r="3.5" fill={!isEWGreen ? "#22c55e" : "#032e14"}>
              {!isEWGreen && <animate attributeName="opacity" values="1;0.4;1" dur="1s" repeatCount="indefinite" />}
            </circle>
            <text x="0" y="22" textAnchor="middle" fill={!isEWGreen ? "#22c55e" : "#ef4444"} fontSize="8" fontWeight="900">{!isEWGreen ? "WALK" : "STOP"}</text>
          </g>

          {/* ========================================================================= */}
          {/* DYNAMICALLY ANIMATED DRIVING VEHICLES (ADAPTIVE TRAFFIC SIGNAL RULES) */}
          {/* ========================================================================= */}

          {/* NORTH INBOUND VEHICLES (Heading South) */}
          {northVehicles.map((vtype, idx) => {
            const laneX = idx % 2 === 0 ? 460 : 485;
            const speedFact = vtype === 'motorcycle' ? 1.25 : vtype === 'bus' || vtype === 'truck' ? 0.85 : 1.0;
            const stopLineY = 130 - Math.floor(idx / 2) * 55;
            let vehY: number;
            if (isNSGreen) {
              const startOffset = -30 + idx * 45;
              vehY = ((startOffset + simStep * flowSpeed * speedFact) % 540) - 20;
            } else {
              const rawY = (( -30 + idx * 45 + simStep * flowSpeed * speedFact) % 540) - 20;
              vehY = (rawY > 0 && rawY < stopLineY) ? rawY : stopLineY;
            }
            return renderVehicleSVG(vtype, laneX, vehY, 180, `n_v_${idx}`);
          })}

          {/* SOUTH INBOUND VEHICLES (Heading North) */}
          {southVehicles.map((vtype, idx) => {
            const laneX = idx % 2 === 0 ? 515 : 540;
            const speedFact = vtype === 'motorcycle' ? 1.25 : vtype === 'bus' || vtype === 'truck' ? 0.85 : 1.0;
            const stopLineY = 370 + Math.floor(idx / 2) * 55;
            let vehY: number;
            if (isNSGreen) {
              const startOffset = -30 + idx * 45;
              vehY = 520 - ((startOffset + simStep * flowSpeed * speedFact) % 540);
            } else {
              const rawY = 520 - (( -30 + idx * 45 + simStep * flowSpeed * speedFact) % 540);
              vehY = (rawY < 500 && rawY > stopLineY) ? rawY : stopLineY;
            }
            return renderVehicleSVG(vtype, laneX, vehY, 0, `s_v_${idx}`);
          })}

          {/* WEST INBOUND VEHICLES (Heading East) */}
          {westVehicles.map((vtype, idx) => {
            const laneY = idx % 2 === 0 ? 270 : 295;
            const speedFact = vtype === 'motorcycle' ? 1.25 : vtype === 'bus' || vtype === 'truck' ? 0.85 : 1.0;
            const stopLineX = 370 - Math.floor(idx / 2) * 55;
            let vehX: number;
            if (isEWGreen) {
              const startOffset = -30 + idx * 45;
              vehX = ((startOffset + simStep * flowSpeed * speedFact) % 1040) - 20;
            } else {
              const rawX = (( -30 + idx * 45 + simStep * flowSpeed * speedFact) % 1040) - 20;
              vehX = (rawX > 0 && rawX < stopLineX) ? rawX : stopLineX;
            }
            return renderVehicleSVG(vtype, vehX, laneY, 90, `w_v_${idx}`);
          })}

          {/* EAST INBOUND VEHICLES (Heading West) */}
          {eastVehicles.map((vtype, idx) => {
            const laneY = idx % 2 === 0 ? 205 : 230;
            const speedFact = vtype === 'motorcycle' ? 1.25 : vtype === 'bus' || vtype === 'truck' ? 0.85 : 1.0;
            const stopLineX = 630 + Math.floor(idx / 2) * 55;
            let vehX: number;
            if (isEWGreen) {
              const startOffset = -30 + idx * 45;
              vehX = 1020 - ((startOffset + simStep * flowSpeed * speedFact) % 1040);
            } else {
              const rawX = 1020 - (( -30 + idx * 45 + simStep * flowSpeed * speedFact) % 1040);
              vehX = (rawX < 1000 && rawX > stopLineX) ? rawX : stopLineX;
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
              <g key={`ped_n_${i}`} transform={`translate(${pX}, 170)`} style={{ transition: 'all 0.8s linear' }}>
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
              <g key={`ped_s_${i}`} transform={`translate(${pX}, 330)`} style={{ transition: 'all 0.8s linear' }}>
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
              <g key={`ped_e_${i}`} transform={`translate(590, ${pY})`} style={{ transition: 'all 0.8s linear' }}>
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
              <g key={`ped_w_${i}`} transform={`translate(410, ${pY})`} style={{ transition: 'all 0.8s linear' }}>
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

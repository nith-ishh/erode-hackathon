import React, { useRef } from 'react';
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

export const JunctionVisualizer: React.FC<JunctionVisualizerProps> = ({ stateData, finalPhase, emergencyActive, onToggleEmergency: _onToggleEmergency }) => {
  const approaches: Record<string, ApproachData> = stateData?.state?.approaches || {};
  const isEmergency = emergencyActive || stateData?.state?.emergency_present || false;
  const breakItActive = stateData?.safety_shield?.break_it_active || false;
  const fallbackActive = stateData?.safety_shield?.fallback_active || breakItActive;
  const simStep = stateData?.step || 0;

  // Signal phase status: 0/1 = NS Green/Yellow, 2/3 = EW Green/Yellow
  const isNSGreen = finalPhase === 0;
  const isNSYellow = finalPhase === 1;
  const isEWGreen = finalPhase === 2;
  const isEWYellow = finalPhase === 3;

  const ambulance = stateData?.ambulance || {};
  const isAmbActive = ambulance.active || isEmergency;
  const ambApproach = ambulance.approach_edge ? ambulance.approach_edge.charAt(0).toUpperCase() : 'N';
  const ambSiren = ambulance.siren_active ?? isEmergency;

  // Continuous vehicle position tracking to eliminate glitches, backwards flying, and speed spikes
  const vehPosRef = useRef<Record<string, { pos: number; isSmooth: boolean }>>({});
  const lastStepRef = useRef<number>(-1);
  const pedPosRef = useRef<Record<string, { pos: number; isSmooth: boolean }>>({});
  const lastPedStepRef = useRef<number>(-1);

  // Stable vehicle templates per approach so vehicles don't morph/glitch on vehicle count updates
  const STABLE_APPROACH_TEMPLATES: Record<string, string[]> = {
    N: ['car', 'motorcycle', 'auto', 'car', 'bus', 'motorcycle', 'car', 'truck'],
    S: ['car', 'auto', 'motorcycle', 'car', 'truck', 'car', 'bus', 'motorcycle'],
    E: ['bus', 'car', 'truck', 'auto', 'car', 'motorcycle', 'car', 'bus'],
    W: ['truck', 'car', 'motorcycle', 'auto', 'bus', 'car', 'motorcycle', 'car']
  };

  const getVehiclesForApproach = (appKey: string) => {
    const app = approaches[appKey];
    const count = Math.min(8, Math.max(3, app?.vehicle_count ?? (appKey === 'N' ? 5 : appKey === 'S' ? 6 : appKey === 'E' ? 7 : 8)));
    const template = [...(STABLE_APPROACH_TEMPLATES[appKey] || STABLE_APPROACH_TEMPLATES.N)];

    if (isAmbActive && appKey === ambApproach) {
      template[0] = ambSiren ? 'emergency' : 'ambulance_normal';
    }

    return template.slice(0, count);
  };

  const northVehicles = getVehiclesForApproach('N');
  const southVehicles = getVehiclesForApproach('S');
  const eastVehicles = getVehiclesForApproach('E');
  const westVehicles = getVehiclesForApproach('W');

  // Update continuous vehicle positions whenever simulation step advances
  if (simStep !== lastStepRef.current) {
    lastStepRef.current = simStep;
    const moveStep = 20; // Realistic calibrated movement (20 px/sec)

    // 1. NORTH APPROACH (Heading South, Y increases from -30 to 530)
    northVehicles.forEach((_, idx) => {
      const key = `n_${idx}`;
      const queueStopY = 135 - Math.floor(idx / 2) * 50;
      const prev = vehPosRef.current[key];
      let currentPos = prev ? prev.pos : (isNSGreen ? (idx * 55) : queueStopY);
      let smooth = true;

      if (isNSGreen) {
        currentPos += moveStep;
        if (currentPos > 530) {
          currentPos = -40;
          smooth = false; // Instant off-screen wrap without backwards animation
        }
      } else {
        if (currentPos < queueStopY) {
          currentPos = Math.min(queueStopY, currentPos + moveStep);
        } else if (currentPos > 155) {
          // Already past stopline: safely clear the junction
          currentPos += moveStep;
          if (currentPos > 530) {
            currentPos = -40;
            smooth = false;
          }
        } else {
          currentPos = queueStopY;
        }
      }
      vehPosRef.current[key] = { pos: currentPos, isSmooth: smooth };
    });

    // 2. SOUTH APPROACH (Heading North, Y decreases from 530 to -30)
    southVehicles.forEach((_, idx) => {
      const key = `s_${idx}`;
      const queueStopY = 365 + Math.floor(idx / 2) * 50;
      const prev = vehPosRef.current[key];
      let currentPos = prev ? prev.pos : (isNSGreen ? (500 - idx * 55) : queueStopY);
      let smooth = true;

      if (isNSGreen) {
        currentPos -= moveStep;
        if (currentPos < -40) {
          currentPos = 540;
          smooth = false;
        }
      } else {
        if (currentPos > queueStopY) {
          currentPos = Math.max(queueStopY, currentPos - moveStep);
        } else if (currentPos < 345) {
          currentPos -= moveStep;
          if (currentPos < -40) {
            currentPos = 540;
            smooth = false;
          }
        } else {
          currentPos = queueStopY;
        }
      }
      vehPosRef.current[key] = { pos: currentPos, isSmooth: smooth };
    });

    // 3. WEST APPROACH (Heading East, X increases from -30 to 1030)
    westVehicles.forEach((_, idx) => {
      const key = `w_${idx}`;
      const queueStopX = 375 - Math.floor(idx / 2) * 50;
      const prev = vehPosRef.current[key];
      let currentPos = prev ? prev.pos : (isEWGreen ? (idx * 65) : queueStopX);
      let smooth = true;

      if (isEWGreen) {
        currentPos += moveStep;
        if (currentPos > 1030) {
          currentPos = -40;
          smooth = false;
        }
      } else {
        if (currentPos < queueStopX) {
          currentPos = Math.min(queueStopX, currentPos + moveStep);
        } else if (currentPos > 395) {
          currentPos += moveStep;
          if (currentPos > 1030) {
            currentPos = -40;
            smooth = false;
          }
        } else {
          currentPos = queueStopX;
        }
      }
      vehPosRef.current[key] = { pos: currentPos, isSmooth: smooth };
    });

    // 4. EAST APPROACH (Heading West, X decreases from 1030 to -30)
    eastVehicles.forEach((_, idx) => {
      const key = `e_${idx}`;
      const queueStopX = 625 + Math.floor(idx / 2) * 50;
      const prev = vehPosRef.current[key];
      let currentPos = prev ? prev.pos : (isEWGreen ? (1000 - idx * 65) : queueStopX);
      let smooth = true;

      if (isEWGreen) {
        currentPos -= moveStep;
        if (currentPos < -40) {
          currentPos = 1040;
          smooth = false;
        }
      } else {
        if (currentPos > queueStopX) {
          currentPos = Math.max(queueStopX, currentPos - moveStep);
        } else if (currentPos < 605) {
          currentPos -= moveStep;
          if (currentPos < -40) {
            currentPos = 1040;
            smooth = false;
          }
        } else {
          currentPos = queueStopX;
        }
      }
      vehPosRef.current[key] = { pos: currentPos, isSmooth: smooth };
    });
  }

  // Update pedestrian walking positions
  if (simStep !== lastPedStepRef.current) {
    lastPedStepRef.current = simStep;
    const pedStep = 5; // Realistic crosswalk pace

    // North Crosswalk Pedestrians (X goes 430 to 570)
    for (let i = 0; i < 8; i++) {
      const key = `ped_n_${i}`;
      const prev = pedPosRef.current[key];
      let pos = prev ? prev.pos : 430 + (i * 20);
      let smooth = true;
      if (!isNSGreen) {
        pos += pedStep;
        if (pos > 570) {
          pos = 430;
          smooth = false;
        }
      } else {
        pos = 425;
        smooth = false;
      }
      pedPosRef.current[key] = { pos, isSmooth: smooth };
    }

    // South Crosswalk Pedestrians (X goes 570 to 430)
    for (let i = 0; i < 8; i++) {
      const key = `ped_s_${i}`;
      const prev = pedPosRef.current[key];
      let pos = prev ? prev.pos : 570 - (i * 20);
      let smooth = true;
      if (!isNSGreen) {
        pos -= pedStep;
        if (pos < 430) {
          pos = 570;
          smooth = false;
        }
      } else {
        pos = 575;
        smooth = false;
      }
      pedPosRef.current[key] = { pos, isSmooth: smooth };
    }

    // East Crosswalk Pedestrians (Y goes 190 to 310)
    for (let i = 0; i < 8; i++) {
      const key = `ped_e_${i}`;
      const prev = pedPosRef.current[key];
      let pos = prev ? prev.pos : 190 + (i * 20);
      let smooth = true;
      if (!isEWGreen) {
        pos += pedStep;
        if (pos > 310) {
          pos = 190;
          smooth = false;
        }
      } else {
        pos = 185;
        smooth = false;
      }
      pedPosRef.current[key] = { pos, isSmooth: smooth };
    }

    // West Crosswalk Pedestrians (Y goes 310 to 190)
    for (let i = 0; i < 8; i++) {
      const key = `ped_w_${i}`;
      const prev = pedPosRef.current[key];
      let pos = prev ? prev.pos : 310 - (i * 20);
      let smooth = true;
      if (!isEWGreen) {
        pos -= pedStep;
        if (pos < 190) {
          pos = 310;
          smooth = false;
        }
      } else {
        pos = 315;
        smooth = false;
      }
      pedPosRef.current[key] = { pos, isSmooth: smooth };
    }
  }

  // SVG Vehicle Top-View Renderer with smooth hardware-accelerated transform
  const renderVehicleSVG = (type: string, x: number, y: number, rotation: number, key: string, isSmooth: boolean = true) => {
    const transform = `translate(${x}, ${y}) rotate(${rotation})`;
    const style: React.CSSProperties = {
      transition: isSmooth ? 'transform 0.95s linear' : 'none',
      willChange: 'transform'
    };

    switch (type) {
      case 'emergency':
        return (
          <g transform={transform} key={key} style={style}>
            {/* 1. Large Pulsing Dual-Color Radiant Siren Halo (Blue on Left, Red on Right) */}
            <circle cx="-8" cy="-2" r="24" fill="#00e5ff" opacity="0.45">
              <animate attributeName="opacity" values="0.75;0.05;0.75" dur="0.3s" repeatCount="indefinite" />
              <animate attributeName="r" values="16;28;16" dur="0.3s" repeatCount="indefinite" />
            </circle>
            <circle cx="8" cy="-2" r="24" fill="#ff0055" opacity="0.45">
              <animate attributeName="opacity" values="0.05;0.75;0.05" dur="0.3s" repeatCount="indefinite" />
              <animate attributeName="r" values="28;16;28" dur="0.3s" repeatCount="indefinite" />
            </circle>

            {/* 2. Vehicle Body (White with Red Emergency Borders) */}
            <rect x="-13" y="-23" width="26" height="46" rx="4" fill="#ffffff" stroke="#ef4444" strokeWidth="2.5" />
            
            {/* Red Cross Emblem on Roof */}
            <rect x="-3" y="2" width="6" height="14" fill="#ef4444" />
            <rect x="-7" y="6" width="14" height="6" fill="#ef4444" />
            
            {/* Windshield & Rear Windows */}
            <rect x="-10" y="-18" width="20" height="6" fill="#0f172a" rx="1.5" />
            <rect x="-9" y="16" width="18" height="4" fill="#0f172a" rx="1" />

            {/* 3. High-Intensity Roof Emergency Siren Lightbar */}
            <rect x="-11" y="-6" width="22" height="8" rx="2" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            {/* Left Blue Strobe Capsule */}
            <rect x="-10" y="-5" width="9" height="6" rx="1.5" fill="#00e5ff">
              <animate attributeName="fill" values="#00f0ff;#0284c7;#00f0ff" dur="0.3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="1;0.15;1" dur="0.3s" repeatCount="indefinite" />
            </rect>
            {/* Center Bar Divider */}
            <line x1="0" y1="-6" x2="0" y2="2" stroke="#0f172a" strokeWidth="2" />
            {/* Right Red Strobe Capsule */}
            <rect x="1" y="-5" width="9" height="6" rx="1.5" fill="#ff0044">
              <animate attributeName="fill" values="#881337;#ff0044;#881337" dur="0.3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.15;1;0.15" dur="0.3s" repeatCount="indefinite" />
            </rect>

            {/* 4. Alternating Corner Strobe Flashers */}
            <circle cx="-10" cy="-21" r="2.5" fill="#00e5ff">
              <animate attributeName="opacity" values="1;0.1;1" dur="0.2s" repeatCount="indefinite" />
            </circle>
            <circle cx="10" cy="-21" r="2.5" fill="#ff0055">
              <animate attributeName="opacity" values="0.1;1;0.1" dur="0.2s" repeatCount="indefinite" />
            </circle>
            <circle cx="-10" cy="19" r="2" fill="#ff0055">
              <animate attributeName="opacity" values="0.1;1;0.1" dur="0.2s" repeatCount="indefinite" />
            </circle>
            <circle cx="10" cy="19" r="2" fill="#00e5ff">
              <animate attributeName="opacity" values="1;0.1;1" dur="0.2s" repeatCount="indefinite" />
            </circle>
            {/* Pulse Aura */}
            <circle cx="0" cy="0" r="28" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.6">
              <animate attributeName="r" values="20;32;20" dur="0.8s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.8;0.1;0.8" dur="0.8s" repeatCount="indefinite" />
            </circle>
            <text x="0" y="30" textAnchor="middle" fill="#f87171" fontSize="9" fontWeight="bold">SIREN ON</text>
          </g>
        );
      case 'ambulance_normal':
        return (
          <g transform={transform} key={key} style={style}>
            <rect x="-13" y="-23" width="26" height="46" rx="4" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" />
            <rect x="-3" y="-8" width="6" height="16" fill="#ef4444" />
            <rect x="-8" y="-3" width="16" height="6" fill="#ef4444" />
            <rect x="-9" y="-18" width="18" height="6" fill="#334155" rx="1" />
            <text x="0" y="30" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">SIREN OFF</text>
          </g>
        );
      case 'bus':
        return (
          <g transform={transform} key={key} style={style}>
            <rect x="-13" y="-28" width="26" height="56" rx="3" fill="#991b1b" stroke="#f87171" strokeWidth="1.5" />
            <rect x="-10" y="-24" width="20" height="8" fill="#1e293b" rx="1" />
            <rect x="-10" y="-12" width="20" height="32" fill="#7f1d1d" rx="1" />
          </g>
        );
      case 'truck':
        return (
          <g transform={transform} key={key} style={style}>
            <rect x="-13" y="-26" width="26" height="52" rx="2" fill="#166534" stroke="#4ade80" strokeWidth="1.5" />
            <rect x="-11" y="-24" width="22" height="14" fill="#047857" rx="2" />
          </g>
        );
      case 'motorcycle':
        return (
          <g transform={transform} key={key} style={style}>
            <rect x="-4" y="-10" width="8" height="20" rx="2" fill="#854d0e" stroke="#fde047" strokeWidth="1" />
            <circle cx="0" cy="0" r="4" fill="#facc15" />
          </g>
        );
      case 'auto':
        return (
          <g transform={transform} key={key} style={style}>
            <polygon points="0,-12 10,8 -10,8" fill="#c2410c" stroke="#fb923c" strokeWidth="1.5" />
            <rect x="-9" y="0" width="18" height="10" fill="#ea580c" rx="1" />
          </g>
        );
      default: // car
        return (
          <g transform={transform} key={key} style={style}>
            <rect x="-11" y="-18" width="22" height="36" rx="5" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
            <rect x="-8" y="-14" width="16" height="6" fill="#0f172a" rx="1" />
            <rect x="-8" y="8" width="16" height="4" fill="#0f172a" rx="1" />
            <circle cx="-7" cy="-17" r="1.5" fill="#fef08a" />
            <circle cx="7" cy="-17" r="1.5" fill="#fef08a" />
          </g>
        );
    }
  };

  return (
    <div className="panel" style={{ width: '100%', marginBottom: '1.5rem' }}>
      {/* Top Header Bar */}
      <div className="panel-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
        <div className="panel-title" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>
          <Activity className="w-5 h-5" style={{ color: 'var(--accent-cyan)' }} />
          <span>SUMO Digital Twin — Live Interactive 2D Signal Simulation (J1)</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
          {/* 1. HIGH-VISIBILITY 3-LENS VEHICLE TRAFFIC SIGNALS (PLACED WIDE ON CORNERS) */}
          {/* ========================================================================= */}

          {/* NORTH APPROACH VEHICLE SIGNAL (Top-Left Sidewalk at X=330, Y=80) */}
          <g transform="translate(330, 80)">
            <rect x="-14" y="-34" width="28" height="68" rx="5" fill="#080e1a" stroke="#475569" strokeWidth="2" />
            {/* Red Lens */}
            <circle cx="0" cy="-21" r="6.5" fill={!isNSGreen && !isNSYellow ? "#ef4444" : "#290b0b"} />
            {!isNSGreen && !isNSYellow && <circle cx="0" cy="-21" r="8.5" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.8" />}
            {/* Yellow Lens */}
            <circle cx="0" cy="0" r="6.5" fill={isNSYellow ? "#eab308" : "#2b2205"} />
            {isNSYellow && <circle cx="0" cy="0" r="8.5" fill="none" stroke="#eab308" strokeWidth="1.5" opacity="0.8" />}
            {/* Green Lens */}
            <circle cx="0" cy="21" r="6.5" fill={isNSGreen ? "#22c55e" : "#052613"} />
            {isNSGreen && <circle cx="0" cy="21" r="8.5" fill="none" stroke="#22c55e" strokeWidth="1.5" opacity="0.8"><animate attributeName="r" values="8.5;10.5;8.5" dur="1.2s" repeatCount="indefinite" /></circle>}
            <text x="0" y="-40" textAnchor="middle" fill="#38bdf8" fontSize="8.5" fontWeight="800">NORTH SIG</text>
            <text x="0" y="46" textAnchor="middle" fill={isNSGreen ? "#22c55e" : isNSYellow ? "#eab308" : "#ef4444"} fontSize="8" fontWeight="900">
              {isNSGreen ? "GREEN" : isNSYellow ? "YELLOW" : "RED"}
            </text>
          </g>

          {/* SOUTH APPROACH VEHICLE SIGNAL (Bottom-Right Sidewalk at X=670, Y=420) */}
          <g transform="translate(670, 420)">
            <rect x="-14" y="-34" width="28" height="68" rx="5" fill="#080e1a" stroke="#475569" strokeWidth="2" />
            {/* Red Lens */}
            <circle cx="0" cy="-21" r="6.5" fill={!isNSGreen && !isNSYellow ? "#ef4444" : "#290b0b"} />
            {!isNSGreen && !isNSYellow && <circle cx="0" cy="-21" r="8.5" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.8" />}
            {/* Yellow Lens */}
            <circle cx="0" cy="0" r="6.5" fill={isNSYellow ? "#eab308" : "#2b2205"} />
            {isNSYellow && <circle cx="0" cy="0" r="8.5" fill="none" stroke="#eab308" strokeWidth="1.5" opacity="0.8" />}
            {/* Green Lens */}
            <circle cx="0" cy="21" r="6.5" fill={isNSGreen ? "#22c55e" : "#052613"} />
            {isNSGreen && <circle cx="0" cy="21" r="8.5" fill="none" stroke="#22c55e" strokeWidth="1.5" opacity="0.8"><animate attributeName="r" values="8.5;10.5;8.5" dur="1.2s" repeatCount="indefinite" /></circle>}
            <text x="0" y="-40" textAnchor="middle" fill="#38bdf8" fontSize="8.5" fontWeight="800">SOUTH SIG</text>
            <text x="0" y="46" textAnchor="middle" fill={isNSGreen ? "#22c55e" : isNSYellow ? "#eab308" : "#ef4444"} fontSize="8" fontWeight="900">
              {isNSGreen ? "GREEN" : isNSYellow ? "YELLOW" : "RED"}
            </text>
          </g>

          {/* EAST APPROACH VEHICLE SIGNAL (Top-Right Sidewalk at X=670, Y=80) */}
          <g transform="translate(670, 80)">
            <rect x="-14" y="-34" width="28" height="68" rx="5" fill="#080e1a" stroke="#475569" strokeWidth="2" />
            {/* Red Lens */}
            <circle cx="0" cy="-21" r="6.5" fill={!isEWGreen && !isEWYellow ? "#ef4444" : "#290b0b"} />
            {!isEWGreen && !isEWYellow && <circle cx="0" cy="-21" r="8.5" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.8" />}
            {/* Yellow Lens */}
            <circle cx="0" cy="0" r="6.5" fill={isEWYellow ? "#eab308" : "#2b2205"} />
            {isEWYellow && <circle cx="0" cy="0" r="8.5" fill="none" stroke="#eab308" strokeWidth="1.5" opacity="0.8" />}
            {/* Green Lens */}
            <circle cx="0" cy="21" r="6.5" fill={isEWGreen ? "#22c55e" : "#052613"} />
            {isEWGreen && <circle cx="0" cy="21" r="8.5" fill="none" stroke="#22c55e" strokeWidth="1.5" opacity="0.8"><animate attributeName="r" values="8.5;10.5;8.5" dur="1.2s" repeatCount="indefinite" /></circle>}
            <text x="0" y="-40" textAnchor="middle" fill="#38bdf8" fontSize="8.5" fontWeight="800">EAST SIG</text>
            <text x="0" y="46" textAnchor="middle" fill={isEWGreen ? "#22c55e" : isEWYellow ? "#eab308" : "#ef4444"} fontSize="8" fontWeight="900">
              {isEWGreen ? "GREEN" : isEWYellow ? "YELLOW" : "RED"}
            </text>
          </g>

          {/* WEST APPROACH VEHICLE SIGNAL (Bottom-Left Sidewalk at X=330, Y=420) */}
          <g transform="translate(330, 420)">
            <rect x="-14" y="-34" width="28" height="68" rx="5" fill="#080e1a" stroke="#475569" strokeWidth="2" />
            {/* Red Lens */}
            <circle cx="0" cy="-21" r="6.5" fill={!isEWGreen && !isEWYellow ? "#ef4444" : "#290b0b"} />
            {!isEWGreen && !isEWYellow && <circle cx="0" cy="-21" r="8.5" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.8" />}
            {/* Yellow Lens */}
            <circle cx="0" cy="0" r="6.5" fill={isEWYellow ? "#eab308" : "#2b2205"} />
            {isEWYellow && <circle cx="0" cy="0" r="8.5" fill="none" stroke="#eab308" strokeWidth="1.5" opacity="0.8" />}
            {/* Green Lens */}
            <circle cx="0" cy="21" r="6.5" fill={isEWGreen ? "#22c55e" : "#052613"} />
            {isEWGreen && <circle cx="0" cy="21" r="8.5" fill="none" stroke="#22c55e" strokeWidth="1.5" opacity="0.8"><animate attributeName="r" values="8.5;10.5;8.5" dur="1.2s" repeatCount="indefinite" /></circle>}
            <text x="0" y="-40" textAnchor="middle" fill="#38bdf8" fontSize="8.5" fontWeight="800">WEST SIG</text>
            <text x="0" y="46" textAnchor="middle" fill={isEWGreen ? "#22c55e" : isEWYellow ? "#eab308" : "#ef4444"} fontSize="8" fontWeight="900">
              {isEWGreen ? "GREEN" : isEWYellow ? "YELLOW" : "RED"}
            </text>
          </g>

          {/* ========================================================================= */}
          {/* 2. DEDICATED PEDESTRIAN CROSSING HEADS (PLACED DIRECTLY ON ZEBRA CURBS)  */}
          {/* ========================================================================= */}

          {/* North Crosswalk Pedestrian Signals (At curbs X=412 and X=588, Y=145) */}
          <g transform="translate(410, 145)">
            <rect x="-16" y="-8" width="32" height="16" rx="3" fill="#080e1a" stroke={!isNSGreen ? "#22c55e" : "#ef4444"} strokeWidth="1.5" />
            <text x="0" y="3.5" textAnchor="middle" fill={!isNSGreen ? "#22c55e" : "#ef4444"} fontSize="7.5" fontWeight="900">
              {!isNSGreen ? "WALK" : "STOP"}
            </text>
          </g>

          <g transform="translate(590, 145)">
            <rect x="-16" y="-8" width="32" height="16" rx="3" fill="#080e1a" stroke={!isNSGreen ? "#22c55e" : "#ef4444"} strokeWidth="1.5" />
            <text x="0" y="3.5" textAnchor="middle" fill={!isNSGreen ? "#22c55e" : "#ef4444"} fontSize="7.5" fontWeight="900">
              {!isNSGreen ? "WALK" : "STOP"}
            </text>
          </g>

          {/* South Crosswalk Pedestrian Signals (At curbs X=410 and X=590, Y=355) */}
          <g transform="translate(410, 355)">
            <rect x="-16" y="-8" width="32" height="16" rx="3" fill="#080e1a" stroke={!isNSGreen ? "#22c55e" : "#ef4444"} strokeWidth="1.5" />
            <text x="0" y="3.5" textAnchor="middle" fill={!isNSGreen ? "#22c55e" : "#ef4444"} fontSize="7.5" fontWeight="900">
              {!isNSGreen ? "WALK" : "STOP"}
            </text>
          </g>

          <g transform="translate(590, 355)">
            <rect x="-16" y="-8" width="32" height="16" rx="3" fill="#080e1a" stroke={!isNSGreen ? "#22c55e" : "#ef4444"} strokeWidth="1.5" />
            <text x="0" y="3.5" textAnchor="middle" fill={!isNSGreen ? "#22c55e" : "#ef4444"} fontSize="7.5" fontWeight="900">
              {!isNSGreen ? "WALK" : "STOP"}
            </text>
          </g>

          {/* West Crosswalk Pedestrian Signals (At curbs X=380, Y=175 and Y=325) */}
          <g transform="translate(380, 175)">
            <rect x="-16" y="-8" width="32" height="16" rx="3" fill="#080e1a" stroke={!isEWGreen ? "#22c55e" : "#ef4444"} strokeWidth="1.5" />
            <text x="0" y="3.5" textAnchor="middle" fill={!isEWGreen ? "#22c55e" : "#ef4444"} fontSize="7.5" fontWeight="900">
              {!isEWGreen ? "WALK" : "STOP"}
            </text>
          </g>

          <g transform="translate(380, 325)">
            <rect x="-16" y="-8" width="32" height="16" rx="3" fill="#080e1a" stroke={!isEWGreen ? "#22c55e" : "#ef4444"} strokeWidth="1.5" />
            <text x="0" y="3.5" textAnchor="middle" fill={!isEWGreen ? "#22c55e" : "#ef4444"} fontSize="7.5" fontWeight="900">
              {!isEWGreen ? "WALK" : "STOP"}
            </text>
          </g>

          {/* East Crosswalk Pedestrian Signals (At curbs X=620, Y=175 and Y=325) */}
          <g transform="translate(620, 175)">
            <rect x="-16" y="-8" width="32" height="16" rx="3" fill="#080e1a" stroke={!isEWGreen ? "#22c55e" : "#ef4444"} strokeWidth="1.5" />
            <text x="0" y="3.5" textAnchor="middle" fill={!isEWGreen ? "#22c55e" : "#ef4444"} fontSize="7.5" fontWeight="900">
              {!isEWGreen ? "WALK" : "STOP"}
            </text>
          </g>

          <g transform="translate(620, 325)">
            <rect x="-16" y="-8" width="32" height="16" rx="3" fill="#080e1a" stroke={!isEWGreen ? "#22c55e" : "#ef4444"} strokeWidth="1.5" />
            <text x="0" y="3.5" textAnchor="middle" fill={!isEWGreen ? "#22c55e" : "#ef4444"} fontSize="7.5" fontWeight="900">
              {!isEWGreen ? "WALK" : "STOP"}
            </text>
          </g>


          {/* ========================================================================= */}
          {/* DYNAMICALLY ANIMATED DRIVING VEHICLES (ADAPTIVE TRAFFIC SIGNAL RULES) */}
          {/* ========================================================================= */}

          {/* NORTH INBOUND VEHICLES (Heading South) */}
          {northVehicles.map((vtype, idx) => {
            const laneX = idx % 2 === 0 ? 460 : 485;
            const key = `n_${idx}`;
            const tracked = vehPosRef.current[key] || { pos: 135 - Math.floor(idx / 2) * 50, isSmooth: false };
            return renderVehicleSVG(vtype, laneX, tracked.pos, 180, `${key}_${vtype}`, tracked.isSmooth);
          })}

          {/* SOUTH INBOUND VEHICLES (Heading North) */}
          {southVehicles.map((vtype, idx) => {
            const laneX = idx % 2 === 0 ? 515 : 540;
            const key = `s_${idx}`;
            const tracked = vehPosRef.current[key] || { pos: 365 + Math.floor(idx / 2) * 50, isSmooth: false };
            return renderVehicleSVG(vtype, laneX, tracked.pos, 0, `${key}_${vtype}`, tracked.isSmooth);
          })}

          {/* WEST INBOUND VEHICLES (Heading East) */}
          {westVehicles.map((vtype, idx) => {
            const laneY = idx % 2 === 0 ? 270 : 295;
            const key = `w_${idx}`;
            const tracked = vehPosRef.current[key] || { pos: 375 - Math.floor(idx / 2) * 50, isSmooth: false };
            return renderVehicleSVG(vtype, tracked.pos, laneY, 90, `${key}_${vtype}`, tracked.isSmooth);
          })}

          {/* EAST INBOUND VEHICLES (Heading West) */}
          {eastVehicles.map((vtype, idx) => {
            const laneY = idx % 2 === 0 ? 205 : 230;
            const key = `e_${idx}`;
            const tracked = vehPosRef.current[key] || { pos: 625 + Math.floor(idx / 2) * 50, isSmooth: false };
            return renderVehicleSVG(vtype, tracked.pos, laneY, 270, `${key}_${vtype}`, tracked.isSmooth);
          })}

          {/* ========================================================================= */}
          {/* ANIMATED PEDESTRIANS WALKING ON SAFE CROSSWALKS */}
          {/* ========================================================================= */}

          {/* North Crosswalk Pedestrians */}
          {[...Array(approaches.N?.pedestrians_waiting || 3)].map((_, i) => {
            const isSafeToWalk = !isNSGreen;
            const key = `ped_n_${i}`;
            const tracked = pedPosRef.current[key] || { pos: isSafeToWalk ? 430 : 425, isSmooth: false };
            return (
              <g key={key} transform={`translate(${tracked.pos}, 170)`} style={{ transition: tracked.isSmooth ? 'transform 0.95s linear' : 'none', willChange: 'transform' }}>
                <circle cx="0" cy="0" r="5" fill={isSafeToWalk ? "#22c55e" : "#ef4444"} stroke="#ffffff" strokeWidth="1" />
                <circle cx="0" cy="-6" r="3" fill="#fbbf24" />
              </g>
            );
          })}

          {/* South Crosswalk Pedestrians */}
          {[...Array(approaches.S?.pedestrians_waiting || 3)].map((_, i) => {
            const isSafeToWalk = !isNSGreen;
            const key = `ped_s_${i}`;
            const tracked = pedPosRef.current[key] || { pos: isSafeToWalk ? 570 : 575, isSmooth: false };
            return (
              <g key={key} transform={`translate(${tracked.pos}, 330)`} style={{ transition: tracked.isSmooth ? 'transform 0.95s linear' : 'none', willChange: 'transform' }}>
                <circle cx="0" cy="0" r="5" fill={isSafeToWalk ? "#22c55e" : "#ef4444"} stroke="#ffffff" strokeWidth="1" />
                <circle cx="0" cy="-6" r="3" fill="#fbbf24" />
              </g>
            );
          })}

          {/* East Crosswalk Pedestrians */}
          {[...Array(approaches.E?.pedestrians_waiting || 2)].map((_, i) => {
            const isSafeToWalk = !isEWGreen;
            const key = `ped_e_${i}`;
            const tracked = pedPosRef.current[key] || { pos: isSafeToWalk ? 190 : 185, isSmooth: false };
            return (
              <g key={key} transform={`translate(590, ${tracked.pos})`} style={{ transition: tracked.isSmooth ? 'transform 0.95s linear' : 'none', willChange: 'transform' }}>
                <circle cx="0" cy="0" r="5" fill={isSafeToWalk ? "#22c55e" : "#ef4444"} stroke="#ffffff" strokeWidth="1" />
                <circle cx="0" cy="-6" r="3" fill="#fbbf24" />
              </g>
            );
          })}

          {/* West Crosswalk Pedestrians */}
          {[...Array(approaches.W?.pedestrians_waiting || 2)].map((_, i) => {
            const isSafeToWalk = !isEWGreen;
            const key = `ped_w_${i}`;
            const tracked = pedPosRef.current[key] || { pos: isSafeToWalk ? 310 : 315, isSmooth: false };
            return (
              <g key={key} transform={`translate(410, ${tracked.pos})`} style={{ transition: tracked.isSmooth ? 'transform 0.95s linear' : 'none', willChange: 'transform' }}>
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

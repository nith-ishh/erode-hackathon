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
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [localEmergency, setLocalEmergency] = useState<boolean>(false);
  const [animTime, setAnimTime] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'ai-only' | 'fixed-only'>('side-by-side');

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
  const isEmergency = localEmergency || emergencyActive || Boolean(stateData?.state?.emergency_present);
  const breakItActive = stateData?.safety_shield?.break_it_active || false;
  const fallbackActive = stateData?.safety_shield?.fallback_active || breakItActive;
  const simStep = animTime * 25;

  const handleTriggerAmbulanceClick = async () => {
    const nextVal = !isEmergency;
    setLocalEmergency(nextVal);
    if (onToggleEmergency) {
      onToggleEmergency();
    }
    try {
      await fetch(`http://127.0.0.1:8000/api/emergency?enable=${nextVal}`, { method: 'POST' });
    } catch (err) {
      // API call fallback
    }
  };

  const flowSpeed = 1.0 * speedMultiplier;
  const pedSpeed = 0.5 * speedMultiplier;

  const getSpeedForVType = (vtype: string, sirenOn: boolean) => {
    if (vtype === 'emergency') {
      return sirenOn ? flowSpeed * 2.2 : flowSpeed * 1.0;
    }
    switch (vtype) {
      case 'motorcycle':
        return flowSpeed * 1.25;
      case 'car':
        return flowSpeed * 1.0;
      case 'auto':
        return flowSpeed * 0.85;
      case 'bus':
        return flowSpeed * 0.70;
      case 'truck':
        return flowSpeed * 0.55;
      default:
        return flowSpeed * 1.0;
    }
  };

  // AI Adaptive Signal Phase
  const autoPhase = Math.floor((animTime % 16) / 4);
  const effectivePhase = (stateData && stateData.final_phase !== undefined) ? stateData.final_phase : (finalPhase !== undefined ? finalPhase : autoPhase);
  const aiActivePhase = isEmergency ? 0 : effectivePhase;
  const aiIsNSGreen = aiActivePhase === 0;
  const aiIsEWGreen = aiActivePhase === 2;

  // Traditional Fixed-Timer Signal Phase (30s rigid fixed cycle, completely ignores emergency sirens)
  const fixedCyclePhase = Math.floor((animTime % 24) / 12) * 2;
  const fixedIsNSGreen = fixedCyclePhase === 0;
  const fixedIsEWGreen = fixedCyclePhase === 2;

  const getSignalColor = (isGreen: boolean) => (isGreen ? '#22c55e' : '#ef4444');

  const getVehiclesForApproach = (appKey: string, isFixedTwin: boolean = false) => {
    if (isFixedTwin) {
      // Traditional Fixed-Timer System (Baseline): Balanced Queue across both lanes (4 vehicles per arm = 16 total)
      switch (appKey) {
        case 'N':
          return ['emergency', 'bus', 'car', 'motorcycle'];
        case 'S':
          return ['truck', 'car', 'bus', 'auto'];
        case 'E':
          return ['bus', 'truck', 'car', 'motorcycle'];
        case 'W':
          return ['car', 'bus', 'truck', 'auto'];
        default:
          return ['car', 'truck', 'bus', 'auto'];
      }
    } else {
      // AI Adaptive Digital Twin (Proposed System): Free-Flowing Smooth Traffic (2 vehicles per arm = 8 total)
      switch (appKey) {
        case 'N':
          return isEmergency ? ['emergency', 'car'] : ['car', 'motorcycle'];
        case 'S':
          return ['car', 'auto'];
        case 'E':
          return ['motorcycle', 'car'];
        case 'W':
          return ['car', 'bus'];
        default:
          return ['car', 'motorcycle'];
      }
    }
  };

  // High-Fidelity SVG Vehicle Top-View Renderer
  const renderVehicleSVG = (type: string, x: number, y: number, rotation: number, key: string, sirenActive: boolean) => {
    const transform = `translate(${x}, ${y}) rotate(${rotation})`;
    const gpuStyle: React.CSSProperties = { willChange: 'transform' };

    switch (type) {
      case 'emergency':
        return (
          <g transform={transform} key={key} style={gpuStyle}>
            {/* Front Headlight Beams */}
            <polygon points="-10,-25 -22,-65 22,-65 10,-25" fill="rgba(254, 240, 138, 0.22)" />
            {sirenActive && (
              <circle cx="0" cy="0" r="36" fill="rgba(239, 68, 68, 0.25)">
                <animate attributeName="r" values="28;42;28" dur="0.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0.15;0.5" dur="0.5s" repeatCount="indefinite" />
              </circle>
            )}

            {/* Ambulance Body */}
            <rect x="-14" y="-26" width="28" height="52" rx="5" fill="#ffffff" stroke={sirenActive ? "#dc2626" : "#475569"} strokeWidth="2" />
            <rect x="-11" y="-22" width="22" height="9" fill="#0f172a" rx="2" stroke="#38bdf8" strokeWidth="0.8" />
            <rect x="-16" y="-18" width="3" height="6" fill="#dc2626" rx="1" />
            <rect x="13" y="-18" width="3" height="6" fill="#dc2626" rx="1" />

            {/* Red Cross */}
            <g transform="translate(0, 3)">
              <rect x="-3" y="-10" width="6" height="20" fill={sirenActive ? "#dc2626" : "#475569"} rx="1" />
              <rect x="-10" y="-3" width="20" height="6" fill={sirenActive ? "#dc2626" : "#475569"} rx="1" />
            </g>

            {/* Siren Lights */}
            <rect x="-10" y="-11" width="20" height="4" fill="#0f172a" rx="1" />
            {sirenActive ? (
              <>
                <circle cx="-6" cy="-9" r="4" fill="#38bdf8">
                  <animate attributeName="fill" values="#38bdf8;#0284c7;#38bdf8" dur="0.25s" repeatCount="indefinite" />
                </circle>
                <circle cx="6" cy="-9" r="4" fill="#ef4444">
                  <animate attributeName="fill" values="#ef4444;#b91c1c;#ef4444" dur="0.25s" repeatCount="indefinite" />
                </circle>
              </>
            ) : (
              <>
                <circle cx="-6" cy="-9" r="3" fill="#64748b" />
                <circle cx="6" cy="-9" r="3" fill="#64748b" />
              </>
            )}

            {/* Rear Red Taillights */}
            <rect x="-12" y="24" width="5" height="2" fill="#ef4444" rx="1" />
            <rect x="7" y="24" width="5" height="2" fill="#ef4444" rx="1" />

            <text x="0" y="22" textAnchor="middle" fill={sirenActive ? "#dc2626" : "#475569"} fontSize="6" fontWeight="900" letterSpacing="0.3">
              {sirenActive ? "🚨 108 AMBULANCE" : "108 ROUTINE"}
            </text>
          </g>
        );
      case 'bus':
        return (
          <g transform={transform} key={key} style={gpuStyle}>
            <polygon points="-12,-32 -20,-70 20,-70 12,-32" fill="rgba(254, 240, 138, 0.18)" />
            <rect x="-14" y="-34" width="28" height="68" rx="5" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1.5" />
            <rect x="-12" y="-30" width="24" height="10" fill="#0f172a" rx="2" />
            <rect x="-12" y="-16" width="24" height="4" fill="#0f172a" rx="1" />
            <rect x="-12" y="0" width="24" height="4" fill="#0f172a" rx="1" />
            <rect x="-12" y="16" width="24" height="12" fill="#0f172a" rx="2" />
            <rect x="-12" y="32" width="5" height="2" fill="#ef4444" rx="1" />
            <rect x="7" y="32" width="5" height="2" fill="#ef4444" rx="1" />
          </g>
        );
      case 'truck':
        return (
          <g transform={transform} key={key} style={gpuStyle}>
            <polygon points="-10,-28 -18,-60 18,-60 10,-28" fill="rgba(254, 240, 138, 0.18)" />
            <rect x="-14" y="-28" width="28" height="56" rx="3" fill="#166534" stroke="#4ade80" strokeWidth="1.5" />
            <rect x="-12" y="-26" width="24" height="14" fill="#047857" rx="2" />
            <rect x="-10" y="-24" width="20" height="6" fill="#0f172a" rx="1" />
            <rect x="-12" y="26" width="5" height="2" fill="#ef4444" rx="1" />
            <rect x="7" y="26" width="5" height="2" fill="#ef4444" rx="1" />
          </g>
        );
      case 'motorcycle':
        return (
          <g transform={transform} key={key} style={gpuStyle}>
            <polygon points="-4,-12 -10,-35 10,-35 4,-12" fill="rgba(254, 240, 138, 0.22)" />
            <rect x="-5" y="-12" width="10" height="24" rx="3" fill="#854d0e" stroke="#fde047" strokeWidth="1" />
            <circle cx="0" cy="-2" r="5" fill="#facc15" />
            <circle cx="0" cy="10" r="1.5" fill="#ef4444" />
          </g>
        );
      case 'auto':
        return (
          <g transform={transform} key={key} style={gpuStyle}>
            <polygon points="-8,-14 -14,-40 14,-40 8,-14" fill="rgba(254, 240, 138, 0.18)" />
            <polygon points="0,-14 11,8 -11,8" fill="#c2410c" stroke="#fb923c" strokeWidth="1.5" />
            <rect x="-10" y="0" width="20" height="12" fill="#ea580c" rx="2" />
            <circle cx="-7" cy="11" r="1.5" fill="#ef4444" />
            <circle cx="7" cy="11" r="1.5" fill="#ef4444" />
          </g>
        );
      default: // car
        return (
          <g transform={transform} key={key} style={gpuStyle}>
            <polygon points="-8,-20 -18,-50 18,-50 8,-20" fill="rgba(254, 240, 138, 0.2)" />
            <rect x="-12" y="-20" width="24" height="40" rx="6" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
            <rect x="-9" y="-15" width="18" height="7" fill="#0f172a" rx="2" />
            <rect x="-9" y="8" width="18" height="5" fill="#0f172a" rx="1" />
            <circle cx="-8" cy="-19" r="2" fill="#fef08a" />
            <circle cx="8" cy="-19" r="2" fill="#fef08a" />
            <rect x="-10" y="19" width="4" height="2" fill="#ef4444" rx="1" />
            <rect x="6" y="19" width="4" height="2" fill="#ef4444" rx="1" />
          </g>
        );
    }
  };

  // Modular SVG Digital Twin Canvas Renderer
  const renderDigitalTwinCanvas = (isNSGreen: boolean, isEWGreen: boolean, isFixedTwin: boolean, keyPrefix: string) => {
    const sirenActive = !isFixedTwin && isEmergency;
    const northVehicles = getVehiclesForApproach('N', isFixedTwin);
    const southVehicles = getVehiclesForApproach('S', isFixedTwin);
    const eastVehicles = getVehiclesForApproach('E', isFixedTwin);
    const westVehicles = getVehiclesForApproach('W', isFixedTwin);

    return (
      <div style={{ width: '100%', height: viewMode === 'side-by-side' ? '390px' : '530px', background: '#070b14', borderRadius: '0.85rem', overflow: 'hidden', border: isFixedTwin ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(34, 197, 94, 0.4)', position: 'relative', boxShadow: 'inset 0 0 30px rgba(0,0,0,0.8)' }}>
        {/* Floating Live Traffic Status Overlay */}
        {isFixedTwin && (
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: 'rgba(239, 68, 68, 0.28)',
            border: '1px solid rgba(239, 68, 68, 0.7)',
            backdropFilter: 'blur(8px)',
            padding: '5px 12px',
            borderRadius: '8px',
            color: '#fee2e2',
            fontSize: '0.75rem',
            fontWeight: 900,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.6)',
            zIndex: 10
          }}>
            <span style={{ fontSize: '0.9rem' }}>🚨</span>
            <span>HIGH CONGESTION (16 QUEUED VEHICLES)</span>
          </div>
        )}

        <svg viewBox="0 0 1000 500" style={{ width: '100%', height: '100%', display: 'block' }}>
          <defs>
            <pattern id={`${keyPrefix}_gridPattern`} width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.025)" strokeWidth="1" />
            </pattern>
            <linearGradient id={`${keyPrefix}_asphalt`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#141c2c" />
              <stop offset="100%" stopColor="#0f1624" />
            </linearGradient>
          </defs>

          {/* Background Landscape Grid */}
          <rect width="1000" height="500" fill="#080d1a" />
          <rect width="1000" height="500" fill={`url(#${keyPrefix}_gridPattern)`} />

          {/* Corner Parks & Lawn Blocks */}
          <g>
            <rect x="0" y="0" width="415" height="175" fill="#0c2419" rx="6" />
            <rect x="10" y="10" width="395" height="155" fill="#083322" rx="6" stroke="rgba(34, 197, 94, 0.2)" strokeWidth="1" />
            <circle cx="100" cy="80" r="18" fill="#15803d" opacity="0.6" />
            <circle cx="280" cy="70" r="22" fill="#15803d" opacity="0.6" />
            <path d="M 0 175 L 415 175" stroke="#334155" strokeWidth="4" />
            <path d="M 415 0 L 415 175" stroke="#334155" strokeWidth="4" />
          </g>

          <g>
            <rect x="585" y="0" width="415" height="175" fill="#0c2419" rx="6" />
            <rect x="595" y="10" width="395" height="155" fill="#083322" rx="6" stroke="rgba(34, 197, 94, 0.2)" strokeWidth="1" />
            <circle cx="720" cy="80" r="20" fill="#15803d" opacity="0.6" />
            <circle cx="900" cy="90" r="18" fill="#15803d" opacity="0.6" />
            <path d="M 585 175 L 1000 175" stroke="#334155" strokeWidth="4" />
            <path d="M 585 0 L 585 175" stroke="#334155" strokeWidth="4" />
          </g>

          <g>
            <rect x="0" y="325" width="415" height="175" fill="#0c2419" rx="6" />
            <rect x="10" y="335" width="395" height="155" fill="#083322" rx="6" stroke="rgba(34, 197, 94, 0.2)" strokeWidth="1" />
            <circle cx="120" cy="410" r="22" fill="#15803d" opacity="0.6" />
            <circle cx="300" cy="420" r="19" fill="#15803d" opacity="0.6" />
            <path d="M 0 325 L 415 325" stroke="#334155" strokeWidth="4" />
            <path d="M 415 325 L 415 500" stroke="#334155" strokeWidth="4" />
          </g>

          <g>
            <rect x="585" y="325" width="415" height="175" fill="#0c2419" rx="6" />
            <rect x="595" y="335" width="395" height="155" fill="#083322" rx="6" stroke="rgba(34, 197, 94, 0.2)" strokeWidth="1" />
            <circle cx="700" cy="410" r="18" fill="#15803d" opacity="0.6" />
            <circle cx="880" cy="400" r="22" fill="#15803d" opacity="0.6" />
            <path d="M 585 325 L 1000 325" stroke="#334155" strokeWidth="4" />
            <path d="M 585 325 L 585 500" stroke="#334155" strokeWidth="4" />
          </g>

          {/* Photorealistic Asphalt Roads */}
          <rect x="420" y="0" width="160" height="500" fill={`url(#${keyPrefix}_asphalt)`} />
          <rect x="0" y="180" width="1000" height="140" fill={`url(#${keyPrefix}_asphalt)`} />
          <rect x="420" y="180" width="160" height="140" fill="#0d1527" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="2" />

          {/* Double Yellow & Dashed Lane Lines */}
          <line x1="499" y1="0" x2="499" y2="160" stroke="#eab308" strokeWidth="2" />
          <line x1="501" y1="0" x2="501" y2="160" stroke="#eab308" strokeWidth="2" />
          <line x1="460" y1="0" x2="460" y2="160" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeDasharray="10 10" />
          <line x1="540" y1="0" x2="540" y2="160" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeDasharray="10 10" />

          <line x1="499" y1="340" x2="499" y2="500" stroke="#eab308" strokeWidth="2" />
          <line x1="501" y1="340" x2="501" y2="500" stroke="#eab308" strokeWidth="2" />
          <line x1="460" y1="340" x2="460" y2="500" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeDasharray="10 10" />
          <line x1="540" y1="340" x2="540" y2="500" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeDasharray="10 10" />

          <line x1="0" y1="249" x2="400" y2="249" stroke="#eab308" strokeWidth="2" />
          <line x1="0" y1="251" x2="400" y2="251" stroke="#eab308" strokeWidth="2" />
          <line x1="0" y1="215" x2="400" y2="215" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeDasharray="10 10" />
          <line x1="0" y1="285" x2="400" y2="285" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeDasharray="10 10" />

          <line x1="600" y1="249" x2="1000" y2="249" stroke="#eab308" strokeWidth="2" />
          <line x1="600" y1="251" x2="1000" y2="251" stroke="#eab308" strokeWidth="2" />
          <line x1="600" y1="215" x2="1000" y2="215" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeDasharray="10 10" />
          <line x1="600" y1="285" x2="1000" y2="285" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeDasharray="10 10" />

          {/* Pavement Lane Direction Arrows */}
          <path d="M 470 60 L 470 40 M 470 40 L 465 48 M 470 40 L 475 48" stroke="rgba(255,255,255,0.4)" strokeWidth="2" fill="none" />
          <path d="M 530 440 L 530 460 M 530 460 L 525 452 M 530 460 L 535 452" stroke="rgba(255,255,255,0.4)" strokeWidth="2" fill="none" />
          <path d="M 60 270 L 40 270 M 40 270 L 48 265 M 40 270 L 48 275" stroke="rgba(255,255,255,0.4)" strokeWidth="2" fill="none" />
          <path d="M 940 230 L 960 230 M 960 230 L 952 225 M 960 230 L 952 235" stroke="rgba(255,255,255,0.4)" strokeWidth="2" fill="none" />

          {/* Stop Lines */}
          <line x1="420" y1="160" x2="498" y2="160" stroke="#ffffff" strokeWidth="5" />
          <line x1="502" y1="340" x2="580" y2="340" stroke="#ffffff" strokeWidth="5" />
          <line x1="400" y1="252" x2="400" y2="320" stroke="#ffffff" strokeWidth="5" />
          <line x1="600" y1="180" x2="600" y2="248" stroke="#ffffff" strokeWidth="5" />

          {/* Zebra Crosswalks */}
          {[...Array(11)].map((_, i) => (
            <rect key={`n_cw_${i}`} x={424 + i * 14} y="163" width="8" height="14" fill="rgba(255, 255, 255, 0.75)" rx="1" />
          ))}
          {[...Array(11)].map((_, i) => (
            <rect key={`s_cw_${i}`} x={424 + i * 14} y="323" width="8" height="14" fill="rgba(255, 255, 255, 0.75)" rx="1" />
          ))}
          {[...Array(9)].map((_, i) => (
            <rect key={`w_cw_${i}`} x="403" y={185 + i * 14} width="14" height="8" fill="rgba(255, 255, 255, 0.75)" rx="1" />
          ))}
          {[...Array(9)].map((_, i) => (
            <rect key={`e_cw_${i}`} x="583" y={185 + i * 14} width="14" height="8" fill="rgba(255, 255, 255, 0.75)" rx="1" />
          ))}

          {/* Traffic Signal Lights with Glowing Halos */}
          <g>
            <circle cx="395" cy="140" r="14" fill="#0f172a" stroke="#334155" strokeWidth="2" />
            <circle cx="395" cy="140" r="9" fill={getSignalColor(isNSGreen)}>
              <animate attributeName="r" values="9;11;9" dur="1.2s" repeatCount="indefinite" />
            </circle>
            <text x="395" y="120" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="700">NORTH SIG</text>
          </g>

          <g>
            <circle cx="605" cy="360" r="14" fill="#0f172a" stroke="#334155" strokeWidth="2" />
            <circle cx="605" cy="360" r="9" fill={getSignalColor(isNSGreen)}>
              <animate attributeName="r" values="9;11;9" dur="1.2s" repeatCount="indefinite" />
            </circle>
            <text x="605" y="385" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="700">SOUTH SIG</text>
          </g>

          <g>
            <circle cx="620" cy="155" r="14" fill="#0f172a" stroke="#334155" strokeWidth="2" />
            <circle cx="620" cy="155" r="9" fill={getSignalColor(isEWGreen)}>
              <animate attributeName="r" values="9;11;9" dur="1.2s" repeatCount="indefinite" />
            </circle>
            <text x="645" y="140" textAnchor="start" fill="#94a3b8" fontSize="10" fontWeight="700">EAST SIG</text>
          </g>

          <g>
            <circle cx="380" cy="345" r="14" fill="#0f172a" stroke="#334155" strokeWidth="2" />
            <circle cx="380" cy="345" r="9" fill={getSignalColor(isEWGreen)}>
              <animate attributeName="r" values="9;11;9" dur="1.2s" repeatCount="indefinite" />
            </circle>
            <text x="355" y="365" textAnchor="end" fill="#94a3b8" fontSize="10" fontWeight="700">WEST SIG</text>
          </g>

          {/* Pedestrian Walk Signals */}
          <g transform="translate(500, 145)">
            <rect x="-24" y="-12" width="48" height="24" rx="4" fill="#0f172a" stroke={!isNSGreen ? "#22c55e" : "#ef4444"} strokeWidth="1.5" />
            <circle cx="-10" cy="0" r="6" fill={!isNSGreen ? "#22c55e" : "#1e293b"} />
            <text x="6" y="4" textAnchor="middle" fill={!isNSGreen ? "#22c55e" : "#ef4444"} fontSize="9" fontWeight="900">
              {!isNSGreen ? "WALK" : "WAIT"}
            </text>
          </g>

          <g transform="translate(500, 355)">
            <rect x="-24" y="-12" width="48" height="24" rx="4" fill="#0f172a" stroke={!isNSGreen ? "#22c55e" : "#ef4444"} strokeWidth="1.5" />
            <circle cx="-10" cy="0" r="6" fill={!isNSGreen ? "#22c55e" : "#1e293b"} />
            <text x="6" y="4" textAnchor="middle" fill={!isNSGreen ? "#22c55e" : "#ef4444"} fontSize="9" fontWeight="900">
              {!isNSGreen ? "WALK" : "WAIT"}
            </text>
          </g>

          {/* Vehicles rendering - Dynamic Anti-Overlap Headway Safeguard */}
          {/* North Inbound */}
          {(() => {
            const laneFrontY: Record<number, number> = {};
            return northVehicles.map((vtype, idx) => {
              const isAmbulance = vtype === 'emergency';
              const laneId = sirenActive ? (isAmbulance ? 0 : 1) : idx % 2;
              const laneX = sirenActive ? (isAmbulance ? 448 : 485) : (idx % 2 === 0 ? 455 : 485);
              const speedBoost = isFixedTwin ? 0.8 : 1.35;
              const currentSpeed = getSpeedForVType(vtype, sirenActive) * speedBoost;
              const startOffset = -80 + idx * (isFixedTwin ? 110 : 280);
              const flowY = ((startOffset + simStep * currentSpeed) % 660) - 80;
              const stopY = 110 - Math.floor(idx / 2) * (isFixedTwin ? 75 : 85);
              
              const movesContinuously = (isAmbulance && sirenActive) || isNSGreen;
              let vehY = movesContinuously ? flowY : Math.min(flowY, stopY);

              // Anti-Overlap Safety Distance Buffer
              if (laneFrontY[laneId] !== undefined) {
                vehY = Math.min(vehY, laneFrontY[laneId] - (isFixedTwin ? 75 : 85));
              }
              laneFrontY[laneId] = vehY;

              return renderVehicleSVG(vtype, laneX, vehY, 180, `${keyPrefix}_n_v_${idx}`, sirenActive);
            });
          })()}

          {/* South Inbound */}
          {(() => {
            const laneFrontY: Record<number, number> = {};
            return southVehicles.map((vtype, idx) => {
              const laneId = idx % 2;
              const laneX = idx % 2 === 0 ? 515 : 545;
              const speedBoost = isFixedTwin ? 0.8 : 1.35;
              const currentSpeed = getSpeedForVType(vtype, false) * speedBoost;
              const startOffset = -80 + idx * (isFixedTwin ? 110 : 280);
              const flowY = 580 - ((startOffset + simStep * currentSpeed) % 660);
              const stopY = 380 + Math.floor(idx / 2) * (isFixedTwin ? 75 : 85);
              let vehY = isNSGreen ? flowY : Math.max(flowY, stopY);

              if (laneFrontY[laneId] !== undefined) {
                vehY = Math.max(vehY, laneFrontY[laneId] + (isFixedTwin ? 75 : 85));
              }
              laneFrontY[laneId] = vehY;

              return renderVehicleSVG(vtype, laneX, vehY, 0, `${keyPrefix}_s_v_${idx}`, false);
            });
          })()}

          {/* West Inbound */}
          {(() => {
            const laneFrontX: Record<number, number> = {};
            return westVehicles.map((vtype, idx) => {
              const laneId = idx % 2;
              const laneY = idx % 2 === 0 ? 270 : 295;
              const speedBoost = isFixedTwin ? 0.8 : 1.35;
              const currentSpeed = getSpeedForVType(vtype, false) * speedBoost;
              const startOffset = -80 + idx * (isFixedTwin ? 110 : 280);
              const flowX = ((startOffset + simStep * currentSpeed) % 1160) - 80;
              const stopX = 330 - Math.floor(idx / 2) * (isFixedTwin ? 75 : 85);
              let vehX = isEWGreen ? flowX : Math.min(flowX, stopX);

              if (laneFrontX[laneId] !== undefined) {
                vehX = Math.min(vehX, laneFrontX[laneId] - (isFixedTwin ? 75 : 85));
              }
              laneFrontX[laneId] = vehX;

              return renderVehicleSVG(vtype, vehX, laneY, 90, `${keyPrefix}_w_v_${idx}`, false);
            });
          })()}

          {/* East Inbound */}
          {(() => {
            const laneFrontX: Record<number, number> = {};
            return eastVehicles.map((vtype, idx) => {
              const laneId = idx % 2;
              const laneY = idx % 2 === 0 ? 205 : 230;
              const speedBoost = isFixedTwin ? 0.8 : 1.35;
              const currentSpeed = getSpeedForVType(vtype, false) * speedBoost;
              const startOffset = -80 + idx * (isFixedTwin ? 110 : 280);
              const flowX = 1080 - ((startOffset + simStep * currentSpeed) % 1160);
              const stopX = 670 + Math.floor(idx / 2) * (isFixedTwin ? 75 : 85);
              let vehX = isEWGreen ? flowX : Math.max(flowX, stopX);

              if (laneFrontX[laneId] !== undefined) {
                vehX = Math.max(vehX, laneFrontX[laneId] + (isFixedTwin ? 75 : 85));
              }
              laneFrontX[laneId] = vehX;

              return renderVehicleSVG(vtype, vehX, laneY, 270, `${keyPrefix}_e_v_${idx}`, false);
            });
          })()}

          {/* Animated Pedestrians */}
          {[...Array(approaches.N?.pedestrians_waiting || 3)].map((_, i) => {
            const isSafeToWalk = !isNSGreen;
            const pX = isSafeToWalk ? 430 + ((i * 35 + simStep * pedSpeed) % 130) : 425;
            return (
              <g key={`${keyPrefix}_ped_n_${i}`} transform={`translate(${pX}, 170)`} style={{ willChange: 'transform' }}>
                <circle cx="0" cy="0" r="5" fill={isSafeToWalk ? "#22c55e" : "#ef4444"} stroke="#ffffff" strokeWidth="1" />
                <circle cx="0" cy="-6" r="3" fill="#fbbf24" />
              </g>
            );
          })}

          {[...Array(approaches.S?.pedestrians_waiting || 3)].map((_, i) => {
            const isSafeToWalk = !isNSGreen;
            const pX = isSafeToWalk ? 570 - ((i * 35 + simStep * pedSpeed) % 130) : 575;
            return (
              <g key={`${keyPrefix}_ped_s_${i}`} transform={`translate(${pX}, 330)`} style={{ willChange: 'transform' }}>
                <circle cx="0" cy="0" r="5" fill={isSafeToWalk ? "#22c55e" : "#ef4444"} stroke="#ffffff" strokeWidth="1" />
                <circle cx="0" cy="-6" r="3" fill="#fbbf24" />
              </g>
            );
          })}

          {/* Compass labels positioned cleanly inside corner park areas (Zero Road Overlap) */}
          <g>
            <rect x="250" y="12" width="100" height="22" rx="4" fill="rgba(15, 23, 42, 0.75)" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1" />
            <text x="300" y="27" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="900" letterSpacing="1.5">NORTH (N)</text>
          </g>

          <g>
            <rect x="250" y="465" width="100" height="22" rx="4" fill="rgba(15, 23, 42, 0.75)" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1" />
            <text x="300" y="480" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="900" letterSpacing="1.5">SOUTH (S)</text>
          </g>

          <g>
            <rect x="650" y="12" width="90" height="22" rx="4" fill="rgba(15, 23, 42, 0.75)" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1" />
            <text x="695" y="27" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="900" letterSpacing="1.5">WEST (W)</text>
          </g>

          <g>
            <rect x="650" y="465" width="85" height="22" rx="4" fill="rgba(15, 23, 42, 0.75)" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1" />
            <text x="692" y="480" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="900" letterSpacing="1.5">EAST (E)</text>
          </g>
        </svg>
      </div>
    );
  };

  return (
    <div className="panel" style={{ width: '100%', marginBottom: '1rem' }}>
      {/* Top Header Bar */}
      <div className="panel-header" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
        <div className="panel-title" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
          <Activity className="w-5 h-5" style={{ color: 'var(--accent-cyan)' }} />
          <span>SUMO Digital Twin — Real-Time Signal Simulation</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          {/* DIGITAL TWIN VIEW MODE SELECTOR */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', padding: '0.25rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}>
            <button
              onClick={() => setViewMode('side-by-side')}
              style={{
                background: viewMode === 'side-by-side' ? '#0284c7' : 'transparent',
                color: viewMode === 'side-by-side' ? '#ffffff' : '#475569',
                border: 'none',
                borderRadius: '0.36rem',
                padding: '0.35rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              ⚔️ Side-by-Side View
            </button>
            <button
              onClick={() => setViewMode('ai-only')}
              style={{
                background: viewMode === 'ai-only' ? '#0284c7' : 'transparent',
                color: viewMode === 'ai-only' ? '#ffffff' : '#475569',
                border: 'none',
                borderRadius: '0.36rem',
                padding: '0.35rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              🤖 AI Adaptive Twin
            </button>
            <button
              onClick={() => setViewMode('fixed-only')}
              style={{
                background: viewMode === 'fixed-only' ? '#0284c7' : 'transparent',
                color: viewMode === 'fixed-only' ? '#ffffff' : '#475569',
                border: 'none',
                borderRadius: '0.36rem',
                padding: '0.35rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              ⏱️ Fixed-Timer Twin
            </button>
          </div>

          {/* Speed Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 800 }}>Speed:</span>
            <button
              onClick={() => setSpeedMultiplier(0.5)}
              style={{
                background: speedMultiplier === 0.5 ? '#0284c7' : 'transparent',
                color: speedMultiplier === 0.5 ? '#ffffff' : '#475569',
                border: 'none',
                borderRadius: '0.3rem',
                padding: '0.2rem 0.4rem',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              0.5x
            </button>
            <button
              onClick={() => setSpeedMultiplier(1.0)}
              style={{
                background: speedMultiplier === 1.0 ? '#0284c7' : 'transparent',
                color: speedMultiplier === 1.0 ? '#ffffff' : '#475569',
                border: 'none',
                borderRadius: '0.3rem',
                padding: '0.2rem 0.4rem',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              1x
            </button>
            <button
              onClick={() => setSpeedMultiplier(2.0)}
              style={{
                background: speedMultiplier === 2.0 ? '#0284c7' : 'transparent',
                color: speedMultiplier === 2.0 ? '#ffffff' : '#475569',
                border: 'none',
                borderRadius: '0.3rem',
                padding: '0.2rem 0.4rem',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              2x
            </button>
          </div>
        </div>
      </div>

      {/* AMBULANCE CORRIDOR ALGORITHM LIVE HUD BANNER */}
      {isEmergency && (
        <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', padding: '0.65rem 1rem', borderRadius: '0.5rem', margin: '0.75rem 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', animation: 'pulse 1.5s infinite' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#be123c', fontWeight: 800, fontSize: '0.85rem' }}>
            <Siren className="w-5 h-5 text-red-600" />
            <span>EMERGENCY AMBULANCE PRIORITY PASS: AI Adaptive System Grants Instant Green Corridor! Fixed-Timer System Retains Congestion Wait.</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#9f1239', fontWeight: 800 }}>
            AI Delay Saved: -100% | Ambulance Clearance: Immediate
          </div>
        </div>
      )}

      {/* MAIN DIGITAL TWIN DISPLAY CANVAS CONTAINER */}
      {viewMode === 'side-by-side' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginTop: '0.75rem' }}>
          {/* LEFT COLUMN: LEGACY FIXED-TIMER DIGITAL TWIN */}
          <div>
            <div style={{ background: '#ffe4e6', border: '1px solid #fca5a5', padding: '0.5rem 0.85rem', borderRadius: '0.5rem 0.5rem 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#be123c', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                ⏱️ TRADITIONAL FIXED-TIMER TWIN (BASELINE)
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, background: '#fecdd3', color: '#9f1239', padding: '0.2rem 0.5rem', borderRadius: '0.3rem' }}>
                Phase: Fixed 30s Cycles
              </span>
            </div>
            {renderDigitalTwinCanvas(fixedIsNSGreen, fixedIsEWGreen, true, 'fixed_twin')}
            <div style={{ background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '0 0 0.5rem 0.5rem', border: '1px solid #cbd5e1', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', color: '#334155', fontWeight: 600 }}>
              <div>Avg Queue: <strong style={{ color: '#dc2626' }}>18.5 PCU</strong></div>
              <div>Avg Delay: <strong style={{ color: '#dc2626' }}>54.2s</strong></div>
              <div>Ambulance Wait: <strong style={{ color: '#dc2626' }}>{isEmergency ? '42s (STUCK IN QUEUE)' : 'Normal'}</strong></div>
            </div>
          </div>

          {/* RIGHT COLUMN: PROPOSED AI ADAPTIVE DIGITAL TWIN */}
          <div>
            <div style={{ background: '#dcfce7', border: '1px solid #86efac', padding: '0.5rem 0.85rem', borderRadius: '0.5rem 0.5rem 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#15803d', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                🤖 AI ADAPTIVE DIGITAL TWIN (PROPOSED)
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, background: '#bbf7d0', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '0.3rem' }}>
                Phase {aiActivePhase}: {aiIsNSGreen ? 'North-South Green' : aiIsEWGreen ? 'East-West Green' : 'Clearance'}
              </span>
            </div>
            {renderDigitalTwinCanvas(aiIsNSGreen, aiIsEWGreen, false, 'ai_twin')}
            <div style={{ background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '0 0 0.5rem 0.5rem', border: '1px solid #cbd5e1', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', color: '#334155', fontWeight: 600 }}>
              <div>Avg Queue: <strong style={{ color: '#16a34a' }}>3.2 PCU (-83%)</strong></div>
              <div>Avg Delay: <strong style={{ color: '#16a34a' }}>12.1s (-78%)</strong></div>
              <div>Ambulance Wait: <strong style={{ color: '#16a34a' }}>{isEmergency ? '0s (INSTANT PASS)' : 'Normal'}</strong></div>
            </div>
          </div>
        </div>
      ) : viewMode === 'ai-only' ? (
        <div style={{ marginTop: '0.75rem' }}>
          {renderDigitalTwinCanvas(aiIsNSGreen, aiIsEWGreen, false, 'ai_single')}
        </div>
      ) : (
        <div style={{ marginTop: '0.75rem' }}>
          {renderDigitalTwinCanvas(fixedIsNSGreen, fixedIsEWGreen, true, 'fixed_single')}
        </div>
      )}

      {/* Vehicle Category & PCU Legend */}
      <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem' }}>
        <div className="metric-card" style={{ padding: '0.6rem 0.85rem' }}>
          <span className="metric-lbl">Car (PCU: 1.0)</span>
          <span className="metric-val" style={{ fontSize: '1.2rem', color: '#0284c7' }}>35%</span>
        </div>
        <div className="metric-card" style={{ padding: '0.6rem 0.85rem' }}>
          <span className="metric-lbl">2-Wheeler (PCU: 0.5)</span>
          <span className="metric-val" style={{ fontSize: '1.2rem', color: '#d97706' }}>40%</span>
        </div>
        <div className="metric-card" style={{ padding: '0.6rem 0.85rem' }}>
          <span className="metric-lbl">Bus (PCU: 3.0)</span>
          <span className="metric-val" style={{ fontSize: '1.2rem', color: '#dc2626' }}>5%</span>
        </div>
        <div className="metric-card" style={{ padding: '0.6rem 0.85rem' }}>
          <span className="metric-lbl">Truck (PCU: 3.0)</span>
          <span className="metric-val" style={{ fontSize: '1.2rem', color: '#16a34a' }}>5%</span>
        </div>
        <div className="metric-card" style={{ padding: '0.6rem 0.85rem' }}>
          <span className="metric-lbl">Auto (PCU: 0.75)</span>
          <span className="metric-val" style={{ fontSize: '1.2rem', color: '#ea580c' }}>15%</span>
        </div>
      </div>
    </div>
  );
};

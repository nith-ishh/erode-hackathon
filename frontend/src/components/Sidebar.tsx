import React from 'react';
import {
  Layers,
  Activity,
  ShieldAlert,
  Ban,
  GitCompare,
  Brain,
  ShieldCheck,
  Siren,
  LineChart,
  Database,
  Radio,
  Sliders,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export type FeatureTab =
  | 'all'
  | 'visualizer'
  | 'bridge'
  | 'parking'
  | 'comparison'
  | 'brain'
  | 'safety'
  | 'emergency'
  | 'dynamics'
  | 'analytics';

export interface FeatureVisibility {
  visualizer: boolean;
  bridge: boolean;
  parking: boolean;
  comparison: boolean;
  brain: boolean;
  safety: boolean;
  emergency: boolean;
  dynamics: boolean;
  analytics: boolean;
}

interface SidebarProps {
  activeTab: FeatureTab;
  onSelectTab: (tab: FeatureTab) => void;
  visibility: FeatureVisibility;
  onToggleFeature: (key: keyof FeatureVisibility) => void;
  onSelectAllFeatures: () => void;
  onClearAllFeatures: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  stateData?: any;
  connectionMode: 'ws' | 'polling' | 'connecting';
  scenario: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  visibility,
  onToggleFeature,
  onSelectAllFeatures,
  onClearAllFeatures,
  isCollapsed,
  onToggleCollapse,
  stateData,
  connectionMode,
  scenario
}) => {
  const bridge = stateData?.bridge_monitor;
  const isBridgeAlert = bridge?.alert_active || false;
  const bridgeLoadPct = bridge?.load_percentage ?? 46;

  const noParking = stateData?.no_parking;
  const parkingCount = noParking?.active_violations_count ?? 0;

  const isEmergency = stateData?.state?.emergency_present || stateData?.ambulance?.active || false;
  const simStep = stateData?.step ?? 0;

  const navItems: Array<{
    id: FeatureTab;
    label: string;
    icon: React.ReactNode;
    badge?: string;
    badgeColor?: string;
    featureKey?: keyof FeatureVisibility;
  }> = [
    {
      id: 'all',
      label: 'Command Center (All)',
      icon: <Layers className="w-4 h-4 text-cyan-400" />,
      badge: 'OVERVIEW',
      badgeColor: 'rgba(56, 189, 248, 0.2)'
    },
    {
      id: 'visualizer',
      label: 'SUMO 2D Digital Twin',
      icon: <Activity className="w-4 h-4 text-emerald-400" />,
      badge: 'LIVE 2D',
      badgeColor: 'rgba(34, 197, 94, 0.2)',
      featureKey: 'visualizer'
    },
    {
      id: 'bridge',
      label: 'Bridge Structural Alert',
      icon: <ShieldAlert className="w-4 h-4 text-amber-400" />,
      badge: isBridgeAlert ? 'ALERT' : `${bridgeLoadPct}%`,
      badgeColor: isBridgeAlert ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.2)',
      featureKey: 'bridge'
    },
    {
      id: 'parking',
      label: 'No-Parking e-Challan',
      icon: <Ban className="w-4 h-4 text-rose-400" />,
      badge: parkingCount > 0 ? `${parkingCount} CITED` : 'CLEAR',
      badgeColor: parkingCount > 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(56, 189, 248, 0.2)',
      featureKey: 'parking'
    },
    {
      id: 'comparison',
      label: 'Adaptive vs Fixed-Time',
      icon: <GitCompare className="w-4 h-4 text-purple-400" />,
      badge: 'DUAL TWIN',
      badgeColor: 'rgba(168, 85, 247, 0.2)',
      featureKey: 'comparison'
    },
    {
      id: 'brain',
      label: 'AI Brain & Explainer',
      icon: <Brain className="w-4 h-4 text-blue-400" />,
      badge: 'PPO + JEV',
      badgeColor: 'rgba(59, 130, 246, 0.2)',
      featureKey: 'brain'
    },
    {
      id: 'safety',
      label: 'Safety Shield & Faults',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
      badge: '11 RULES',
      badgeColor: 'rgba(34, 197, 94, 0.2)',
      featureKey: 'safety'
    },
    {
      id: 'emergency',
      label: 'Green Wave Corridor',
      icon: <Siren className="w-4 h-4 text-red-400" />,
      badge: isEmergency ? 'SIREN ON' : 'READY',
      badgeColor: isEmergency ? 'rgba(239, 68, 68, 0.3)' : 'rgba(100, 116, 139, 0.2)',
      featureKey: 'emergency'
    },
    {
      id: 'dynamics',
      label: 'Live Dynamics & Graphs',
      icon: <LineChart className="w-4 h-4 text-cyan-400" />,
      badge: 'SERIES',
      badgeColor: 'rgba(56, 189, 248, 0.2)',
      featureKey: 'dynamics'
    },
    {
      id: 'analytics',
      label: 'Impact & Decision Audit',
      icon: <Database className="w-4 h-4 text-indigo-400" />,
      badge: 'SQLITE',
      badgeColor: 'rgba(99, 102, 241, 0.2)',
      featureKey: 'analytics'
    }
  ];

  return (
    <aside
      style={{
        width: isCollapsed ? '68px' : '280px',
        minWidth: isCollapsed ? '68px' : '280px',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        background: 'rgba(11, 16, 27, 0.92)',
        backdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 50,
        overflowY: 'auto',
        overflowX: 'hidden'
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: isCollapsed ? '1rem 0.5rem' : '1.25rem 1rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between'
        }}
      >
        {!isCollapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 12px rgba(56, 189, 248, 0.4)'
              }}
            >
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fff', letterSpacing: '0.5px' }}>
                TRAFFIC <span style={{ color: 'var(--accent-cyan)' }}>AI OS</span>
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Erode Smart Signal Control
              </div>
            </div>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            color: '#94a3b8',
            padding: '0.35rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Navigation List */}
      <div style={{ padding: '0.75rem 0.5rem', flex: 1 }}>
        {!isCollapsed && (
          <div
            style={{
              fontSize: '0.65rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              letterSpacing: '1px',
              padding: '0.25rem 0.5rem 0.5rem 0.5rem'
            }}
          >
            Feature Views
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                title={item.label}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isCollapsed ? 'center' : 'space-between',
                  padding: isCollapsed ? '0.65rem 0' : '0.55rem 0.65rem',
                  borderRadius: '0.5rem',
                  border: isActive ? '1px solid rgba(56, 189, 248, 0.5)' : '1px solid transparent',
                  background: isActive ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                  color: isActive ? '#fff' : '#94a3b8',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  {item.icon}
                  {!isCollapsed && (
                    <span style={{ fontSize: '0.8rem', fontWeight: isActive ? 800 : 600 }}>
                      {item.label}
                    </span>
                  )}
                </div>

                {!isCollapsed && item.badge && (
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '0.15rem 0.45rem',
                      borderRadius: '4px',
                      background: item.badgeColor || 'rgba(255, 255, 255, 0.08)',
                      color: '#e2e8f0'
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Feature Checkbox Selector (Visible when expanded) */}
        {!isCollapsed && (
          <div
            style={{
              marginTop: '1.25rem',
              paddingTop: '1rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 0.5rem 0.5rem 0.5rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.8px' }}>
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Select Visible Features</span>
              </div>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                <button
                  onClick={onSelectAllFeatures}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#38bdf8',
                    fontSize: '0.65rem',
                    cursor: 'pointer',
                    fontWeight: 700
                  }}
                >
                  All
                </button>
                <span style={{ color: 'rgba(255, 255, 255, 0.2)', fontSize: '0.65rem' }}>|</span>
                <button
                  onClick={onClearAllFeatures}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '0.65rem',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Clear
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              {(Object.keys(visibility) as Array<keyof FeatureVisibility>).map((key) => {
                const isChecked = visibility[key];
                const matchingItem = navItems.find((n) => n.featureKey === key);
                if (!matchingItem) return null;

                return (
                  <div
                    key={key}
                    onClick={() => onToggleFeature(key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.35rem 0.55rem',
                      borderRadius: '0.35rem',
                      cursor: 'pointer',
                      background: isChecked ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                      color: isChecked ? '#fff' : '#64748b',
                      fontSize: '0.75rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      {isChecked ? (
                        <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-600" />
                      )}
                      <span>{matchingItem.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Footer: System Status */}
      <div
        style={{
          padding: isCollapsed ? '0.75rem 0.4rem' : '0.85rem 1rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(5, 8, 15, 0.6)'
        }}
      >
        {isCollapsed ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span style={{ fontSize: '0.65rem', color: '#38bdf8', fontWeight: 800 }}>#{simStep}</span>
          </div>
        ) : (
          <div style={{ fontSize: '0.7rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#22c55e', fontWeight: 700 }}>
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                <span>{connectionMode === 'ws' ? 'WebSocket Live' : 'REST Stream'}</span>
              </div>
              <span style={{ color: '#38bdf8', fontWeight: 800 }}>Step #{simStep}</span>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>
              Scenario: <strong style={{ color: '#c084fc' }}>{scenario.toUpperCase()}</strong>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

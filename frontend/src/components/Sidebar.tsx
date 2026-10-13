import React, { useState } from 'react';
import { 
  Activity, 
  Brain, 
  ShieldCheck, 
  Siren, 
  BarChart2, 
  Database, 
  LayoutGrid, 
  ChevronLeft, 
  ChevronRight,
  AlertTriangle,
  Zap
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: any) => void;
  scenario: string;
  onScenarioChange: (s: string) => void;
  breakItActive: boolean;
  onToggleBreakIt: () => void;
  emergencyActive: boolean;
  onToggleEmergency: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  scenario,
  onScenarioChange,
  breakItActive,
  onToggleBreakIt,
  emergencyActive,
  onToggleEmergency
}) => {
  const [collapsed, setCollapsed] = useState<boolean>(false);

  const features = [
    { id: 'all', label: 'Command Hub', icon: LayoutGrid, color: '#38bdf8' },
    { id: 'twin', label: 'SUMO Digital Twin', icon: Activity, color: '#00f2fe' },
    { id: 'ai', label: 'PPO RL Policy Brain', icon: Brain, color: '#c084fc' },
    { id: 'shield', label: 'Safety Shield (11 Rules)', icon: ShieldCheck, color: '#4ade80' },
    { id: 'emergency', label: 'Ambulance Green Wave', icon: Siren, color: '#f87171' },
    { id: 'analytics', label: 'Impact Analytics & CO₂', icon: BarChart2, color: '#facc15' },
    { id: 'audit', label: 'SQLite Audit Trail', icon: Database, color: '#a855f7' },
  ];

  return (
    <aside
      style={{
        width: collapsed ? '72px' : '260px',
        height: 'calc(100vh - 2rem)',
        position: 'sticky',
        top: '1rem',
        background: '#ffffff',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: '1px solid #e2e8f0',
        borderRadius: '1.25rem',
        padding: collapsed ? '1.25rem 0.6rem' : '1.25rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: '0 10px 30px -5px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.03)',
        zIndex: 40,
        flexShrink: 0
      }}
    >
      <div>
        {/* Sidebar Header & Collapse Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', marginBottom: '1.5rem', paddingBottom: '0.85rem', borderBottom: '1px solid #f1f5f9' }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap className="w-5 h-5 text-cyan-600" />
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '0.95rem', color: '#0f172a', letterSpacing: '0.04em' }}>
                FEATURE NAV
              </span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '0.5rem',
              color: '#475569',
              padding: '0.35rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Feature Navigation List */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {features.map((f) => {
            const Icon = f.icon;
            const isActive = activeTab === f.id;
            return (
              <button
                key={f.id}
                onClick={() => onSelectTab(f.id)}
                style={{
                  background: isActive
                    ? `linear-gradient(135deg, rgba(14, 165, 233, 0.14) 0%, rgba(124, 58, 237, 0.14) 100%)`
                    : 'transparent',
                  color: isActive ? '#0284c7' : '#475569',
                  border: isActive ? `1px solid ${f.color}` : '1px solid transparent',
                  borderRadius: '0.75rem',
                  padding: collapsed ? '0.75rem 0' : '0.65rem 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  gap: '0.75rem',
                  fontSize: '0.82rem',
                  fontWeight: isActive ? 800 : 600,
                  cursor: 'pointer',
                  boxShadow: isActive ? `0 2px 10px ${f.color}25` : 'none',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                title={f.label}
              >
                <Icon className="w-4 h-4" style={{ color: isActive ? f.color : '#64748b', flexShrink: 0 }} />
                {!collapsed && (
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {f.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Quick Controls Section inside Sidebar */}
      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
          {/* Quick Scenario Selector */}
          <div>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.04em', display: 'block', marginBottom: '0.3rem' }}>
              Traffic Scenario
            </span>
            <select
              value={scenario}
              onChange={(e) => onScenarioChange(e.target.value)}
              style={{
                width: '100%',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '0.5rem',
                padding: '0.4rem 0.6rem',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#0f172a',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="normal" style={{ background: '#ffffff', color: '#0f172a' }}>🚗 Normal Flow</option>
              <option value="rush_hour" style={{ background: '#ffffff', color: '#0f172a' }}>🏙️ Rush Hour</option>
              <option value="high_density" style={{ background: '#ffffff', color: '#0f172a' }}>🚦 Heavy PCU</option>
              <option value="incident" style={{ background: '#ffffff', color: '#0f172a' }}>🚨 Incident</option>
            </select>
          </div>

          {/* Emergency Siren Quick Toggle */}
          <button
            onClick={onToggleEmergency}
            style={{
              width: '100%',
              background: emergencyActive
                ? 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)'
                : '#f3e8ff',
              color: emergencyActive ? 'white' : '#7c3aed',
              border: emergencyActive ? '1px solid #fda4af' : '1px solid #d8b4fe',
              borderRadius: '0.6rem',
              padding: '0.5rem 0.75rem',
              fontSize: '0.76rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
              boxShadow: emergencyActive ? '0 4px 14px rgba(225, 29, 72, 0.4)' : 'none',
              transition: 'all 0.3s ease'
            }}
          >
            <Siren className="w-3.5 h-3.5" />
            <span>{emergencyActive ? '🚨 SIREN ACTIVE' : '🔔 TOGGLE SIREN'}</span>
          </button>

          {/* Fault Injection Quick Toggle */}
          <button
            onClick={onToggleBreakIt}
            className={`btn-break-it ${breakItActive ? 'active' : ''}`}
            style={{ width: '100%', padding: '0.45rem 0.75rem', fontSize: '0.75rem', justifyContent: 'center' }}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{breakItActive ? 'RESET FAULT' : '⚡ BREAK-IT'}</span>
          </button>
        </div>
      )}
    </aside>
  );
};

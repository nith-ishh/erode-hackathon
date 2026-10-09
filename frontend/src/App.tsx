import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { JunctionVisualizer } from './components/JunctionVisualizer';
import { AdaptiveVsFixedPanel } from './components/AdaptiveVsFixedPanel';
import { AdaptivityExplainer } from './components/AdaptivityExplainer';
import { AIControlPanel } from './components/AIControlPanel';
import { SafetyShieldPanel } from './components/SafetyShieldPanel';
import { LiveDecisionLog } from './components/LiveDecisionLog';
import { LiveTimeSeriesCharts } from './components/LiveTimeSeriesCharts';
import { GreenWavePanel } from './components/GreenWavePanel';
import { BridgeCapacityAlertPanel } from './components/BridgeCapacityAlertPanel';
import { NoParkingChallanPanel } from './components/NoParkingChallanPanel';
import { ImpactDashboard } from './components/ImpactDashboard';
import { DecisionAuditLog } from './components/DecisionAuditLog';
import { Sidebar, type FeatureTab, type FeatureVisibility } from './components/Sidebar';
import { Radio } from 'lucide-react';

export const App: React.FC = () => {
  const [scenario, setScenario] = useState<string>('normal');
  const [breakItActive, setBreakItActive] = useState<boolean>(false);
  const [emergencyActive, setEmergencyActive] = useState<boolean>(false);
  const [stateData, setStateData] = useState<any>(null);
  const [metricsData, setMetricsData] = useState<any>(null);
  const [isRunningTest, setIsRunningTest] = useState<boolean>(false);
  const [connectionMode, setConnectionMode] = useState<'ws' | 'polling' | 'connecting'>('connecting');
  const wsRef = useRef<WebSocket | null>(null);

  // Left Sidebar Feature Selection & Filter State
  const [activeTab, setActiveTab] = useState<FeatureTab>('all');
  const [visibility, setVisibility] = useState<FeatureVisibility>({
    visualizer: true,
    bridge: true,
    parking: true,
    comparison: true,
    brain: true,
    safety: true,
    emergency: true,
    dynamics: true,
    analytics: true,
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  const handleToggleFeature = (key: keyof FeatureVisibility) => {
    setVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectAllFeatures = () => {
    setVisibility({
      visualizer: true,
      bridge: true,
      parking: true,
      comparison: true,
      brain: true,
      safety: true,
      emergency: true,
      dynamics: true,
      analytics: true,
    });
  };

  const handleClearAllFeatures = () => {
    setVisibility({
      visualizer: false,
      bridge: false,
      parking: false,
      comparison: false,
      brain: false,
      safety: false,
      emergency: false,
      dynamics: false,
      analytics: false,
    });
  };

  const shouldShow = (key: keyof FeatureVisibility) => {
    if (activeTab === 'all') {
      return visibility[key];
    }
    return activeTab === key;
  };

  // Real-time WebSocket Live Stream with REST Polling Fallback
  useEffect(() => {
    let pollingInterval: any = null;

    const startPolling = () => {
      setConnectionMode('polling');
      if (!pollingInterval) {
        pollingInterval = setInterval(async () => {
          try {
            const res = await fetch('http://127.0.0.1:8000/api/state');
            if (res.ok) {
              const data = await res.json();
              setStateData(data);
            }
          } catch (err) {
            // Reconnecting
          }
        }, 1000);
      }
    };

    const setupWebSocket = () => {
      try {
        const ws = new WebSocket('ws://127.0.0.1:8000/ws');
        wsRef.current = ws;

        ws.onopen = () => {
          setConnectionMode('ws');
          if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
          }
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setStateData(data);
          } catch (e) {
            // JSON parse error
          }
        };

        ws.onerror = () => {
          startPolling();
        };

        ws.onclose = () => {
          startPolling();
          setTimeout(setupWebSocket, 5000);
        };
      } catch (err) {
        startPolling();
      }
    };

    setupWebSocket();

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, []);

  const handleScenarioChange = async (newScenario: string) => {
    setScenario(newScenario);
    try {
      await fetch(`http://127.0.0.1:8000/api/scenario?name=${newScenario}`, { method: 'POST' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSurgeTraffic = async (direction: string) => {
    try {
      await fetch(`http://127.0.0.1:8000/api/surge?direction=${direction}&amount=15.0`, { method: 'POST' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunComparisonTest = async () => {
    setIsRunningTest(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/compare/run?scenario=${scenario}&steps=600&seed=12345`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setMetricsData(data);
      }
    } catch (err) {
      console.error("Comparison test error:", err);
    } finally {
      setIsRunningTest(false);
    }
  };

  const handleToggleBreakIt = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/break-it', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setBreakItActive(data.break_it_active);
      }
    } catch (err) {
      setBreakItActive(!breakItActive);
    }
  };

  const handleToggleEmergency = async () => {
    const nextVal = !emergencyActive;
    setEmergencyActive(nextVal);
    try {
      await fetch(`http://127.0.0.1:8000/api/emergency?enable=${nextVal}`, { method: 'POST' });
    } catch (err) {
      console.error(err);
    }
  };

  const finalPhase = stateData?.final_phase ?? 0;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%', background: 'var(--bg-primary, #090d16)' }}>
      {/* 0. Collapsible Left Sidebar with Custom Feature Selection & Tab Switching */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        visibility={visibility}
        onToggleFeature={handleToggleFeature}
        onSelectAllFeatures={handleSelectAllFeatures}
        onClearAllFeatures={handleClearAllFeatures}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        stateData={stateData}
        connectionMode={connectionMode}
        scenario={scenario}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, minWidth: 0, height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div className="dashboard-container" style={{ width: '100%', maxWidth: '1600px', margin: '0 auto', boxSizing: 'border-box' }}>
          {/* 1. Header Bar with Scenarios, Surges, Comparison Trigger, and Break System */}
          <Header
            scenario={scenario}
            onScenarioChange={handleScenarioChange}
            breakItActive={breakItActive}
            onToggleBreakIt={handleToggleBreakIt}
            emergencyActive={emergencyActive}
            onToggleEmergency={handleToggleEmergency}
            onSurgeTraffic={handleSurgeTraffic}
            onRunTest={handleRunComparisonTest}
            isRunningTest={isRunningTest}
          />

          {/* Active Filter Notification Banner if in focused tab */}
          {activeTab !== 'all' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.6rem 1rem',
                marginBottom: '0.8rem',
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '8px',
                fontSize: '0.82rem',
                color: '#38bdf8',
              }}
            >
              <span>
                Focused View: Showing only <strong>{activeTab.toUpperCase()}</strong>. Other features are hidden.
              </span>
              <button
                onClick={() => setActiveTab('all')}
                style={{
                  padding: '4px 12px',
                  background: '#0284c7',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                }}
              >
                Reset to Full Dashboard
              </button>
            </div>
          )}

          {/* Telemetry Status Line */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0.2rem 0 0.8rem 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Radio className="w-3.5 h-3.5" style={{ color: connectionMode === 'ws' ? '#22c55e' : '#38bdf8' }} />
              <span>Telemetry Stream: <strong style={{ color: '#fff' }}>{connectionMode === 'ws' ? 'WebSocket Real-Time (1000ms tick)' : 'HTTP REST Polling'}</strong></span>
            </div>
            <div>
              Step: <strong style={{ color: '#38bdf8' }}>#{stateData?.step ?? 0}</strong> | Scenario: <strong style={{ color: '#c084fc' }}>{scenario.toUpperCase()}</strong>
            </div>
          </div>

          {/* 2. Full-Width SUMO Digital Twin High-Definition Visualizer */}
          {shouldShow('visualizer') && (
            <JunctionVisualizer
              stateData={stateData}
              finalPhase={finalPhase}
              emergencyActive={emergencyActive}
              onToggleEmergency={handleToggleEmergency}
            />
          )}

          {/* 2.1 BRIDGE OVERLOAD EARLY WARNING & POLICE ALERT SYSTEM */}
          {shouldShow('bridge') && (
            <BridgeCapacityAlertPanel bridgeData={stateData?.bridge_monitor} />
          )}

          {/* 2.2 SMART NO-PARKING e-CHALLAN & REVENUE BILLING ENFORCEMENT */}
          {shouldShow('parking') && (
            <NoParkingChallanPanel parkingData={stateData?.no_parking} />
          )}

          {/* 3. CORE REQUIREMENT: ADAPTIVE AI vs FIXED-TIME SIDE-BY-SIDE PANEL */}
          {shouldShow('comparison') && (
            <>
              <AdaptiveVsFixedPanel stateData={stateData} />
              <AdaptivityExplainer adaptivityProof={stateData?.adaptivity_proof} stateData={stateData} />
            </>
          )}

          {/* 5. AI Brain + Deterministic Safety Shield Grid */}
          {(shouldShow('brain') || shouldShow('safety')) && (
            <div className={shouldShow('brain') && shouldShow('safety') ? 'grid-2' : ''}>
              {shouldShow('brain') && <AIControlPanel stateData={stateData} />}
              {shouldShow('safety') && <SafetyShieldPanel stateData={stateData} breakItActive={breakItActive} />}
            </div>
          )}

          {/* 6. Live Decision Log Event Stream */}
          {shouldShow('brain') && (
            <LiveDecisionLog logs={stateData?.live_decision_log} />
          )}

          {/* 7. Live Time-Series Dynamics Graphs */}
          {shouldShow('dynamics') && (
            <LiveTimeSeriesCharts history={stateData?.time_series_history} />
          )}

          {/* 8. Emergency Green Wave Corridor Panel */}
          {shouldShow('emergency') && (
            <GreenWavePanel emergencyData={stateData?.emergency} />
          )}

          {/* 9. Live Counterfactual Twin & Empirical Impact Dashboard */}
          {shouldShow('analytics') && (
            <>
              <ImpactDashboard metricsData={metricsData} />
              <DecisionAuditLog />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;

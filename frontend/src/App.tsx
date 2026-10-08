import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { JunctionVisualizer } from './components/JunctionVisualizer';
import { AIControlPanel } from './components/AIControlPanel';
import { SafetyShieldPanel } from './components/SafetyShieldPanel';
import { ImpactDashboard } from './components/ImpactDashboard';
import { GreenWavePanel } from './components/GreenWavePanel';
import { DecisionAuditLog } from './components/DecisionAuditLog';
import { Radio } from 'lucide-react';

export const App: React.FC = () => {
  const [scenario, setScenario] = useState<string>('normal');
  const [breakItActive, setBreakItActive] = useState<boolean>(false);
  const [emergencyActive, setEmergencyActive] = useState<boolean>(false);
  const [stateData, setStateData] = useState<any>(null);
  const [connectionMode, setConnectionMode] = useState<'ws' | 'polling' | 'connecting'>('connecting');
  const wsRef = useRef<WebSocket | null>(null);

  // High-performance WebSocket Live Stream with REST Polling Fallback (Member 4 Lead)
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
          // Attempt WS reconnection in 5 seconds
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
    <div className="dashboard-container">
      {/* 1. Header Bar with Connection Status */}
      <Header
        scenario={scenario}
        onScenarioChange={handleScenarioChange}
        breakItActive={breakItActive}
        onToggleBreakIt={handleToggleBreakIt}
        emergencyActive={emergencyActive}
        onToggleEmergency={handleToggleEmergency}
      />

      {/* Live Stream Telemetry Banner */}
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
      <JunctionVisualizer
        stateData={stateData}
        finalPhase={finalPhase}
        emergencyActive={emergencyActive}
        onToggleEmergency={handleToggleEmergency}
      />
      
      {/* 3. AI Brain + Deterministic Safety Shield Grid */}
      <div className="grid-2">
        <AIControlPanel stateData={stateData} />
        <SafetyShieldPanel stateData={stateData} breakItActive={breakItActive} />
      </div>

      {/* 4. Emergency Green Wave Corridor Panel */}
      <GreenWavePanel emergencyData={stateData?.emergency} />

      {/* 5. Live Counterfactual Twin & Empirical Impact Dashboard (Member 4 Lead) */}
      <ImpactDashboard />

      {/* 6. SQLite Decision Audit Trail & Governance Inspector (Member 4 Lead) */}
      <DecisionAuditLog />
    </div>
  );
};

export default App;

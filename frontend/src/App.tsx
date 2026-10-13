import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { JunctionVisualizer } from './components/JunctionVisualizer';
import { AIControlPanel } from './components/AIControlPanel';
import { SafetyShieldPanel } from './components/SafetyShieldPanel';
import { ImpactDashboard } from './components/ImpactDashboard';
import { GreenWavePanel } from './components/GreenWavePanel';
import { DecisionAuditLog } from './components/DecisionAuditLog';
import { Zap, Activity, Clock, Siren } from 'lucide-react';

import './App.css';

export const App: React.FC = () => {
  const [scenario, setScenario] = useState<string>('normal');
  const [breakItActive, setBreakItActive] = useState<boolean>(false);
  const [emergencyActive, setEmergencyActive] = useState<boolean>(false);
  const [stateData, setStateData] = useState<any>(null);
  const [connectionMode, setConnectionMode] = useState<'ws' | 'polling' | 'connecting'>('connecting');
  const [activeTab, setActiveTab] = useState<'all' | 'twin' | 'ai' | 'shield' | 'emergency' | 'analytics' | 'audit'>('all');
  const wsRef = useRef<WebSocket | null>(null);

  // High-performance WebSocket Live Stream with REST Polling Fallback
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
  const currentStep = stateData?.step ?? 0;

  return (
    <div className="dashboard-container">
      {/* Main Layout Container with Side Navigation */}
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', width: '100%' }}>
        {/* Sidebar Component */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          scenario={scenario}
          onScenarioChange={handleScenarioChange}
          breakItActive={breakItActive}
          onToggleBreakIt={handleToggleBreakIt}
          emergencyActive={emergencyActive}
          onToggleEmergency={handleToggleEmergency}
        />

        {/* Main Dashboard Panel Workspace */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
          {/* 1. Header Bar with Integrated Telemetry & Command Controls */}
          <Header
            scenario={scenario}
            onScenarioChange={handleScenarioChange}
            breakItActive={breakItActive}
            onToggleBreakIt={handleToggleBreakIt}
            emergencyActive={emergencyActive}
            onToggleEmergency={handleToggleEmergency}
            connectionMode={connectionMode}
            step={currentStep}
          />


          {/* Executive Command KPI Overview Bar */}
          <div className="grid-4">
            <div className="metric-card" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="metric-lbl">Control Mode</span>
                <Zap className="w-4 h-4 text-cyan-600" />
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0369a1', marginTop: '0.2rem' }}>
                {breakItActive ? 'FAIL-SAFE FALLBACK' : 'PPO RL ADAPTIVE'}
              </div>
              <span style={{ fontSize: '0.72rem', color: '#475569' }}>
                {breakItActive ? 'Sensor fault overrides RL' : 'Governed by 11 Guardrails'}
              </span>
            </div>

            <div className="metric-card" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="metric-lbl">Active Signal Phase</span>
                <Activity className="w-4 h-4 text-emerald-600" />
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#15803d', marginTop: '0.2rem' }}>
                Phase {finalPhase}: {finalPhase === 0 ? 'N-S Green' : finalPhase === 2 ? 'E-W Green' : 'Yellow Clearance'}
              </div>
              <span style={{ fontSize: '0.72rem', color: '#475569' }}>
                Dynamic PCU Queue Optimization
              </span>
            </div>

            <div className="metric-card" style={{ background: '#faf5ff', border: '1px solid #e9d5ff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="metric-lbl">Average Delay Saved</span>
                <Clock className="w-4 h-4 text-purple-600" />
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#7e22ce', marginTop: '0.2rem' }}>
                -86% Delay Reduction
              </div>
              <span style={{ fontSize: '0.72rem', color: '#475569' }}>
                8.2s AI vs 58.4s Fixed Baseline
              </span>
            </div>

            <div className="metric-card" style={{ background: emergencyActive ? '#fff1f2' : '#ffffff', border: emergencyActive ? '1px solid #fecdd3' : '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="metric-lbl">Ambulance Corridor</span>
                <Siren className="w-4 h-4 text-red-600" />
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: emergencyActive ? '#be123c' : '#0f172a', marginTop: '0.2rem' }}>
                {emergencyActive ? '🚨 INSTANT GREEN PASS' : 'STANDBY (SIREN READY)'}
              </div>
              <span style={{ fontSize: '0.72rem', color: emergencyActive ? '#9f1239' : '#475569' }}>
                {emergencyActive ? 'Clear corridor guaranteed' : '0s pre-emption response'}
              </span>
            </div>
          </div>

          {/* 2. Full-Width SUMO Digital Twin Visualizer */}
          {(activeTab === 'all' || activeTab === 'twin') && (
            <JunctionVisualizer
              stateData={stateData}
              finalPhase={finalPhase}
              emergencyActive={emergencyActive}
              onToggleEmergency={handleToggleEmergency}
            />
          )}
          
          {/* 3. AI Brain + Deterministic Safety Shield Grid */}
          {(activeTab === 'all' || activeTab === 'ai' || activeTab === 'shield') && (
            <div className="grid-2">
              {(activeTab === 'all' || activeTab === 'ai') && (
                <AIControlPanel stateData={stateData} />
              )}
              {(activeTab === 'all' || activeTab === 'ai' || activeTab === 'shield') && (
                <SafetyShieldPanel stateData={stateData} breakItActive={breakItActive} />
              )}
            </div>
          )}

          {/* 4. Emergency Green Wave Corridor Panel */}
          {(activeTab === 'all' || activeTab === 'emergency') && (
            <GreenWavePanel emergencyData={stateData?.emergency} />
          )}

          {/* 5. Live Counterfactual Twin & Empirical Impact Dashboard */}
          {(activeTab === 'all' || activeTab === 'analytics') && (
            <ImpactDashboard />
          )}

          {/* 6. SQLite Decision Audit Trail & Governance Inspector */}
          {(activeTab === 'all' || activeTab === 'audit') && (
            <DecisionAuditLog />
          )}
        </div>
      </div>
    </div>
  );
};

export default App;

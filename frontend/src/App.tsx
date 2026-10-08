import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { JunctionVisualizer } from './components/JunctionVisualizer';
import { AIControlPanel } from './components/AIControlPanel';
import { SafetyShieldPanel } from './components/SafetyShieldPanel';
import { ImpactDashboard } from './components/ImpactDashboard';
import { GreenWavePanel } from './components/GreenWavePanel';

export const App: React.FC = () => {
  const [scenario, setScenario] = useState<string>('normal');
  const [breakItActive, setBreakItActive] = useState<boolean>(false);
  const [emergencyActive, setEmergencyActive] = useState<boolean>(false);
  const [stateData, setStateData] = useState<any>(null);
  const metricsData = null;

  // Poll API state every 1 second (resilient live updates)
  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/state');
        if (res.ok) {
          const data = await res.json();
          setStateData(data);
        }
      } catch (err) {
        // Backend starting up or reconnecting
      }
    };

    fetchState();
    const interval = setInterval(fetchState, 1000);
    return () => clearInterval(interval);
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
      {/* 1. Header Bar */}
      <Header
        scenario={scenario}
        onScenarioChange={handleScenarioChange}
        breakItActive={breakItActive}
        onToggleBreakIt={handleToggleBreakIt}
        emergencyActive={emergencyActive}
        onToggleEmergency={handleToggleEmergency}
      />

      {/* 2. Full-Width SUMO Digital Twin High-Definition Visualizer */}
      <JunctionVisualizer stateData={stateData} finalPhase={finalPhase} />
      
      {/* 3. AI Brain + Deterministic Safety Shield Grid */}
      <div className="grid-2">
        <AIControlPanel stateData={stateData} />
        <SafetyShieldPanel stateData={stateData} breakItActive={breakItActive} />
      </div>

      {/* 4. Feature 4: Emergency Green Wave Panel */}
      <GreenWavePanel emergencyData={stateData?.emergency} />

      {/* 5. Feature 3: Impact Dashboard */}
      <ImpactDashboard metricsData={metricsData} />
    </div>
  );
};

export default App;

import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { Activity, Clock } from 'lucide-react';

interface LiveTimeSeriesChartsProps {
  history?: any[];
}

export const LiveTimeSeriesCharts: React.FC<LiveTimeSeriesChartsProps> = ({ history = [] }) => {
  // Fallback demo data if history is short
  const data = history.length > 5 ? history : [
    { time: '1s', ai_queue: 12.0, fixed_queue: 14.0, ai_waiting: 15.0, fixed_waiting: 18.0 },
    { time: '5s', ai_queue: 11.2, fixed_queue: 16.5, ai_waiting: 14.2, fixed_waiting: 22.0 },
    { time: '10s', ai_queue: 9.8, fixed_queue: 19.8, ai_waiting: 13.0, fixed_waiting: 26.5 },
    { time: '15s', ai_queue: 13.5, fixed_queue: 23.0, ai_waiting: 16.2, fixed_waiting: 31.0 },
    { time: '20s', ai_queue: 10.4, fixed_queue: 25.4, ai_waiting: 14.0, fixed_waiting: 35.2 },
    { time: '25s', ai_queue: 8.9, fixed_queue: 28.0, ai_waiting: 12.5, fixed_waiting: 39.0 },
    { time: '30s', ai_queue: 11.0, fixed_queue: 22.5, ai_waiting: 15.1, fixed_waiting: 32.0 },
  ];

  return (
    <div className="panel" style={{ border: '1px solid rgba(56, 189, 248, 0.25)', marginBottom: '1.2rem' }}>
      <div className="panel-header">
        <div className="panel-title">
          <Activity style={{ color: 'var(--accent-cyan)' }} />
          <span>Real-Time Simulation Dynamics: Adaptive AI vs Fixed-Time Baseline</span>
        </div>
        <span className="badge badge-cyan">Live Time-Series Graphs</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.2rem' }}>
        {/* GRAPH 1: PCU Queue over Simulation Time */}
        <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '0.6rem', padding: '0.75rem', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Activity className="w-3.5 h-3.5" style={{ color: '#38bdf8' }} />
            <span>PCU Queue Accumulation over Time</span>
          </div>
          <div style={{ height: '180px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                <Line type="monotone" dataKey="ai_queue" stroke="#38bdf8" strokeWidth={2.5} dot={false} name="Adaptive AI (PCU)" />
                <Line type="monotone" dataKey="fixed_queue" stroke="#f87171" strokeWidth={2} strokeDasharray="4 4" dot={false} name="Fixed-Time (PCU)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* GRAPH 2: Average Waiting Time over Simulation Time */}
        <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '0.6rem', padding: '0.75rem', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Clock className="w-3.5 h-3.5" style={{ color: '#c084fc' }} />
            <span>Average Vehicle Waiting Time (Seconds)</span>
          </div>
          <div style={{ height: '180px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                <Line type="monotone" dataKey="ai_waiting" stroke="#4ade80" strokeWidth={2.5} dot={false} name="Adaptive AI Wait (s)" />
                <Line type="monotone" dataKey="fixed_waiting" stroke="#fbbf24" strokeWidth={2} strokeDasharray="4 4" dot={false} name="Fixed-Time Wait (s)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Database, Search, RefreshCw, CheckCircle, AlertTriangle, Shield } from 'lucide-react';

export const DecisionAuditLog: React.FC = () => {
  const [decisions, setDecisions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [filterMode, setFilterMode] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchDecisions = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/decisions?limit=30');
      if (res.ok) {
        const data = await res.json();
        setDecisions(data.decisions || []);
      }
    } catch (err) {
      console.error("Failed to fetch decisions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecisions();
    const interval = setInterval(fetchDecisions, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredDecisions = decisions.filter((d) => {
    if (filterMode === 'fallback' && !d.fallback_status) return false;
    if (filterMode === 'emergency' && !d.emergency_status) return false;
    if (filterMode === 'ai' && (d.fallback_status || d.emergency_status)) return false;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const expText = (d.explanation?.human_readable_explanation || '').toLowerCase();
      const scenario = (d.scenario || '').toLowerCase();
      return expText.includes(q) || scenario.includes(q);
    }
    return true;
  });

  return (
    <div className="panel" style={{ marginTop: '1.5rem', border: '1px solid rgba(168, 85, 247, 0.25)' }}>
      <div className="panel-header" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
        <div className="panel-title">
          <Database style={{ color: 'var(--accent-purple)' }} />
          <span>SQLite Decision Audit Trail & Governance Inspector</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search className="w-3.5 h-3.5" style={{ position: 'absolute', left: '8px', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search audit trail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '0.4rem',
                padding: '0.35rem 0.6rem 0.35rem 1.7rem',
                fontSize: '0.75rem',
                color: '#fff',
                outline: 'none'
              }}
            />
          </div>

          {/* Filter Pills */}
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '0.4rem',
              padding: '0.35rem 0.6rem',
              fontSize: '0.75rem',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Modes ({decisions.length})</option>
            <option value="ai">AI Adaptive Control</option>
            <option value="fallback">Fallback Mode Active</option>
            <option value="emergency">Emergency Overrides</option>
          </select>

          <button
            onClick={fetchDecisions}
            disabled={loading}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '0.4rem',
              padding: '0.35rem 0.6rem',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.75rem'
            }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Decision Table */}
      <div style={{ overflowX: 'auto', maxHeight: '280px', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.7rem' }}>
              <th style={{ padding: '0.5rem' }}>ID / Time</th>
              <th style={{ padding: '0.5rem' }}>Scenario</th>
              <th style={{ padding: '0.5rem' }}>PPO Action</th>
              <th style={{ padding: '0.5rem' }}>JEV Eval</th>
              <th style={{ padding: '0.5rem' }}>Safety Shield</th>
              <th style={{ padding: '0.5rem' }}>Final Phase</th>
              <th style={{ padding: '0.5rem' }}>Explain Justification</th>
            </tr>
          </thead>
          <tbody>
            {filteredDecisions.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                  {loading ? 'Fetching decision logs...' : 'No decision records logged yet in database.'}
                </td>
              </tr>
            ) : (
              filteredDecisions.map((d) => {
                const isEmergency = Boolean(d.emergency_status);
                const isFallback = Boolean(d.fallback_status);

                return (
                  <tr
                    key={d.decision_id}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      background: isFallback
                        ? 'rgba(239, 68, 68, 0.05)'
                        : isEmergency
                        ? 'rgba(245, 158, 11, 0.05)'
                        : 'transparent'
                    }}
                  >
                    <td style={{ padding: '0.5rem', whiteSpace: 'nowrap', color: '#94a3b8' }}>
                      <div style={{ fontWeight: 600, color: '#e2e8f0' }}>#{d.decision_id}</div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                        {d.created_at ? d.created_at.split(' ')[1] : `${Math.round(d.timestamp)}s`}
                      </div>
                    </td>

                    <td style={{ padding: '0.5rem' }}>
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.08)', color: '#e2e8f0' }}>
                        {d.scenario || 'normal'}
                      </span>
                    </td>

                    <td style={{ padding: '0.5rem' }}>
                      <span className="badge badge-purple">
                        Action {d.ppo_action}
                      </span>
                    </td>

                    <td style={{ padding: '0.5rem', whiteSpace: 'nowrap' }}>
                      <span style={{ color: '#4ade80', fontWeight: 600 }}>
                        {((d.jev_result?.jev_score ?? 0.95) * 100).toFixed(0)}%
                      </span>
                    </td>

                    <td style={{ padding: '0.5rem', whiteSpace: 'nowrap' }}>
                      {isFallback ? (
                        <span className="badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                          <AlertTriangle className="w-3 h-3" /> Fallback
                        </span>
                      ) : isEmergency ? (
                        <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Shield className="w-3 h-3" /> Pre-empt
                        </span>
                      ) : (
                        <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                          <CheckCircle className="w-3 h-3" /> Approved
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '0.5rem', fontWeight: 700, color: '#38bdf8' }}>
                      Phase {d.final_action}
                    </td>

                    <td style={{ padding: '0.5rem', color: '#cbd5e1', maxWidth: '300px', fontSize: '0.74rem' }}>
                      {d.explanation?.human_readable_explanation || d.explanation || 'Signal phase executed safely.'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

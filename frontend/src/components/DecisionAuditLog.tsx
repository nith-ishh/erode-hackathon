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
    <div className="panel" style={{ marginTop: '0.5rem', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
      <div className="panel-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
        <div className="panel-title">
          <Database className="w-5 h-5" style={{ color: 'var(--accent-purple-bright)' }} />
          <span>SQLite Decision Audit Trail & Governance Inspector</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search className="w-3.5 h-3.5" style={{ position: 'absolute', left: '10px', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search audit trail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '0.5rem',
                padding: '0.4rem 0.75rem 0.4rem 2rem',
                fontSize: '0.78rem',
                color: '#0f172a',
                outline: 'none',
                width: '180px',
                transition: 'all 0.2s ease'
              }}
            />
          </div>

          {/* Filter Pills */}
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '0.5rem',
              padding: '0.4rem 0.75rem',
              fontSize: '0.78rem',
              color: '#0f172a',
              fontWeight: 700,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="all" style={{ background: '#ffffff', color: '#0f172a' }}>All Modes ({decisions.length})</option>
            <option value="ai" style={{ background: '#ffffff', color: '#0f172a' }}>AI Adaptive Control</option>
            <option value="fallback" style={{ background: '#ffffff', color: '#0f172a' }}>Fallback Mode Active</option>
            <option value="emergency" style={{ background: '#ffffff', color: '#0f172a' }}>Emergency Overrides</option>
          </select>

          <button
            onClick={fetchDecisions}
            disabled={loading}
            style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '0.5rem',
              padding: '0.4rem 0.85rem',
              color: '#0f172a',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.78rem',
              fontWeight: 700
            }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Decision Table */}
      <div style={{ overflowX: 'auto', maxHeight: '300px', overflowY: 'auto', borderRadius: '0.65rem', border: '1px solid #e2e8f0' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.78rem', textAlign: 'left' }}>
          <thead>
            <tr>
              <th style={{ padding: '0.65rem 0.85rem', color: '#475569', fontWeight: 800 }}>ID / Time</th>
              <th style={{ padding: '0.65rem 0.85rem', color: '#475569', fontWeight: 800 }}>Scenario</th>
              <th style={{ padding: '0.65rem 0.85rem', color: '#475569', fontWeight: 800 }}>PPO Action</th>
              <th style={{ padding: '0.65rem 0.85rem', color: '#475569', fontWeight: 800 }}>JEV Eval</th>
              <th style={{ padding: '0.65rem 0.85rem', color: '#475569', fontWeight: 800 }}>Safety Shield</th>
              <th style={{ padding: '0.65rem 0.85rem', color: '#475569', fontWeight: 800 }}>Final Phase</th>
              <th style={{ padding: '0.65rem 0.85rem', color: '#475569', fontWeight: 800 }}>Explain Justification</th>
            </tr>
          </thead>
          <tbody>
            {filteredDecisions.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  {loading ? 'Fetching decision logs from SQLite...' : 'No decision records logged yet in database.'}
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
                      background: isFallback
                        ? '#fff1f2'
                        : isEmergency
                        ? '#fffbeb'
                        : 'transparent'
                    }}
                  >
                    <td style={{ padding: '0.65rem 0.85rem', whiteSpace: 'nowrap', color: '#0f172a' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>#{d.decision_id}</div>
                      <div style={{ fontSize: '0.68rem', color: '#475569', fontFamily: 'var(--font-mono)' }}>
                        {d.created_at ? d.created_at.split(' ')[1] : `${Math.round(d.timestamp)}s`}
                      </div>
                    </td>

                    <td style={{ padding: '0.65rem 0.85rem' }}>
                      <span className="badge" style={{ background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1', fontSize: '0.68rem', fontWeight: 800 }}>
                        {d.scenario || 'normal'}
                      </span>
                    </td>

                    <td style={{ padding: '0.65rem 0.85rem' }}>
                      <span className="badge badge-purple" style={{ fontSize: '0.68rem', fontWeight: 800 }}>
                        Action {d.ppo_action}
                      </span>
                    </td>

                    <td style={{ padding: '0.65rem 0.85rem', whiteSpace: 'nowrap' }}>
                      <span style={{ color: '#16a34a', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                        {((d.jev_result?.jev_score ?? 0.95) * 100).toFixed(0)}%
                      </span>
                    </td>

                    <td style={{ padding: '0.65rem 0.85rem', whiteSpace: 'nowrap' }}>
                      {isFallback ? (
                        <span className="badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.68rem' }}>
                          <AlertTriangle className="w-3 h-3" /> Fallback
                        </span>
                      ) : isEmergency ? (
                        <span className="badge" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde047', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.68rem' }}>
                          <Shield className="w-3 h-3" /> Pre-empt
                        </span>
                      ) : (
                        <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.68rem' }}>
                          <CheckCircle className="w-3 h-3" /> Approved
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '0.65rem 0.85rem', fontWeight: 800, color: '#0284c7', fontFamily: 'var(--font-mono)' }}>
                      Phase {d.final_action}
                    </td>

                    <td style={{ padding: '0.65rem 0.85rem', color: '#334155', maxWidth: '320px', fontSize: '0.78rem', lineHeight: '1.4', fontWeight: 600 }}>
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

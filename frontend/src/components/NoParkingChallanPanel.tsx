import React, { useState } from 'react';
import { Camera, Ban, Receipt, Truck, CreditCard, CheckCircle2, AlertOctagon, Smartphone, Clock } from 'lucide-react';

interface NoParkingChallanPanelProps {
  parkingData?: any;
}

export const NoParkingChallanPanel: React.FC<NoParkingChallanPanelProps> = ({ parkingData }) => {
  const [selectedPlate, setSelectedPlate] = useState('TN-33-AX-8912');
  const [selectedZone, setSelectedZone] = useState('NP_BROUGH_RD');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<any>(null);

  const data = parkingData || {
    active_violations_count: 0,
    active_violations: [],
    recent_challans: [],
    total_violations_detected: 0,
    total_cleared: 0,
    total_fines_billed: 0,
    total_fines_collected: 0,
    zones: [
      { name: "Brough Road Commercial Clearway", approach: "W", fine_amount: 1000 },
      { name: "Manikoondu Clock Tower Junction Curb", approach: "E", fine_amount: 1000 },
      { name: "Cauvery Bridge Approach Ingress Ramp", approach: "N", fine_amount: 1500 }
    ]
  };

  const handleSimulateViolation = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/parking/trigger?vehicle_plate=${encodeURIComponent(selectedPlate)}&zone_id=${selectedZone}&vehicle_type=car`, {
        method: 'POST'
      });
      if (res.ok) {
        const json = await res.json();
        if (json.violation) {
          setActiveReceipt(json.violation);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearViolation = async (challanId: string) => {
    try {
      await fetch(`http://127.0.0.1:8000/api/parking/clear?challan_id=${challanId}`, { method: 'POST' });
      if (activeReceipt?.challan_id === challanId) {
        setActiveReceipt(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePayChallan = async (challanId: string) => {
    try {
      await fetch(`http://127.0.0.1:8000/api/parking/pay?challan_id=${challanId}`, { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
  };

  const activeViolations = data.active_violations || [];
  const recentChallans = data.recent_challans || [];

  return (
    <div className="panel" style={{ marginBottom: '1.5rem' }}>
      {/* Header Bar */}
      <div className="panel-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
        <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Ban className="w-5 h-5" style={{ color: '#ef4444' }} />
          <div>
            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'white' }}>Smart No-Parking & Traffic Obstruction e-Challan System</span>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Automated Optical ANPR Detection, Legal Citations (Sec 122/177 M.V. Act) & Instant Billing</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span className="badge badge-red" style={{ padding: '0.4rem 0.8rem' }}>
            <Camera className="w-3.5 h-3.5" /> CCTV ANPR ACTIVE
          </span>
          <span className="badge badge-yellow" style={{ fontSize: '0.75rem' }}>
            Active Obstructions: {data.active_violations_count}
          </span>
        </div>
      </div>

      {/* Summary KPI Statistics Ticker */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', margin: '1rem 0' }}>
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Violations Detected</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#f87171' }}>{data.total_violations_detected}</div>
        </div>
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Towed / Cleared Bottlenecks</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#38bdf8' }}>{data.total_cleared}</div>
        </div>
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Fines Billed (₹)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fbbf24' }}>₹{data.total_fines_billed?.toLocaleString()}</div>
        </div>
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Revenue Collected (₹)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#22c55e' }}>₹{data.total_fines_collected?.toLocaleString()}</div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '1.2rem' }}>
        {/* Left Column: Interactive Detection & Active Violations Feed */}
        <div>
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid rgba(255, 255, 255, 0.06)', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertOctagon className="w-4 h-4 text-red-400" />
              <span>Simulate Illegal Curb Parking & Bottleneck Choking</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr auto', gap: '0.6rem', alignItems: 'center' }}>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Vehicle Plate #</label>
                <input
                  type="text"
                  value={selectedPlate}
                  onChange={(e) => setSelectedPlate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.6rem',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '0.4rem',
                    color: '#fff',
                    fontSize: '0.8rem',
                    fontWeight: 700
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Designated Zone</label>
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.6rem',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '0.4rem',
                    color: '#fff',
                    fontSize: '0.75rem'
                  }}
                >
                  <option value="NP_BROUGH_RD">Brough Road Clearway (₹1,500)</option>
                  <option value="NP_MANIKOONDU">Manikoondu Clock Tower (₹1,500)</option>
                  <option value="NP_CAUVERY_ENTRY">Cauvery Bridge Ramp (₹2,000)</option>
                </select>
              </div>

              <div style={{ alignSelf: 'flex-end' }}>
                <button
                  onClick={handleSimulateViolation}
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{
                    padding: '0.5rem 0.9rem',
                    fontSize: '0.75rem',
                    background: '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Ban className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Detecting...' : 'Simulate Illegal Park'}
                </button>
              </div>
            </div>
          </div>

          {/* Active Violations List */}
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>
            Live Active Roadway Obstructions ({activeViolations.length})
          </div>

          {activeViolations.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '0.5rem', border: '1px dashed rgba(255, 255, 255, 0.1)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-green-400" />
              All travel lanes and clearways clear. No unauthorized parking detected.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '280px', overflowY: 'auto' }}>
              {activeViolations.map((viol: any) => (
                <div
                  key={viol.challan_id}
                  style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 900, color: '#fca5a5', letterSpacing: '1px' }}>
                        {viol.vehicle_plate}
                      </span>
                      <span className="badge badge-red" style={{ fontSize: '0.65rem' }}>
                        CHOKING LANE
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <Clock className="w-3 h-3 inline mr-0.5" /> {viol.duration_seconds}s
                      </span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#fff', marginTop: '0.2rem' }}>
                      <strong>Zone:</strong> {viol.zone_name} | <strong>Owner:</strong> {viol.owner_name}
                    </div>

                    <div style={{ fontSize: '0.7rem', color: '#fbbf24', marginTop: '0.1rem' }}>
                      Billed Fine: <strong>₹{viol.total_fine}</strong> (Fine: ₹{viol.base_fine} + Tow Fee: ₹{viol.towing_fee})
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      onClick={() => setActiveReceipt(viol)}
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.6rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                    >
                      <Receipt className="w-3 h-3" /> View Challan
                    </button>
                    <button
                      onClick={() => handleClearViolation(viol.challan_id)}
                      className="btn btn-primary"
                      style={{ padding: '0.35rem 0.6rem', fontSize: '0.7rem', background: '#0284c7', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                    >
                      <Truck className="w-3 h-3" /> Tow & Clear
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: e-Challan Receipt & SMS Billing Notice Preview */}
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem' }}>
            Official Electronic e-Challan & Billing Receipt
          </div>

          {activeReceipt ? (
            <div style={{
              background: '#0d1527',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '0.75rem',
              padding: '1.2rem',
              boxShadow: '0 0 20px rgba(56, 189, 248, 0.15)'
            }}>
              {/* Receipt Header */}
              <div style={{ textAlign: 'center', borderBottom: '1px dashed rgba(255, 255, 255, 0.15)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontWeight: 800, letterSpacing: '1px' }}>
                  GOVERNMENT OF TAMIL NADU — TRAFFIC POLICE
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 900, color: '#fff' }}>AUTOMATED TRAFFIC e-CHALLAN INVOICE</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Challan ID: <strong style={{ color: '#fff' }}>{activeReceipt.challan_id}</strong></div>
              </div>

              {/* Vehicle & Violation Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Registration Plate:</span>
                  <div style={{ fontWeight: 800, color: '#38bdf8', fontSize: '0.9rem' }}>{activeReceipt.vehicle_plate}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Registered Owner:</span>
                  <div style={{ fontWeight: 700, color: '#fff' }}>{activeReceipt.owner_name}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Location / Zone:</span>
                  <div style={{ fontWeight: 600, color: '#fff' }}>{activeReceipt.zone_name}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Offense Under:</span>
                  <div style={{ fontWeight: 600, color: '#f87171' }}>Sec 122 & 177 M.V. Act</div>
                </div>
              </div>

              {/* Fine Itemization Table */}
              <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '0.6rem 0.8rem', borderRadius: '0.4rem', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', marginBottom: '0.2rem' }}>
                  <span>Illegal Obstruction Fine:</span>
                  <span>₹{activeReceipt.base_fine?.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', marginBottom: '0.3rem' }}>
                  <span>Towing & Bottleneck Surcharge:</span>
                  <span>₹{activeReceipt.towing_fee?.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '0.3rem', fontWeight: 800, color: '#fbbf24', fontSize: '0.85rem' }}>
                  <span>Total Amount Due:</span>
                  <span>₹{activeReceipt.total_fine?.toFixed(2)}</span>
                </div>
              </div>

              {/* SMS Dispatch Simulation Card */}
              <div style={{ background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '0.6rem', borderRadius: '0.4rem', fontSize: '0.7rem', color: '#86efac', marginBottom: '0.75rem' }}>
                <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
                  <Smartphone className="w-3.5 h-3.5" /> SMS GateWay Dispatch to {activeReceipt.owner_phone}
                </div>
                <div style={{ fontStyle: 'italic', color: '#cbd5e1' }}>
                  "{activeReceipt.sms_text}"
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handlePayChallan(activeReceipt.challan_id)}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '0.45rem', fontSize: '0.75rem', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                >
                  <CreditCard className="w-3.5 h-3.5" /> Pay Online (Simulate Citizen Payment)
                </button>
                <button
                  onClick={() => handleClearViolation(activeReceipt.challan_id)}
                  className="btn btn-secondary"
                  style={{ padding: '0.45rem 0.8rem', fontSize: '0.75rem' }}
                >
                  Clear Obstruction
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              background: 'rgba(15, 23, 42, 0.5)',
              border: '1px dashed rgba(255, 255, 255, 0.1)',
              borderRadius: '0.75rem',
              padding: '2.5rem 1rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.8rem'
            }}>
              <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40 text-blue-400" />
              Click <strong>"View Challan"</strong> on any active obstruction or simulate a new violation to inspect the official electronic e-Challan invoice.
            </div>
          )}

          {/* Recent Citation Audit Log */}
          {recentChallans.length > 0 && (
            <div style={{ marginTop: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Recent Citations Audit Log:</div>
              <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.3rem' }}>
                {recentChallans.slice(0, 4).map((c: any) => (
                  <div
                    key={c.challan_id}
                    onClick={() => setActiveReceipt(c)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      padding: '0.3rem 0.5rem',
                      borderRadius: '0.3rem',
                      fontSize: '0.65rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <span style={{ fontWeight: 700, color: '#38bdf8' }}>{c.vehicle_plate}</span>
                    <span style={{ marginLeft: '0.3rem', color: c.payment_status === 'PAID' ? '#22c55e' : '#fbbf24' }}>
                      {c.payment_status === 'PAID' ? 'PAID' : `₹${c.total_fine}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

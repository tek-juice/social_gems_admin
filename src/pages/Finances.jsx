import { useEffect, useState, useCallback } from 'react';
import { getFinancialDashboard, getUsdWithdrawals, processUsdWithdrawal } from '../api/admin';

export default function Finances() {
  const [dashboard, setDashboard] = useState(null);
  const [dashLoading, setDashLoading] = useState(true);

  const [withdrawals, setWithdrawals] = useState([]);
  const [wLoading, setWLoading] = useState(false);
  const [processing, setProcessing] = useState({});

  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    getFinancialDashboard()
      .then((res) => setDashboard(res.data?.data || res.data || {}))
      .catch(() => setDashboard({}))
      .finally(() => setDashLoading(false));
  }, []);

  const fetchWithdrawals = useCallback(() => {
    setWLoading(true);
    getUsdWithdrawals()
      .then((res) => {
        const data = res.data?.data || res.data || [];
        setWithdrawals(Array.isArray(data) ? data : []);
      })
      .catch(() => setWithdrawals([]))
      .finally(() => setWLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab === 'withdrawals') fetchWithdrawals();
  }, [activeTab, fetchWithdrawals]);

  const handleProcess = async (txId, action) => {
    setProcessing((prev) => ({ ...prev, [txId]: action }));
    try {
      await processUsdWithdrawal(txId, action);
      setWithdrawals((prev) =>
        prev.map((w) =>
          w.transaction_id === txId || w.id === txId
            ? { ...w, status: action === 'approve' ? 'SUCCESS' : 'FAILED' }
            : w
        )
      );
    } catch {
      alert(`Failed to ${action} withdrawal`);
    } finally {
      setProcessing((prev) => { const n = { ...prev }; delete n[txId]; return n; });
    }
  };

  const d = dashboard || {};

  return (
    <div>
      <h2 style={styles.heading}>Financial Overview</h2>

      {dashLoading ? (
        <p style={styles.center}>Loading financial data...</p>
      ) : (
        <>
          <div style={styles.pills}>
            <Pill value={`$${Number(d.total_escrow_usd ?? d.total_escrow ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} label="Total Escrow (USD)" color="#2e7d32" />
            <Pill value={`${Number(d.kes_liability ?? 0).toLocaleString()} KES`} label="KES Liability" color="#1565c0" />
            <Pill value={`$${Number(d.usd_liability ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} label="USD Liability" color="#7b1fa2" />
            <Pill value={`$${Number(d.pending_withdrawals_usd ?? d.pending_withdrawals ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} label="Pending Withdrawals" color="#ef6c00" />
          </div>

          <div style={styles.tabs}>
            {['overview', 'withdrawals', 'escrow'].map((tab) => (
              <button
                key={tab}
                style={{ ...styles.tab, ...(activeTab === tab ? styles.activeTab : {}) }}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'overview' ? 'Overview' : tab === 'withdrawals' ? 'USD Withdrawals' : 'Escrow by Campaign'}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div style={styles.cards}>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Withdrawal Summary</h3>
                <StatRow label="Successful" value={d.successful_withdrawals ?? 0} />
                <StatRow label="Failed" value={d.failed_withdrawals ?? 0} valueColor="#c62828" />
                <StatRow label="Pending Approval" value={d.pending_approval ?? 0} valueColor="#ef6c00" />
              </div>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Active Wallets</h3>
                <StatRow label="USD Wallets" value={d.usd_wallets ?? 0} />
                <StatRow label="KES Wallets" value={d.kes_wallets ?? 0} />
                <StatRow label="Total Users" value={d.total_wallet_users ?? 0} />
              </div>
              {d.revenue != null && (
                <div style={styles.card}>
                  <h3 style={styles.cardTitle}>Revenue</h3>
                  <StatRow label="Platform Fees (USD)" value={`$${Number(d.revenue_usd ?? 0).toFixed(2)}`} />
                  <StatRow label="Platform Fees (KES)" value={`${Number(d.revenue_kes ?? 0).toLocaleString()} KES`} />
                </div>
              )}
            </div>
          )}

          {activeTab === 'withdrawals' && (
            wLoading ? (
              <p style={styles.center}>Loading withdrawals...</p>
            ) : (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.thead}>
                      <th style={styles.th}>User</th>
                      <th style={styles.th}>Amount (USD)</th>
                      <th style={styles.th}>Bank / Account</th>
                      <th style={styles.th}>SWIFT</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Requested</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map((w, i) => {
                      const txId = w.transaction_id || w.id;
                      const isPending = w.status === 'PENDING';
                      const busy = processing[txId];
                      return (
                        <tr key={txId || i} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                          <td style={styles.td}>
                            <div style={{ fontWeight: '600' }}>{w.user_name || w.username || '—'}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>{w.email || ''}</div>
                          </td>
                          <td style={{ ...styles.td, fontWeight: '700', color: '#1e293b' }}>
                            ${Number(w.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={styles.td}>
                            <div>{w.bank_name || w.bankName || '—'}</div>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>{w.account_name || w.accountName || ''}</div>
                          </td>
                          <td style={styles.td}>{w.swift_code || w.swiftCode || '—'}</td>
                          <td style={styles.td}>
                            <StatusBadge status={w.status} />
                          </td>
                          <td style={styles.td}>{w.created_on ? new Date(w.created_on).toLocaleDateString() : '—'}</td>
                          <td style={styles.td}>
                            {isPending ? (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  style={{ ...styles.actionBtn, background: busy === 'approve' ? '#81c784' : '#2e7d32', color: '#fff', opacity: busy ? 0.7 : 1 }}
                                  disabled={!!busy}
                                  onClick={() => handleProcess(txId, 'approve')}
                                >
                                  {busy === 'approve' ? '...' : 'Approve'}
                                </button>
                                <button
                                  style={{ ...styles.actionBtn, background: busy === 'reject' ? '#e57373' : '#c62828', color: '#fff', opacity: busy ? 0.7 : 1 }}
                                  disabled={!!busy}
                                  onClick={() => handleProcess(txId, 'reject')}
                                >
                                  {busy === 'reject' ? '...' : 'Reject'}
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '12px', color: '#94a3b8' }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {withdrawals.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ ...styles.td, textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                          No pending USD withdrawals
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <p style={styles.count}>{withdrawals.filter(w => w.status === 'PENDING').length} pending · {withdrawals.length} total</p>
              </div>
            )
          )}

          {activeTab === 'escrow' && (
            <EscrowTable rows={d.escrow_by_campaign || []} />
          )}
        </>
      )}
    </div>
  );
}

function Pill({ value, label, color }) {
  return (
    <div style={{ ...styles.pill, borderColor: color }}>
      <span style={{ ...styles.pillNum, color }}>{value}</span>
      <span style={styles.pillLabel}>{label}</span>
    </div>
  );
}

function StatRow({ label, value, valueColor }) {
  return (
    <div style={styles.statRow}>
      <span>{label}</span>
      <span style={{ ...styles.statValue, color: valueColor || '#334155' }}>{value}</span>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    PENDING: { bg: '#fff3e0', color: '#ef6c00' },
    SUCCESS: { bg: '#e8f5e9', color: '#2e7d32' },
    FAILED: { bg: '#fdecea', color: '#c62828' },
    APPROVED: { bg: '#e8f5e9', color: '#2e7d32' },
    REJECTED: { bg: '#fdecea', color: '#c62828' },
  };
  const s = map[status] || { bg: '#f5f5f5', color: '#888' };
  return (
    <span style={{ ...styles.badge, background: s.bg, color: s.color }}>{status}</span>
  );
}

function EscrowTable({ rows }) {
  if (!rows.length) return (
    <div style={{ ...styles.center, background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      No escrow data available
    </div>
  );
  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr style={styles.thead}>
            <th style={styles.th}>Campaign</th>
            <th style={styles.th}>Brand</th>
            <th style={styles.th}>Escrowed (USD)</th>
            <th style={styles.th}>Released</th>
            <th style={styles.th}>Remaining</th>
            <th style={styles.th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.campaign_id || i} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
              <td style={styles.td}>{r.title || '—'}</td>
              <td style={styles.td}>{r.brand_name || '—'}</td>
              <td style={{ ...styles.td, fontWeight: '700' }}>${Number(r.escrowed ?? 0).toFixed(2)}</td>
              <td style={{ ...styles.td, color: '#2e7d32' }}>${Number(r.released ?? 0).toFixed(2)}</td>
              <td style={{ ...styles.td, color: '#ef6c00' }}>${Number(r.remaining ?? 0).toFixed(2)}</td>
              <td style={styles.td}><StatusBadge status={r.status || '—'} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  heading: { fontSize: '28px', fontWeight: '800', color: '#1e293b', marginBottom: '20px', marginTop: 0 },
  pills: { display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' },
  pill: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '14px 24px', background: '#fff', borderRadius: '12px',
    border: '2px solid', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', minWidth: '160px',
  },
  pillNum: { fontSize: '24px', fontWeight: '800', lineHeight: 1 },
  pillLabel: { fontSize: '12px', color: '#64748b', marginTop: '4px', fontWeight: '500' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' },
  tab: {
    padding: '10px 20px', borderRadius: '8px', border: 'none', background: 'transparent',
    fontSize: '14px', fontWeight: '600', color: '#64748b', cursor: 'pointer',
  },
  activeTab: { background: '#734D20', color: '#fff' },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' },
  card: { background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardTitle: { margin: '0 0 16px 0', fontSize: '16px', fontWeight: '700', color: '#1e293b' },
  statRow: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' },
  statValue: { fontWeight: '700' },
  tableWrap: { overflowX: 'auto', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff' },
  thead: { background: '#f8fafc' },
  th: {
    padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700',
    color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px',
    borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap',
  },
  td: { padding: '12px 16px', fontSize: '14px', color: '#334155', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' },
  rowEven: { background: '#fff' },
  rowOdd: { background: '#fafafa' },
  badge: { padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', display: 'inline-block' },
  center: { textAlign: 'center', color: '#94a3b8', padding: '60px 0', fontSize: '15px' },
  actionBtn: { padding: '6px 14px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  count: { padding: '12px 16px', fontSize: '12px', color: '#aaa', margin: 0, borderTop: '1px solid #f0f0f0' },
};

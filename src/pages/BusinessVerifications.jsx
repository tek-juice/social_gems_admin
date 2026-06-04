import { useEffect, useMemo, useState } from 'react';
import {
  approveBusinessRegistration,
  getBusinessRegistrations,
  getPendingBusinessRegistrations,
  getVerifiedBusinessRegistrations,
} from '../api/admin';

const STATUS_STYLES = {
  approved: { background: '#e8f5e9', color: '#2e7d32' },
  pending: { background: '#fff7e6', color: '#b45309' },
  rejected: { background: '#fdecea', color: '#c62828' },
  verified: { background: '#e8f5e9', color: '#2e7d32' },
};

function Badge({ value }) {
  const status = String(value || 'pending').toLowerCase();
  return (
    <span style={{ ...styles.badge, ...(STATUS_STYLES[status] || styles.neutralBadge) }}>
      {status}
    </span>
  );
}

function getRows(res) {
  const payload = res.data?.data || res.data;
  return Array.isArray(payload) ? payload : [];
}

export default function BusinessVerifications() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [action, setAction] = useState({ business: null, status: '', reason: '' });
  const [processing, setProcessing] = useState(false);

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const request =
        tab === 'pending'
          ? getPendingBusinessRegistrations()
          : tab === 'approved'
            ? getVerifiedBusinessRegistrations()
            : getBusinessRegistrations();
      const res = await request;
      setBusinesses(getRows(res));
    } catch (err) {
      console.error(err);
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, [tab]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return businesses;
    return businesses.filter((b) =>
      [
        b.name,
        b.business_name,
        b.email,
        b.phone,
        b.business_id,
        b.owner_id,
      ].some((value) => String(value || '').toLowerCase().includes(q))
    );
  }, [businesses, search]);

  const counts = useMemo(() => ({
    total: businesses.length,
    pending: businesses.filter((b) => String(b.verification_status || '').toLowerCase() === 'pending').length,
    approved: businesses.filter((b) => ['approved', 'verified'].includes(String(b.verification_status || '').toLowerCase())).length,
    rejected: businesses.filter((b) => String(b.verification_status || '').toLowerCase() === 'rejected').length,
  }), [businesses]);

  const openAction = (business, status) => {
    setAction({ business, status, reason: '' });
  };

  const closeAction = () => {
    setAction({ business: null, status: '', reason: '' });
    setProcessing(false);
  };

  const submitAction = async () => {
    if (!action.business || !action.status) return;
    if (action.status === 'rejected' && !action.reason.trim()) {
      alert('Please provide a rejection reason.');
      return;
    }

    setProcessing(true);
    try {
      await approveBusinessRegistration(
        action.business.business_id,
        action.status,
        action.reason.trim()
      );
      closeAction();
      fetchBusinesses();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || 'Action failed');
      setProcessing(false);
    }
  };

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h2 style={styles.heading}>Business Verification</h2>
          <p style={styles.subheading}>Review brand business profiles submitted from the Flutter app.</p>
        </div>
        <button style={styles.refreshBtn} onClick={fetchBusinesses}>Refresh</button>
      </div>

      <div style={styles.pills}>
        <SummaryPill label="Loaded" value={counts.total} color="#734D20" />
        <SummaryPill label="Pending" value={counts.pending} color="#b45309" />
        <SummaryPill label="Approved" value={counts.approved} color="#2e7d32" />
        <SummaryPill label="Rejected" value={counts.rejected} color="#c62828" />
      </div>

      <div style={styles.toolbar}>
        <div style={styles.tabs}>
          {[
            ['pending', 'Pending'],
            ['approved', 'Approved'],
            ['all', 'All'],
          ].map(([key, label]) => (
            <button
              key={key}
              style={{ ...styles.tab, ...(tab === key ? styles.activeTab : {}) }}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          style={styles.search}
          placeholder="Search business, email, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p style={styles.center}>Loading businesses...</p>
      ) : filtered.length === 0 ? (
        <p style={styles.center}>No business registrations found.</p>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>Business</th>
                <th style={styles.th}>Contact</th>
                <th style={styles.th}>Registration</th>
                <th style={styles.th}>Country</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Submitted</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((business, index) => {
                const status = String(business.verification_status || '').toLowerCase();
                const canReview = status === 'pending' || status === 'rejected';
                return (
                  <tr key={business.business_id || index} style={index % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                    <td style={styles.td}>
                      <div style={styles.primaryText}>{business.name || business.business_name || 'Unnamed business'}</div>
                      <div style={styles.muted}>{business.business_id}</div>
                      {business.website && (
                        <a style={styles.link} href={business.website} target="_blank" rel="noreferrer">
                          Website
                        </a>
                      )}
                    </td>
                    <td style={styles.td}>
                      <div>{business.email || 'No email'}</div>
                      <div style={styles.muted}>{business.phone || 'No phone'}</div>
                    </td>
                    <td style={styles.td}>
                      <div>{business.is_registered === 'yes' ? 'Registered' : 'Not registered'}</div>
                      <div style={styles.muted}>{business.registration_number || business.reg_number || 'No registration no.'}</div>
                    </td>
                    <td style={styles.td}>{business.country || business.iso_code || '-'}</td>
                    <td style={styles.td}><Badge value={business.verification_status} /></td>
                    <td style={styles.td}>{business.created_at ? new Date(business.created_at).toLocaleDateString() : '-'}</td>
                    <td style={styles.td}>
                      <div style={styles.actions}>
                        <button
                          style={{ ...styles.actionBtn, ...styles.approveBtn }}
                          disabled={!canReview}
                          onClick={() => openAction(business, 'approved')}
                        >
                          Approve
                        </button>
                        <button
                          style={{ ...styles.actionBtn, ...styles.rejectBtn }}
                          disabled={!canReview}
                          onClick={() => openAction(business, 'rejected')}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {action.business && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>
              {action.status === 'approved' ? 'Approve Business' : 'Reject Business'}
            </h3>
            <p style={styles.modalText}>
              {action.business.name || action.business.business_name || action.business.business_id}
            </p>
            {action.status === 'rejected' && (
              <textarea
                style={styles.textarea}
                placeholder="Reason for rejection"
                value={action.reason}
                onChange={(e) => setAction((prev) => ({ ...prev, reason: e.target.value }))}
              />
            )}
            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={closeAction} disabled={processing}>Cancel</button>
              <button
                style={{
                  ...styles.confirmBtn,
                  ...(action.status === 'approved' ? styles.approveBtn : styles.rejectBtn),
                }}
                onClick={submitAction}
                disabled={processing}
              >
                {processing ? 'Saving...' : action.status === 'approved' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryPill({ label, value, color }) {
  return (
    <div style={{ ...styles.pill, borderColor: color }}>
      <span style={{ ...styles.pillNum, color }}>{value}</span>
      <span style={styles.pillLabel}>{label}</span>
    </div>
  );
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', marginBottom: '20px' },
  heading: { fontSize: '28px', fontWeight: '800', color: '#1e293b', margin: 0 },
  subheading: { color: '#64748b', margin: '6px 0 0', fontSize: '14px' },
  refreshBtn: { padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', color: '#334155', cursor: 'pointer', fontWeight: 700 },
  pills: { display: 'flex', gap: '16px', marginBottom: '22px', flexWrap: 'wrap' },
  pill: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 24px', background: '#fff', borderRadius: '10px', border: '2px solid #734D20', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', minWidth: '110px' },
  pillNum: { fontSize: '26px', fontWeight: '800', lineHeight: 1 },
  pillLabel: { fontSize: '12px', color: '#64748b', marginTop: '4px', fontWeight: '600' },
  toolbar: { display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '18px', flexWrap: 'wrap' },
  tabs: { display: 'flex', gap: '8px' },
  tab: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', color: '#475569', cursor: 'pointer', fontWeight: 700 },
  activeTab: { background: '#734D20', color: '#fff', borderColor: '#734D20' },
  search: { minWidth: '260px', flex: 1, maxWidth: '420px', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '14px', outline: 'none' },
  tableWrap: { overflowX: 'auto', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff' },
  thead: { background: '#f8fafc' },
  th: { padding: '13px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' },
  td: { padding: '14px 16px', fontSize: '14px', color: '#334155', borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' },
  rowEven: { background: '#fff' },
  rowOdd: { background: '#fbfdff' },
  primaryText: { fontWeight: 800, color: '#1e293b', marginBottom: '4px' },
  muted: { color: '#64748b', fontSize: '12px', marginTop: '3px' },
  link: { display: 'inline-block', marginTop: '6px', color: '#1565c0', fontSize: '12px', fontWeight: 700, textDecoration: 'none' },
  badge: { display: 'inline-block', padding: '5px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 800, textTransform: 'capitalize' },
  neutralBadge: { background: '#f1f5f9', color: '#475569' },
  actions: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  actionBtn: { padding: '8px 10px', borderRadius: '8px', border: 'none', color: '#fff', fontWeight: 800, cursor: 'pointer' },
  approveBtn: { background: '#2e7d32' },
  rejectBtn: { background: '#c62828' },
  center: { textAlign: 'center', padding: '40px', color: '#64748b' },
  modalBackdrop: { position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { width: 'min(460px, calc(100vw - 32px))', background: '#fff', borderRadius: '12px', padding: '22px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalTitle: { margin: '0 0 8px', fontSize: '20px', color: '#1e293b' },
  modalText: { margin: '0 0 16px', color: '#64748b' },
  textarea: { width: '100%', minHeight: '100px', resize: 'vertical', boxSizing: 'border-box', padding: '12px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', marginBottom: '16px' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px' },
  cancelBtn: { padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', color: '#334155', fontWeight: 800, cursor: 'pointer' },
  confirmBtn: { padding: '10px 14px', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 800, cursor: 'pointer' },
};

import { useEffect, useState, useCallback } from 'react';
import { getSubmissions, approveSubmission, requestRevision } from '../api/admin';

const STATUS_COLORS = {
  submitted: { background: '#e3f2fd', color: '#1565c0' },
  approved: { background: '#e8f5e9', color: '#2e7d32' },
  revision_required: { background: '#fff3e0', color: '#ef6c00' },
  rejected: { background: '#fdecea', color: '#c62828' },
  completed: { background: '#e8f5e9', color: '#2e7d32' },
};

export default function Submissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [revisionModal, setRevisionModal] = useState(null);
  const [revisionNote, setRevisionNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSubmissions = useCallback(() => {
    setLoading(true);
    getSubmissions({ status: statusFilter === 'all' ? undefined : statusFilter, q: search || undefined })
      .then((res) => {
        const data = res.data?.submissions || res.data || [];
        setSubmissions(Array.isArray(data) ? data : []);
      })
      .catch(() => setSubmissions([]))
      .finally(() => setLoading(false));
  }, [statusFilter, search]);

  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);

  const handleApprove = async (submission) => {
    if (!window.confirm(`Approve submission from ${submission.creator_name}? This will process payment.`)) return;
    setActionLoading(true);
    try {
      await approveSubmission(submission.interest_id);
      fetchSubmissions();
    } catch (e) {
      alert('Failed to approve submission');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionNote.trim()) return alert('Please enter revision instructions');
    setActionLoading(true);
    try {
      await requestRevision(revisionModal.interest_id, revisionNote);
      setRevisionModal(null);
      setRevisionNote('');
      fetchSubmissions();
    } catch (e) {
      alert('Failed to send revision request');
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = submissions.filter((s) => {
    if (!search) return true;
    return (
      s.job_title?.toLowerCase().includes(search.toLowerCase()) ||
      s.creator_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.brand_name?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const statusCounts = submissions.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <h2 style={styles.heading}>Content Submissions</h2>

      <div style={styles.pills}>
        <div style={styles.pill}>
          <span style={styles.pillNum}>{submissions.length}</span>
          <span style={styles.pillLabel}>Total Submissions</span>
        </div>
        <div style={{ ...styles.pill, borderColor: '#1565c0' }}>
          <span style={{ ...styles.pillNum, color: '#1565c0' }}>{statusCounts.submitted || 0}</span>
          <span style={styles.pillLabel}>Pending Review</span>
        </div>
        <div style={{ ...styles.pill, borderColor: '#ef6c00' }}>
          <span style={{ ...styles.pillNum, color: '#ef6c00' }}>{statusCounts.revision_required || 0}</span>
          <span style={styles.pillLabel}>Revision Requested</span>
        </div>
        <div style={{ ...styles.pill, borderColor: '#2e7d32' }}>
          <span style={{ ...styles.pillNum, color: '#2e7d32' }}>{statusCounts.approved || 0}</span>
          <span style={styles.pillLabel}>Approved</span>
        </div>
      </div>

      <div style={styles.toolbar}>
        <input
          style={styles.search}
          placeholder="Search by job, creator or brand..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select style={styles.select} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="submitted">Pending Review</option>
          <option value="revision_required">Revision Requested</option>
          <option value="approved">Approved</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <p style={styles.center}>Loading submissions...</p>
      ) : filtered.length === 0 ? (
        <p style={styles.center}>No submissions found.</p>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>Job</th>
                <th style={styles.th}>Brand</th>
                <th style={styles.th}>Creator</th>
                <th style={styles.th}>Submitted</th>
                <th style={styles.th}>Deadline</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const statusStyle = STATUS_COLORS[s.status] || { background: '#f5f5f5', color: '#888' };
                const isOverdue = s.deadline && new Date(s.deadline) < new Date() && s.status === 'submitted';

                return (
                  <tr key={s.submission_id || s.interest_id} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                    <td style={{ ...styles.td, fontWeight: '600', maxWidth: '220px' }}>
                      {s.job_title || '—'}
                    </td>
                    <td style={styles.td}>{s.brand_name || '—'}</td>
                    <td style={styles.td}>{s.creator_name || '—'}</td>
                    <td style={styles.td}>
                      {s.submitted_at ? new Date(s.submitted_at).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ ...styles.td, color: isOverdue ? '#c62828' : '#334155', fontWeight: isOverdue ? '700' : '400' }}>
                      {s.deadline ? new Date(s.deadline).toLocaleDateString() : '—'}
                      {isOverdue && <span style={{ marginLeft: '4px' }}>⚠️</span>}
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, ...statusStyle }}>{s.status?.replace(/_/g, ' ')}</span>
                    </td>
                    <td style={styles.td}>
                      {s.status === 'submitted' && !actionLoading && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            style={{ ...styles.actionBtn, background: '#2e7d32', color: '#fff' }}
                            onClick={() => handleApprove(s)}
                          >
                            Approve
                          </button>
                          <button
                            style={{ ...styles.actionBtn, background: '#ef6c00', color: '#fff' }}
                            onClick={() => setRevisionModal(s)}
                          >
                            Request Revision
                          </button>
                        </div>
                      )}
                      {actionLoading && <span style={{ fontSize: '12px', color: '#888' }}>Processing...</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {revisionModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Request Revision</h3>
            <p style={styles.modalSubtitle}>Describe what changes are needed for {revisionModal.creator_name}'s submission.</p>
            <textarea
              style={styles.textarea}
              placeholder="Enter revision instructions..."
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
              rows={5}
            />
            <div style={styles.modalActions}>
              <button
                style={{ ...styles.modalBtn, background: '#f5f5f5', color: '#333' }}
                onClick={() => { setRevisionModal(null); setRevisionNote(''); }}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                style={{ ...styles.modalBtn, background: '#ef6c00', color: '#fff' }}
                onClick={handleRequestRevision}
                disabled={actionLoading || !revisionNote.trim()}
              >
                {actionLoading ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  heading: { fontSize: '28px', fontWeight: '800', color: '#1e293b', marginBottom: '20px', marginTop: 0 },
  pills: { display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' },
  pill: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '14px 24px', background: '#fff', borderRadius: '12px',
    border: '2px solid #734D20', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', minWidth: '120px',
  },
  pillNum: { fontSize: '28px', fontWeight: '800', color: '#734D20', lineHeight: 1 },
  pillLabel: { fontSize: '12px', color: '#64748b', marginTop: '4px', fontWeight: '500' },
  toolbar: { display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' },
  search: {
    flex: 1, minWidth: '200px', padding: '10px 14px', borderRadius: '10px',
    border: '1.5px solid #e2e8f0', fontSize: '14px', outline: 'none',
  },
  select: {
    padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #e2e8f0',
    fontSize: '14px', background: '#fff', cursor: 'pointer',
  },
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
  actionBtn: {
    padding: '6px 12px', borderRadius: '6px', border: 'none', fontSize: '12px',
    fontWeight: '600', cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: 1000,
  },
  modal: {
    background: '#fff', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '480px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
  },
  modalTitle: { margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#1e293b' },
  modalSubtitle: { margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' },
  textarea: {
    width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1.5px solid #e2e8f0',
    fontSize: '14px', resize: 'vertical', minHeight: '100px', marginBottom: '16px',
    boxSizing: 'border-box',
  },
  modalActions: { display: 'flex', gap: '12px', justifyContent: 'flex-end' },
  modalBtn: {
    padding: '10px 20px', borderRadius: '8px', border: 'none', fontSize: '14px',
    fontWeight: '600', cursor: 'pointer',
  },
};

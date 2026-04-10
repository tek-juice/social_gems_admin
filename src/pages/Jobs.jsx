import { useEffect, useState, useCallback } from 'react';
import { getJobs } from '../api/admin';

const STATUS_COLORS = {
  active: { background: '#e8f5e9', color: '#2e7d32' },
  closed: { background: '#fdecea', color: '#c62828' },
  deleted: { background: '#f5f5f5', color: '#888' },
};

const CAMPAIGN_STATUS_COLORS = {
  active: { background: '#e3f2fd', color: '#1565c0' },
  completed: { background: '#e8f5e9', color: '#2e7d32' },
  draft: { background: '#f5f5f5', color: '#888' },
  closed: { background: '#fdecea', color: '#c62828' },
};

function Badge({ label, colors }) {
  return (
    <span style={{ ...styles.badge, ...colors }}>
      {label}
    </span>
  );
}

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [linkFilter, setLinkFilter] = useState('all'); // all | linked | standalone
  const [page, setPage] = useState(1);
  const limit = 50;

  const fetchJobs = useCallback(() => {
    setLoading(true);
    getJobs({ status: statusFilter === 'all' ? undefined : statusFilter, q: search || undefined, page, limit })
      .then((res) => {
        const data = res.data;
        setJobs(Array.isArray(data.jobs) ? data.jobs : []);
        setTotal(data.total || 0);
      })
      .catch(() => {
        setJobs([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [statusFilter, search, page]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  // Client-side link filter
  const filtered = jobs.filter((j) => {
    if (linkFilter === 'linked') return !!j.campaign_id;
    if (linkFilter === 'standalone') return !j.campaign_id;
    return true;
  });

  const totalPages = Math.ceil(total / limit);

  const linkedCount = jobs.filter((j) => !!j.campaign_id).length;
  const standaloneCount = jobs.filter((j) => !j.campaign_id).length;

  return (
    <div>
      <h2 style={styles.heading}>Job Board</h2>

      {/* Summary pills */}
      <div style={styles.pills}>
        <div style={styles.pill}>
          <span style={styles.pillNum}>{total}</span>
          <span style={styles.pillLabel}>Total Jobs</span>
        </div>
        <div style={{ ...styles.pill, borderColor: '#1565c0' }}>
          <span style={{ ...styles.pillNum, color: '#1565c0' }}>{linkedCount}</span>
          <span style={styles.pillLabel}>Linked to Campaign</span>
        </div>
        <div style={{ ...styles.pill, borderColor: '#e65100' }}>
          <span style={{ ...styles.pillNum, color: '#e65100' }}>{standaloneCount}</span>
          <span style={styles.pillLabel}>Standalone</span>
        </div>
      </div>

      {/* Toolbar */}
      <div style={styles.toolbar}>
        <input
          style={styles.search}
          placeholder="Search by title or brand..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select style={styles.select} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
          <option value="deleted">Deleted</option>
        </select>
        <select style={styles.select} value={linkFilter} onChange={(e) => setLinkFilter(e.target.value)}>
          <option value="all">All Jobs</option>
          <option value="linked">Linked to Campaign</option>
          <option value="standalone">Standalone Only</option>
        </select>
      </div>

      {loading ? (
        <p style={styles.center}>Loading...</p>
      ) : filtered.length === 0 ? (
        <p style={styles.center}>No jobs found.</p>
      ) : (
        <>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>Job Title</th>
                  <th style={styles.th}>Brand</th>
                  <th style={styles.th}>Niche</th>
                  <th style={styles.th}>Compensation</th>
                  <th style={styles.th}>Min Followers</th>
                  <th style={styles.th}>Deadline</th>
                  <th style={styles.th}>Interests</th>
                  <th style={styles.th}>Shortlisted</th>
                  <th style={styles.th}>Linked Campaign</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((j, i) => (
                  <tr key={j.job_id} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                    <td style={{ ...styles.td, fontWeight: '600', maxWidth: '200px' }}>
                      <span title={j.title}>{j.title || '—'}</span>
                    </td>
                    <td style={styles.td}>{j.brand_name || '—'}</td>
                    <td style={styles.td}>{j.niche || '—'}</td>
                    <td style={{ ...styles.td, fontWeight: '600', color: '#734D20' }}>
                      {j.comp_type === 'product' ? 'Product' : `${Number(j.comp_amount).toLocaleString()} ${j.comp_currency}`}
                    </td>
                    <td style={styles.td}>{Number(j.min_followers).toLocaleString()}</td>
                    <td style={styles.td}>{j.deadline ? new Date(j.deadline).toLocaleDateString() : '—'}</td>
                    <td style={{ ...styles.td, textAlign: 'center', fontWeight: '700', color: '#1565c0' }}>
                      {j.interest_count || 0}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'center', fontWeight: '700', color: '#2e7d32' }}>
                      {j.shortlisted_count || 0}
                    </td>
                    <td style={styles.td}>
                      {j.campaign_id ? (
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                            {j.campaign_title || j.campaign_id}
                          </div>
                          {j.campaign_status && (
                            <Badge
                              label={j.campaign_status}
                              colors={CAMPAIGN_STATUS_COLORS[j.campaign_status] || { background: '#f5f5f5', color: '#888' }}
                            />
                          )}
                        </div>
                      ) : (
                        <span style={styles.standalone}>Standalone</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <Badge
                        label={j.status}
                        colors={STATUS_COLORS[j.status] || { background: '#f5f5f5', color: '#888' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={styles.pagination}>
              <button style={styles.pageBtn} disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              <span style={styles.pageInfo}>Page {page} of {totalPages}</span>
              <button style={styles.pageBtn} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </>
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
  standalone: { fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' },
  center: { textAlign: 'center', color: '#94a3b8', padding: '60px 0', fontSize: '15px' },
  pagination: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '20px' },
  pageBtn: {
    padding: '8px 18px', borderRadius: '8px', border: '1.5px solid #e2e8f0',
    background: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#334155',
  },
  pageInfo: { fontSize: '14px', color: '#64748b' },
};

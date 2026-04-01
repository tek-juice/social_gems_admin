import { useEffect, useState } from 'react';
import { getCampaigns } from '../api/admin';

const STATUS_COLORS = {
  active: { background: '#e8f5e9', color: '#2e7d32' },
  completed: { background: '#e3f2fd', color: '#1565c0' },
  draft: { background: '#f5f5f5', color: '#888' },
  closed: { background: '#fdecea', color: '#c62828' },
};

const EARNING_TYPE_COLORS = {
  paid: { background: '#fff8e1', color: '#f57f17' },
  affiliate: { background: '#ede7f6', color: '#512da8' },
  barter: { background: '#e0f2f1', color: '#00695c' },
};

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    getCampaigns()
      .then((res) => {
        const data = res.data?.data || res.data;
        setCampaigns(Array.isArray(data) ? data : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = campaigns.filter((c) => {
    const matchSearch = c.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || c.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div>
      <h2 style={styles.heading}>Campaigns</h2>
      <div style={styles.toolbar}>
        <input
          style={styles.search}
          placeholder="Search by title or brand..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select style={styles.select} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="draft">Draft</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {loading ? (
        <p style={styles.center}>Loading...</p>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>Title</th>
                <th style={styles.th}>Brand</th>
                <th style={styles.th}>Objective</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Budget</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const statusStyle = STATUS_COLORS[c.status] || { background: '#f5f5f5', color: '#888' };
                return (
                  <tr key={c.campaign_id || i} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                    <td style={styles.td}>{c.title || '—'}</td>
                    <td style={styles.td}>{c.name || '—'}</td>
                    <td style={styles.td}>{c.objective || '—'}</td>
                    <td style={styles.td}>
                      {c.earning_type && (
                        <span style={{ ...styles.badge, ...EARNING_TYPE_COLORS[c.earning_type] }}>
                          {c.earning_type === 'barter' ? 'Free Collab' : c.earning_type}
                        </span>
                      )}
                    </td>
                    <td style={styles.td}>{c.budget ? `$${Number(c.budget).toLocaleString()}` : '—'}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, ...statusStyle }}>{c.status}</span>
                    </td>
                    <td style={styles.td}>{c.created_on?.split('T')[0] || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p style={styles.count}>{filtered.length} campaigns</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  heading: { fontSize: '22px', fontWeight: '800', color: '#333', marginBottom: '20px' },
  toolbar: { display: 'flex', gap: '12px', marginBottom: '16px' },
  search: { flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' },
  select: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', background: '#fff' },
  tableWrap: { background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#f9f9f9' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' },
  td: { padding: '12px 16px', fontSize: '14px', color: '#333', borderTop: '1px solid #f0f0f0' },
  rowEven: { background: '#fff' },
  rowOdd: { background: '#fafafa' },
  badge: { padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' },
  count: { padding: '12px 16px', fontSize: '12px', color: '#aaa', margin: 0, borderTop: '1px solid #f0f0f0' },
  center: { textAlign: 'center', padding: '40px', color: '#888' },
};

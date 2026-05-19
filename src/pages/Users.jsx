import { useEffect, useState } from 'react';
import { getUsers } from '../api/admin';

const TIER_STYLES = {
  pro:  { background: '#ede7f6', color: '#512da8', label: 'Pro' },
  plus: { background: '#e3f2fd', color: '#1565c0', label: 'Plus' },
  free: { background: '#f5f5f5', color: '#888',    label: 'Free' },
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');

  useEffect(() => {
    getUsers()
      .then((res) => {
        const data = res.data?.data || res.data;
        setUsers(Array.isArray(data) ? data : []);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter((u) => {
    const matchSearch =
      u.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || u.user_type === filter;
    const matchTier = tierFilter === 'all' || (u.subscription_tier || 'free') === tierFilter;
    return matchSearch && matchFilter && matchTier;
  });

  const proCount = users.filter((u) => u.subscription_tier === 'pro').length;
  const plusCount = users.filter((u) => u.subscription_tier === 'plus').length;

  return (
    <div>
      <h2 style={styles.heading}>Users</h2>

      <div style={styles.statRow}>
        <div style={styles.statCard}>
          <span style={styles.statNum}>{users.length}</span>
          <span style={styles.statLabel}>Total</span>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '3px solid #512da8' }}>
          <span style={{ ...styles.statNum, color: '#512da8' }}>{proCount}</span>
          <span style={styles.statLabel}>Creator Pro</span>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '3px solid #1565c0' }}>
          <span style={{ ...styles.statNum, color: '#1565c0' }}>{plusCount}</span>
          <span style={styles.statLabel}>Creator Plus</span>
        </div>
      </div>

      <div style={styles.toolbar}>
        <input
          style={styles.search}
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select style={styles.select} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Types</option>
          <option value="influencer">Influencers</option>
          <option value="brand">Brands</option>
        </select>
        <select style={styles.select} value={tierFilter} onChange={(e) => setTierFilter(e.target.value)}>
          <option value="all">All Plans</option>
          <option value="pro">Creator Pro</option>
          <option value="plus">Creator Plus</option>
          <option value="free">Free</option>
        </select>
      </div>

      {loading ? (
        <p style={styles.center}>Loading...</p>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Plan</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Country</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => {
                const tier = u.subscription_tier || 'free';
                const tierStyle = TIER_STYLES[tier] || TIER_STYLES.free;
                return (
                  <tr key={u.user_id || i} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {tier !== 'free' && (
                          <span style={{ fontSize: '14px' }} title={`Creator ${tierStyle.label}`}>
                            {tier === 'pro' ? '💎' : '⭐'}
                          </span>
                        )}
                        {u.first_name} {u.last_name}
                      </div>
                    </td>
                    <td style={styles.td}>{u.email}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, ...tierStyle }}>
                        {tierStyle.label}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, background: u.user_type === 'brand' ? '#F9D769' : '#e8f5e9', color: u.user_type === 'brand' ? '#734D20' : '#2e7d32' }}>
                        {u.user_type}
                      </span>
                    </td>
                    <td style={styles.td}>{u.iso_code || '—'}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, background: u.status === 'active' ? '#e8f5e9' : '#fdecea', color: u.status === 'active' ? '#2e7d32' : '#c62828' }}>
                        {u.status}
                      </span>
                    </td>
                    <td style={styles.td}>{u.created_at?.split('T')[0] || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p style={styles.count}>{filtered.length} users</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  heading: { fontSize: '22px', fontWeight: '800', color: '#333', marginBottom: '20px' },
  statRow: { display: 'flex', gap: '12px', marginBottom: '20px' },
  statCard: {
    background: '#fff', borderRadius: '10px', padding: '14px 20px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.07)', borderLeft: '3px solid #e0e0e0',
    display: 'flex', flexDirection: 'column', gap: '2px', minWidth: '100px',
  },
  statNum: { fontSize: '22px', fontWeight: '800', color: '#333' },
  statLabel: { fontSize: '12px', color: '#888', fontWeight: '500' },
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

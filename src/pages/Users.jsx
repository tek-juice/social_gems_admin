import { useEffect, useState } from 'react';
import { getUsers } from '../api/admin';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

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
    return matchSearch && matchFilter;
  });

  return (
    <div>
      <h2 style={styles.heading}>Users</h2>
      <div style={styles.toolbar}>
        <input
          style={styles.search}
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select style={styles.select} value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="influencer">Influencers</option>
          <option value="brand">Brands</option>
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
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Country</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.user_id || i} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                  <td style={styles.td}>{u.first_name} {u.last_name}</td>
                  <td style={styles.td}>{u.email}</td>
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
              ))}
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

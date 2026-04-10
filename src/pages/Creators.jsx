import { useEffect, useState, useCallback } from 'react';
import { filterCreators, getIndustries } from '../api/admin';

const TIERS = [
  { value: '', label: 'All Tiers' },
  { value: '1', label: 'Nano' },
  { value: '2', label: 'Micro' },
  { value: '3', label: 'Mid' },
  { value: '4', label: 'Macro' },
  { value: '5', label: 'Mega' },
];

export default function Creators() {
  const [creators, setCreators] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 20 });

  const [filters, setFilters] = useState({
    q: '',
    location: '',
    level_id: '',
    industry_id: '',
    min_rating: '',
  });

  const fetchCreators = useCallback(async (overrides = {}) => {
    setLoading(true);
    try {
      const params = { ...filters, ...overrides };
      // strip empty values
      Object.keys(params).forEach((k) => { if (!params[k]) delete params[k]; });
      const res = await filterCreators(params);
      const body = res.data;
      setCreators(body.creators || []);
      if (body.pagination) setPagination(body.pagination);
    } catch {
      setCreators([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    getIndustries()
      .then((res) => {
        const data = res.data?.data || res.data || [];
        setIndustries(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
    fetchCreators();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCreators({ page: 1 });
  };

  const handleReset = () => {
    const reset = { q: '', location: '', level_id: '', industry_id: '', min_rating: '' };
    setFilters(reset);
    setTimeout(() => fetchCreators({ ...reset, page: 1 }), 0);
  };

  const goToPage = (p) => fetchCreators({ page: p });

  const ratingColor = (r) => {
    if (!r) return '#aaa';
    if (r >= 4) return '#2e7d32';
    if (r >= 2.5) return '#e65100';
    return '#c62828';
  };

  return (
    <div>
      <h2 style={styles.heading}>Creator Filter</h2>

      <form onSubmit={handleSearch} style={styles.filterCard}>
        <div style={styles.filterGrid}>
          <input
            style={styles.input}
            placeholder="Search name / username..."
            value={filters.q}
            onChange={(e) => handleFilterChange('q', e.target.value)}
          />
          <input
            style={styles.input}
            placeholder="Location (e.g. KE, NG)"
            value={filters.location}
            onChange={(e) => handleFilterChange('location', e.target.value.toUpperCase())}
            maxLength={2}
          />
          <select
            style={styles.select}
            value={filters.level_id}
            onChange={(e) => handleFilterChange('level_id', e.target.value)}
          >
            {TIERS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <select
            style={styles.select}
            value={filters.industry_id}
            onChange={(e) => handleFilterChange('industry_id', e.target.value)}
          >
            <option value="">All Niches</option>
            {industries.map((ind) => (
              <option key={ind.industry_id || ind.id} value={ind.industry_id || ind.id}>
                {ind.industry_name || ind.name}
              </option>
            ))}
          </select>
          <input
            style={{ ...styles.input, width: '120px' }}
            type="number"
            placeholder="Min rating"
            min="0"
            max="5"
            step="0.1"
            value={filters.min_rating}
            onChange={(e) => handleFilterChange('min_rating', e.target.value)}
          />
        </div>
        <div style={styles.filterActions}>
          <button type="submit" style={styles.btnPrimary}>Search</button>
          <button type="button" style={styles.btnSecondary} onClick={handleReset}>Reset</button>
        </div>
      </form>

      {loading ? (
        <p style={styles.center}>Loading...</p>
      ) : (
        <>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>Creator</th>
                  <th style={styles.th}>Username</th>
                  <th style={styles.th}>Location</th>
                  <th style={styles.th}>Tier</th>
                  <th style={styles.th}>Niche</th>
                  <th style={styles.th}>Rating</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {creators.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ ...styles.td, textAlign: 'center', color: '#aaa', padding: '40px' }}>
                      No creators found
                    </td>
                  </tr>
                ) : (
                  creators.map((c, i) => (
                    <tr key={c.user_id || i} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                      <td style={styles.td}>
                        <div style={styles.nameCell}>
                          {c.profile_pic ? (
                            <img src={c.profile_pic} alt="" style={styles.avatar} onError={(e) => { e.target.style.display = 'none'; }} />
                          ) : (
                            <div style={styles.avatarPlaceholder}>{(c.first_name || '?')[0].toUpperCase()}</div>
                          )}
                          <span>{c.first_name} {c.last_name}</span>
                        </div>
                      </td>
                      <td style={styles.td}>{c.username || '—'}</td>
                      <td style={styles.td}>{c.iso_code || '—'}</td>
                      <td style={styles.td}>
                        {c.level_name ? (
                          <span style={styles.tierBadge}>{c.level_name}</span>
                        ) : '—'}
                      </td>
                      <td style={styles.td} title={c.industry_names || ''}>
                        <span style={styles.niche}>{c.industry_names || '—'}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.ratingBadge, color: ratingColor(c.influencer_rating), borderColor: ratingColor(c.influencer_rating) }}>
                          {c.influencer_rating != null ? Number(c.influencer_rating).toFixed(1) : '—'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, background: c.status === 'active' ? '#e8f5e9' : '#fdecea', color: c.status === 'active' ? '#2e7d32' : '#c62828' }}>
                          {c.status}
                        </span>
                      </td>
                      <td style={styles.td}>{c.created_at?.split('T')[0] || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div style={styles.footer}>
              <span style={styles.count}>{pagination.total} creators</span>
              {pagination.pages > 1 && (
                <div style={styles.pager}>
                  <button style={styles.pageBtn} disabled={pagination.page <= 1} onClick={() => goToPage(pagination.page - 1)}>‹</button>
                  <span style={styles.pageInfo}>Page {pagination.page} of {pagination.pages}</span>
                  <button style={styles.pageBtn} disabled={pagination.page >= pagination.pages} onClick={() => goToPage(pagination.page + 1)}>›</button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  heading: { fontSize: '22px', fontWeight: '800', color: '#333', marginBottom: '20px' },
  filterCard: { background: '#fff', borderRadius: '12px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
  filterGrid: { display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' },
  input: { flex: 1, minWidth: '140px', padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', outline: 'none' },
  select: { flex: 1, minWidth: '140px', padding: '10px 14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', background: '#fff', outline: 'none' },
  filterActions: { display: 'flex', gap: '10px' },
  btnPrimary: { padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#734D20', color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer' },
  btnSecondary: { padding: '10px 20px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', color: '#555', fontWeight: '600', fontSize: '14px', cursor: 'pointer' },
  tableWrap: { background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#f9f9f9' },
  th: { padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' },
  td: { padding: '12px 16px', fontSize: '14px', color: '#333', borderTop: '1px solid #f0f0f0' },
  rowEven: { background: '#fff' },
  rowOdd: { background: '#fafafa' },
  nameCell: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: { width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' },
  avatarPlaceholder: { width: '32px', height: '32px', borderRadius: '50%', background: '#F9D769', color: '#734D20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px', flexShrink: 0 },
  badge: { padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' },
  tierBadge: { padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: '#EDE7F6', color: '#4527A0' },
  ratingBadge: { padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', border: '1px solid', background: 'transparent' },
  niche: { display: 'inline-block', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'middle' },
  footer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid #f0f0f0' },
  count: { fontSize: '12px', color: '#aaa' },
  pager: { display: 'flex', alignItems: 'center', gap: '8px' },
  pageBtn: { padding: '4px 12px', borderRadius: '6px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: '16px', lineHeight: '1', color: '#555' },
  pageInfo: { fontSize: '13px', color: '#555' },
  center: { textAlign: 'center', padding: '40px', color: '#888' },
};

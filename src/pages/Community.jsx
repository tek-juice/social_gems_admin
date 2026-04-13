import { useEffect, useState, useCallback } from 'react';
import { getAdminCommunityFeed } from '../api/admin';

const TAB_CONFIG = {
  all:          { label: 'All',           icon: '🌐' },
  announcement: { label: 'Announcements', icon: '📢' },
  job:          { label: 'Job Highlights', icon: '💼' },
  success:      { label: 'Success',        icon: '🏆' },
  discussion:   { label: 'Discussions',    icon: '💬' },
};

const TYPE_STYLES = {
  announcement: { bg: '#e3f2fd', color: '#1565c0' },
  job:          { bg: '#e8f5e9', color: '#2e7d32' },
  success:      { bg: '#fff3e0', color: '#e65100' },
  discussion:   { bg: '#f3e5f5', color: '#6a1b9a' },
};

export default function Community() {
  const [activeTab, setActiveTab] = useState('all');
  const [feed, setFeed] = useState([]);
  const [sections, setSections] = useState({});
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchFeed = useCallback((tab, p) => {
    setLoading(true);
    const params = { page: p, limit: 20 };
    if (tab !== 'all') params.type = tab;
    getAdminCommunityFeed(params)
      .then((res) => {
        const body = res.data?.data || res.data || {};
        const items = body.feed || (Array.isArray(body) ? body : []);
        setFeed(items);
        if (body.sections) setSections(body.sections);
        if (body.pagination) setPagination(body.pagination);
        else setPagination({ page: p, pages: 1, total: items.length });
      })
      .catch(() => setFeed([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchFeed(activeTab, page);
  }, [activeTab, page, fetchFeed]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  return (
    <div>
      <h2 style={styles.heading}>Community Hub</h2>

      {Object.keys(sections).length > 0 && (
        <div style={styles.pills}>
          {Object.entries(sections).map(([type, count]) => {
            const cfg = TYPE_STYLES[type] || { bg: '#f5f5f5', color: '#555' };
            const tab = TAB_CONFIG[type];
            return (
              <div key={type} style={{ ...styles.pill, background: cfg.bg, borderColor: cfg.bg }}>
                <span style={{ ...styles.pillNum, color: cfg.color }}>{count}</span>
                <span style={{ ...styles.pillLabel, color: cfg.color }}>{tab?.icon} {tab?.label || type}</span>
              </div>
            );
          })}
          <div style={styles.pill}>
            <span style={styles.pillNum}>{pagination.total}</span>
            <span style={styles.pillLabel}>Total Posts</span>
          </div>
        </div>
      )}

      <div style={styles.tabs}>
        {Object.entries(TAB_CONFIG).map(([id, cfg]) => (
          <button
            key={id}
            style={{ ...styles.tab, ...(activeTab === id ? styles.activeTab : {}) }}
            onClick={() => handleTabChange(id)}
          >
            <span style={{ marginRight: '5px' }}>{cfg.icon}</span>
            {cfg.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={styles.center}>Loading feed...</p>
      ) : feed.length === 0 ? (
        <div style={styles.empty}>No posts found for this filter.</div>
      ) : (
        <>
          <div style={styles.feedGrid}>
            {feed.map((item, i) => (
              <FeedCard key={item.id || item.post_id || i} item={item} />
            ))}
          </div>

          {pagination.pages > 1 && (
            <div style={styles.pager}>
              <button style={styles.pageBtn} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>‹ Prev</button>
              <span style={styles.pageInfo}>Page {pagination.page} of {pagination.pages}</span>
              <button style={styles.pageBtn} disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>Next ›</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FeedCard({ item }) {
  const type = item.type || 'discussion';
  const typeStyle = TYPE_STYLES[type] || { bg: '#f5f5f5', color: '#555' };
  const tabCfg = TAB_CONFIG[type] || TAB_CONFIG.discussion;
  const date = item.created_at || item.published_at;
  const body = item.body || item.description || item.content;

  return (
    <div style={styles.card}>
      {item.image_url && (
        <img src={item.image_url} alt="" style={styles.cardImg} onError={(e) => { e.target.style.display = 'none'; }} />
      )}
      <div style={styles.cardBody}>
        <div style={styles.cardMeta}>
          <span style={{ ...styles.typeBadge, background: typeStyle.bg, color: typeStyle.color }}>
            {tabCfg.icon} {tabCfg.label}
          </span>
          {date && (
            <span style={styles.dateText}>{new Date(date).toLocaleDateString()}</span>
          )}
        </div>
        <div style={styles.cardTitle}>{item.title || item.headline || '—'}</div>
        {body && (
          <div style={styles.cardExcerpt}>
            {body.length > 160 ? body.slice(0, 160) + '…' : body}
          </div>
        )}
        {item.author || item.username ? (
          <div style={styles.cardAuthor}>
            <div style={styles.authorAvatar}>
              {(item.author || item.username || '?')[0].toUpperCase()}
            </div>
            {item.author || item.username}
          </div>
        ) : null}
      </div>
    </div>
  );
}

const styles = {
  heading: { fontSize: '28px', fontWeight: '800', color: '#1e293b', marginBottom: '20px', marginTop: 0 },
  pills: { display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' },
  pill: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '10px 20px', borderRadius: '10px', border: '2px solid #e2e8f0',
    background: '#fff', minWidth: '120px',
  },
  pillNum: { fontSize: '22px', fontWeight: '800', color: '#334155', lineHeight: 1 },
  pillLabel: { fontSize: '11px', color: '#64748b', marginTop: '3px', fontWeight: '600' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', flexWrap: 'wrap' },
  tab: {
    padding: '10px 18px', borderRadius: '8px', border: 'none', background: 'transparent',
    fontSize: '13px', fontWeight: '600', color: '#64748b', cursor: 'pointer',
  },
  activeTab: { background: '#734D20', color: '#fff' },
  feedGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' },
  card: { background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  cardImg: { width: '100%', height: '140px', objectFit: 'cover', display: 'block' },
  cardBody: { padding: '16px', flex: 1 },
  cardMeta: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' },
  typeBadge: { padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' },
  dateText: { fontSize: '11px', color: '#94a3b8' },
  cardTitle: { fontSize: '15px', fontWeight: '700', color: '#1e293b', marginBottom: '6px', lineHeight: 1.35 },
  cardExcerpt: { fontSize: '13px', color: '#64748b', lineHeight: 1.5, marginBottom: '10px' },
  cardAuthor: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b', fontWeight: '600' },
  authorAvatar: {
    width: '24px', height: '24px', borderRadius: '50%', background: '#F9D769',
    color: '#734D20', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '11px', fontWeight: '700', flexShrink: 0,
  },
  empty: { textAlign: 'center', padding: '60px', color: '#94a3b8', fontSize: '15px', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  center: { textAlign: 'center', padding: '60px', color: '#94a3b8', fontSize: '15px' },
  pager: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '24px' },
  pageBtn: { padding: '8px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer', color: '#334155' },
  pageInfo: { fontSize: '14px', color: '#64748b' },
};

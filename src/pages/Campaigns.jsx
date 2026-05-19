import { useEffect, useState } from 'react';
import { getCampaigns, getDelayedCampaigns, updateCampaignAccessTier } from '../api/admin';

const TIER_COLORS = {
  free: { background: '#f5f5f5', color: '#666' },
  plus: { background: '#e3f2fd', color: '#1565c0' },
  pro: { background: '#ede7f6', color: '#512da8' },
};

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
  const [delayed, setDelayed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [delayedLoading, setDelayedLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [mainTab, setMainTab] = useState('all'); // 'all' | 'delayed'
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [tierForm, setTierForm] = useState({ access_tier: 'free', early_access_hours: 0 });
  const [tierSaving, setTierSaving] = useState(false);
  const [tierError, setTierError] = useState('');

  useEffect(() => {
    getCampaigns()
      .then((res) => {
        const data = res.data?.data || res.data;
        setCampaigns(Array.isArray(data) ? data : []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (mainTab === 'delayed' && delayed.length === 0) {
      setDelayedLoading(true);
      getDelayedCampaigns()
        .then((res) => {
          const data = res.data?.data || res.data || [];
          setDelayed(Array.isArray(data) ? data : []);
        })
        .catch(() => setDelayed([]))
        .finally(() => setDelayedLoading(false));
    }
  }, [mainTab, delayed.length]);

  const openTierEdit = (campaign) => {
    setEditingCampaign(campaign);
    setTierForm({
      access_tier: campaign.access_tier || 'free',
      early_access_hours: campaign.early_access_hours || 0,
    });
    setTierError('');
  };

  const saveTier = async () => {
    setTierSaving(true);
    setTierError('');
    try {
      await updateCampaignAccessTier(editingCampaign.campaign_id, tierForm.access_tier, Number(tierForm.early_access_hours));
      setCampaigns((prev) =>
        prev.map((c) =>
          c.campaign_id === editingCampaign.campaign_id
            ? { ...c, access_tier: tierForm.access_tier, early_access_hours: Number(tierForm.early_access_hours) }
            : c
        )
      );
      setEditingCampaign(null);
    } catch (e) {
      setTierError(e?.response?.data?.message || 'Failed to update. Try again.');
    } finally {
      setTierSaving(false);
    }
  };

  const filtered = campaigns.filter((c) => {
    const matchSearch = c.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || c.status === filter;
    const matchType = typeFilter === 'all' || c.earning_type === typeFilter;
    return matchSearch && matchFilter && matchType;
  });

  return (
    <div>
      <h2 style={styles.heading}>Campaigns</h2>

      <div style={styles.mainTabs}>
        <button
          style={{ ...styles.mainTab, ...(mainTab === 'all' ? styles.activeMainTab : {}) }}
          onClick={() => setMainTab('all')}
        >
          All Campaigns
        </button>
        <button
          style={{ ...styles.mainTab, ...(mainTab === 'delayed' ? styles.activeMainTab : {}), ...(mainTab !== 'delayed' ? styles.delayedTabInactive : {}) }}
          onClick={() => setMainTab('delayed')}
        >
          Delayed / Overdue
          {delayed.length > 0 && (
            <span style={styles.delayBadge}>{delayed.length}</span>
          )}
        </button>
      </div>

      {mainTab === 'all' && (
        <>
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
            <select style={styles.select} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All Types</option>
              <option value="paid">Paid</option>
              <option value="affiliate">Affiliate</option>
              <option value="barter">Free Collab</option>
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
                    <th style={styles.th}>Milestones</th>
                    <th style={styles.th}>Access Tier</th>
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
                          {c.earning_type === 'affiliate' && c.affiliate_link && (
                            <a
                              href={c.affiliate_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={styles.affiliateLink}
                              title={c.affiliate_link}
                            >
                              🔗 link
                            </a>
                          )}
                        </td>
                        <td style={styles.td}>{c.budget ? `$${Number(c.budget).toLocaleString()}` : '—'}</td>
                        <td style={styles.td}>
                          <div style={styles.milestones}>
                            <MilestonePip label="Inv" value={c.count_invited} color="#90a4ae" />
                            <MilestonePip label="Acc" value={c.count_accepted} color="#42a5f5" />
                            <MilestonePip label="Sub" value={c.count_submitted} color="#7e57c2" />
                            <MilestonePip label="App" value={c.count_approved} color="#66bb6a" />
                            <MilestonePip label="Rev" value={c.count_revision_required} color="#ffa726" />
                            <MilestonePip label="Done" value={c.count_completed} color="#2e7d32" />
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ ...styles.badge, ...TIER_COLORS[c.access_tier || 'free'] }}>
                              {c.access_tier || 'free'}
                            </span>
                            {c.early_access_hours > 0 && (
                              <span style={{ fontSize: '10px', color: '#888' }}>{c.early_access_hours}h early</span>
                            )}
                            <button onClick={() => openTierEdit(c)} style={styles.editBtn} title="Edit tier">✏️</button>
                          </div>
                        </td>
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
        </>
      )}

      {mainTab === 'delayed' && (
        delayedLoading ? (
          <p style={styles.center}>Loading delayed campaigns...</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thead}>
                  <th style={styles.th}>Campaign</th>
                  <th style={styles.th}>Brand</th>
                  <th style={styles.th}>Creator</th>
                  <th style={styles.th}>End Date</th>
                  <th style={styles.th}>Days Overdue</th>
                  <th style={styles.th}>Action Status</th>
                  <th style={styles.th}>Campaign Status</th>
                </tr>
              </thead>
              <tbody>
                {delayed.map((d, i) => {
                  const endDate = d.end_date ? new Date(d.end_date) : null;
                  const daysOverdue = endDate
                    ? Math.max(0, Math.floor((Date.now() - endDate.getTime()) / 86400000))
                    : null;
                  return (
                    <tr key={d.invite_id || i} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                      <td style={styles.td}>
                        <div style={{ fontWeight: '600' }}>{d.title || '—'}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{d.campaign_id}</div>
                      </td>
                      <td style={styles.td}>{d.brand_name || d.created_by || '—'}</td>
                      <td style={styles.td}>
                        <div>{d.username || d.creator_name || '—'}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{d.email || ''}</div>
                      </td>
                      <td style={styles.td}>{endDate ? endDate.toLocaleDateString() : '—'}</td>
                      <td style={styles.td}>
                        {daysOverdue != null ? (
                          <span style={{
                            ...styles.badge,
                            background: daysOverdue > 14 ? '#fdecea' : '#fff3e0',
                            color: daysOverdue > 14 ? '#c62828' : '#e65100',
                            fontWeight: '700',
                          }}>
                            {daysOverdue}d overdue
                          </span>
                        ) : '—'}
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, background: '#f5f5f5', color: '#555' }}>
                          {d.action_status || '—'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, ...(STATUS_COLORS[d.status] || { background: '#f5f5f5', color: '#888' }) }}>
                          {d.status || '—'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {delayed.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ ...styles.td, textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                      No delayed campaigns found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <p style={styles.count}>{delayed.length} delayed campaigns</p>
          </div>
        )
      )}

      {editingCampaign && (
        <div style={styles.modalOverlay} onClick={() => setEditingCampaign(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Set Access Tier</h3>
            <p style={styles.modalSubtitle}>{editingCampaign.title}</p>
            <label style={styles.label}>Access Tier</label>
            <select
              style={styles.modalSelect}
              value={tierForm.access_tier}
              onChange={(e) => setTierForm((f) => ({ ...f, access_tier: e.target.value }))}
            >
              <option value="free">Free — visible to all</option>
              <option value="plus">Plus — Creator Plus &amp; Pro only</option>
              <option value="pro">Pro — Creator Pro only</option>
            </select>
            <label style={styles.label}>Early Access (hours before public)</label>
            <input
              type="number"
              min="0"
              style={styles.modalInput}
              value={tierForm.early_access_hours}
              onChange={(e) => setTierForm((f) => ({ ...f, early_access_hours: e.target.value }))}
              placeholder="0 = no early access"
            />
            {tierError && <p style={styles.tierError}>{tierError}</p>}
            <div style={styles.modalActions}>
              <button style={styles.cancelBtn} onClick={() => setEditingCampaign(null)}>Cancel</button>
              <button style={styles.saveBtn} onClick={saveTier} disabled={tierSaving}>
                {tierSaving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MilestonePip({ label, value, color }) {
  if (!value && value !== 0) return null;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', marginRight: '6px' }}>
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, display: 'inline-block' }} />
      <span style={{ fontSize: '11px', color: '#555' }}>{label} <strong>{value}</strong></span>
    </span>
  );
}

const styles = {
  heading: { fontSize: '22px', fontWeight: '800', color: '#333', marginBottom: '20px' },
  mainTabs: { display: 'flex', gap: '8px', marginBottom: '20px' },
  mainTab: {
    padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff',
    fontSize: '14px', fontWeight: '600', color: '#64748b', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '8px',
  },
  activeMainTab: { background: '#734D20', color: '#fff', borderColor: '#734D20' },
  delayedTabInactive: { borderColor: '#ffa726', color: '#e65100' },
  delayBadge: {
    background: '#e65100', color: '#fff', borderRadius: '10px',
    padding: '1px 7px', fontSize: '11px', fontWeight: '700',
  },
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
  affiliateLink: { display: 'block', marginTop: '4px', fontSize: '11px', color: '#512da8', textDecoration: 'none' },
  milestones: { display: 'flex', flexWrap: 'wrap', gap: '2px', minWidth: '160px' },
  count: { padding: '12px 16px', fontSize: '12px', color: '#aaa', margin: 0, borderTop: '1px solid #f0f0f0' },
  center: { textAlign: 'center', padding: '40px', color: '#888' },
  editBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', padding: '0 2px', lineHeight: 1 },
  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modal: {
    background: '#fff', borderRadius: '12px', padding: '28px 32px',
    width: '360px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
  },
  modalTitle: { fontSize: '17px', fontWeight: '700', marginBottom: '4px' },
  modalSubtitle: { fontSize: '13px', color: '#888', marginBottom: '20px', marginTop: 0 },
  label: { display: 'block', fontSize: '12px', fontWeight: '600', color: '#555', marginBottom: '6px', marginTop: '14px' },
  modalSelect: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' },
  modalInput: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' },
  tierError: { color: '#c62828', fontSize: '13px', marginTop: '8px' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' },
  cancelBtn: { padding: '9px 18px', borderRadius: '8px', border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: '14px' },
  saveBtn: { padding: '9px 18px', borderRadius: '8px', border: 'none', background: '#734D20', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
};

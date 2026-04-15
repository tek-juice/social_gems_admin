import { useState, useEffect } from 'react';
import { getMyCampaigns, getMyCampaignStats, getMyCampaignApplicants } from '../api/admin';
import { useAuth } from '../hooks/useAuth';

const STATUS_COLOR = {
  active: '#16a34a',
  open_to_applications: '#2563eb',
  completed: '#6b7280',
  closed: '#6b7280',
  draft: '#d97706',
};

const INVITE_COLOR = {
  accepted: '#16a34a',
  pending: '#d97706',
  rejected: '#dc2626',
  invited: '#2563eb',
};

const ACTION_COLOR = {
  submitted: '#2563eb',
  approved: '#16a34a',
  completed: '#6b7280',
  revision_required: '#d97706',
  pending: '#9ca3af',
};

export default function CampaignManagerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [selected, setSelected] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMyCampaignStats(), getMyCampaigns()])
      .then(([s, c]) => {
        setStats(s.data?.data || {});
        setCampaigns(c.data?.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const openCampaign = async (campaign) => {
    setSelected(campaign);
    setLoadingApplicants(true);
    try {
      const res = await getMyCampaignApplicants(campaign.campaign_id);
      setApplicants(res.data?.data || []);
    } catch {
      setApplicants([]);
    } finally {
      setLoadingApplicants(false);
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const daysLeft = (end) => {
    if (!end) return null;
    const diff = Math.ceil((new Date(end) - new Date()) / 86400000);
    return diff;
  };

  if (loading) return <div style={styles.loading}>Loading dashboard…</div>;

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Campaign Manager Dashboard</h1>
          <p style={styles.subtitle}>Welcome back, {user?.first_name || 'Manager'}</p>
        </div>
      </div>

      {/* Stat cards */}
      <div style={styles.statsRow}>
        {[
          { label: 'Assigned Campaigns', value: stats?.total_campaigns ?? 0, color: '#734D20', icon: '📢' },
          { label: 'Active', value: stats?.active_campaigns ?? 0, color: '#2563eb', icon: '🟢' },
          { label: 'Completed', value: stats?.completed_campaigns ?? 0, color: '#16a34a', icon: '✅' },
          { label: 'Total Applicants', value: stats?.total_applicants ?? 0, color: '#7c3aed', icon: '👥' },
          { label: 'Accepted', value: stats?.total_accepted ?? 0, color: '#16a34a', icon: '✔️' },
          { label: 'Submitted', value: stats?.total_submitted ?? 0, color: '#2563eb', icon: '📝' },
          { label: 'Approved', value: stats?.total_approved ?? 0, color: '#d97706', icon: '⭐' },
          { label: 'Completed Work', value: stats?.total_completed ?? 0, color: '#6b7280', icon: '🏁' },
        ].map((s) => (
          <div key={s.label} style={styles.statCard}>
            <span style={styles.statIcon}>{s.icon}</span>
            <div style={{ ...styles.statValue, color: s.color }}>{s.value}</div>
            <div style={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Campaign list + detail panel */}
      <div style={styles.body}>
        {/* Left: campaign list */}
        <div style={styles.listPanel}>
          <h2 style={styles.sectionTitle}>My Campaigns ({campaigns.length})</h2>
          {campaigns.length === 0 && (
            <div style={styles.empty}>No campaigns assigned yet.</div>
          )}
          {campaigns.map((c) => {
            const days = daysLeft(c.end_date);
            const isSelected = selected?.campaign_id === c.campaign_id;
            return (
              <div
                key={c.campaign_id}
                style={{ ...styles.campaignCard, ...(isSelected ? styles.campaignCardActive : {}) }}
                onClick={() => openCampaign(c)}
              >
                <div style={styles.campaignTop}>
                  <span style={styles.campaignTitle}>{c.title}</span>
                  <span style={{ ...styles.statusBadge, background: (STATUS_COLOR[c.status] || '#9ca3af') + '22', color: STATUS_COLOR[c.status] || '#9ca3af' }}>
                    {c.status?.replace(/_/g, ' ')}
                  </span>
                </div>
                <div style={styles.campaignMeta}>
                  <span>Budget: <b>${c.budget || '—'}</b></span>
                  <span>Ends: {fmt(c.end_date)}</span>
                  {days !== null && days > 0 && <span style={{ color: days < 7 ? '#dc2626' : '#6b7280' }}>{days}d left</span>}
                  {days !== null && days <= 0 && <span style={{ color: '#dc2626' }}>Ended</span>}
                </div>
                <div style={styles.pipelineRow}>
                  {[
                    { label: 'Invited', val: c.count_invited, color: '#2563eb' },
                    { label: 'Accepted', val: c.count_accepted, color: '#16a34a' },
                    { label: 'Submitted', val: c.count_submitted, color: '#7c3aed' },
                    { label: 'Approved', val: c.count_approved, color: '#d97706' },
                    { label: 'Done', val: c.count_completed, color: '#6b7280' },
                  ].map((p) => (
                    <div key={p.label} style={styles.pipelineItem}>
                      <span style={{ ...styles.pipelineNum, color: p.color }}>{p.val ?? 0}</span>
                      <span style={styles.pipelineLabel}>{p.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: applicant detail */}
        <div style={styles.detailPanel}>
          {!selected ? (
            <div style={styles.empty}>Select a campaign to view creator pipeline</div>
          ) : (
            <>
              <h2 style={styles.sectionTitle}>{selected.title} — Creator Pipeline</h2>
              {loadingApplicants ? (
                <div style={styles.loading}>Loading…</div>
              ) : applicants.length === 0 ? (
                <div style={styles.empty}>No creators yet.</div>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {['Creator', 'Invite Status', 'Work Status', 'Applied On', 'Action Date'].map(h => (
                        <th key={h} style={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {applicants.map((a) => (
                      <tr key={a.invite_id} style={styles.tr}>
                        <td style={styles.td}>
                          <div style={styles.creatorName}>{a.first_name} {a.last_name}</div>
                          <div style={styles.creatorEmail}>{a.email}</div>
                        </td>
                        <td style={styles.td}>
                          <span style={{ ...styles.badge, background: (INVITE_COLOR[a.invite_status] || '#9ca3af') + '22', color: INVITE_COLOR[a.invite_status] || '#9ca3af' }}>
                            {a.invite_status}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <span style={{ ...styles.badge, background: (ACTION_COLOR[a.action_status] || '#9ca3af') + '22', color: ACTION_COLOR[a.action_status] || '#9ca3af' }}>
                            {a.action_status || 'pending'}
                          </span>
                        </td>
                        <td style={styles.td}>{fmt(a.invited_on)}</td>
                        <td style={styles.td}>{fmt(a.action_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { fontFamily: "'Segoe UI', Roboto, sans-serif", color: '#1f2937' },
  header: { marginBottom: '24px' },
  title: { fontSize: '24px', fontWeight: '700', color: '#734D20', margin: '0 0 4px' },
  subtitle: { color: '#6b7280', fontSize: '14px', margin: 0 },
  loading: { textAlign: 'center', padding: '48px', color: '#6b7280' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' },
  statCard: { background: '#fff', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', textAlign: 'center' },
  statIcon: { fontSize: '22px' },
  statValue: { fontSize: '26px', fontWeight: '800', margin: '6px 0 2px' },
  statLabel: { fontSize: '12px', color: '#6b7280', fontWeight: '500' },
  body: { display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px', alignItems: 'start' },
  listPanel: { background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', maxHeight: '80vh', overflowY: 'auto' },
  detailPanel: { background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', minHeight: '300px', overflowX: 'auto' },
  sectionTitle: { fontSize: '16px', fontWeight: '700', color: '#374151', margin: '0 0 16px' },
  empty: { textAlign: 'center', padding: '32px', color: '#9ca3af', fontSize: '14px' },
  campaignCard: { padding: '14px', borderRadius: '10px', border: '2px solid #f3f4f6', marginBottom: '10px', cursor: 'pointer', transition: 'all 0.15s ease' },
  campaignCardActive: { borderColor: '#734D20', background: '#fdf8f3' },
  campaignTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' },
  campaignTitle: { fontWeight: '600', fontSize: '14px', flex: 1 },
  statusBadge: { fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px', whiteSpace: 'nowrap' },
  campaignMeta: { fontSize: '12px', color: '#6b7280', display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' },
  pipelineRow: { display: 'flex', gap: '12px', borderTop: '1px solid #f3f4f6', paddingTop: '8px' },
  pipelineItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 },
  pipelineNum: { fontSize: '16px', fontWeight: '700' },
  pipelineLabel: { fontSize: '10px', color: '#9ca3af', marginTop: '2px' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  th: { textAlign: 'left', padding: '10px 12px', borderBottom: '2px solid #f3f4f6', fontSize: '12px', fontWeight: '600', color: '#6b7280', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #f9fafb' },
  td: { padding: '10px 12px', verticalAlign: 'middle' },
  badge: { fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px' },
  creatorName: { fontWeight: '600', fontSize: '13px' },
  creatorEmail: { fontSize: '11px', color: '#9ca3af' },
};

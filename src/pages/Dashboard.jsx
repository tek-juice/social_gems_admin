import { useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Link } from 'react-router-dom';
import { getStats, getUserGrowth, getUsersByRegion, getApplicationsPerCampaign } from '../api/admin';
import StatCard from '../components/StatCard';

function number(value) {
  return Number(value || 0).toLocaleString();
}

function getRegionCount(row) {
  return Number(row.count || row.total || row['count(*)'] || 0);
}

function downloadCsv(filename, rows) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((key) => `"${String(row[key] ?? '').replaceAll('"', '""')}"`).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [growth, setGrowth] = useState([]);
  const [regions, setRegions] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [search, setSearch] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchDashboard = () => {
    setLoading(true);
    const safe = (promise) => promise.catch(() => null);
    Promise.all([
      safe(getStats()),
      safe(getUserGrowth()),
      safe(getUsersByRegion()),
      safe(getApplicationsPerCampaign()),
    ]).then(([statsRes, growthRes, regionsRes, appsRes]) => {
      if (statsRes) setStats(statsRes.data?.data || statsRes.data);
      if (growthRes) setGrowth(Array.isArray(growthRes.data) ? growthRes.data : growthRes.data?.data || []);
      if (regionsRes) {
        const regionData = Array.isArray(regionsRes.data) ? regionsRes.data : regionsRes.data?.data || [];
        setRegions(regionData.slice(0, 10));
      }
      if (appsRes) {
        const appsData = Array.isArray(appsRes.data) ? appsRes.data : appsRes.data?.data || [];
        setApplications(appsData);
      }
      setLastUpdated(new Date());
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const onboardingRate = Number(stats?.onboardingRate ?? 0);
  const onboarded = Number(stats?.onboardedInfluencers ?? 0);
  const totalInfluencers = Number(stats?.totalInfluencers ?? 0);
  const brandUsers = Number(stats?.brandUsers ?? 0);
  const activeCampaigns = Number(stats?.activeCampaigns ?? 0);
  const totalCampaigns = Number(stats?.totalCampaigns ?? 0);

  const sparkline = useMemo(() => (
    growth.slice(-8).map((item) => ({ value: Number(item.users || item.count || 0) }))
  ), [growth]);

  const filteredApplications = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return applications;
    return applications.filter((row) => [
      row.title,
      row.brand_name,
      row.status,
      row.earning_type,
    ].some((value) => String(value || '').toLowerCase().includes(q)));
  }, [applications, search]);

  const campaignSummary = useMemo(() => {
    const totalApplications = applications.reduce((sum, row) => sum + Number(row.total_applications || 0), 0);
    const approved = applications.reduce((sum, row) => sum + Number(row.approved || 0), 0);
    const pending = applications.reduce((sum, row) => sum + Number(row.pending || 0), 0);
    return { totalApplications, approved, pending };
  }, [applications]);

  const recentActivity = useMemo(() => (
    applications.slice(0, 5).map((row) => ({
      title: row.title || 'Campaign',
      meta: `${row.brand_name || 'Unknown brand'} · ${number(row.total_applications)} applications`,
      status: row.status || 'active',
    }))
  ), [applications]);

  const notifications = [
    {
      title: `${number(totalInfluencers - onboarded)} influencers need onboarding`,
      tone: onboardingRate >= 70 ? 'good' : 'warn',
    },
    {
      title: `${number(campaignSummary.pending)} campaign applications pending`,
      tone: campaignSummary.pending > 0 ? 'warn' : 'good',
    },
    {
      title: `${number(activeCampaigns)} campaigns currently active`,
      tone: 'neutral',
    },
  ];

  if (loading) return <div style={styles.center}>Loading dashboard...</div>;

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <p style={styles.eyebrow}>Admin workspace</p>
          <h1 style={styles.heading}>Dashboard</h1>
          <p style={styles.subheading}>
            Track platform growth, campaign activity, and operational work from one place.
          </p>
        </div>
        <div style={styles.headerControls}>
          <input
            style={styles.search}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns..."
          />
          <select style={styles.select} value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          <button style={styles.secondaryBtn} onClick={fetchDashboard}>Refresh</button>
          <button style={styles.primaryBtn} onClick={() => downloadCsv('campaign-applications.csv', filteredApplications)}>
            Export
          </button>
        </div>
      </header>

      <div style={styles.metaBar}>
        <span>Viewing {dateRange === 'all' ? 'all available data' : dateRange}</span>
        <span>{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Not refreshed yet'}</span>
      </div>

      <section style={styles.cards}>
        <StatCard title="Influencers" value={number(totalInfluencers)} color="#734D20" marker="IN" trend="+12%" sparkline={sparkline} subtitle={`${number(onboarded)} onboarded`} />
        <StatCard title="Brands" value={number(brandUsers)} color="#b7791f" marker="BR" trend="+5%" sparkline={sparkline} subtitle="Business accounts" />
        <StatCard title="Active Campaigns" value={number(activeCampaigns)} color="#15803d" marker="AC" trend="+8%" sparkline={sparkline} subtitle={`${number(totalCampaigns)} total campaigns`} />
        <StatCard title="Applications" value={number(campaignSummary.totalApplications)} color="#2563eb" marker="AP" trend="+18%" sparkline={sparkline} subtitle={`${number(campaignSummary.pending)} pending review`} />
      </section>

      <section style={styles.grid}>
        <div style={{ ...styles.card, ...styles.largeCard }}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>User Growth</h2>
              <p style={styles.cardCopy}>New platform accounts over time.</p>
            </div>
            <span style={styles.cardChip}>{growth.length} points</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={growth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#edf2f7" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip />
              <Line type="monotone" dataKey="users" stroke="#734D20" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>Onboarding</h2>
              <p style={styles.cardCopy}>Influencers with connected social accounts.</p>
            </div>
            <strong style={styles.percent}>{onboardingRate}%</strong>
          </div>
          <div style={styles.ringWrap}>
            <div style={{
              ...styles.ring,
              background: `conic-gradient(#734D20 ${onboardingRate * 3.6}deg, #edf2f7 0deg)`,
            }}>
              <div style={styles.ringInner}>{onboardingRate}%</div>
            </div>
          </div>
          <div style={styles.progressBg}>
            <div style={{ ...styles.progressFill, width: `${Math.min(onboardingRate, 100)}%` }} />
          </div>
          <p style={styles.cardCopy}>{number(onboarded)} of {number(totalInfluencers)} influencers onboarded.</p>
        </div>

        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>Regions</h2>
              <p style={styles.cardCopy}>Top user locations.</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={regions}>
              <CartesianGrid strokeDasharray="3 3" stroke="#edf2f7" />
              <XAxis dataKey="iso_code" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip />
              <Bar dataKey={getRegionCount} radius={[6, 6, 0, 0]}>
                {regions.map((_, index) => (
                  <Cell key={index} fill={index % 2 === 0 ? '#734D20' : '#F9D769'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ ...styles.card, ...styles.largeCard }}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>Campaign Analytics</h2>
              <p style={styles.cardCopy}>Application volume and approval movement.</p>
            </div>
            <div style={styles.summaryStack}>
              <span>{number(campaignSummary.approved)} approved</span>
              <span>{number(campaignSummary.pending)} pending</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={filteredApplications.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#edf2f7" />
              <XAxis dataKey="title" tick={false} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip />
              <Area type="monotone" dataKey="total_applications" stroke="#734D20" fill="#734D20" fillOpacity={0.12} strokeWidth={2} />
              <Area type="monotone" dataKey="approved" stroke="#15803d" fill="#15803d" fillOpacity={0.08} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
          <CampaignTable rows={filteredApplications.slice(0, 6)} />
        </div>

        <aside style={styles.sideStack}>
          <Panel title="Quick Actions">
            <div style={styles.actionGrid}>
              <Link style={styles.actionLink} to="/business-verifications">Review businesses</Link>
              <Link style={styles.actionLink} to="/submissions">Review submissions</Link>
              <Link style={styles.actionLink} to="/finances">Process payouts</Link>
              <Link style={styles.actionLink} to="/campaigns">Audit campaigns</Link>
            </div>
          </Panel>

          <Panel title="Notifications">
            <div style={styles.feed}>
              {notifications.map((item) => (
                <div key={item.title} style={styles.feedItem}>
                  <span style={{ ...styles.dot, ...(item.tone === 'warn' ? styles.dotWarn : item.tone === 'good' ? styles.dotGood : {}) }} />
                  <span>{item.title}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Recent Activity">
            <div style={styles.feed}>
              {recentActivity.length === 0 ? (
                <p style={styles.empty}>No recent campaign activity.</p>
              ) : recentActivity.map((item) => (
                <div key={`${item.title}-${item.meta}`} style={styles.activityItem}>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.meta}</p>
                  </div>
                  <span style={styles.statusPill}>{item.status}</span>
                </div>
              ))}
            </div>
          </Panel>
        </aside>
      </section>
    </div>
  );
}

function CampaignTable({ rows }) {
  if (!rows.length) return <p style={styles.empty}>No campaign application data yet.</p>;
  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Campaign</th>
            <th style={styles.th}>Brand</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Applications</th>
            <th style={styles.th}>Approved</th>
            <th style={styles.th}>Pending</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.campaign_id || index}>
              <td style={styles.td}>{row.title || '-'}</td>
              <td style={styles.td}>{row.brand_name || '-'}</td>
              <td style={styles.td}><span style={styles.statusPill}>{row.status || '-'}</span></td>
              <td style={styles.tdStrong}>{number(row.total_applications)}</td>
              <td style={styles.td}>{number(row.approved)}</td>
              <td style={styles.td}>{number(row.pending)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div style={styles.card}>
      <h2 style={styles.cardTitle}>{title}</h2>
      {children}
    </div>
  );
}

const styles = {
  page: { width: '100%', minWidth: 0 },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '20px',
    marginBottom: '14px',
    flexWrap: 'wrap',
  },
  eyebrow: { margin: '0 0 6px', color: '#a16207', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.08em' },
  heading: { fontSize: '30px', fontWeight: '850', color: '#111827', margin: 0, letterSpacing: '0' },
  subheading: { color: '#64748b', margin: '8px 0 0', fontSize: '14px', maxWidth: '660px' },
  headerControls: { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' },
  search: { width: '240px', padding: '10px 12px', borderRadius: '9px', border: '1px solid #dbe3ec', background: '#fff', color: '#334155', outline: 'none' },
  select: { padding: '10px 12px', borderRadius: '9px', border: '1px solid #dbe3ec', background: '#fff', color: '#334155', outline: 'none' },
  primaryBtn: { padding: '10px 14px', border: 'none', borderRadius: '9px', background: '#734D20', color: '#fff', fontWeight: '800', cursor: 'pointer' },
  secondaryBtn: { padding: '10px 14px', border: '1px solid #dbe3ec', borderRadius: '9px', background: '#fff', color: '#334155', fontWeight: '800', cursor: 'pointer' },
  metaBar: { display: 'flex', justifyContent: 'space-between', gap: '12px', color: '#64748b', fontSize: '12px', marginBottom: '18px', flexWrap: 'wrap' },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))', gap: '16px', alignItems: 'start' },
  card: { background: '#fff', borderRadius: '10px', padding: '18px', border: '1px solid #e8edf3', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)', minWidth: 0 },
  largeCard: { minHeight: '360px' },
  cardHeader: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' },
  cardTitle: { margin: 0, color: '#111827', fontSize: '17px', fontWeight: '850', letterSpacing: '0' },
  cardCopy: { margin: '5px 0 0', color: '#64748b', fontSize: '13px', lineHeight: 1.45 },
  cardChip: { background: '#f8f1df', color: '#734D20', borderRadius: '999px', padding: '4px 10px', fontSize: '12px', fontWeight: '800' },
  percent: { color: '#734D20', fontSize: '26px' },
  ringWrap: { display: 'flex', justifyContent: 'center', padding: '10px 0 18px' },
  ring: { width: '156px', height: '156px', borderRadius: '50%', display: 'grid', placeItems: 'center' },
  ringInner: { width: '112px', height: '112px', borderRadius: '50%', background: '#fff', display: 'grid', placeItems: 'center', fontWeight: '900', color: '#734D20', fontSize: '24px' },
  progressBg: { height: '10px', background: '#edf2f7', borderRadius: '999px', overflow: 'hidden', marginBottom: '10px' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #734D20, #F9D769)', borderRadius: '999px' },
  summaryStack: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', color: '#64748b', fontSize: '12px', fontWeight: '800' },
  tableWrap: { overflowX: 'auto', marginTop: '12px', border: '1px solid #eef2f6', borderRadius: '9px' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff' },
  th: { textAlign: 'left', padding: '11px 12px', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', background: '#f8fafc', borderBottom: '1px solid #e8edf3' },
  td: { padding: '11px 12px', fontSize: '13px', color: '#334155', borderBottom: '1px solid #f1f5f9' },
  tdStrong: { padding: '11px 12px', fontSize: '13px', color: '#734D20', borderBottom: '1px solid #f1f5f9', fontWeight: '900' },
  statusPill: { display: 'inline-flex', borderRadius: '999px', padding: '3px 8px', background: '#f1f5f9', color: '#475569', fontSize: '11px', fontWeight: '800', textTransform: 'capitalize' },
  sideStack: { display: 'grid', gap: '16px' },
  actionGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '14px' },
  actionLink: { textDecoration: 'none', color: '#734D20', background: '#fffaf0', border: '1px solid #f4dfb0', borderRadius: '9px', padding: '12px', fontSize: '13px', fontWeight: '850' },
  feed: { display: 'grid', gap: '10px', marginTop: '14px' },
  feedItem: { display: 'flex', alignItems: 'flex-start', gap: '9px', color: '#334155', fontSize: '13px', lineHeight: 1.45 },
  dot: { width: '9px', height: '9px', borderRadius: '50%', background: '#94a3b8', marginTop: '5px', flex: '0 0 auto' },
  dotWarn: { background: '#d97706' },
  dotGood: { background: '#15803d' },
  activityItem: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', color: '#334155', fontSize: '13px' },
  empty: { margin: 0, color: '#94a3b8', fontSize: '13px', padding: '18px 0' },
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: '#64748b', fontSize: '16px' },
};

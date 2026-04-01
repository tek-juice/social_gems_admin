import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { getStats, getUserGrowth, getUsersByRegion, getApplicationsPerCampaign } from '../api/admin';
import StatCard from '../components/StatCard';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [growth, setGrowth] = useState([]);
  const [regions, setRegions] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getStats(), getUserGrowth(), getUsersByRegion(), getApplicationsPerCampaign()])
      .then(([statsRes, growthRes, regionsRes, appsRes]) => {
        setStats(statsRes.data?.data || statsRes.data);
        setGrowth(Array.isArray(growthRes.data) ? growthRes.data : growthRes.data?.data || []);
        const regionData = Array.isArray(regionsRes.data) ? regionsRes.data : regionsRes.data?.data || [];
        setRegions(regionData.slice(0, 10));
        const appsData = Array.isArray(appsRes.data) ? appsRes.data : appsRes.data?.data || [];
        setApplications(appsData);
      })
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={styles.center}>Loading...</div>;
  if (error) return <div style={styles.center}>{error}</div>;

  const onboardingRate = stats?.onboardingRate ?? 0;
  const onboarded = stats?.onboardedInfluencers ?? 0;
  const totalInfluencers = stats?.totalInfluencers ?? 0;

  return (
    <div>
      <h2 style={styles.heading}>Overview</h2>

      {/* Stat Cards */}
      <div style={styles.cards}>
        <StatCard title="Total Influencers" value={totalInfluencers} color="#734D20" />
        <StatCard title="Total Brands" value={stats?.brandUsers} color="#F9D769" subtitle="Business accounts" />
        <StatCard title="Active Campaigns" value={stats?.activeCampaigns} color="#4CAF50" />
        <StatCard title="Total Campaigns" value={stats?.totalCampaigns} color="#2196F3" />
      </div>

      {/* Onboarding Completion */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Onboarding Completion Rate</h3>
        <p style={styles.subtext}>Influencers with at least one social account connected</p>
        <div style={styles.onboardingRow}>
          <div style={styles.onboardingStats}>
            <div style={styles.onboardingBig}>{onboardingRate}%</div>
            <div style={styles.onboardingSub}>{onboarded} of {totalInfluencers} influencers onboarded</div>
          </div>
          <div style={styles.progressWrap}>
            <div style={styles.progressBg}>
              <div style={{ ...styles.progressFill, width: `${onboardingRate}%` }} />
            </div>
            <div style={styles.progressLabels}>
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* User Growth Chart */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>User Signups Over Time</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={growth}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="users" stroke="#734D20" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Users by Region */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Users by Region (Top 10)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={regions}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="iso_code" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="count(*)" fill="#734D20" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Applications per Campaign */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Creator Applications per Campaign</h3>
        {applications.length === 0 ? (
          <p style={styles.empty}>No campaign application data yet.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>Campaign</th>
                <th style={styles.th}>Brand</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Total Applications</th>
                <th style={styles.th}>Approved</th>
                <th style={styles.th}>Pending</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((row, i) => (
                <tr key={row.campaign_id || i} style={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                  <td style={styles.td}>{row.title || '—'}</td>
                  <td style={styles.td}>{row.brand_name || '—'}</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, ...(EARNING_TYPE_COLORS[row.earning_type] || EARNING_TYPE_COLORS.paid) }}>
                      {row.earning_type === 'barter' ? 'Free Collab' : row.earning_type || 'paid'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{ ...styles.badge, ...STATUS_COLORS[row.status] }}>
                      {row.status}
                    </span>
                  </td>
                  <td style={{ ...styles.td, fontWeight: '700', color: '#734D20' }}>{row.total_applications}</td>
                  <td style={{ ...styles.td, color: '#2e7d32' }}>{row.approved}</td>
                  <td style={{ ...styles.td, color: '#e65100' }}>{row.pending}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const STATUS_COLORS = {
  active: { background: '#e8f5e9', color: '#2e7d32' },
  completed: { background: '#e3f2fd', color: '#1565c0' },
  closed: { background: '#fdecea', color: '#c62828' },
};

const EARNING_TYPE_COLORS = {
  paid: { background: '#fff8e1', color: '#f57f17' },
  affiliate: { background: '#ede7f6', color: '#512da8' },
  barter: { background: '#e0f2f1', color: '#00695c' },
};

const styles = {
  heading: { fontSize: '22px', fontWeight: '800', color: '#333', marginBottom: '20px' },
  cards: { display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '32px' },
  section: { background: '#fff', borderRadius: '12px', padding: '20px 24px', marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
  sectionTitle: { fontSize: '15px', fontWeight: '700', color: '#333', marginBottom: '4px', marginTop: 0 },
  subtext: { fontSize: '12px', color: '#aaa', marginTop: 0, marginBottom: '16px' },
  onboardingRow: { display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' },
  onboardingStats: { minWidth: '120px' },
  onboardingBig: { fontSize: '48px', fontWeight: '800', color: '#734D20', lineHeight: 1 },
  onboardingSub: { fontSize: '13px', color: '#888', marginTop: '6px' },
  progressWrap: { flex: 1, minWidth: '200px' },
  progressBg: { height: '16px', background: '#f0f0f0', borderRadius: '8px', overflow: 'hidden' },
  progressFill: { height: '100%', background: 'linear-gradient(90deg, #734D20, #F9D769)', borderRadius: '8px', transition: 'width 0.5s ease' },
  progressLabels: { display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#bbb', marginTop: '4px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#f9f9f9' },
  th: { padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' },
  td: { padding: '10px 14px', fontSize: '14px', color: '#333', borderTop: '1px solid #f0f0f0' },
  rowEven: { background: '#fff' },
  rowOdd: { background: '#fafafa' },
  badge: { padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600' },
  empty: { color: '#aaa', fontSize: '14px', textAlign: 'center', padding: '20px 0' },
  center: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#888' },
};

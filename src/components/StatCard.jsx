import { Area, AreaChart, ResponsiveContainer } from 'recharts';

export default function StatCard({
  title,
  value,
  subtitle,
  color = '#734D20',
  marker,
  trend,
  sparkline = [],
}) {
  const positive = !String(trend || '').trim().startsWith('-');

  return (
    <div style={{ ...styles.card, '--accent': color }}>
      <div style={styles.topRow}>
        <span style={styles.marker}>{marker || title?.slice(0, 2)?.toUpperCase()}</span>
        {trend && (
          <span style={{ ...styles.trend, color: positive ? '#15803d' : '#b91c1c', background: positive ? '#dcfce7' : '#fee2e2' }}>
            {trend}
          </span>
        )}
      </div>
      <p style={styles.title}>{title}</p>
      <div style={styles.metricRow}>
        <p style={{ ...styles.value, color }}>{value ?? '-'}</p>
        {sparkline.length > 1 && (
          <div style={styles.sparkline}>
            <ResponsiveContainer width="100%" height={34}>
              <AreaChart data={sparkline}>
                <Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.12} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
    </div>
  );
}

const styles = {
  card: {
    background: '#fff',
    borderRadius: '10px',
    padding: '18px',
    border: '1px solid #e8edf3',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)',
    minWidth: 0,
    transition: 'transform 0.16s ease, box-shadow 0.16s ease',
  },
  topRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', gap: '10px' },
  marker: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '34px',
    height: '30px',
    borderRadius: '8px',
    background: 'color-mix(in srgb, var(--accent), white 88%)',
    color: 'var(--accent)',
    fontSize: '11px',
    fontWeight: '900',
    letterSpacing: '0',
  },
  trend: { borderRadius: '999px', padding: '3px 8px', fontSize: '11px', fontWeight: '800' },
  title: { fontSize: '12px', color: '#64748b', margin: '0 0 8px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.04em' },
  metricRow: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px' },
  value: { fontSize: '34px', fontWeight: '850', margin: 0, lineHeight: 1 },
  subtitle: { fontSize: '12px', color: '#64748b', margin: '10px 0 0', lineHeight: 1.35 },
  sparkline: { width: '86px', height: '34px', flex: '0 0 auto' },
};

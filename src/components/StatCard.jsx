export default function StatCard({ title, value, subtitle, color = '#734D20' }) {
  return (
    <div style={{ ...styles.card, borderTop: `4px solid ${color}` }}>
      <p style={styles.title}>{title}</p>
      <p style={{ ...styles.value, color }}>{value ?? '—'}</p>
      {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
    </div>
  );
}

const styles = {
  card: { background: '#fff', borderRadius: '12px', padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', flex: 1, minWidth: '160px' },
  title: { fontSize: '13px', color: '#888', margin: '0 0 8px 0', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' },
  value: { fontSize: '32px', fontWeight: '800', margin: '0 0 4px 0' },
  subtitle: { fontSize: '12px', color: '#aaa', margin: 0 },
};

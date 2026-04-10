export default function StatCard({ title, value, subtitle, color = '#734D20', icon }) {
  return (
    <div style={{ ...styles.card, borderLeft: `4px solid ${color}` }}>
      <div style={styles.cardHeader}>
        <div>
          <p style={styles.title}>{title}</p>
          <p style={{ ...styles.value, color }}>{value ?? '—'}</p>
          {subtitle && <p style={styles.subtitle}>{subtitle}</p>}
        </div>
        {icon && <div style={{ ...styles.icon, backgroundColor: `${color}15` }}>{icon}</div>}
      </div>
    </div>
  );
}

const styles = {
  card: { 
    background: '#fff', 
    borderRadius: '16px', 
    padding: '24px', 
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)', 
    flex: 1, 
    minWidth: '200px',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  title: { 
    fontSize: '13px', 
    color: '#64748b', 
    margin: '0 0 8px 0', 
    fontWeight: '600', 
    textTransform: 'uppercase', 
    letterSpacing: '0.5px' 
  },
  value: { 
    fontSize: '36px', 
    fontWeight: '800', 
    margin: '0 0 4px 0',
    lineHeight: 1
  },
  subtitle: { 
    fontSize: '12px', 
    color: '#94a3b8', 
    margin: 0 
  },
  icon: {
    padding: '12px',
    borderRadius: '12px',
    fontSize: '24px'
  }
};

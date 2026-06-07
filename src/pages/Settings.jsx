import { useEffect, useMemo, useState } from 'react';
import { getAdminSettings, updateAdminSetting } from '../api/admin';

const CREATOR_SETTING_KEYS = ['creator_plus_max_kes', 'creator_pro_min_kes'];

export default function Settings() {
  const [settings, setSettings] = useState([]);
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const creatorSettings = useMemo(
    () => settings.filter((item) => CREATOR_SETTING_KEYS.includes(item.setting_key)),
    [settings],
  );

  async function loadSettings() {
    try {
      setLoading(true);
      setError('');
      const response = await getAdminSettings();
      const rows = response.data?.data || [];
      setSettings(rows);
      setValues(Object.fromEntries(rows.map((item) => [item.setting_key, item.setting_value])));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  async function saveSetting(key) {
    const nextValue = values[key];
    if (nextValue === '' || Number(nextValue) < 0 || Number.isNaN(Number(nextValue))) {
      setError('Enter a valid non-negative KES amount.');
      return;
    }

    try {
      setSavingKey(key);
      setError('');
      setMessage('');
      await updateAdminSetting(key, nextValue);
      setMessage('Setting updated');
      await loadSettings();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update setting');
    } finally {
      setSavingKey('');
    }
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <p style={styles.eyebrow}>Platform Controls</p>
          <h1 style={styles.title}>Settings</h1>
          <p style={styles.subtitle}>
            Configure how creator opportunities are labelled and gated in the app.
          </p>
        </div>
        <button type="button" onClick={loadSettings} style={styles.secondaryButton}>
          Refresh
        </button>
      </header>

      {(message || error) && (
        <div style={{ ...styles.notice, ...(error ? styles.error : styles.success) }}>
          {error || message}
        </div>
      )}

      <section style={styles.card}>
        <div style={styles.cardHeader}>
          <div>
            <h2 style={styles.cardTitle}>Creator Subscription Thresholds</h2>
            <p style={styles.cardText}>
              Affiliate opportunities are always Creator Plus. Paid opportunities at or above the
              Pro minimum require Creator Pro.
            </p>
          </div>
        </div>

        {loading ? (
          <div style={styles.loading}>Loading settings...</div>
        ) : (
          <div style={styles.grid}>
            {creatorSettings.map((setting) => (
              <div key={setting.setting_key} style={styles.settingRow}>
                <label style={styles.label} htmlFor={setting.setting_key}>
                  {setting.setting_key === 'creator_plus_max_kes'
                    ? 'Creator Plus default max'
                    : 'Creator Pro minimum'}
                </label>
                <p style={styles.description}>{setting.description}</p>
                <div style={styles.inputRow}>
                  <span style={styles.prefix}>KES</span>
                  <input
                    id={setting.setting_key}
                    type="number"
                    min="0"
                    value={values[setting.setting_key] ?? ''}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        [setting.setting_key]: event.target.value,
                      }))
                    }
                    style={styles.input}
                  />
                  <button
                    type="button"
                    disabled={savingKey === setting.setting_key}
                    onClick={() => saveSetting(setting.setting_key)}
                    style={styles.primaryButton}
                  >
                    {savingKey === setting.setting_key ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

const styles = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    alignItems: 'flex-start',
  },
  eyebrow: {
    margin: '0 0 6px',
    color: '#8a5a1f',
    fontSize: '12px',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  title: {
    margin: 0,
    color: '#241a10',
    fontSize: '30px',
    letterSpacing: '0',
  },
  subtitle: {
    margin: '8px 0 0',
    color: '#64748b',
    fontSize: '14px',
  },
  card: {
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    padding: '20px',
    boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '18px',
  },
  cardTitle: {
    margin: 0,
    color: '#241a10',
    fontSize: '18px',
  },
  cardText: {
    margin: '6px 0 0',
    color: '#64748b',
    fontSize: '13px',
    lineHeight: 1.5,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
  },
  settingRow: {
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '16px',
    background: '#f8fafc',
  },
  label: {
    display: 'block',
    color: '#241a10',
    fontWeight: '800',
    fontSize: '14px',
    marginBottom: '6px',
  },
  description: {
    minHeight: '38px',
    margin: '0 0 12px',
    color: '#64748b',
    fontSize: '12px',
    lineHeight: 1.45,
  },
  inputRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  prefix: {
    color: '#8a5a1f',
    fontSize: '12px',
    fontWeight: '800',
  },
  input: {
    minWidth: 0,
    flex: 1,
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    padding: '10px 12px',
    fontSize: '14px',
    color: '#1e293b',
    outline: 'none',
  },
  primaryButton: {
    border: 0,
    background: '#6f481d',
    color: '#fff',
    borderRadius: '10px',
    padding: '10px 14px',
    fontWeight: '800',
    cursor: 'pointer',
  },
  secondaryButton: {
    border: '1px solid #d6b75c',
    background: '#fff8df',
    color: '#6f481d',
    borderRadius: '10px',
    padding: '10px 14px',
    fontWeight: '800',
    cursor: 'pointer',
  },
  notice: {
    borderRadius: '10px',
    padding: '11px 14px',
    fontSize: '13px',
    fontWeight: '700',
  },
  success: {
    color: '#047857',
    background: '#ecfdf5',
    border: '1px solid #a7f3d0',
  },
  error: {
    color: '#b91c1c',
    background: '#fef2f2',
    border: '1px solid #fecaca',
  },
  loading: {
    color: '#64748b',
    fontSize: '14px',
    padding: '16px 0',
  },
};

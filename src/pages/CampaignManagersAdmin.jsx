import { useState, useEffect } from 'react';
import {
  getCampaignManagers, getAllCampaigns,
  createCampaignManager, updateCampaignManager,
  assignCampaign, unassignCampaign,
  deactivateAdminUser, reactivateAdminUser,
} from '../api/admin';
import client from '../api/client';

const TABS = ['List', 'Assignments'];

export default function CampaignManagersAdmin() {
  const [tab, setTab] = useState('List');
  const [managers, setManagers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({ first_name: '', last_name: '', email: '', country: '' });
  const [createFeedback, setCreateFeedback] = useState(null);

  // Edit form
  const [editing, setEditing] = useState(null); // manager object being edited
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [editFeedback, setEditFeedback] = useState(null);

  // Assignments tab
  const [selected, setSelected] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [toAssign, setToAssign] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignFeedback, setAssignFeedback] = useState(null);

  const loadManagers = () =>
    getCampaignManagers().then(m => setManagers(m.data?.data || []));

  useEffect(() => {
    Promise.all([getCampaignManagers(), getAllCampaigns()])
      .then(([m, c]) => {
        setManagers(m.data?.data || []);
        setCampaigns((c.data?.data || []).filter(x => x.status !== 'draft'));
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Create ────────────────────────────────────────────────────────────────
  const doCreate = async (e) => {
    e.preventDefault();
    setCreating(true); setCreateFeedback(null);
    try {
      const res = await createCampaignManager(createForm);
      if (res.data?.status === 200) {
        setCreateFeedback({ type: 'success', msg: 'Manager created — login credentials sent to their email.' });
        setCreateForm({ first_name: '', last_name: '', email: '', country: '' });
        await loadManagers();
      } else {
        setCreateFeedback({ type: 'error', msg: res.data?.message || 'Failed to create.' });
      }
    } catch (e) {
      setCreateFeedback({ type: 'error', msg: e?.response?.data?.message || 'Failed to create.' });
    } finally { setCreating(false); }
  };

  // ── Edit ─────────────────────────────────────────────────────────────────
  const openEdit = (m) => {
    setEditing(m);
    setEditForm({ first_name: m.first_name, last_name: m.last_name, country: m.country || '' });
    setEditFeedback(null);
  };

  const doSave = async (e) => {
    e.preventDefault();
    setSaving(true); setEditFeedback(null);
    try {
      const res = await updateCampaignManager(editing.user_id, editForm);
      if (res.data?.status === 200) {
        setEditFeedback({ type: 'success', msg: 'Saved.' });
        await loadManagers();
        setEditing(m => ({ ...m, ...editForm }));
      } else {
        setEditFeedback({ type: 'error', msg: res.data?.message || 'Failed.' });
      }
    } catch { setEditFeedback({ type: 'error', msg: 'Failed to save.' }); }
    finally { setSaving(false); }
  };

  const toggleStatus = async (m) => {
    try {
      if (m.status === 'active') {
        await deactivateAdminUser(m.user_id);
      } else {
        await reactivateAdminUser(m.user_id);
      }
      await loadManagers();
      if (editing?.user_id === m.user_id) {
        setEditing(prev => ({ ...prev, status: prev.status === 'active' ? 'inactive' : 'active' }));
      }
    } catch { /* silent */ }
  };

  // ── Assignments ───────────────────────────────────────────────────────────
  const selectManager = async (m) => {
    setSelected(m); setAssignFeedback(null);
    try {
      const res = await client.get(`/admin/campaignManagers/${m.user_id}/assignments`);
      setAssignments(res.data?.data || []);
    } catch { setAssignments([]); }
  };

  const doAssign = async () => {
    if (!selected || !toAssign) return;
    setAssigning(true); setAssignFeedback(null);
    try {
      await assignCampaign(selected.user_id, toAssign);
      setAssignFeedback({ type: 'success', msg: 'Assigned.' });
      setToAssign('');
      await selectManager(selected);
    } catch (e) {
      setAssignFeedback({ type: 'error', msg: e?.response?.data?.message || 'Failed.' });
    } finally { setAssigning(false); }
  };

  const doUnassign = async (campaignId) => {
    try {
      await unassignCampaign(selected.user_id, campaignId);
      await selectManager(selected);
    } catch { /* silent */ }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  if (loading) return <div style={styles.loading}>Loading…</div>;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Campaign Managers</h1>
          <p style={styles.subtitle}>Create, edit, and assign campaigns to your campaign managers</p>
        </div>
        <button style={styles.createToggleBtn} onClick={() => { setShowCreate(v => !v); setCreateFeedback(null); }}>
          {showCreate ? '✕ Cancel' : '+ New Manager'}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <form onSubmit={doCreate} style={styles.createForm}>
          <div style={styles.formTitle}>Create Campaign Manager</div>
          <div style={styles.formRow}>
            {[
              { f: 'first_name', label: 'First Name', type: 'text', req: true },
              { f: 'last_name',  label: 'Last Name',  type: 'text', req: true },
              { f: 'email',      label: 'Email',       type: 'email', req: true },
              { f: 'country',    label: 'Country',     type: 'text', req: false },
            ].map(({ f, label, type, req }) => (
              <input
                key={f}
                style={styles.input}
                type={type}
                placeholder={label}
                value={createForm[f]}
                onChange={e => setCreateForm(p => ({ ...p, [f]: e.target.value }))}
                required={req}
              />
            ))}
            <button type="submit" style={{ ...styles.btn, alignSelf: 'flex-end' }} disabled={creating}>
              {creating ? 'Creating…' : 'Create & Send Credentials'}
            </button>
          </div>
          {createFeedback && <Feedback f={createFeedback} />}
        </form>
      )}

      {/* Tabs */}
      <div style={styles.tabs}>
        {TABS.map(t => (
          <button key={t} style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {/* ── LIST TAB ── */}
      {tab === 'List' && (
        <div style={styles.card}>
          {managers.length === 0 ? (
            <div style={styles.empty}>No campaign managers yet. Click <b>+ New Manager</b> to create one.</div>
          ) : (
            <>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {['Name', 'Email', 'Country', 'Status', 'Created', 'Actions'].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {managers.map(m => (
                    <tr key={m.user_id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={styles.nameCell}>
                          <div style={styles.avatar}>{m.first_name?.[0]}{m.last_name?.[0]}</div>
                          <div>
                            <div style={styles.managerName}>{m.first_name} {m.last_name}</div>
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>{m.email}</td>
                      <td style={styles.td}>{m.country || '—'}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.statusBadge, background: m.status === 'active' ? '#dcfce7' : '#fee2e2', color: m.status === 'active' ? '#16a34a' : '#dc2626' }}>
                          {m.status}
                        </span>
                      </td>
                      <td style={styles.td}>{fmt(m.created_at)}</td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button style={styles.editBtn} onClick={() => openEdit(m)}>Edit</button>
                          <button
                            style={{ ...styles.statusBtn, background: m.status === 'active' ? '#fee2e2' : '#dcfce7', color: m.status === 'active' ? '#dc2626' : '#16a34a' }}
                            onClick={() => toggleStatus(m)}
                          >
                            {m.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Edit drawer */}
              {editing && (
                <div style={styles.editDrawer}>
                  <div style={styles.editDrawerHeader}>
                    <span style={styles.formTitle}>Edit — {editing.first_name} {editing.last_name}</span>
                    <button style={styles.closeBtn} onClick={() => setEditing(null)}>✕</button>
                  </div>
                  <form onSubmit={doSave} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      { f: 'first_name', label: 'First Name' },
                      { f: 'last_name',  label: 'Last Name' },
                      { f: 'country',    label: 'Country' },
                    ].map(({ f, label }) => (
                      <label key={f} style={styles.fieldLabel}>
                        {label}
                        <input
                          style={styles.input}
                          value={editForm[f] || ''}
                          onChange={e => setEditForm(p => ({ ...p, [f]: e.target.value }))}
                        />
                      </label>
                    ))}
                    {editFeedback && <Feedback f={editFeedback} />}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button type="submit" style={styles.btn} disabled={saving}>
                        {saving ? 'Saving…' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        style={{ ...styles.statusBtn, background: editing.status === 'active' ? '#fee2e2' : '#dcfce7', color: editing.status === 'active' ? '#dc2626' : '#16a34a' }}
                        onClick={() => toggleStatus(editing)}
                      >
                        {editing.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── ASSIGNMENTS TAB ── */}
      {tab === 'Assignments' && (
        <div style={styles.assignBody}>
          {/* Manager picker */}
          <div style={styles.listPanel}>
            <h2 style={styles.sectionTitle}>Select Manager</h2>
            {managers.map(m => (
              <div
                key={m.user_id}
                style={{ ...styles.managerCard, ...(selected?.user_id === m.user_id ? styles.managerCardActive : {}) }}
                onClick={() => selectManager(m)}
              >
                <div style={styles.avatar}>{m.first_name?.[0]}{m.last_name?.[0]}</div>
                <div style={styles.managerInfo}>
                  <div style={styles.managerName}>{m.first_name} {m.last_name}</div>
                  <div style={styles.managerEmail}>{m.email}</div>
                </div>
                <span style={{ ...styles.statusDot, background: m.status === 'active' ? '#16a34a' : '#dc2626' }} />
              </div>
            ))}
          </div>

          {/* Assignment panel */}
          <div style={styles.detailPanel}>
            {!selected ? (
              <div style={styles.empty}>Select a manager to manage their assignments</div>
            ) : (
              <>
                <h2 style={styles.sectionTitle}>{selected.first_name} {selected.last_name} — Assigned Campaigns</h2>
                <div style={styles.assignRow}>
                  <select style={styles.select} value={toAssign} onChange={e => setToAssign(e.target.value)}>
                    <option value="">Select campaign to assign…</option>
                    {campaigns.map(c => (
                      <option key={c.campaign_id} value={c.campaign_id}>{c.title} ({c.status})</option>
                    ))}
                  </select>
                  <button style={{ ...styles.btn, opacity: assigning || !toAssign ? 0.6 : 1 }} onClick={doAssign} disabled={assigning || !toAssign}>
                    {assigning ? 'Assigning…' : 'Assign'}
                  </button>
                </div>
                {assignFeedback && <Feedback f={assignFeedback} />}

                {assignments.length === 0 ? (
                  <div style={{ ...styles.empty, marginTop: '24px' }}>No campaigns assigned yet.</div>
                ) : (
                  <table style={{ ...styles.table, marginTop: '16px' }}>
                    <thead>
                      <tr>
                        {['Campaign', 'Status', 'Budget', 'End Date', 'Invited', 'Accepted', 'Submitted', ''].map(h => (
                          <th key={h} style={styles.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map(a => (
                        <tr key={a.campaign_id} style={styles.tr}>
                          <td style={styles.td}><div style={styles.managerName}>{a.title}</div></td>
                          <td style={styles.td}><span style={{ ...styles.statusBadge, background: '#f3f4f6', color: '#374151' }}>{a.status?.replace(/_/g, ' ')}</span></td>
                          <td style={styles.td}>${a.budget || '—'}</td>
                          <td style={styles.td}>{fmt(a.end_date)}</td>
                          <td style={styles.td}>{a.count_invited ?? 0}</td>
                          <td style={styles.td}>{a.count_accepted ?? 0}</td>
                          <td style={styles.td}>{a.count_submitted ?? 0}</td>
                          <td style={styles.td}>
                            <button style={styles.removeBtn} onClick={() => doUnassign(a.campaign_id)}>Remove</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Feedback({ f }) {
  return (
    <div style={{ padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '500', background: f.type === 'success' ? '#dcfce7' : '#fee2e2', color: f.type === 'success' ? '#16a34a' : '#dc2626' }}>
      {f.msg}
    </div>
  );
}

const styles = {
  page: { fontFamily: "'Segoe UI', Roboto, sans-serif", color: '#1f2937' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
  title: { fontSize: '24px', fontWeight: '700', color: '#734D20', margin: '0 0 4px' },
  subtitle: { color: '#6b7280', fontSize: '14px', margin: 0 },
  loading: { textAlign: 'center', padding: '48px', color: '#6b7280' },
  empty: { textAlign: 'center', padding: '32px', color: '#9ca3af', fontSize: '14px', lineHeight: '1.6' },

  createToggleBtn: { padding: '10px 18px', background: '#734D20', color: '#F9D769', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', flexShrink: 0 },
  createForm: { background: '#fdf8f3', border: '1px solid #e5d5c5', borderRadius: '12px', padding: '20px', marginBottom: '20px' },
  formTitle: { fontWeight: '700', fontSize: '15px', color: '#734D20', marginBottom: '12px', display: 'block' },
  formRow: { display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-start' },
  input: { padding: '9px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none', background: '#fff', minWidth: '160px', flex: 1 },
  fieldLabel: { display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' },
  btn: { padding: '10px 20px', background: '#734D20', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' },

  tabs: { display: 'flex', gap: '4px', marginBottom: '16px', background: '#f3f4f6', padding: '4px', borderRadius: '10px', width: 'fit-content' },
  tab: { padding: '8px 20px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', background: 'transparent', color: '#6b7280', transition: 'all 0.15s' },
  tabActive: { background: '#fff', color: '#734D20', fontWeight: '700', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },

  card: { background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', position: 'relative' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '14px' },
  th: { textAlign: 'left', padding: '10px 12px', borderBottom: '2px solid #f3f4f6', fontSize: '12px', fontWeight: '600', color: '#6b7280', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #f9fafb' },
  td: { padding: '10px 12px', verticalAlign: 'middle' },
  nameCell: { display: 'flex', alignItems: 'center', gap: '10px' },
  avatar: { width: '36px', height: '36px', borderRadius: '50%', background: '#734D20', color: '#F9D769', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px', flexShrink: 0 },
  managerName: { fontWeight: '600', fontSize: '14px' },
  managerEmail: { fontSize: '12px', color: '#6b7280' },
  statusBadge: { fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px' },
  editBtn: { padding: '4px 12px', background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
  statusBtn: { padding: '4px 12px', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },

  editDrawer: { position: 'absolute', top: 0, right: 0, width: '320px', height: '100%', background: '#fff', borderLeft: '1px solid #e5e7eb', borderRadius: '0 12px 12px 0', padding: '24px', boxShadow: '-4px 0 16px rgba(0,0,0,0.06)', boxSizing: 'border-box' },
  editDrawerHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  closeBtn: { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6b7280', padding: '4px' },

  assignBody: { display: 'grid', gridTemplateColumns: '280px 1fr', gap: '20px', alignItems: 'start' },
  listPanel: { background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' },
  detailPanel: { background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflowX: 'auto' },
  sectionTitle: { fontSize: '16px', fontWeight: '700', color: '#374151', margin: '0 0 16px' },
  managerCard: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '10px', border: '2px solid #f3f4f6', marginBottom: '8px', cursor: 'pointer', transition: 'all 0.15s' },
  managerCardActive: { borderColor: '#734D20', background: '#fdf8f3' },
  managerInfo: { flex: 1, minWidth: 0 },
  statusDot: { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 },
  assignRow: { display: 'flex', gap: '10px', alignItems: 'center' },
  select: { flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none' },
  removeBtn: { padding: '4px 12px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' },
};

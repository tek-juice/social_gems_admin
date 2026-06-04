import { useEffect, useState } from 'react';
import { getMakerCheckerRequests, actionMakerCheckerRequest, executeMakerCheckerRequest } from '../api/admin';

function parseRequestData(value) {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function fullName(...parts) {
  return parts.filter(Boolean).join(' ').trim();
}

function getTargetInfo(request) {
  const data = parseRequestData(request.request_data);
  const userInfo = data.userInfo || {};
  const name = request.target_name
    || userInfo.business_name
    || userInfo.name
    || fullName(userInfo.first_name, userInfo.last_name)
    || userInfo.username
    || 'Unknown user';

  return {
    id: request.target_id || request.primary_key_value || data.influencer_id || data.userId || '',
    name,
    email: request.target_email || userInfo.email || '',
    type: request.target_user_type || userInfo.user_type || '',
    reason: data.reason || request.details?.reason || '',
  };
}

function getRequesterInfo(request) {
  const name = request.requested_by
    || fullName(request.requested_by_first_name, request.requested_by_last_name)
    || request.requested_by_email
    || request.maker_user_id
    || '';

  return {
    name,
    email: request.requested_by_email || '',
    id: request.maker_user_id || '',
  };
}

export default function PendingDeletions() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  const fetchRequests = () => {
    setLoading(true);
    getMakerCheckerRequests()
      .then((res) => {
        const data = res.data?.data || res.data || [];
        const deleteRequests = data.filter((r) =>
          r.operation_type === 'DELETE' && r.table_name === 'users'
        );
        setRequests(deleteRequests);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (requestId, action) => {
    setProcessing(requestId);
    try {
      await actionMakerCheckerRequest(requestId, action);
      alert(`Request ${action} successfully`);
      fetchRequests();
    } catch (err) {
      alert('Action failed: ' + (err?.response?.data?.message || err.message));
    } finally {
      setProcessing(null);
    }
  };

  const handleExecute = async (requestId) => {
    setProcessing(requestId);
    try {
      await executeMakerCheckerRequest(requestId);
      alert('Delete executed successfully');
      fetchRequests();
    } catch (err) {
      alert('Execute failed: ' + (err?.response?.data?.message || err.message));
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '20px' }}>
        Pending Delete Requests
      </h2>

      {loading ? (
        <p>Loading...</p>
      ) : requests.length === 0 ? (
        <p style={{ color: '#888' }}>No pending user deletion requests.</p>
      ) : (
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f9f9f9' }}>
              <tr>
                <th style={thStyle}>User</th>
                <th style={thStyle}>Requested By</th>
                <th style={thStyle}>Reason</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Created</th>
                <th style={thStyle}>Request ID</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r, i) => {
                const target = getTargetInfo(r);
                const requester = getRequesterInfo(r);
                return (
                  <tr key={r.request_id} style={i % 2 === 0 ? rowEven : rowOdd}>
                    <td style={tdStyle}>
                      <div style={styles.primaryText}>{target.name}</div>
                      <div style={styles.metaText}>{target.email || 'No email'}{target.type ? ` • ${target.type}` : ''}</div>
                      <div style={styles.idText}>{target.id}</div>
                    </td>
                    <td style={tdStyle}>
                      <div style={styles.primaryText}>{requester.name || 'Unknown admin'}</div>
                      <div style={styles.metaText}>{requester.email || requester.id}</div>
                    </td>
                    <td style={tdStyle}>{target.reason || '-'}</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        background: r.status === 'pending' ? '#fff3cd' : '#d4edda',
                        color: r.status === 'pending' ? '#856404' : '#155724'
                      }}>
                        {r.status}
                      </span>
                    </td>
                    <td style={tdStyle}>{r.date_sent?.split('T')[0] || r.created_at?.split('T')[0] || '-'}</td>
                    <td style={tdStyle}><span style={styles.idText}>{r.request_id}</span></td>
                    <td style={tdStyle}>
                      {r.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => handleAction(r.request_id, 'approved')}
                            disabled={processing === r.request_id}
                            style={btnStyle}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(r.request_id, 'rejected')}
                            disabled={processing === r.request_id}
                            style={{ ...btnStyle, background: '#6c757d' }}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {r.status === 'approved' && (
                        <button
                          onClick={() => handleExecute(r.request_id)}
                          disabled={processing === r.request_id}
                          style={{ ...btnStyle, background: '#c62828' }}
                        >
                          Execute Delete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const thStyle = { padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#888', textTransform: 'uppercase' };
const tdStyle = { padding: '12px 16px', fontSize: '14px', borderTop: '1px solid #f0f0f0', verticalAlign: 'top' };
const rowEven = { background: '#fff' };
const rowOdd = { background: '#fafafa' };
const btnStyle = { padding: '4px 10px', fontSize: '12px', border: 'none', borderRadius: '6px', background: '#2e7d32', color: '#fff', cursor: 'pointer' };

const styles = {
  primaryText: { fontWeight: '700', color: '#2f2f2f', marginBottom: '3px' },
  metaText: { color: '#666', fontSize: '12px', lineHeight: '1.4' },
  idText: { color: '#999', fontSize: '11px', fontFamily: 'monospace', lineHeight: '1.5' },
};

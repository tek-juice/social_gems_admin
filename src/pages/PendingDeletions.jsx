import { useEffect, useState } from 'react';
import { getMakerCheckerRequests, actionMakerCheckerRequest, executeMakerCheckerRequest } from '../api/admin';

export default function PendingDeletions() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  const fetchRequests = () => {
    setLoading(true);
    getMakerCheckerRequests()
      .then((res) => {
        const data = res.data?.data || res.data || [];
        // Filter only user delete requests
        const deleteRequests = data.filter(r => 
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
                <th style={thStyle}>Request ID</th>
                <th style={thStyle}>User ID</th>
                <th style={thStyle}>Requested By</th>
                <th style={thStyle}>Reason</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Created</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r, i) => (
                <tr key={r.request_id} style={i % 2 === 0 ? rowEven : rowOdd}>
                  <td style={tdStyle}>{r.request_id}</td>
                  <td style={tdStyle}>{r.target_id}</td>
                  <td style={tdStyle}>{r.requested_by}</td>
                  <td style={tdStyle}>{r.details?.reason || '—'}</td>
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
                  <td style={tdStyle}>{r.created_at?.split('T')[0]}</td>
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const thStyle = { padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#888', textTransform: 'uppercase' };
const tdStyle = { padding: '12px 16px', fontSize: '14px', borderTop: '1px solid #f0f0f0' };
const rowEven = { background: '#fff' };
const rowOdd = { background: '#fafafa' };
const btnStyle = { padding: '4px 10px', fontSize: '12px', border: 'none', borderRadius: '6px', background: '#2e7d32', color: '#fff', cursor: 'pointer' };

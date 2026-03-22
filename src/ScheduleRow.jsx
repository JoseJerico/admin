import React from 'react';

export default function ScheduleRow({ s, onEdit, onApprove, onReject, onAssign }) {
  return (
    <tr>
      <td>#{s.id}</td>
      <td>{s.full_name || 'N/A'}</td>
      <td>{s.service || 'N/A'}</td>
      <td>{s.date ? new Date(s.date).toLocaleDateString() : '—'} | {s.time || '—'}</td>
      <td>{s.mobile_number || 'N/A'}</td>
      <td>{s.address || 'N/A'}</td>
      <td>{s.technician_name || 'Not assigned'}</td>
      <td>{s.scheduled_date ? new Date(s.scheduled_date).toLocaleString() : 'Not set'}</td>
      <td><span className={`status-badge status-${s.status}`}>{s.status}</span></td>
      <td className="actions-cell">
        <button onClick={() => onEdit(s)} className="btn btn-edit">✏️ Edit</button>

        {s.status === 'pending' && (
          <>
            <button onClick={() => onApprove(s.id)} className="btn btn-approve">✓ Approve</button>
            <button onClick={() => onReject(s.id)} className="btn btn-reject">✗ Reject</button>
          </>
        )}

        {s.status === 'approved' && (
          <button onClick={() => onAssign(s)} className="btn btn-assign">👤 Assign</button>
        )}

        {s.status === 'assigned' && <span className="status-text">Assigned</span>}
      </td>
    </tr>
  );
}
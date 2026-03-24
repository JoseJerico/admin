import React from 'react';

export default function ScheduleRow({ s, onEdit, onApprove, onReject, onAssign, style }) {
  return (
    <tr style={style}>
      <td>{s.id}</td>
      <td>{s.full_name}</td>
      <td>{s.service}</td>
      <td>{s.date} | {s.time}</td>
      <td>{s.mobile_number || s.contact}</td>
      <td>{s.address}</td>
      <td>{s.technician_name || 'Not assigned'}</td>
      <td>{s.scheduled_date ? new Date(s.scheduled_date).toLocaleString() : 'Not set'}</td>
      <td>{s.status.charAt(0).toUpperCase() + s.status.slice(1)}</td>
      <td>
        {s.status.toLowerCase() === 'pending' && (
          <>
            <button
              onClick={() => onApprove(s.id)}
              style={{ backgroundColor: '#4CAF50', color: 'white', marginRight: '5px', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}
            >
              ✓ Approve
            </button>
            <button
              onClick={() => onReject(s.id)}
              style={{ backgroundColor: '#f44336', color: 'white', marginRight: '5px', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}
            >
              ✗ Reject
            </button>
          </>
        )}
        {['pending','approved'].includes(s.status.toLowerCase()) && (
          <button
            onClick={() => onAssign(s)}
            style={{ backgroundColor: '#2196F3', color: 'white', marginRight: '5px', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}
          >
            🛠 Assign Technician
          </button>
        )}
        <button
          onClick={() => onEdit(s)}
          style={{ backgroundColor: '#FFC107', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}
        >
          ✎ Edit
        </button>
      </td>
    </tr>
  );
}
import React from 'react';

export default function ScheduleRow({
  s,
  bgColor,
  onEdit,
  onApprove,
  onReject,
  onAssign,
  onComplete,
  setSelectedPhoto
}) {
  return (
    <tr style={{ backgroundColor: bgColor }}>
      <td>{s.id}</td>
      <td>{s.full_name}</td>
      <td>{s.service}</td>
      <td>{s.date} | {s.time}</td>
      <td>{s.mobile_number || s.contact}</td>
      <td>{s.address}</td>

      {/* TECHNICIAN INFO */}
      <td>
        {s.technician_name || 'Not assigned'} <br />
        📞 {s.technician_contact || 'N/A'} <br />
        ⚡ {s.technician_specialty || 'N/A'}
      </td>

      {/* SCHEDULED DATE */}
      <td>
        {s.scheduled_date
          ? new Date(s.scheduled_date).toLocaleString()
          : 'Not set'}
      </td>

      {/* STATUS */}
      <td>
        {s.status?.charAt(0).toUpperCase() + s.status?.slice(1)}
      </td>

      {/* PHOTOS */}
      <td>
        {s.photos?.length > 0 ? (
          <div className="photo-gallery">
            {s.photos.map(photo => (
              <img
                key={photo.id}
                src={photo.url}
                alt="Booking"
                onClick={() => setSelectedPhoto(photo.url)}
                style={{
                  width: "50px",
                  height: "50px",
                  objectFit: "cover",
                  cursor: "pointer",
                  margin: "2px",
                  borderRadius: "5px"
                }}
              />
            ))}
          </div>
        ) : "No photos"}
      </td>

      {/* ACTIONS */}
      <td>
        {/* APPROVE / REJECT */}
        {s.status?.toLowerCase() === 'pending' && (
          <>
            <button onClick={() => onApprove(s.id)} style={btnGreen}>
              ✓
            </button>
            <button onClick={() => onReject(s.id)} style={btnRed}>
              ✗
            </button>
          </>
        )}

       {/* ASSIGN */}
{['pending', 'approved'].includes(s.status?.toLowerCase()) && (
  <button onClick={() => onAssign(s)} style={btnBlue}>
    🛠 Assign Technician
  </button>
)}

{/* COMPLETE */}
{s.status?.toLowerCase() === "assigned" && (
  <button onClick={() => onComplete(s.id)} style={btnTeal}>
    ✅ Complete
  </button>
)}

{/* EDIT */}
<button onClick={() => onEdit(s)} style={btnYellow}>
  ✎ Edit
</button>
      </td>
    </tr>
  );
}

/* BUTTON STYLES */
const baseBtn = {
  border: 'none',
  padding: '5px 10px',
  borderRadius: '5px',
  cursor: 'pointer',
  marginRight: '5px',
  color: 'white'
};

const btnGreen = { ...baseBtn, backgroundColor: '#4CAF50' };
const btnRed = { ...baseBtn, backgroundColor: '#f44336' };
const btnBlue = { ...baseBtn, backgroundColor: '#2196F3' };
const btnTeal = { ...baseBtn, backgroundColor: '#10b981' };
const btnYellow = { ...baseBtn, backgroundColor: '#FFC107' };
import React, { useState } from 'react';
import './EditAppointment.css';

export default function EditAppointment({ appointment, onSave, onClose, schedules }) {
  // ✅ States para sa lahat ng fields
  const [fullName, setFullName] = useState(appointment.full_name || '');
  const [date, setDate] = useState(appointment.date || '');
  const [time, setTime] = useState(appointment.time || '');
  const [mobileNumber, setMobileNumber] = useState(appointment.mobile_number || appointment.contact || '');
  const [address, setAddress] = useState(appointment.address || '');
  const [status, setStatus] = useState(appointment.status || 'pending');
  const [notes, setNotes] = useState(appointment.notes || '');

  // ✅ Save button handler
  const handleSave = () => {
  if (!fullName || !date || !time) {
    return alert('Please fill in required fields: Customer Name, Date, and Time');
  }

  // ✅ Availability check
  const conflict = schedules.some(
    (b) =>
      b.id !== appointment.id && // exclude current booking
      b.date === date &&
      b.time === time &&
      ['approved','assigned'].includes(b.status.toLowerCase()) // check only active bookings
  );

  if (conflict) {
    return alert('⚠ Conflict detected! Another booking exists at this date and time.');
  }

  // ✅ Save if no conflict
  onSave({
    full_name: fullName,
    date,
    time,
    mobile_number: mobileNumber,
    address,
    status,
    notes
  });
};

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Edit Appointment</h3>
        <button className="modal-close" onClick={onClose}>X</button>

        <div className="modal-content">
          <label>Customer Name *</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter customer name"
          />

          <label>Requested Date *</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <label>Requested Time *</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />

          <label>Mobile Number</label>
          <input
            type="text"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            placeholder="Enter mobile number"
          />

          <label>Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter address"
          />

          <label>Status *</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="assigned">Assigned</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* ✅ Notes Field */}
          <label>Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add reason for change (optional)"
          />
        </div>

        <div className="modal-actions">
          <button onClick={handleSave} className="btn-save">Save Changes</button>
          <button onClick={onClose} className="btn-cancel">Cancel</button>
        </div>
      </div>
    </div>
  );
}
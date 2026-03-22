import React, { useState } from 'react';
import './AssignTechnicianModal.css'; // optional, para sa styles

export default function AssignTechnicianModal({ schedule, technicians, onClose, onAssign }) {
  const [techId, setTechId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');

  return (
    <div className="modal">
      <h3>Assign Technician for {schedule.full_name}</h3>

      <select value={techId} onChange={e => setTechId(e.target.value)}>
        <option value="">Select Technician</option>
        {technicians.map(t => (
          <option key={t.id} value={t.id}>
            {t.name} ({t.contact})
          </option>
        ))}
      </select>

      <input
        type="datetime-local"
        value={scheduledDate}
        onChange={e => setScheduledDate(e.target.value)}
      />

      <button onClick={() => onAssign(schedule.id, techId, scheduledDate)}>Assign</button>
      <button onClick={onClose}>Cancel</button>
    </div>
  );
}
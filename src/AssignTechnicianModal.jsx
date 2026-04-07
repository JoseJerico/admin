import React, { useState } from 'react';
import './AssignTechnicianModal.css'; // optional, for styles

export default function AssignTechnicianModal({ schedule, technicians, onClose, onAssign }) {
  const [techId, setTechId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');  // State for scheduled date

  const handleAssign = async () => {
    if (!techId || !scheduledDate) {
      return alert("Please select a technician and a scheduled date.");
    }

    // Log values to check if everything is correct
    console.log("Selected Technician ID:", techId);
    console.log("Scheduled Date:", scheduledDate);
    console.log("Booking ID:", schedule.id);

    // Perform the assignment in the bookings table
    const { data, error } = await supabase.from('bookings').update({
      technician_id: techId,  // Technician assignment to bookings table
      technician_name: selectedTechnician.name,
      technician_contact: selectedTechnician.contact,
      technician_speciality: selectedTechnician.speciality,
      status: "assigned",  // Update status when assigned
      scheduled_date: scheduledDate,  // Set the scheduled date
    }).eq('id', schedule.id);  // Link the technician to the booking by ID

    if (error) {
      console.error("Error assigning technician:", error.message);
      alert("Failed to assign technician: " + error.message);
      return;
    }

    console.log("Technician assigned successfully:", data);
    alert(`Technician ${selectedTechnician.name} assigned!`);
    setSelectedBooking(null);  // Clear the selected booking
    setSelectedTechnician(null);  // Clear the selected technician
    refresh();  // Refresh the UI
  };

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
        value={scheduledDate}  // Bind to state
        onChange={e => setScheduledDate(e.target.value)}  // Update state on change
      />

      <button onClick={handleAssign}>Assign</button>
      <button onClick={onClose}>Cancel</button>
    </div>
  );
}
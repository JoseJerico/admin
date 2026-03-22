import React, { useEffect, useState } from 'react';
import Login from '../Login';
import EditAppointment from '../EditAppointment';
import InstallPrompt from '../InstallPrompt';
import AssignTechnicianModal from '../AssignTechnicianModal';
import ScheduleRow from '../ScheduleRow';
import './AdminApp.css';
import { supabase } from '../supabase';

export default function AdminApp({ user, onLogout }) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedTechnician, setSelectedTechnician] = useState(null);

  useEffect(() => {
    async function init() {
      setLoading(true);
      const { data: techs, error: techError } = await supabase.from('technicians').select('*');
      if (techError) console.error('Error fetching technicians:', techError);
      else setTechnicians(techs || []);

      const { data: bookings, error: bookingError } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
      if (bookingError) console.error(bookingError);
      else setSchedules(bookings || []);
      setLoading(false);
    }
    init();
  }, []);

  async function approve(id) {
    const { error } = await supabase.from('bookings').update({ status: 'approved' }).eq('id', id);
    if (error) { console.error(error); alert('Failed to approve booking'); return }
    refresh();
  }

  async function reject(id) {
    const { error } = await supabase.from('bookings').update({ status: 'rejected' }).eq('id', id);
    if (error) { console.error(error); alert('Failed to reject booking'); return }
    refresh();
  }

  async function assignTech(scheduleId, technicianId, scheduleDate) {
    const tech = technicians.find(t => t.id === technicianId);
    if (!tech) return alert('Select a technician');
    const { error } = await supabase.from('bookings').update({
      technician_id: tech.id,
      technician_name: tech.name,
      technician_contact: tech.contact,
      status: 'assigned',
      scheduled_date: scheduleDate
    }).eq('id', scheduleId);
    if (error) console.error('Error assigning technician:', error)
    else refresh();
    setSelectedSchedule(null);
  }

  async function fetchTechnicians() {
  const { data, error } = await supabase
    .from("technicians")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching technicians:", error);
    setTechnicians([]);
    return;
  }

  setTechnicians(data || []);
}

useEffect(() => {
  fetchTechnicians();
}, []);

  async function handleEditAppointment(updatedData) {
    if (!editingAppointment) return;
    const { error } = await supabase.from('bookings').update({
      full_name: updatedData.full_name,
      service: updatedData.service,
      date: updatedData.date,
      time: updatedData.time,
      mobile_number: updatedData.mobile_number,
      address: updatedData.address,
      status: updatedData.status
    }).eq('id', editingAppointment.id);
    if (error) { console.error(error); alert('Error updating booking'); return }
    setEditingAppointment(null);
    refresh();
  }

  async function refresh() {
    setLoading(true);
    const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
    if (error) console.error(error);
    else setSchedules(data || []);
    setLoading(false);
  }

  async function handleAssign() {
  if (!selectedBooking || !selectedTechnician) {
    alert("Please select a technician");
    return;
  }

  const { error } = await supabase
    .from("bookings")
    .update({
      technician_id: selectedTechnician.id,
      technician_name: selectedTechnician.name,
      technician_contact: selectedTechnician.contact,
      status: "assigned",
      scheduled_date: new Date().toISOString(), // pwede palitan kung may specific schedule
    })
    .eq("id", selectedBooking.id);

  if (error) {
    console.error("Assign error:", error);
    alert("Failed to assign technician");
    return;
  }

  alert(`Technician ${selectedTechnician.name} assigned!`);
  refresh(); // refresh the dashboard
  setAssignModalOpen(false);
}

  function openAssignModal(booking) {
  setSelectedBooking(booking);
  setAssignModalOpen(true);
}

  function renderTable(data) {
    return (
      <table className="schedules-table">
        <thead>
          <tr>
            <th>ID</th><th>Name</th><th>Service</th><th>Date & Time</th>
            <th>Contact</th><th>Address</th><th>Technician</th>
            <th>Scheduled Date</th><th>Status</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map(s => (
            <ScheduleRow
              key={s.id}
              s={s}
              onEdit={setEditingAppointment}
              onApprove={approve}
              onReject={reject}
              onAssign={openAssignModal}
            />
          ))}
        </tbody>
      </table>
    )
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <h1>🔧 Aircon Admin Dashboard</h1>
          <div className="header-actions">
            <span className="user-info">👤 {user?.name || 'Admin'}</span>
            <button onClick={refresh} disabled={loading} className="btn-refresh">{loading ? 'Loading...' : 'Refresh'}</button>
            <button onClick={onLogout} className="btn-logout">Logout</button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="stats-grid">
  <div className="stat-card"><div className="stat-value">{schedules.length}</div><div className="stat-label">Total Bookings</div></div>
  <div className="stat-card pending"><div className="stat-value">{schedules.filter(s => s.status === 'pending').length}</div><div className="stat-label">Pending</div></div>
  <div className="stat-card approved"><div className="stat-value">{schedules.filter(s => s.status === 'approved').length}</div><div className="stat-label">Approved</div></div>
  <div className="stat-card assigned"><div className="stat-value">{schedules.filter(s => s.status === 'assigned').length}</div><div className="stat-label">Assigned</div></div>
  <div className="stat-card rejected"><div className="stat-value">{schedules.filter(s => s.status === 'rejected').length}</div><div className="stat-label">Rejected</div></div>
  <div className="stat-card cancelled"><div className="stat-value">{schedules.filter(s => s.status === 'cancelled').length}</div><div className="stat-label">Cancelled</div></div>
</div>
      

      {/* Filters */}
      <div className="filter-tabs">
        {['all','pending','approved','assigned','rejected','cancelled'].map(status => (
          <button key={status} onClick={() => setFilter(status)} className={`tab ${filter===status?'active':''}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="schedules-container">
        {filter === 'all' 
          ? (schedules.length === 0 ? <div className="empty-state">📋 No schedules found</div> : renderTable(schedules))
          : (schedules.filter(s => s.status === filter).length === 0 
              ? <div className="empty-state">📋 No {filter} schedules</div>
              : renderTable(schedules.filter(s => s.status === filter))
            )
        }
      </div>

      {assignModalOpen && selectedBooking && (
  <div className="modal-overlay" onClick={() => setAssignModalOpen(false)}>
    <div className="modal" onClick={(e) => e.stopPropagation()}>
      <h3>Assign Technician for {selectedBooking.service}</h3>

      <select
        onChange={(e) =>
          setSelectedTechnician(
            technicians.find((t) => t.id === e.target.value)
          )
        }
      >
        <option value="">Select Technician</option>
        {technicians.map((tech) => (
          <option key={tech.id} value={tech.id}>
            {tech.name} ({tech.specialty})
          </option>
        ))}
      </select>

      <div style={{ marginTop: "10px" }}>
        <button onClick={handleAssign} style={{ marginRight: "10px" }}>
          Assign
        </button>
        <button onClick={() => setAssignModalOpen(false)}>Cancel</button>
      </div>
    </div>
  </div>
)}

      {/* Modals */}
      {selectedSchedule && <AssignTechnicianModal
        schedule={selectedSchedule}
        technicians={technicians}
        onClose={() => setSelectedSchedule(null)}
        onAssign={assignTech}
      />}
      {editingAppointment && <EditAppointment
        appointment={editingAppointment}
        onSave={handleEditAppointment}
        onClose={() => setEditingAppointment(null)}
      />}
      <InstallPrompt />
    </div>
  )
}


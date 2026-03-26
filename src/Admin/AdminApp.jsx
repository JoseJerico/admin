import React, { useEffect, useState } from 'react';
import Login from '../Login';
import EditAppointment from '../EditAppointment';
import InstallPrompt from '../InstallPrompt';
import ScheduleRow from '../ScheduleRow';
import { supabase } from '../supabase';
import './AdminApp.css';

// Assign Technician Modal
function AssignTechnicianModal({ booking, technicians, onAssign, onClose, selectedTechnician, setSelectedTechnician }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Assign Technician for {booking.service}</h3>
        <select
          value={selectedTechnician?.id || ""}
          onChange={(e) => setSelectedTechnician(technicians.find(t => t.id === e.target.value))}
        >
          <option value="">Select Technician</option>
          {technicians.map(tech => (
            <option key={tech.id} value={tech.id}>{tech.name} | {tech.contact || 'N/A'} | {tech.specialty || 'N/A'}</option>
          ))}
        </select>

        {selectedTechnician && (
          <div style={{ marginTop: "10px", padding: "10px", background: "#f1f5f9", borderRadius: "8px" }}>
            <p>👤 <strong>{selectedTechnician.name}</strong></p>
            <p>📞 {selectedTechnician.contact}</p>
          </div>
        )}

        <div style={{ marginTop: "10px" }}>
          <button onClick={onAssign} style={{ marginRight: "10px" }}>Assign</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// Profile Modal
function ProfileModal({ user, fullName, roleName, onClose }) {
  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>👤 My Profile</h2>
          <button onClick={onClose} className="btn-close-modal">✕</button>
        </div>
        <div className="profile-content">
          <div className="profile-item"><span className="label">Name:</span><span>{fullName || "Admin"}</span></div>
          <div className="profile-item"><span className="label">Email:</span><span>{user?.email || "N/A"}</span></div>
          <div className="profile-item"><span className="label">Role:</span><span>{roleName || "Admin"}</span></div>
        </div>
        <div className="modal-actions"><button onClick={onClose} className="btn-close">Close</button></div>
      </div>
    </div>
  );
}

// Stats Grid
function StatsGrid({ schedules }) {
  const statusList = ['pending','approved','assigned','rejected','cancelled'];
  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-value">{schedules.length}</div>
        <div className="stat-label">Total Bookings</div>
      </div>
      {statusList.map(status => (
        <div className={`stat-card ${status}`} key={status}>
          <div className="stat-value">{schedules.filter(s => s.status?.toLowerCase() === status).length}</div>
          <div className="stat-label">{status.charAt(0).toUpperCase() + status.slice(1)}</div>
        </div>
      ))}
    </div>
  );
}

// Filters
function Filters({ filter, setFilter }) {
  const statusList = ['all','pending','approved','assigned','rejected','cancelled'];
  return (
    <div className="filter-tabs">
      {statusList.map(status => (
        <button key={status} onClick={() => setFilter(status)} className={`tab ${filter===status?'active':''}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </button>
      ))}
    </div>
  );
}

// AdminApp
export default function AdminApp({ user, onLogout }) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [conflictIds, setConflictIds] = useState([]);
  const [fullName, setFullName] = useState("");
  const [roleName, setRoleName] = useState("");
  const [showProfile, setShowProfile] = useState(false);

  const STATUS_COLORS = {
    cancelled: '#4da6ff',    
    rejected: '#4da6ff',     
    pending: '#b3ff66',      
    assigned: 'transparent', 
    approved: '#ffeb99',     
    conflict: '#ff9999'      
  };

  // Fetch bookings & detect conflicts
  function groupConflicts(bookings) {
    const activeBookings = bookings.filter(
      b => b.status && !['assigned','cancelled','rejected'].includes(b.status.toLowerCase())
    );
    const map = {};
    activeBookings.forEach(b => {
      const key = `${b.date}|${b.time}`;
      if (!map[key]) map[key] = [];
      map[key].push(b);
    });
    return Object.values(map).filter(g => g.length > 1);
  }

  async function refresh() {
    setLoading(true);
    const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
    if (error) console.error(error);
    else {
      setSchedules(data || []);
      const conflicts = groupConflicts(data || []);
      setConflictIds(conflicts.flat().map(b => b.id));
      if (conflicts.length > 0) alert(`⚠️ Mayroong ${conflicts.flat().length} booking(s) na may conflict!`);
    }
    setLoading(false);
  }
  useEffect(() => { refresh(); }, []);

  // Fetch profile
  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data, error } = await supabase.from("profiles").select("full_name, role_id").eq("id", user.id).single();
      if (error) { setFullName("Admin"); setRoleName("Admin"); }
      else {
        setFullName(data.full_name || "Admin");
        const roleMap = { "7a118e8b-595d-4659-986c-8e1147ce5851":"Admin","1b9afae0-cefb-4ce5-942d-4d70b33a0ac6":"Technician" };
        setRoleName(roleMap[data.role_id] || "Customer");
      }
    };
    fetchProfile();
  }, [user]);

  // Fetch technicians
  async function fetchTechnicians() {
    const { data, error } = await supabase.from("technicians").select("id,name,contact,specialty").order("name");
    if (error) console.error(error);
    else setTechnicians(data || []);
  }
  useEffect(() => { fetchTechnicians(); }, []);

  // Approve / Reject
  async function approve(id) { await supabase.from('bookings').update({status:'approved'}).eq('id',id); refresh(); }
  async function reject(id) { await supabase.from('bookings').update({status:'rejected'}).eq('id',id); refresh(); }

  // Assign Technician
  async function handleAssign() {
    if (!selectedBooking || !selectedTechnician) return alert("Select technician");
    const { error } = await supabase.from("bookings").update({
      technician_id: selectedTechnician.id,
      technician_name: selectedTechnician.name,
      technician_contact: selectedTechnician.contact,
      technician_specialty: selectedTechnician.specialty,
      status: "assigned",
      scheduled_date: new Date().toISOString()
    }).eq("id", selectedBooking.id);
    if (error) { console.error(error); alert("Failed to assign technician"); return; }
    alert(`Technician ${selectedTechnician.name} assigned!`);
    refresh();
    setSelectedBooking(null);
    setSelectedTechnician(null);
  }

  // Render Table
  function renderTable(data) {
    return (
      <table className="schedules-table">
        <thead>
          <tr>
            <th>ID</th><th>Name</th><th>Service</th><th>Date & Time</th>
            <th>Contact</th><th>Address</th><th>Technician</th><th>Scheduled Date</th>
            <th>Status</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map(s => {
            let bgColor = 'transparent';
            if (conflictIds.includes(s.id)) bgColor = STATUS_COLORS.conflict;
            else if (['cancelled','rejected'].includes(s.status?.toLowerCase())) bgColor = STATUS_COLORS.cancelled;
            else if (s.status?.toLowerCase() === 'pending') bgColor = STATUS_COLORS.pending;
            else if (s.status?.toLowerCase() === 'approved' && !s.technician_id) bgColor = STATUS_COLORS.approved;
            return <ScheduleRow key={s.id} s={s} onEdit={setEditingAppointment} onApprove={approve} onReject={reject} onAssign={(b)=>setSelectedBooking(b)} style={{ backgroundColor: bgColor }} />;
          })}
        </tbody>
      </table>
    );
  }

  const filteredSchedules = filter === 'all' ? schedules : schedules.filter(s => s.status?.toLowerCase() === filter);

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>🔧 Aircon Admin Dashboard</h1>
          <div className="header-actions">
            <button onClick={()=>setShowProfile(true)} title="View profile">👤 {fullName || user?.email}</button>
            <button onClick={refresh} disabled={loading}>{loading?'Loading...':'Refresh'}</button>
            <button onClick={onLogout}>Logout</button>
          </div>
        </div>
      </header>

      <StatsGrid schedules={schedules} />
      <Filters filter={filter} setFilter={setFilter} />

      <div className="status-legend" style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '15px' }}>
      <div style={{ backgroundColor: STATUS_COLORS.conflict, padding:'5px 10px', borderRadius:'5px' }}>Conflict/ (Red)</div>
      <div style={{ backgroundColor: STATUS_COLORS.cancelled, padding:'5px 10px', borderRadius:'5px' }}>Cancelled / Rejected (Blue)</div>
      <div style={{ backgroundColor: STATUS_COLORS.pending, padding:'5px 10px', borderRadius:'5px' }}>Pending (Green)</div>
      <div style={{ backgroundColor: STATUS_COLORS.approved, padding:'5px 10px', borderRadius:'5px' }}>Approved / No assigned technician yet (Yellow)</div>
      <div style={{ backgroundColor: STATUS_COLORS.assigned, padding:'5px 10px', borderRadius:'5px', border:'1px solid #ccc' }}>Assigned (No Color)</div>
     </div>

      <div className="schedules-container">{renderTable(filteredSchedules)}</div>

      {selectedBooking && <AssignTechnicianModal booking={selectedBooking} technicians={technicians} onAssign={handleAssign} onClose={()=>{setSelectedBooking(null); setSelectedTechnician(null)}} selectedTechnician={selectedTechnician} setSelectedTechnician={setSelectedTechnician} />}

      {showProfile && <ProfileModal user={user} fullName={fullName} roleName={roleName} onClose={()=>setShowProfile(false)} />}
      {editingAppointment && 
  <EditAppointment
    appointment={editingAppointment}
    schedules={schedules}
    onClose={() => setEditingAppointment(null)}
    onSave={async (updated) => {
      try {
        // Update sa bookings table
        const { error } = await supabase
          .from('bookings')
          .update(updated)
          .eq('id', editingAppointment.id);

        if (error) {
          console.error(error);
          return alert('Failed to save changes!');
        }

        // Refresh ang dashboard para makita ang changes
        await refresh();

        // Isara ang modal
        setEditingAppointment(null);

        alert('Changes saved successfully!');
      } catch (err) {
        console.error(err);
        alert('Something went wrong while saving!');
      }
    }}
  />
}
      <InstallPrompt />
    </div>
  );
}
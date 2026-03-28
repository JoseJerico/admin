import React, { useEffect, useState } from 'react';
import Login from '../Login';
import EditAppointment from '../EditAppointment';
import InstallPrompt from '../InstallPrompt';
import { supabase } from '../supabase';
import './AdminApp.css';

// Assign Technician Modal
function AssignTechnicianModal({ booking, technicians, onAssign, onClose, selectedTechnician, setSelectedTechnician }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>Assign Technician for {booking.service}</h3>
        <select
          value={selectedTechnician?.id || ""}
          onChange={e => setSelectedTechnician(technicians.find(t => t.id === e.target.value))}
        >
          <option value="">Select Technician</option>
          {technicians.map(t => (
            <option key={t.id} value={t.id}>{t.name} | {t.contact || 'N/A'} | {t.specialty || 'N/A'}</option>
          ))}
        </select>
        {selectedTechnician && (
          <div style={{ marginTop:"10px", padding:"10px", background:"#f1f5f9", borderRadius:"8px" }}>
            <p>👤 <strong>{selectedTechnician.name}</strong></p>
            <p>📞 {selectedTechnician.contact}</p>
            <p>⚡ {selectedTechnician.specialty}</p>
          </div>
        )}
        <div style={{ marginTop:"10px" }}>
          <button onClick={onAssign} style={{ marginRight:"10px" }}>Assign</button>
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
      <div className="profile-modal" onClick={e => e.stopPropagation()}>
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
  const statusList = ['pending','approved','assigned','in_progress','completed','rejected','cancelled'];
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
  const statusList = ['all','pending','approved','assigned','in_progress','completed','rejected','cancelled'];
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

// Status Legend
function StatusLegend() {
  const legend = [
    { color: '#ff9999', label: 'Conflict' },
    { color: '#b3ff66', label: 'Pending' },
    { color: '#ffeb99', label: 'Approved' },
    { color: '#f59e0b', label: 'Assigned' },
    { color: '#a52a2a', label: 'In Progress' },
    { color: '#10b981', label: 'Completed' },
    { color: '#4da6ff', label: 'Cancelled / Rejected' }
  ];
  return (
    <div className="status-legend" style={{ display:'flex', justifyContent:'center', flexWrap:'wrap', margin:'20px 0' }}>
      {legend.map(item => (
        <div key={item.label} className="legend-item" style={{ display:'flex', alignItems:'center', margin:'0 10px' }}>
          <span style={{ backgroundColor:item.color, width:'20px', height:'20px', display:'inline-block', marginRight:'5px', borderRadius:'4px' }}></span>
          <span>{item.label}</span>
        </div>
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
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const STATUS_COLORS = {
    cancelled: '#4da6ff',
    rejected: '#4da6ff',
    pending: '#b3ff66',
    assigned: '#f59e0b',
    approved: '#ffeb99',
    in_progress: '#a52a2a',
    completed: '#10b981',
    conflict: '#ff9999'
  };

  // Fetch bookings
  async function refresh() {
    setLoading(true);
    const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending:false });
    if (error) console.error(error);
    else {
      setSchedules(data || []);
      const conflicts = groupConflicts(data || []);
      setConflictIds(conflicts.flat().map(b => b.id));
    }
    setLoading(false);
  }

  // Group conflicts
  function groupConflicts(bookings) {
    const active = bookings.filter(b => b.status && !['assigned','cancelled','rejected','completed'].includes(b.status.toLowerCase()));
    const map = {};
    active.forEach(b => {
      const key = `${b.date}|${b.time}`;
      if (!map[key]) map[key] = [];
      map[key].push(b);
    });
    return Object.values(map).filter(g => g.length > 1);
  }

  useEffect(() => { refresh(); }, []);

  // Fetch profile
  useEffect(() => {
    if (!user) return;
    (async ()=>{
      const { data, error } = await supabase.from("profiles").select("full_name, role_id").eq("id", user.id).single();
      if(error){ setFullName("Admin"); setRoleName("Admin"); return; }
      setFullName(data.full_name || "Admin");
      const roleMap = { "7a118e8b-595d-4659-986c-8e1147ce5851":"Admin","1b9afae0-cefb-4ce5-942d-4d70b33a0ac6":"Technician" };
      setRoleName(roleMap[data.role_id] || "Customer");
    })();
  }, [user]);

  // Fetch technicians
  useEffect(() => {
    (async ()=>{
      const { data, error } = await supabase.from("technicians").select("id,name,contact,specialty").order("name");
      if(error) console.error(error);
      else setTechnicians(data || []);
    })();
  }, []);

  // Actions
  async function approve(id){ await supabase.from('bookings').update({status:'approved'}).eq('id',id); refresh(); }
  async function reject(id){ await supabase.from('bookings').update({status:'rejected'}).eq('id',id); refresh(); }

  async function completeBooking(id){
    if(!window.confirm("Mark this booking as COMPLETED?")) return;
    const { error } = await supabase.from('bookings').update({status:"completed"}).eq("id",id);
    if(error){ alert("❌ Failed to complete booking"); console.error(error); return; }
    alert("✅ Booking marked as completed!");
    refresh();
  }

  async function handleAssign(){
    if(!selectedBooking || !selectedTechnician) return alert("Select technician");
    const { error } = await supabase.from('bookings').update({
      technician_id:selectedTechnician.id,
      technician_name:selectedTechnician.name,
      technician_contact:selectedTechnician.contact,
      technician_specialty:selectedTechnician.specialty,
      status:"assigned"
    }).eq("id",selectedBooking.id);
    if(error){ console.error(error); alert("Failed to assign technician"); return; }
    alert(`Technician ${selectedTechnician.name} assigned!`);
    setSelectedBooking(null); setSelectedTechnician(null);
    refresh();
  }

  const filteredSchedules = filter==='all'?schedules:schedules.filter(s=>s.status?.toLowerCase()===filter);

  function renderTable(data) {
  return (
    <table className="schedules-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Service</th>
          <th>Date & Time</th>
          <th>Contact</th>
          <th>Address</th>
          <th>Technician</th>
          <th>Status</th>
          <th>Photos</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.map(s => {
          let bgColor = 'transparent';
          if (conflictIds.includes(s.id)) bgColor = STATUS_COLORS.conflict;
          else if (['cancelled','rejected'].includes(s.status?.toLowerCase())) bgColor = STATUS_COLORS.cancelled;
          else if (s.status?.toLowerCase() === 'pending') bgColor = STATUS_COLORS.pending;
          else if (s.status?.toLowerCase() === 'approved' && !s.technician_id) bgColor = STATUS_COLORS.approved;
          else if (s.status?.toLowerCase() === 'assigned') bgColor = STATUS_COLORS.assigned;
          else if (s.status?.toLowerCase() === 'in_progress') bgColor = STATUS_COLORS.in_progress;
          else if (s.status?.toLowerCase() === 'completed') bgColor = STATUS_COLORS.completed;

          const isInProgress = s.status?.toLowerCase() === 'in_progress';
          const isCompleted = s.status?.toLowerCase() === 'completed';
          const isApproved = s.status?.toLowerCase() === 'approved';

          return (
            <tr key={s.id} style={{ backgroundColor: bgColor }}>
              <td>{s.id}</td>
              <td>{s.full_name}</td>
              <td>{s.service}</td>
              <td>{s.date} {s.time}</td>
              <td>{s.mobile_number}</td>
              <td>{s.address}</td>
              <td>{s.technician_name || 'N/A'}</td>
              <td>{s.status}</td>
              <td>
                <div style={{ display: 'flex', gap: '5px' }}>
                  {s.photos?.map((p, i) => (
                    <img
                      key={i}
                      src={p.url}
                      alt={p.type}
                      title={p.type === 'before' ? 'Start Work' : 'End Work'}
                      style={{ width: '40px', height: '40px', objectFit: 'cover', cursor: 'pointer', borderRadius: '4px' }}
                      onClick={() => setSelectedPhoto(p.url)}
                    />
                  ))}
                </div>
              </td>
              <td style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {/* EDIT BUTTON */}
                {!isInProgress && !isCompleted && (
                  <button onClick={() => setEditingAppointment(s)} className="btn-edit">✏ Edit</button>
                )}

                {/* APPROVE BUTTON */}
                {!isInProgress && !isCompleted && !isApproved && (
                  <button onClick={() => approve(s.id)} className="btn-approve">✅ Approve</button>
                )}

                {/* REJECT BUTTON */}
                {!isInProgress && !isCompleted && !isApproved && (
                  <button onClick={() => reject(s.id)} className="btn-reject">❌ Reject</button>
                )}

                {/* ASSIGN BUTTON */}
                {!isInProgress && !isCompleted && (
                  <button onClick={() => setSelectedBooking(s)} className="btn-assign">🛠 Assign</button>
                )}

                {/* COMPLETE BUTTON */}
                {!isCompleted && (
                  <button onClick={() => completeBooking(s.id)} className="btn-complete">✔ Complete</button>
                )}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  );
}

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>🔧 Aircon Admin Dashboard</h1>
          <div className="header-actions">
            <button onClick={()=>setShowProfile(true)}>👤 {fullName||user?.email}</button>
            <button onClick={refresh} disabled={loading}>{loading?'Loading...':'Refresh'}</button>
            <button onClick={onLogout}>Logout</button>
          </div>
        </div>
      </header>

      <StatsGrid schedules={schedules} />
      <Filters filter={filter} setFilter={setFilter} />
      <StatusLegend />

      <div className="schedules-container">{renderTable(filteredSchedules)}</div>

      {selectedBooking &&
        <AssignTechnicianModal
          booking={selectedBooking}
          technicians={technicians}
          onAssign={handleAssign}
          onClose={()=>{ setSelectedBooking(null); setSelectedTechnician(null); }}
          selectedTechnician={selectedTechnician}
          setSelectedTechnician={setSelectedTechnician}
        />
      }

      {showProfile &&
        <ProfileModal user={user} fullName={fullName} roleName={roleName} onClose={()=>setShowProfile(false)} />
      }

      {selectedPhoto &&
        <div className="photo-modal-overlay" onClick={()=>setSelectedPhoto(null)} style={{
          position:"fixed",top:0,left:0,width:"100vw",height:"100vh",backgroundColor:"rgba(0,0,0,0.7)",
          display:"flex",justifyContent:"center",alignItems:"center",zIndex:1000,cursor:"pointer"
        }}>
          <img src={selectedPhoto} alt="Booking Photo" style={{maxWidth:"80%",maxHeight:"80%",borderRadius:"8px"}} />
        </div>
      }

      {editingAppointment &&
        <EditAppointment
          appointment={editingAppointment}
          schedules={schedules}
          onClose={()=>setEditingAppointment(null)}
          onSave={async (updated)=>{
            const { error } = await supabase.from('bookings').update(updated).eq('id', editingAppointment.id);
            if(error){ alert('Failed to save changes!'); console.error(error); return; }
            await refresh();
            setEditingAppointment(null);
            alert('Changes saved successfully!');
          }}
        />
      }

      <InstallPrompt />
    </div>
  );
}
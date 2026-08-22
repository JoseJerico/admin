

import React, { useEffect, useState, useMemo } from 'react';
import Login from '../Login';
import EditAppointment from '../EditAppointment';
import InstallPrompt from '../InstallPrompt';
import { supabase } from '../supabase';
import './AdminApp.css';
import AccountCreatorModal from './AccountCreatorModal';  // Import the modal
import Sidebar from './Sidebar.jsx';
import DashboardCards from './DashboardCards';
import AdminPayments from './AdminPayments';


function PhotoModal({ photoUrl, onClose }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.8)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999
      }}
      onClick={onClose}
    >
      <img
        src={photoUrl}
        alt="Booking Photo"
        style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '8px' }}
        onClick={e => e.stopPropagation()} // para di ma-close kapag photo mismo ang iclick
      />
    </div>
  )
}

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
            <option key={t.id} value={t.id}>{t.name} | {t.contact || 'N/A'} | {t.speciality || 'N/A'}</option>
          ))}
        </select>
        {selectedTechnician && (
          <div style={{ marginTop: "10px", padding: "10px", background: "#f1f5f9", borderRadius: "8px" }}>
            <p>👤 <strong>{selectedTechnician.name}</strong></p>
            <p>📞 {selectedTechnician.contact}</p>
            <p>⚡ {selectedTechnician.speciality}</p>
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
  const statusList = ['pending', 'approved', 'assigned', 'in_progress', 'completed', 'rejected', 'cancelled'];
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
function Filters({ filter, setFilter, setCurrentPage }) {
  const statusList = ['all', 'pending', 'approved', 'assigned', 'in_progress', 'completed', 'rejected', 'cancelled'];
  return (
    <div className="filter-tabs">
      {statusList.map(status => (
        <button key={status} onClick={() => {
          setFilter(status);
          setCurrentPage(1);
        }} className={`tab ${filter === status ? 'active' : ''}`}>
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
    <div className="status-legend" style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', margin: '20px 0' }}>
      {legend.map(item => (
        <div key={item.label} className="legend-item" style={{ display: 'flex', alignItems: 'center', margin: '0 10px' }}>
          <span style={{ backgroundColor: item.color, width: '20px', height: '20px', display: 'inline-block', marginRight: '5px', borderRadius: '4px' }}></span>
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
  const [fullName, setFullName] = useState("");
  const [roleName, setRoleName] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [showFeedbackDropdown, setShowFeedbackDropdown] = useState(false);
  const [expandedFeedback, setExpandedFeedback] = useState(null);
  const [showAccountCreator, setShowAccountCreator] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard');
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const rowsPerPage = 10;

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

  async function refresh(page = currentPage) {
    setLoading(true);

    const from = (page - 1) * rowsPerPage;
    const to = from + rowsPerPage - 1;

    let query = supabase
      .from('bookings')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      console.error(error);
    } else {
      setSchedules(data || []);
      setTotalPages(Math.ceil(count / rowsPerPage));
    }

    setLoading(false);
  }
  useEffect(() => {
    refresh(currentPage);

    const channel = supabase
      .channel('realtime-bookings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          refresh(currentPage); // ✅ importante
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [currentPage, filter]);

  // Fetch profile
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase.from("profiles").select("full_name, role_id").eq("id", user.id).single();
      if (error) { setFullName("Admin"); setRoleName("Admin"); return; }
      setFullName(data.full_name || "Admin");
      const roleMap = { "7a118e8b-595d-4659-986c-8e1147ce5851": "Admin", "1b9afae0-cefb-4ce5-942d-4d70b33a0ac6": "Technician" };
      setRoleName(roleMap[data.role_id] || "Customer");
    })();
  }, [user]);



  // Fetch technicians
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("technicians").select("id,name,contact,speciality").order("name");
      if (error) console.error(error);
      else setTechnicians(data || []);
    })();
  }, []);

  // Actions
  async function approve(id) { await supabase.from('bookings').update({ status: 'approved' }).eq('id', id); refresh(); }
  async function reject(id) { await supabase.from('bookings').update({ status: 'rejected' }).eq('id', id); refresh(); }

  async function completeBooking(id) {
    if (!window.confirm("Mark this booking as COMPLETED?")) return;
    try {
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ status: 'completed', service_status: 'completed' })
        .eq('id', id);
      if (bookingError) throw bookingError;

      const booking = schedules.find(s => s.id === id);
      if (!booking) return alert("❌ Booking not found");

      const serviceId = booking.service_id || crypto.randomUUID();
      const userId = booking.user_id;
      if (!userId) return alert("❌ Missing user_id");

      // ✅ PREVENTIVE MAINTENANCE LOGIC
      const serviceName = booking.service;
      const serviceReminderMap = {
        'AC Installation Basic': 60,
        'AC Rep': 45,
        'AC Maintenance': 30,
        'Split-type AC Installation': 60,
        'Window-type AC Installation': 60,
        'Ceiling Cassette AC Installation': 60,
        'Portable AC Setup': 30,
        'Ducted AC Installation': 60,
        'AC Not Cooling': 45,
        'AC Compressor Replacement': 45,
        'AC Electrical Fault': 45,
        'Strange AC Noise Repair': 30,
        'AC Coil Cleaning': 60,
        'Filter Cleaning/Replacement': 30,
        'Full AC Check-up': 60,
        'Gas Top-up': 30,
        'Thermostat Calibration': 45
      };
      const reminderDays = serviceReminderMap[serviceName] || 30;

      const maintenanceDate = new Date();
      maintenanceDate.setDate(maintenanceDate.getDate() + reminderDays);

      const { error: maintenanceError } = await supabase
        .from('maintenance')
        .insert([{
          user_id: userId,
          service_id: serviceId,
          status: 'pending',
          notes: booking.notes || '',
          date: maintenanceDate.toISOString(),
          reminder_days: reminderDays
        }]);
      if (maintenanceError) throw maintenanceError;

      alert("✅ Booking completed & preventive maintenance scheduled!");
      refresh();

    } catch (err) {
      console.error("Complete booking error:", err);
      alert("❌ Failed: " + (err.message || JSON.stringify(err)));
    }
  }

  useEffect(() => {
    fetchFeedbacks();

    const interval = setInterval(() => {
      fetchFeedbacks();
    }, 10000);

    return () => clearInterval(interval);
  }, []); // Empty dependency array, so this runs only once when the component mounts

  useEffect(() => {
    console.log('Updated feedbacks state:', feedbacks);  // Log feedbacks state after it's updated
  }, [feedbacks]);  // This will log the state whenever it changes
  // Example ng fetchFeedbacks function sa Admin Dashboard
 async function fetchFeedbacks() {
    try {
      const { data, error } = await supabase
        .from('booking_feedback')
        .select(`
          id,
          booking_id,
          user_id,
          rating,
          type,
          message,
          created_at,
          bookings:booking_id (
            id,
            service,
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        return;
      }

      setFeedbacks(data || []);
    } catch {
      setFeedbacks([]);
    }
  }
  const handleAssign = async () => {
    if (!selectedTechnician || !selectedBooking) {
      return alert("Please select a technician and a booking.");
    }

    console.log("Assigning technician...");
    console.log("Technician ID:", selectedTechnician.id);
    console.log("Booking ID:", selectedBooking.id);

    // Kumuha ng technician_speciality mula sa selected technician
    const technicianSpeciality = selectedTechnician.speciality || 'N/A';  // Default kung walang speciality

    // Update the booking in Supabase with the technician details
    const { data, error } = await supabase
      .from('bookings')
      .update({
        technician_id: selectedTechnician.id,
        technician_name: selectedTechnician.name,
        technician_contact: selectedTechnician.contact,
        technician_speciality: technicianSpeciality,  // Set technician speciality
        status: "assigned",  // Change status to 'assigned'
      })
      .eq('id', selectedBooking.id);  // Link technician to booking by ID

    if (error) {
      console.error("Error assigning technician:", error.message);
      alert("Failed to assign technician: " + error.message);
      return;
    }

    console.log("Technician assigned successfully:", data);
    alert(`Technician ${selectedTechnician.name} assigned!`);

    setSelectedBooking(null);  // Clear selected booking
    setSelectedTechnician(null);  // Clear selected technician
    refresh();  // Refresh the UI
  };
  // FILTERED SCHEDULES & CONFLICT IDS
  const filteredSchedules = useMemo(() => {
    return filter === 'all'
      ? schedules
      : schedules.filter(s => s.status?.toLowerCase() === filter);
  }, [schedules, filter]);

  const conflictIds = useMemo(() => {
    const active = schedules.filter(b => b.status && !['assigned', 'cancelled', 'rejected', 'completed'].includes(b.status.toLowerCase()));
    const map = {};
    active.forEach(b => {
      const key = `${b.date}|${b.time}`;
      if (!map[key]) map[key] = [];
      map[key].push(b);
    });
    return Object.values(map).filter(g => g.length > 1).flat().map(b => b.id);
  }, [schedules]);

  function toggleExpand(id) {
    setExpandedFeedback(expandedFeedback === id ? null : id);
  }


  function renderPagination() {
    if (totalPages <= 1) return null;

    return (
      <div className="pagination">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          ⬅ Previous
        </button>

        <span>{currentPage} / {totalPages}</span>

        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Next ➡
        </button>
      </div>
    );
  }

  function renderTable(data) {
    return (
      <>
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
              else if (['cancelled', 'rejected'].includes(s.status?.toLowerCase())) bgColor = STATUS_COLORS.cancelled;
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
                  <td>{s.services?.name || s.service}</td>
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
                          loading="lazy"
                          onClick={() => setSelectedPhoto(p.url)}
                        />
                      ))}
                    </div>
                  </td>
                  <td style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {!isInProgress && !isCompleted && <button onClick={() => setEditingAppointment(s)} className="btn-edit">✏ Edit</button>}
                    {!isInProgress && !isCompleted && !isApproved && <button onClick={() => approve(s.id)} className="btn-approve">✅ Approve</button>}
                    {!isInProgress && !isCompleted && !isApproved && <button onClick={() => reject(s.id)} className="btn-reject">❌ Reject</button>}
                    {!isInProgress && !isCompleted && <button onClick={() => setSelectedBooking(s)} className="btn-assign">🛠 Assign</button>}
                    {!isCompleted && <button onClick={() => completeBooking(s.id)} className="btn-complete">✔ Complete</button>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {renderPagination()}
      </>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar user={user} onLogout={onLogout} fullName={fullName} roleName={roleName} activeMenu={activeMenu} setActiveMenu={setActiveMenu} />

      <div className="app-main">
        <header className="header">
          <div className="header-content">
            <div className="header-title">
              <h1>
                {activeMenu === 'dashboard' && '🔧 Dashboard'}
                {activeMenu === 'bookings' && '📅 Bookings'}
                {activeMenu === 'payments' && '💳 Payments'}
                {activeMenu === 'technicians' && '👥 Technicians/Admins'}
                {activeMenu === 'feedback' && '⭐ Customer Feedback'}
              </h1>
              <p>Welcome back, {fullName || user?.email}</p>
            </div>
            <div className="header-actions">
              <button className="btn-profile" onClick={() => setShowProfile(true)}>👤 Profile</button>
            </div>
          </div>
        </header>

        <div className="app-content">
          {activeMenu === 'dashboard' && (
            <>
              <DashboardCards schedules={schedules} />
            </>
          )}
          {activeMenu === 'payments' && (
            <AdminPayments />
          )}

          {activeMenu === 'technicians' && (
            <>
              <div className="admin-technician-account">
                <h2>Staff Account Management</h2>
                <p>Create staff accounts here for team access. Click below to open the role form.</p>
                <button
                  className="open-account-creator-btn"
                  onClick={() => setShowAccountCreator(true)}
                >
                  + Create New Account
                </button>
              </div>
              {showAccountCreator && <AccountCreatorModal onClose={() => setShowAccountCreator(false)} />}
            </>
          )}

          {activeMenu === 'bookings' && (
            <>
              <Filters filter={filter} setFilter={setFilter} setCurrentPage={setCurrentPage} />
              <StatusLegend />

              <div className="schedules-container">
                {renderTable(filteredSchedules)}
              </div>
            </>
          )}

          {activeMenu === 'feedback' && (
            <div className="feedback-section">
              <button
                type="button"
                className="feedback-dropdown-header"
                onClick={() => setShowFeedbackDropdown(prev => !prev)}
              >
                <span>Feedbacks from Customers ({feedbacks.length})</span>
                <span>{showFeedbackDropdown ? "▲ Hide" : "▼ Show"}</span>
              </button>

              {showFeedbackDropdown && (
                <div className="feedback-list">
                  {feedbacks.length > 0 ? (
                    feedbacks.map((feedback) => {
                      const isOpen = expandedFeedback === feedback.id;

                      return (
                        <div key={feedback.id} className="feedback-item">
                          <button
                            type="button"
                            className="feedback-summary"
                            onClick={() => toggleExpand(feedback.id)}
                          >
                            <div>
                              <p><strong>Customer:</strong> {feedback.bookings?.full_name || "N/A"}</p>
                              <p><strong>Service:</strong> {feedback.bookings?.service || "N/A"}</p>
                              <p><strong>Rating:</strong> {feedback.rating} ⭐</p>
                            </div>

                            <span className="feedback-arrow">
                              {isOpen ? "▲" : "▼"}
                            </span>
                          </button>

                          {isOpen && (
                            <div className="feedback-details">
                              <p><strong>Message:</strong> {feedback.message || "No message"}</p>
                              <p>
                                <strong>Date:</strong>{" "}
                                {feedback.created_at
                                  ? new Date(feedback.created_at).toLocaleString()
                                  : "N/A"}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="no-feedback">No feedback available.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {selectedBooking &&
            <AssignTechnicianModal
              booking={selectedBooking}
              technicians={technicians}
              onAssign={handleAssign}
              onClose={() => { setSelectedBooking(null); setSelectedTechnician(null); }}
              selectedTechnician={selectedTechnician}
              setSelectedTechnician={setSelectedTechnician}
            />
          }

          {showProfile &&
            <ProfileModal
              user={user}
              fullName={fullName}
              roleName={roleName}
              onClose={() => setShowProfile(false)}
            />
          }

          {editingAppointment &&
            <EditAppointment
              appointment={editingAppointment}
              schedules={schedules || []}
              onClose={() => setEditingAppointment(null)}
              onSave={async (updatedData) => {
                const { error } = await supabase
                  .from('bookings')
                  .update(updatedData)
                  .eq('id', editingAppointment.id);

                if (error) {
                  console.error('Update error:', error);
                  alert('❌ Failed to update booking');
                  return;
                }

                alert('✅ Booking updated successfully');
                setEditingAppointment(null);
                refresh();
              }}
            />
          }

          {selectedPhoto &&
            <PhotoModal
              photoUrl={selectedPhoto}
              onClose={() => setSelectedPhoto(null)}
            />
          }
        </div>
      </div>
    </div>
  );
}

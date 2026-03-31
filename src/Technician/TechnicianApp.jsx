import React, { useState, useEffect } from 'react'
import Camera from '../shared/Camera'
import { supabase } from '../supabase'
import './TechnicianApp.css'

// Stats Grid Component
function StatsGrid({ appointments }) {
  const statusList = ['assigned','in_progress','completed']
  const STATUS_COLORS = {
    assigned: '#f59e0b',
    in_progress: '#3b82f6',
    completed: '#10b981'
  }

  return (
    <div className="stats-grid-tech">
      <div className="stat-card-tech">
        <div className="stat-value-tech">{appointments.length}</div>
        <div className="stat-label-tech">Total Jobs</div>
      </div>
      {statusList.map(status => (
        <div
          className="stat-card-tech"
          key={status}
          style={{backgroundColor: STATUS_COLORS[status]}}
        >
          <div className="stat-value-tech">
            {appointments.filter(a => a.status === status).length}
          </div>
          <div className="stat-label-tech">{status.replace('_',' ').toUpperCase()}</div>
        </div>
      ))}
    </div>
  )
}

export default function TechnicianApp({ user, onLogout }) {
  const [screen, setScreen] = useState('appointments')
  const [appointments, setAppointments] = useState([])
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [showCamera, setShowCamera] = useState(false)
  const [workPhotos, setWorkPhotos] = useState([])
  const [notes, setNotes] = useState('')
  const [cameraMode, setCameraMode] = useState('before')
  const [activeFilter, setActiveFilter] = useState('all')

  let subscription = null

  useEffect(() => {
    if (user?.id) {
      loadAppointments()
      setupRealtime()
    }
    return () => {
      if (subscription) subscription.unsubscribe()
    }
  }, [user])

  async function loadAppointments() {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('technician_id', user.id)
        .order('created_at', { ascending: false })

      if (error) return console.error(error)

      setAppointments(data.map(a => ({ ...a, photos: a.photos || [] })))
    } catch (err) {
      console.error(err)
    }
  }

  function setupRealtime() {
    if (subscription) subscription.unsubscribe();
    subscription = supabase
      .channel('public:bookings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        payload => {
          if (payload.new.technician_id === user.id) loadAppointments();
        }
      )
      .subscribe();
  }

  // --- Filter Appointments Function ---
  function getFilteredAppointments() {
    if (activeFilter === 'all') return appointments;
    return appointments.filter(a => a.status === activeFilter);
  }

  // --- Status Color Helper ---
  function getStatusColor(status) {
    const STATUS_COLORS = {
      assigned: '#f59e0b',
      in_progress: '#3b82f6',
      completed: '#10b981'
    };
    return STATUS_COLORS[status] || '#6b7280'; // default grey
  }

  // --- Appointment Click Handler ---
  function handleAppointmentClick(apt) {
    const serviceId = apt.service_id || crypto.randomUUID();

    const updatedApt = {
      ...apt,
      service_id: serviceId,
      photos: apt.photos || [],
      work_notes: apt.work_notes || ''
    }

    console.log("Clicked appointment:", updatedApt);

    setSelectedAppointment(updatedApt);
    setWorkPhotos(updatedApt.photos);
    setNotes(updatedApt.work_notes);
    setScreen('details');
  }

  async function startWork(apt) {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'in_progress', service_status: 'in_progress' })
      .eq('id', apt.id)
    if (error) return console.error(error)

    setSelectedAppointment({ ...apt, status: 'in_progress' })
    setCameraMode('before')
    setShowCamera(true)
    loadAppointments()
  }

  async function handlePhotoCapture(photoUrl) {
    if (!selectedAppointment) return

    const photo = {
      id: Date.now(),
      type: cameraMode,
      url: photoUrl,
      timestamp: new Date().toISOString()
    }

    const updatedPhotos = [...workPhotos.filter(p => p.type !== cameraMode), photo]
    setWorkPhotos(updatedPhotos)

    try {
      const { error } = await supabase
        .from('bookings')
        .update({ photos: updatedPhotos })
        .eq('id', selectedAppointment.id)
      if (error) throw error
    } catch (err) {
      console.error("Failed to save photo:", err)
      alert("❌ Failed to save photo")
    }

    setShowCamera(false)
  }

  // --- Complete Job Function ---
async function completeJob() {
  if (!selectedAppointment) return;

  // Siguraduhin may BEFORE at AFTER photos
  if (!workPhotos.find(p => p.type === 'before') || !workPhotos.find(p => p.type === 'after')) {
    return alert('📸 You must capture BOTH start and end photos before completing the job.');
  }

  try {
    const serviceId = selectedAppointment.service_id || crypto.randomUUID();
    const userId = selectedAppointment.user_id;

    if (!userId) return alert("❌ Missing user_id for maintenance record.");

    // 1️⃣ Update booking status sa 'done' ✅
    const { error: bookingError } = await supabase
      .from('bookings')
      .update({
        status: 'completed',            // Booking completed
        service_status: 'completed',
        work_notes: notes,
        photos: workPhotos,
        service_id: serviceId
      })
      .eq('id', selectedAppointment.id);

    if (bookingError) throw bookingError;

    // 2️⃣ Insert preventive maintenance record (status: pending, 30 days after completion)
    const maintenanceDate = new Date();
    maintenanceDate.setDate(maintenanceDate.getDate() + 30); // 30 days later

    const maintenancePayload = {
      user_id: userId,
      service_id: serviceId,
      status: 'pending',          // Preventive maintenance pending
      notes: notes || '',
      date: maintenanceDate.toISOString(),
      reminder_days: 30
    };

    console.log("Maintenance payload:", maintenancePayload);

    const { error: maintenanceError } = await supabase
      .from('maintenance')
      .insert([maintenancePayload]);

    if (maintenanceError) throw maintenanceError;

    // 3️⃣ Reset UI
    setSelectedAppointment(null);
    setWorkPhotos([]);
    setNotes('');
    setScreen('appointments');
    loadAppointments();

    alert('✅ Job completed & preventive maintenance scheduled!');

  } catch (err) {
    console.error("Error completing job:", err);
    alert('❌ Failed: ' + (err.message || JSON.stringify(err)));
  }
}
  if (showCamera) {
    return (
      <div className="tech-app">
        <Camera
          onCapture={handlePhotoCapture}
          title={`📸 ${cameraMode.toUpperCase()} PHOTO`}
          onClose={() => setShowCamera(false)}
        />
      </div>
    )
  }

  return (
    <div className="tech-app">
      <header className="tech-header">
        <h1>🔧 Technician Dashboard</h1>
        <div className="tech-info">
          <img src={user?.avatar_url || '/default-avatar.png'} className="tech-avatar" />
          <span className="tech-name">👤 {user?.full_name || 'Technician'}</span>
          <button onClick={onLogout} className="btn-logout-tech">🚪 Logout</button>
        </div>
      </header>

      <StatsGrid appointments={appointments} />

      {screen === 'appointments' && (
        <main className="tech-main">
          <div className="screen-header">
            <h2>📋 Assigned Jobs</h2>
            <p>{appointments.length} jobs</p>
          </div>

          <div className="status-filter">
            {['all','assigned','in_progress','completed'].map(s => (
              <button
                key={s}
                className={`filter-btn ${activeFilter === s ? 'active' : ''}`}
                onClick={() => setActiveFilter(s)}
              >
                {s.replace('_',' ')}
              </button>
            ))}
          </div>

          <div className="appointments-list">
            {getFilteredAppointments().map(apt => (
              <div
                key={apt.id}
                className="appointment-card"
                onClick={() => handleAppointmentClick(apt)}
              >
                <div className="apt-header">
                  <h3>{apt.service}</h3>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(apt.status) }}
                  >
                    {apt.status}
                  </span>
                </div>

                <div className="apt-details">
                  <div className="detail-row">👤 {apt.full_name}</div>
                  <div className="detail-row">📅 {apt.date} @ {apt.time}</div>
                  <div className="detail-row">📍 {apt.address}</div>
                  <div className="detail-row">❄️ {apt.room_area} m²</div>
                </div>

                {apt.status !== 'completed' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); startWork(apt) }}
                    className="btn-start-work"
                  >
                    🚀 Start Work
                  </button>
                )}
              </div>
            ))}
          </div>
        </main>
      )}

      {screen === 'details' && selectedAppointment && (
        <main className="tech-main">
          <button onClick={() => setScreen('appointments')} className="btn-back">← Back</button>

          <div className="apt-full-details">
            <h2>{selectedAppointment.service}</h2>
            <p>{selectedAppointment.address}</p>

            <div className="detail-card">
              <p><b>Customer:</b> {selectedAppointment.full_name}</p>
              <p><b>Phone:</b> {selectedAppointment.mobile_number}</p>
              <p><b>Date:</b> {selectedAppointment.date}</p>
              <p><b>Time:</b> {selectedAppointment.time}</p>
              <p><b>Unit Area:</b> {selectedAppointment.room_area} m²</p>
              <p><b>Notes:</b> {selectedAppointment.notes}</p>
            </div>

            {selectedAppointment.status !== 'completed' && (
              <button
                onClick={() => setScreen('photos')}
                className="btn-start-work-full"
              >
                📸 Work Photos & Notes
              </button>
            )}
          </div>
        </main>
      )}

      {screen === 'photos' && selectedAppointment && (
        <main className="tech-main">
          <button onClick={() => setScreen('details')} className="btn-back">← Back</button>

          <div className="work-log">
            <h2>📸 Work Documentation</h2>

            <div className="photos-grid">
              {workPhotos.map(p => (
                <div key={p.id} className="photo-item">
                  <img src={p.url} alt="" />
                  <div className="photo-label">{p.type}</div>
                </div>
              ))}
            </div>

            <div className="actions">
              {!workPhotos.find(p=>p.type==='before') && (
                <button onClick={()=>{ setCameraMode('before'); setShowCamera(true) }} className="btn-add-photo">📸 Start Work Photo</button>
              )}
              {workPhotos.find(p=>p.type==='before') && !workPhotos.find(p=>p.type==='after') && (
                <button onClick={()=>{ setCameraMode('after'); setShowCamera(true) }} className="btn-end-work">🛑 End Work Photo</button>
              )}
              {workPhotos.find(p=>p.type==='before') && workPhotos.find(p=>p.type==='after') && (
                <button onClick={completeJob} className="btn-complete-job">✓ Complete Job</button>
              )}
            </div>

            <div className="notes-section">
              <h3>📝 Notes</h3>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="notes-input"
              />
            </div>
          </div>
        </main>
      )}
    </div>
  )
}
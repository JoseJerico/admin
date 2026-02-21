import React, { useState, useEffect } from 'react'
import Camera from '../shared/Camera'
import './TechnicianApp.css'

const SAMPLE_APPOINTMENTS = [
  {
    id: 1,
    customerName: 'Juan Dela Cruz',
    address: '123 Main St, Manila',
    phone: '09171234567',
    service: 'AC Installation',
    status: 'scheduled',
    date: '2026-02-21',
    time: '10:00 AM',
    unit: '2 Ton Split AC',
    notes: 'Customer has existing wiring',
  },
  {
    id: 2,
    customerName: 'Maria Garcia',
    address: '456 Oak Ave, Makati',
    phone: '09209876543',
    service: 'AC Maintenance',
    status: 'scheduled',
    date: '2026-02-21',
    time: '2:00 PM',
    unit: '1.5 Ton Split AC',
    notes: 'Regular maintenance',
  },
  {
    id: 3,
    customerName: 'Roberto Santos',
    address: '789 Pine Rd, Quezon City',
    phone: '09161111111',
    service: 'AC Repair',
    status: 'in-progress',
    date: '2026-02-21',
    time: '1:30 PM',
    unit: '3 Ton Split AC',
    notes: 'Not cooling properly',
  },
]

export default function TechnicianApp({ user, onLogout }) {
  const [screen, setScreen] = useState('appointments') // appointments, details, camera, photos
  const [appointments, setAppointments] = useState(SAMPLE_APPOINTMENTS)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [showCamera, setShowCamera] = useState(false)
  const [workPhotos, setWorkPhotos] = useState([])
  const [notes, setNotes] = useState('')
  const [cameraMode, setCameraMode] = useState('before') // before, during, after

  function handleAppointmentClick(appointment) {
    setSelectedAppointment(appointment)
    setScreen('details')
  }

  function startWork(appointment) {
    setSelectedAppointment(appointment)
    setWorkPhotos([])
    setNotes('')
    setCameraMode('before')
    setShowCamera(true)
  }

  function handlePhotoCapture(data) {
    const photo = {
      id: Date.now(),
      type: cameraMode,
      url: data.photo,
      timestamp: new Date().toLocaleTimeString()
    }
    setWorkPhotos([...workPhotos, photo])
    
    if (cameraMode === 'before') {
      setCameraMode('during')
    } else if (cameraMode === 'during') {
      setCameraMode('after')
    } else {
      setShowCamera(false)
    }
  }

  function completeJob() {
    if (selectedAppointment) {
      setAppointments(appointments.map(apt => 
        apt.id === selectedAppointment.id 
          ? { ...apt, status: 'completed' }
          : apt
      ))
      setSelectedAppointment(null)
      setWorkPhotos([])
      setNotes('')
      setScreen('appointments')
    }
  }

  function getStatusColor(status) {
    switch(status) {
      case 'scheduled': return '#f59e0b'
      case 'in-progress': return '#3b82f6'
      case 'completed': return '#10b981'
      default: return '#6b7280'
    }
  }

  if (showCamera) {
    return (
      <div className="tech-app">
        <Camera 
          onCapture={handlePhotoCapture} 
          title={`📸 ${cameraMode.charAt(0).toUpperCase() + cameraMode.slice(1)} Work Photo`} 
          mode="photo"
        />
        <button 
          onClick={() => setShowCamera(false)} 
          className="btn-close-camera"
          title="Close camera"
        >
          ✕
        </button>
      </div>
    )
  }

  return (
    <div className="tech-app">
      {/* Header */}
      <header className="tech-header">
        <h1>🔧 Technician Portal</h1>
        <div className="tech-info">
          <span className="tech-name">👤 {user?.name || 'Tech User'}</span>
          <button onClick={onLogout} className="btn-logout-tech">🚪 Logout</button>
        </div>
      </header>

      {/* Appointments List */}
      {screen === 'appointments' && (
        <main className="tech-main">
          <div className="screen-header">
            <h2>📋 Assigned Jobs</h2>
            <p>{appointments.length} appointments</p>
          </div>

          <div className="status-filter">
            <button className="filter-btn active">All</button>
            <button className="filter-btn">Scheduled</button>
            <button className="filter-btn">In Progress</button>
            <button className="filter-btn">Completed</button>
          </div>

          <div className="appointments-list">
            {appointments.map(apt => (
              <div 
                key={apt.id} 
                className={`appointment-card status-${apt.status}`}
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
                  <div className="detail-row">
                    <span className="label">👤 Customer:</span>
                    <span>{apt.customerName}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">📅 Date/Time:</span>
                    <span>{apt.date} @ {apt.time}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">📍 Location:</span>
                    <span>{apt.address}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">❄️ Unit:</span>
                    <span>{apt.unit}</span>
                  </div>
                </div>

                {apt.status !== 'completed' && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      startWork(apt)
                    }}
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

      {/* Appointment Details */}
      {screen === 'details' && selectedAppointment && (
        <main className="tech-main">
          <button onClick={() => setScreen('appointments')} className="btn-back">← Back</button>

          <div className="apt-full-details">
            <div className="detail-section">
              <h2>{selectedAppointment.service}</h2>
              <p className="detail-address">{selectedAppointment.address}</p>
            </div>

            <div className="detail-card">
              <h3>👤 Customer Information</h3>
              <div className="detail-item">
                <span className="label">Name:</span>
                <span>{selectedAppointment.customerName}</span>
              </div>
              <div className="detail-item">
                <span className="label">Phone:</span>
                <a href={`tel:${selectedAppointment.phone}`} className="link">
                  {selectedAppointment.phone}
                </a>
              </div>
              <div className="detail-item">
                <span className="label">Address:</span>
                <span>{selectedAppointment.address}</span>
              </div>
            </div>

            <div className="detail-card">
              <h3>⏰ Schedule</h3>
              <div className="detail-item">
                <span className="label">Date:</span>
                <span>{selectedAppointment.date}</span>
              </div>
              <div className="detail-item">
                <span className="label">Time:</span>
                <span>{selectedAppointment.time}</span>
              </div>
            </div>

            <div className="detail-card">
              <h3>❄️ AC Unit</h3>
              <div className="detail-item">
                <span className="label">Model:</span>
                <span>{selectedAppointment.unit}</span>
              </div>
              <div className="detail-item">
                <span className="label">Notes:</span>
                <span className="notes">{selectedAppointment.notes}</span>
              </div>
            </div>

            {selectedAppointment.status !== 'completed' && (
              <div className="actions">
                <button 
                  onClick={() => startWork(selectedAppointment)}
                  className="btn-start-work-full"
                >
                  📸 Take Work Photos & Notes
                </button>
              </div>
            )}

            {selectedAppointment.status === 'completed' && (
              <div className="completed-badge">✓ Job Completed</div>
            )}
          </div>
        </main>
      )}

      {/* Work Photos & Notes */}
      {screen === 'photos' && selectedAppointment && (
        <main className="tech-main">
          <button onClick={() => setScreen('details')} className="btn-back">← Back</button>

          <div className="work-log">
            <h2>📸 Work Documentation</h2>
            <p className="job-title">{selectedAppointment.service} - {selectedAppointment.customerName}</p>

            <div className="photos-section">
              <h3>Photos</h3>
              {workPhotos.length === 0 ? (
                <div className="no-photos">
                  <p>📷 No photos yet</p>
                  <button onClick={() => setShowCamera(true)} className="btn-add-photo">
                    📸 Add Photo
                  </button>
                </div>
              ) : (
                <>
                  <div className="photos-grid">
                    {workPhotos.map(photo => (
                      <div key={photo.id} className="photo-item">
                        <img src={photo.url} alt={`Work ${photo.type}`} />
                        <div className="photo-label">
                          <span className="photo-type">{photo.type}</span>
                          <span className="photo-time">{photo.timestamp}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {workPhotos.length < 3 && (
                    <button onClick={() => setShowCamera(true)} className="btn-add-more-photos">
                      ➕ Add More Photos
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="notes-section">
              <h3>📝 Work Notes</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Document what was done, any issues found, parts replaced, etc."
                className="notes-input"
              />
            </div>

            <div className="actions">
              <button 
                onClick={completeJob}
                disabled={workPhotos.length === 0 || !notes.trim()}
                className="btn-complete-job"
              >
                ✓ Complete Job
              </button>
            </div>
          </div>
        </main>
      )}

      {/* Bottom Navigation */}
      {screen === 'appointments' && (
        <nav className="bottom-nav-tech">
          <button className="nav-item active">
            📋 Jobs ({appointments.filter(a => a.status !== 'completed').length})
          </button>
          <button className="nav-item">
            ✓ Completed ({appointments.filter(a => a.status === 'completed').length})
          </button>
          <button className="nav-item">⚙️ Settings</button>
        </nav>
      )}
    </div>
  )
}

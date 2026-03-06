import React, { useState, useEffect } from 'react'
import Camera from '../shared/Camera'
import { supabase } from '../supabase'
import './TechnicianApp.css'

export default function TechnicianApp({ user, onLogout }) {
  const [screen, setScreen] = useState('appointments')
  const [appointments, setAppointments] = useState([])
  const [selectedAppointment, setSelectedAppointment] = useState(null)

  const [showCamera, setShowCamera] = useState(false)
  const [workPhotos, setWorkPhotos] = useState([])
  const [notes, setNotes] = useState('')
  const [cameraMode, setCameraMode] = useState('before')
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    if (user?.id) {
      loadJobs()
    }
  }, [user])

  async function loadJobs() {
    const { data, error } = await supabase
      .from('jobs')
      .select(`
        id,
        status,
        notes,
        work_photos,
        schedules (
          id,
          customer_name,
          address,
          phone,
          service,
          requested_date,
          requested_time,
          unit,
          notes
        )
      `)
      .eq('technician_id', user.id)
      .order('id', { ascending: false })

    if (error) {
      console.error(error)
      return
    }

    const mapped = data.map(j => ({
      job_id: j.id,
      status: j.status,
      notes: j.notes,
      work_photos: j.work_photos || [],
      schedule: j.schedules
    }))

    setAppointments(mapped)
  }

  function handleAppointmentClick(apt) {
    setSelectedAppointment(apt)
    setWorkPhotos(apt.work_photos || [])
    setNotes(apt.notes || '')
    setScreen('details')
  }

  async function startWork(apt) {
    await supabase
      .from('jobs')
      .update({ status: 'in_progress' })
      .eq('id', apt.job_id)

    setSelectedAppointment({
      ...apt,
      status: 'in_progress'
    })

    setCameraMode('before')
    setShowCamera(true)
    loadJobs()
  }

  function handlePhotoCapture(data) {
    const photo = {
      id: Date.now(),
      type: cameraMode,
      url: data.photo,
      timestamp: new Date().toISOString()
    }

    const updated = [...workPhotos, photo]
    setWorkPhotos(updated)

    if (cameraMode === 'before') setCameraMode('during')
    else if (cameraMode === 'during') setCameraMode('after')
    else setShowCamera(false)
  }

  async function completeJob() {
    if (!selectedAppointment) return

    const { error } = await supabase
      .from('jobs')
      .update({
        status: 'completed',
        notes,
        work_photos: workPhotos
      })
      .eq('id', selectedAppointment.job_id)

    if (error) {
      console.error(error)
      alert('Failed to complete job')
      return
    }

    setSelectedAppointment(null)
    setWorkPhotos([])
    setNotes('')
    setScreen('appointments')
    loadJobs()
  }

  function getFilteredAppointments() {
    if (activeFilter === 'all') return appointments
    return appointments.filter(a => a.status === activeFilter)
  }

  function getStatusColor(status) {
    switch (status) {
      case 'assigned': return '#f59e0b'
      case 'in_progress': return '#3b82f6'
      case 'completed': return '#10b981'
      default: return '#6b7280'
    }
  }

  if (showCamera) {
    return (
      <div className="tech-app">
        <Camera
          onCapture={handlePhotoCapture}
          title={`📸 ${cameraMode.toUpperCase()} PHOTO`}
          mode="photo"
        />
        <button
          onClick={() => setShowCamera(false)}
          className="btn-close-camera"
        >
          ✕
        </button>
      </div>
    )
  }

  return (
    <div className="tech-app">
      <header className="tech-header">
        <h1>🔧 Technician Portal</h1>
        <div className="tech-info">
          <span className="tech-name">👤 {user?.name}</span>
          <button onClick={onLogout} className="btn-logout-tech">🚪 Logout</button>
        </div>
      </header>

      {screen === 'appointments' && (
        <main className="tech-main">
          <div className="screen-header">
            <h2>📋 Assigned Jobs</h2>
            <p>{appointments.length} jobs</p>
          </div>

          <div className="status-filter">
            {['all', 'assigned', 'in_progress', 'completed'].map(s => (
              <button
                key={s}
                className={`filter-btn ${activeFilter === s ? 'active' : ''}`}
                onClick={() => setActiveFilter(s)}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="appointments-list">
            {getFilteredAppointments().map(apt => (
              <div
                key={apt.job_id}
                className="appointment-card"
                onClick={() => handleAppointmentClick(apt)}
              >
                <div className="apt-header">
                  <h3>{apt.schedule?.service}</h3>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(apt.status) }}
                  >
                    {apt.status}
                  </span>
                </div>

                <div className="apt-details">
                  <div className="detail-row">
                    👤 {apt.schedule?.customer_name}
                  </div>
                  <div className="detail-row">
                    📅 {apt.schedule?.requested_date} @ {apt.schedule?.requested_time}
                  </div>
                  <div className="detail-row">
                    📍 {apt.schedule?.address}
                  </div>
                  <div className="detail-row">
                    ❄️ {apt.schedule?.unit}
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

      {screen === 'details' && selectedAppointment && (
        <main className="tech-main">
          <button onClick={() => setScreen('appointments')} className="btn-back">← Back</button>

          <div className="apt-full-details">
            <h2>{selectedAppointment.schedule?.service}</h2>
            <p>{selectedAppointment.schedule?.address}</p>

            <div className="detail-card">
              <p><b>Customer:</b> {selectedAppointment.schedule?.customer_name}</p>
              <p><b>Phone:</b> {selectedAppointment.schedule?.phone}</p>
              <p><b>Date:</b> {selectedAppointment.schedule?.requested_date}</p>
              <p><b>Time:</b> {selectedAppointment.schedule?.requested_time}</p>
              <p><b>Unit:</b> {selectedAppointment.schedule?.unit}</p>
              <p><b>Notes:</b> {selectedAppointment.schedule?.notes}</p>
            </div>

            {selectedAppointment.status !== 'completed' && (
              <button
                onClick={() => {
                  setScreen('photos')
                }}
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

            <button
              onClick={() => setShowCamera(true)}
              className="btn-add-photo"
            >
              ➕ Add Photo
            </button>

            <div className="notes-section">
              <h3>📝 Notes</h3>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="notes-input"
              />
            </div>

            <div className="actions">
              <button
                onClick={completeJob}
                disabled={!notes.trim() || workPhotos.length === 0}
                className="btn-complete-job"
              >
                ✓ Complete Job
              </button>
            </div>
          </div>
        </main>
      )}
    </div>
  )
}
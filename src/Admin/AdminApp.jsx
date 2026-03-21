import React, { useEffect, useState } from 'react'
import Login from '../Login'
import EditAppointment from '../EditAppointment'
import InstallPrompt from '../InstallPrompt'
import './AdminApp.css'
import { supabase } from '../supabase'

export default function AdminApp({ user, onLogout }) {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')
  const [editingAppointment, setEditingAppointment] = useState(null)
  const [technicians, setTechnicians] = useState([])
  const [selectedSchedule, setSelectedSchedule] = useState(null)

  function AssignTechnicianModal({ schedule, technicians, onClose, onAssign }) {
    const [techId, setTechId] = React.useState('')
    const [scheduledDate, setScheduledDate] = React.useState('')
    return (
      <div className="modal">
        <h3>Assign Technician for {schedule.full_name}</h3>
        <select value={techId} onChange={e => setTechId(e.target.value)}>
          <option value="">Select Technician</option>
          {technicians.map(t => (
            <option key={t.id} value={t.id}>{t.name} ({t.contact})</option>
          ))}
        </select>
        <input type="datetime-local" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} />
        <button onClick={() => onAssign(schedule.id, techId, scheduledDate)}>Assign</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    )
  }

  useEffect(() => { load() }, [])
  useEffect(() => { fetchTechnicians() }, [])

  async function fetchTechnicians() {
    const { data, error } = await supabase.from('technicians').select('*')
    if (error) console.error('Error fetching technicians:', error)
    else setTechnicians(data)
  }

  async function load() {
    setLoading(true)
    const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false })
    if (error) console.error(error)
    else setSchedules(data || [])
    setLoading(false)
  }

  async function approve(id) {
    const { error } = await supabase.from('bookings').update({ status: 'approved' }).eq('id', id)
    if (error) { console.error(error); alert('Failed to approve booking'); return }
    load()
  }

  async function reject(id) {
    const { error } = await supabase.from('bookings').update({ status: 'rejected' }).eq('id', id)
    if (error) { console.error(error); alert('Failed to reject booking'); return }
    load()
  }

  async function assignTech(scheduleId, technicianId, scheduleDate) {
    const tech = technicians.find(t => t.id === technicianId)
    if (!tech) return alert('Select a technician')
    const { error } = await supabase.from('bookings').update({
      technician_id: tech.id,
      technician_name: tech.name,
      technician_contact: tech.contact,
      status: 'assigned',
      scheduled_date: scheduleDate
    }).eq('id', scheduleId)
    if (error) console.error('Error assigning technician:', error)
    else load()
    setSelectedSchedule(null)
  }

  async function handleEditAppointment(updatedData) {
    if (!editingAppointment) return
    const { error } = await supabase.from('bookings').update({
      full_name: updatedData.full_name,
      service: updatedData.service,
      date: updatedData.date,
      time: updatedData.time,
      mobile_number: updatedData.mobile_number,
      address: updatedData.address,
      status: updatedData.status
    }).eq('id', editingAppointment.id)
    if (error) { console.error(error); alert('Error updating booking'); return }
    setEditingAppointment(null)
    load()
  }

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
            <th>Scheduled Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map(s => (
            <tr key={s.id}>
              <td>#{s.id}</td>
              <td>{s.full_name || 'N/A'}</td>
              <td>{s.service || 'N/A'}</td>
              <td>{s.date ? new Date(s.date).toLocaleDateString() : '—'} | {s.time || '—'}</td>
              <td>{s.mobile_number || 'N/A'}</td>
              <td>{s.address || 'N/A'}</td>
              <td>{s.technician_name || 'Not assigned'}</td>
              <td>{s.scheduled_date ? new Date(s.scheduled_date).toLocaleString() : 'Not set'}</td>
              <td><span className={`status-badge status-${s.status}`}>{s.status}</span></td>
              <td className="actions-cell">
                <button onClick={() => setEditingAppointment(s)} className="btn btn-edit">✏️ Edit</button>
                {s.status === 'pending' && <>
                  <button onClick={() => approve(s.id)} className="btn btn-approve">✓ Approve</button>
                  <button onClick={() => reject(s.id)} className="btn btn-reject">✗ Reject</button>
                </>}
                {s.status === 'approved' && <button onClick={() => setSelectedSchedule(s)} className="btn btn-assign">👤 Assign</button>}
                {s.status === 'assigned' && <span className="status-text">Assigned</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>🔧 Aircon Admin Dashboard</h1>
          <div className="header-actions">
            <span className="user-info">👤 {user?.name || 'Admin'}</span>
            <button onClick={load} disabled={loading} className="btn-refresh">{loading ? 'Loading...' : 'Refresh'}</button>
            <button onClick={onLogout} className="btn-logout">Logout</button>
          </div>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card"><div className="stat-value">{schedules.length}</div><div className="stat-label">Total Bookings</div></div>
        <div className="stat-card pending"><div className="stat-value">{schedules.filter(s => s.status === 'pending').length}</div><div className="stat-label">Pending</div></div>
        <div className="stat-card approved"><div className="stat-value">{schedules.filter(s => s.status === 'approved').length}</div><div className="stat-label">Approved</div></div>
        <div className="stat-card assigned"><div className="stat-value">{schedules.filter(s => s.status === 'assigned').length}</div><div className="stat-label">Assigned</div></div>
      </div>

      <div className="filter-tabs">
        {['all','pending','approved','assigned','rejected'].map(status => (
          <button key={status} onClick={() => setFilter(status)} className={`tab ${filter===status?'active':''}`}>{status.charAt(0).toUpperCase()+status.slice(1)}</button>
        ))}
      </div>

      <div className="schedules-container">
        {filter==='all' ? (schedules.length===0 ? <div className="empty-state"><div className="empty-icon">📋</div>No schedules found</div> : renderTable(schedules))
        : (schedules.filter(s => s.status===filter).length===0 ? <div className="empty-state"><div className="empty-icon">📋</div>No {filter} schedules</div> : renderTable(schedules.filter(s => s.status===filter)))}
      </div>

      {selectedSchedule && <AssignTechnicianModal schedule={selectedSchedule} technicians={technicians} onClose={() => setSelectedSchedule(null)} onAssign={assignTech} />}
      {editingAppointment && <EditAppointment appointment={editingAppointment} onSave={handleEditAppointment} onClose={() => setEditingAppointment(null)} />}
      <InstallPrompt />
    </div>
  )
}
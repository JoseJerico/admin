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

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)

    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
    } else {
      setSchedules(data || [])
    }

    setLoading(false)
  }

  async function approve(id) {
    const { error } = await supabase
      .from('schedules')
      .update({ status: 'approved' })
      .eq('id', id)

    if (error) {
      console.error(error)
      alert('Failed to approve schedule')
      return
    }

    load()
  }

  async function reject(id) {
    const { error } = await supabase
      .from('schedules')
      .update({ status: 'rejected' })
      .eq('id', id)

    if (error) {
      console.error(error)
      alert('Failed to reject schedule')
      return
    }

    load()
  }

  async function assignTech(id) {

    const techId = prompt('Technician user_id to assign:')
    if (!techId) return

    const { error: jobError } = await supabase
      .from('jobs')
      .insert([
        {
          schedule_id: id,
          technician_id: techId,
          status: 'assigned'
        }
      ])

    if (jobError) {
      console.error(jobError)
      alert('Failed to assign technician')
      return
    }

    const { error: schedError } = await supabase
      .from('schedules')
      .update({ status: 'assigned' })
      .eq('id', id)

    if (schedError) {
      console.error(schedError)
      alert('Failed to update schedule')
      return
    }

    load()
  }

  async function handleEditAppointment(updatedData) {

    if (!editingAppointment) return

    const { error } = await supabase
      .from('schedules')
      .update({
        customer_name: updatedData.customer_name,
        requested_date: updatedData.requested_date,
        status: updatedData.status,
        notes: updatedData.notes,
      })
      .eq('id', editingAppointment.id)

    if (error) {
      console.error(error)
      alert('Error updating appointment')
      return
    }

    setEditingAppointment(null)
    load()
  }

  function renderTable(data) {
    return (
      <table className="schedules-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Customer</th>
            <th>Requested Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.map(s => (
            <tr key={s.id}>
              <td className="id-cell">#{s.id}</td>
              <td>{s.customer_name || 'N/A'}</td>
              <td>
                {s.requested_date
                  ? new Date(s.requested_date).toLocaleDateString()
                  : '—'}
              </td>
              <td>
                <span className={`status-badge status-${s.status}`}>
                  {s.status}
                </span>
              </td>
              <td className="actions-cell">
                <button
                  onClick={() => setEditingAppointment(s)}
                  className="btn btn-edit"
                >
                  ✏️ Edit
                </button>

                {s.status === 'pending' && (
                  <>
                    <button
                      onClick={() => approve(s.id)}
                      className="btn btn-approve"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => reject(s.id)}
                      className="btn btn-reject"
                    >
                      ✗ Reject
                    </button>
                  </>
                )}

                {s.status === 'approved' && (
                  <button
                    onClick={() => assignTech(s.id)}
                    className="btn btn-assign"
                  >
                    👤 Assign
                  </button>
                )}

                {s.status === 'assigned' && (
                  <span className="status-text">Assigned</span>
                )}
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
            <button
              onClick={load}
              disabled={loading}
              className="btn-refresh"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
            <button onClick={onLogout} className="btn-logout">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{schedules.length}</div>
          <div className="stat-label">Total Schedules</div>
        </div>
        <div className="stat-card pending">
          <div className="stat-value">
            {schedules.filter(s => s.status === 'pending').length}
          </div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card approved">
          <div className="stat-value">
            {schedules.filter(s => s.status === 'approved').length}
          </div>
          <div className="stat-label">Approved</div>
        </div>
        <div className="stat-card assigned">
          <div className="stat-value">
            {schedules.filter(s => s.status === 'assigned').length}
          </div>
          <div className="stat-label">Assigned</div>
        </div>
      </div>

      <div className="filter-tabs">
        {['all', 'pending', 'approved', 'assigned', 'rejected'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`tab ${filter === status ? 'active' : ''}`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      <div className="schedules-container">
        {filter === 'all'
          ? schedules.length === 0
            ? <div className="empty-state"><div className="empty-icon">📋</div>No schedules found</div>
            : renderTable(schedules)
          : schedules.filter(s => s.status === filter).length === 0
            ? <div className="empty-state"><div className="empty-icon">📋</div>No {filter} schedules</div>
            : renderTable(schedules.filter(s => s.status === filter))
        }
      </div>

      {editingAppointment && (
        <EditAppointment
          appointment={editingAppointment}
          onSave={handleEditAppointment}
          onClose={() => setEditingAppointment(null)}
        />
      )}

      <InstallPrompt />
    </div>
  )
}
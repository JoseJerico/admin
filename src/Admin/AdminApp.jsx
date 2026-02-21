import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Login from '../Login'
import EditAppointment from '../EditAppointment'
import InstallPrompt from '../InstallPrompt'
import './AdminApp.css'

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qwqzejzwdzqapjkqadjt.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3cXplanp3ZHpxYXBqa3FhZGp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNzA1MDksImV4cCI6MjA4NTc0NjUwOX0.JV36saRgJtP-zKwI86RzjWQRmuwVo9wAqNpyoVSJm3A'
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export default function AdminApp({ user, onLogout }) {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')
  const [editingAppointment, setEditingAppointment] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase.from('schedules').select('*').order('created_at', { ascending: false })
    if (!error) setSchedules(data || [])
    setLoading(false)
  }

  async function approve(id) {
    await supabase.from('schedules').update({ status: 'approved' }).eq('id', id)
    load()
  }

  async function reject(id) {
    await supabase.from('schedules').update({ status: 'rejected' }).eq('id', id)
    load()
  }

  async function assignTech(id) {
    const techId = prompt('Technician user_id to assign:')
    if (!techId) return
    await supabase.from('jobs').insert([{ schedule_id: id, technician_id: techId, status: 'assigned' }])
    await supabase.from('schedules').update({ status: 'assigned' }).eq('id', id)
    load()
  }

  async function handleEditAppointment(updatedData) {
    if (!editingAppointment) return
    try {
      const { error } = await supabase
        .from('schedules')
        .update({
          customer_name: updatedData.customer_name,
          requested_date: updatedData.requested_date,
          status: updatedData.status,
          notes: updatedData.notes,
        })
        .eq('id', editingAppointment.id)

      if (!error) {
        setEditingAppointment(null)
        load()
      }
    } catch (error) {
      console.error('Error updating appointment:', error)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>🔧 Aircon Admin Dashboard</h1>
          <div className="header-actions">
            <span className="user-info">👤 {user.name}</span>
            <button onClick={load} disabled={loading} className="btn-refresh">
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
          <div className="stat-value">{schedules.filter(s => s.status === 'pending').length}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card approved">
          <div className="stat-value">{schedules.filter(s => s.status === 'approved').length}</div>
          <div className="stat-label">Approved</div>
        </div>
        <div className="stat-card assigned">
          <div className="stat-value">{schedules.filter(s => s.status === 'assigned').length}</div>
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
              <td>{new Date(s.requested_date).toLocaleDateString()}</td>
              <td>
                <span className={`status-badge status-${s.status}`}>
                  {s.status}
                </span>
              </td>
              <td className="actions-cell">
                <button
                  onClick={() => setEditingAppointment(s)}
                  className="btn btn-edit"
                  title="Edit appointment"
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
}

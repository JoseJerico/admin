import React, { useState } from 'react'
import { supabase } from './supabase'
import './RoleSelector.css'

export default function RoleSelector({ onRoleSelect }) {
  const [selectedRole, setSelectedRole] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [confirmPassword, setConfirmPassword] = useState('')
  const [adminAccessGranted, setAdminAccessGranted] = useState(false)
  const [showAdminPin, setShowAdminPin] = useState(false)
  const [adminPin, setAdminPin] = useState('')
  const [pinError, setPinError] = useState('')

  const ADMIN_PIN = '8888'

  const roles = [
    { id: 'user', name: 'Customer', icon: '👤', description: 'Browse & book services', color: '#10b981' },
    { id: 'technician', name: 'Technician', icon: '🔧', description: 'View jobs & work updates', color: '#3b82f6' }
  ]

  if (adminAccessGranted) {
    roles.unshift({ id: 'admin', name: 'Admin', icon: '👨‍💼', description: 'Manage schedules and technicians', color: '#667eea' })
  }

  async function handleLogin() {
    if (!email || !password) {
      alert('Please enter email and password')
      return
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      alert(`Login failed: ${error.message}`)
      return
    }

    // Fetch profile with role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, role_id, roles(name)')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      alert(`Profile fetch failed: ${profileError.message}`)
      return
    }

    onRoleSelect(profile.roles.name, { email, name: profile.full_name || email.split('@')[0] })
  }

  async function handleRegister() {
    if (!email || !password || !confirmPassword) {
      alert('Please fill in all fields')
      return
    }
    if (password.length < 6) {
      alert('Password must be at least 6 characters')
      return
    }
    if (password !== confirmPassword) {
      alert('Passwords do not match')
      return
    }

    // 1. Sign up in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })
    if (authError) {
      alert(`Signup failed: ${authError.message}`)
      return
    }

    const userId = authData.user.id

    // 2. Get role_id from roles table
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', selectedRole)
      .single()

    if (roleError) {
      alert(`Role lookup failed: ${roleError.message}`)
      return
    }

    // 3. Insert into profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: userId,
        role_id: roleData.id,
        full_name: email.split('@')[0],
        username: email.split('@')[0]
      }])

    if (profileError) {
      alert(`Profile insert failed: ${profileError.message}`)
      return
    }

    onRoleSelect(selectedRole, { email, name: email.split('@')[0] })
  }

  function handleAdminPinSubmit() {
    if (!adminPin) {
      setPinError('Please enter the PIN')
      return
    }
    if (adminPin === ADMIN_PIN) {
      setAdminAccessGranted(true)
      setShowAdminPin(false)
      setAdminPin('')
      setPinError('')
    } else {
      setPinError('❌ Incorrect PIN')
      setAdminPin('')
    }
  }

  function handleOpenAdminAccess() {
    setShowAdminPin(true)
    setPinError('')
    setAdminPin('')
  }

  function handleCloseAdminPin() {
    setShowAdminPin(false)
    setPinError('')
    setAdminPin('')
  }

  if (selectedRole) {
    const role = roles.find(r => r.id === selectedRole)
    return (
      <div className="role-selector">
        <div className="login-container">
          <button onClick={() => setSelectedRole(null)} className="btn-back-role">← Back</button>

          <div className="login-box" style={{ borderTopColor: role.color }}>
            <div className="login-header">
              <div className="login-icon">{role.icon}</div>
              <h1>{isRegistering && selectedRole !== 'technician' ? 'Sign Up' : 'Login'} as {role.name}</h1>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                isRegistering && selectedRole !== 'technician' ? handleRegister() : handleLogin()
              }}
              className="login-form"
            >
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={`${role.id}@aircon.com`} />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
              </div>

              {isRegistering && selectedRole !== 'technician' && (
                <div className="form-group">
                  <label>Confirm Password</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" />
                </div>
              )}

              <button type="submit" className="btn-login-role">
                {isRegistering && selectedRole !== 'technician' ? 'Sign Up' : 'Login'}
              </button>
            </form>

            {selectedRole !== 'technician' && (
              <div className="login-toggle-section">
                <p className="toggle-text">
                  {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
                  <button type="button" onClick={() => { setIsRegistering(!isRegistering); setConfirmPassword('') }} className="toggle-btn">
                    {isRegistering ? 'Login' : 'Sign Up'}
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="role-selector">
      <div className="selector-container">
        <div className="selector-header">
          <div className="logo">❄️</div>
          <h1>RoomChill Advisor</h1>
          <p>Smart Cooling Solutions</p>
        </div>

        {showAdminPin && (
          <div className="admin-pin-modal">
            <div className="admin-pin-box">
              <h2>🔐 Admin Access</h2>
              <p>Enter PIN to access admin portal</p>
              <div className="pin-input-group">
                <input type="password" value={adminPin} onChange={(e) => { setAdminPin(e.target.value); setPinError('') }} onKeyPress={(e) => { if (e.key === 'Enter') handleAdminPinSubmit() }} placeholder="Enter 4-digit PIN" maxLength="4" className="pin-input" autoFocus />
                {pinError && <p className="pin-error">{pinError}</p>}
              </div>
              <div className="pin-buttons">
                <button onClick={handleAdminPinSubmit} className="btn-pin-submit">Verify</button>
                <button onClick={handleCloseAdminPin} className="btn-pin-cancel">Cancel</button>
              </div>
            </div>
          </div>
        )}

        <div className="selector-content">
          <h2>Who are you?</h2>
          <p className="selector-subtitle">Choose your role to continue</p>
          <div className="role-cards">
            {roles.map(role => (
              <button key={role.id} onClick={() => setSelectedRole(role.id)} className="role-card" style={{ '--role-color': role.color }}>
                <div className="role-icon">{role.icon}</div>
                <h3>{role.name}</h3>
                <p>{role.description}</p>
              </button>
            ))}
          </div>
        </div>


        <div className="selector-footer">
          <p>🔒 Secure Portal • PWA Ready • Mobile Optimized</p>
          {!adminAccessGranted && (
            <button 
              onClick={handleOpenAdminAccess}
              className="btn-admin-access"
              title="Admin portal access"
            >
              🔑 Admin Access
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

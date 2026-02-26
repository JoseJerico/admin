import React, { useState } from 'react'
import './RoleSelector.css'
import { supabase } from './supabase'


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

  const ADMIN_PIN = '8888' // Security PIN for admin access
  const roles = [
    {
      id: 'user',
      name: 'Customer',
      icon: '👤',
      description: 'Browse & book services',
      color: '#10b981'
    },
    {
      id: 'technician',
      name: 'Technician',
      icon: '🔧',
      description: 'View jobs & work updates',
      color: '#3b82f6'
    }
  ]

  // Insert admin role only if access is granted
  if (adminAccessGranted) {
    roles.unshift({
      id: 'admin',
      name: 'Admin',
      icon: '👨‍💼',
      description: 'Manage schedules and technicians',
      color: '#667eea'
    })
  }

  function handleRoleSelect(roleId) {
    setSelectedRole(roleId)
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
  

   async function handleLogin() {
    if (!email || !password) {
      alert('Please enter email and password')
      return
    }

    if (!selectedRole) return

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      alert(error.message)
      return
    }

    onRoleSelect(selectedRole, {
      id: data.user.id,
      email: data.user.email
    })
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

    if (!email.includes('@')) {
      alert('Please enter a valid email')
      return
    }

    if (!selectedRole) return

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) {
      alert(error.message)
      return
    }

    onRoleSelect(selectedRole, {
      id: data.user.id,
      email: data.user.email
    })
  }

  function handleLogin() {
    if (!email || !password) {
      alert('Please enter email and password')
      return
    }
    if (selectedRole) {
      onRoleSelect(selectedRole, { email, name: email.split('@')[0] })
    }
  }

  function handleRegister() {
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
    if (!email.includes('@')) {
      alert('Please enter a valid email')
      return
    }
    if (selectedRole) {
      onRoleSelect(selectedRole, { email, name: email.split('@')[0] })
    }
  }

  if (selectedRole) {
    const role = roles.find(r => r.id === selectedRole)
    return (
      <div className="role-selector">
        <div className="login-container">
          <button 
            onClick={() => setSelectedRole(null)}
            className="btn-back-role"
          >
            ← Back
          </button>

          <div className="login-box" style={{ borderTopColor: role.color }}>
            <div className="login-header">
              <div className="login-icon">{role.icon}</div>
              <h1>{isRegistering && selectedRole !== 'technician' ? 'Sign Up' : 'Login'} as {role.name}</h1>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); isRegistering && selectedRole !== 'technician' ? handleRegister() : handleLogin() }} className="login-form">
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={`${role.id}@aircon.com`}
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              {isRegistering && selectedRole !== 'technician' && (
                <div className="form-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
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
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(!isRegistering)
                      setConfirmPassword('')
                    }}
                    className="toggle-btn"
                  >
                    {isRegistering ? 'Login' : 'Sign Up'}
                  </button>
                </p>
                <p className="demo-note">Demo: Use any email & password (min 6 chars)</p>
              </div>
            )}

            {selectedRole === 'technician' && (
              <p className="demo-note">Demo: Use any email & password (min 6 chars)</p>
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

        {/* Admin Pin Modal */}
        {showAdminPin && (
          <div className="admin-pin-modal">
            <div className="admin-pin-box">
              <h2>🔐 Admin Access</h2>
              <p>Enter PIN to access admin portal</p>
              
              <div className="pin-input-group">
                <input
                  type="password"
                  value={adminPin}
                  onChange={(e) => {
                    setAdminPin(e.target.value)
                    setPinError('')
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') handleAdminPinSubmit()
                  }}
                  placeholder="Enter 4-digit PIN"
                  maxLength="4"
                  className="pin-input"
                  autoFocus
                />
                {pinError && <p className="pin-error">{pinError}</p>}
              </div>

              <div className="pin-buttons">
                <button onClick={handleAdminPinSubmit} className="btn-pin-submit">
                  Verify
                </button>
                <button onClick={handleCloseAdminPin} className="btn-pin-cancel">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="selector-content">
          <h2>Who are you?</h2>
          <p className="selector-subtitle">Choose your role to continue</p>

          <div className="role-cards">
            {roles.map(role => (
              <button
                key={role.id}
                onClick={() => handleRoleSelect(role.id)}
                className="role-card"
                style={{ '--role-color': role.color }}
              >
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

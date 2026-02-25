import React, { useState } from 'react'
import './Login.css'
import { supabase } from './supabase';

async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) console.error(error);
  else console.log('Signed in:', data);
}

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Simple demo authentication - replace with real Supabase auth
    if (!email || !password) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    // For demo purposes, accept any email/password combination
    if (email && password.length >= 6) {
      onLogin({ email, id: Math.random().toString(36).substr(2, 9) })
    } else {
      setError('Invalid email or password (min 6 characters)')
    }

    setLoading(false)
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <div className="login-icon">🔧</div>
          <h1>Aircon Admin</h1>
          <p>Service Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="admin@aircon.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="btn-login">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="login-footer">
          <p className="demo-note">Demo credentials: any email, password (min 6 chars)</p>
        </div>
      </div>
    </div>
  )
}

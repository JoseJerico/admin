import React, { useState } from 'react'
import { authService } from './supabase.js'
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
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignup, setIsSignup] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignup) {
        // Sign up
        if (!email || !password || !name) {
          throw new Error('Please fill in all fields')
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters')
        }

        const { user } = await authService.signup(email, password, { name })
        
        onLogin({
          id: user.id,
          email: user.email,
          name: name,
          createdAt: user.created_at
        })
      } else {
        // Login
        if (!email || !password) {
          throw new Error('Please fill in all fields')
        }

        const { user } = await authService.login(email, password)
        
        onLogin({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || email.split('@')[0]
        })
      }
    } catch (err) {
      setError(err.message || 'Authentication failed')
      console.error('Auth error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <div className="login-icon">❄️</div>
          <h1>AirCon Hub</h1>
          <p>{isSignup ? 'Create Account' : 'Service Management System'}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {isSignup && (
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
            </div>
          )}

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
            {loading ? 'Please wait...' : isSignup ? 'Sign Up' : 'Login'}
          </button>
        </form>

        <div className="login-footer">
          <button
            type="button"
            className="toggle-auth"
            onClick={() => {
              setIsSignup(!isSignup)
              setError('')
              setEmail('')
              setPassword('')
              setName('')
            }}
            disabled={loading}
          >
            {isSignup ? 'Already have an account? Login' : "Don't have an account? Sign up"}
          </button>
        </div>

        {!isSignup && (
          <div className="demo-credentials">
            <p className="demo-title">Demo Accounts:</p>
            <code>
              Email: admin@aircon.com<br/>
              Email: customer@aircon.com<br/>
              Email: tech@aircon.com<br/>
              Password: (any 6+ char password)
            </code>
          </div>
        )}
      </div>
    </div>
  )
}

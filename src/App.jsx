import React, { useEffect, useState } from 'react'
import { supabase, authService } from './services/supabaseClient'
import RoleSelector from './RoleSelector'
import AdminApp from './Admin/AdminApp'
import UserApp from './User/UserApp'
import TechnicianApp from './Technician/TechnicianApp'
import Login from './Login'
import './App.css'

export default function App() {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authState, setAuthState] = useState('login') // 'login', 'role-select', 'app'

  // Initialize auth on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if there's an existing Supabase session
        const currentUser = await authService.getCurrentUser()
        
        if (currentUser) {
          setUser({
            id: currentUser.id,
            email: currentUser.email,
            name: currentUser.user_metadata?.name || currentUser.email.split('@')[0]
          })
          
          // Check for saved role
          const savedRole = localStorage.getItem('appRole')
          if (savedRole) {
            setRole(savedRole)
            setAuthState('app')
          } else {
            setAuthState('role-select')
          }
        } else {
          // No session - show login
          setAuthState('login')
        }
      } catch (error) {
        console.error('Auth init error:', error)
        setAuthState('login')
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Subscribe to auth changes
    const { data: { subscription } } = authService.onAuthStateChange((user) => {
      if (!user && authState === 'app') {
        // User logged out
        setUser(null)
        setRole(null)
        setAuthState('login')
        localStorage.removeItem('appRole')
        localStorage.removeItem('appUser')
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    localStorage.setItem('appUser', JSON.stringify(userData))
    setAuthState('role-select')
  }

  const handleRoleSelect = (selectedRole, userData) => {
    setRole(selectedRole)
    setUser(userData)
    localStorage.setItem('appRole', selectedRole)
    localStorage.setItem('appUser', JSON.stringify(userData))
    setAuthState('app')
  }

  const handleLogout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
    
    setUser(null)
    setRole(null)
    localStorage.removeItem('appRole')
    localStorage.removeItem('appUser')
    setAuthState('login')
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: '#f5f7fa',
        fontSize: '24px'
      }}>
        Loading...
      </div>
    )
  }

  // Show login screen
  if (authState === 'login') {
    return <Login onLogin={handleLogin} />
  }

  // Show role selector
  if (authState === 'role-select') {
    return <RoleSelector onRoleSelect={handleRoleSelect} />
  }

  // Route to appropriate app based on role
  if (role === 'admin' && user) {
    return <AdminApp user={user} onLogout={handleLogout} />
  }

  if (role === 'user' && user) {
    return <UserApp user={user} onLogout={handleLogout} />
  }

  if (role === 'technician' && user) {
    return <TechnicianApp user={user} onLogout={handleLogout} />
  }

  return null
}

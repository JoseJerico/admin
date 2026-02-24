import React, { useEffect, useState } from 'react'
import RoleSelector from './RoleSelector'
import AdminApp from './Admin/AdminApp'
import UserApp from './User/UserApp'
import TechnicianApp from './Technician/TechnicianApp'
import './App.css'
import { supabase } from './supabaseClient';

async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) console.error(error);
  else console.log('Signed in:', data);
}

export default function App() {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)

  useEffect(() => {
    const savedUser = localStorage.getItem('appUser')
    const savedRole = localStorage.getItem('appRole')
    if (savedUser && savedRole) {
      setUser(JSON.parse(savedUser))
      setRole(savedRole)
    }
  }, [])

  function handleRoleSelect(selectedRole, userData) {
    setRole(selectedRole)
    setUser(userData)
    localStorage.setItem('appRole', selectedRole)
    localStorage.setItem('appUser', JSON.stringify(userData))
  }

  function handleLogout() {
    setUser(null)
    setRole(null)
    localStorage.removeItem('appRole')
    localStorage.removeItem('appUser')
  }

  // No role selected - show role selector
  if (!role || !user) {
    return <RoleSelector onRoleSelect={handleRoleSelect} />
  }

  // Route to appropriate app based on role
  if (role === 'admin') {
    return <AdminApp user={user} onLogout={handleLogout} />
  }

  if (role === 'user') {
    return <UserApp user={user} onLogout={handleLogout} />
  }

  if (role === 'technician') {
    return <TechnicianApp user={user} onLogout={handleLogout} />
  }

  return null
}

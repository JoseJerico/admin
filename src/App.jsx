import React, { useEffect, useState } from 'react'
import RoleSelector from './RoleSelector'
import AdminApp from './Admin/AdminApp'
import UserApp from './User/UserApp'
import TechnicianApp from './Technician/TechnicianApp'
import { supabase } from './supabase'
import './App.css'

export default function App() {

  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)

  useEffect(() => {

    try {

      const savedUser = localStorage.getItem('appUser')
      const savedRole = localStorage.getItem('appRole')

      if (savedUser && savedRole) {
        setUser(JSON.parse(savedUser))
        setRole(savedRole)
      }

    } catch (e) {

      console.warn("Invalid localStorage data", e)

      localStorage.removeItem('appUser')
      localStorage.removeItem('appRole')

    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(

      async (event, session) => {

        if (session?.user) {

          setUser(prev => prev || session.user)

        } else {

          setUser(null)
          setRole(null)

          localStorage.removeItem('appUser')
          localStorage.removeItem('appRole')

        }

      }

    )

    return () => subscription.unsubscribe()

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

    supabase.auth.signOut()

  }


  // show role selector if not logged in
  if (!role || !user) {

    return <RoleSelector onRoleSelect={handleRoleSelect} />

  }


  // dashboards
  if (role === 'admin') {

    return <AdminApp user={user} onLogout={handleLogout} />

  }

  if (role === 'customer') {

    return <UserApp user={user} onLogout={handleLogout} />

  }

  if (role === 'technician') {

    return <TechnicianApp user={user} onLogout={handleLogout} />

  }


  return null

}
import React, { useState } from "react"
import { supabase } from "./supabase"
import "./RoleSelector.css"

export default function RoleSelector({ onRoleSelect }) {
  const [selectedRole, setSelectedRole] = useState(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isRegistering, setIsRegistering] = useState(false)

  const [adminAccessGranted, setAdminAccessGranted] = useState(false)
  const [showAdminPin, setShowAdminPin] = useState(false)
  const [adminPin, setAdminPin] = useState("")
  const [pinError, setPinError] = useState("")

  const ADMIN_PIN = "8888"

  const baseRoles = [
    {
      id: "customer",
      name: "Customer",
      icon: "👤",
      description: "Browse & book services",
      color: "#10b981"
    },
    {
      id: "technician",
      name: "Technician",
      icon: "🔧",
      description: "View jobs & work updates",
      color: "#3b82f6"
    }
  ]

  const roleList = adminAccessGranted
    ? [
        {
          id: "admin",
          name: "Admin",
          icon: "👨‍💼",
          description: "Manage schedules and technicians",
          color: "#667eea"
        },
        ...baseRoles
      ]
    : baseRoles

  async function handleRegister() {
    if (!email || !password) {
      alert("Email and password are required")
      return
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters")
      return
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match")
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) {
      alert(error.message)
      return
    }

    const user = data.user

    if (!user) {
      alert("Signup failed")
      return
    }

    const { data: roleData } = await supabase
      .from("roles")
      .select("id")
      .eq("name", selectedRole)
      .single()

    if (!roleData) {
      alert("Role not found in database")
      return
    }

    await supabase.from("profiles").insert({
      id: user.id,
      role_id: roleData.id
    })

    await supabase.from("user_details").insert({
      id: user.id,
      email: email
    })

    alert("Account created successfully! Please login.")
    setIsRegistering(false)
  }

  async function handleLogin() {
    if (!email || !password) {
      alert("Email and password are required")
      return
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      alert(error.message)
      return
    }

    const user = data.user

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role_id, roles(name)")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      alert("Role not found for this user")
      return
    }

    const userRole = profile.roles.name

    if (userRole !== selectedRole) {
      alert(`This account is registered as ${userRole}`)
      return
    }

    onRoleSelect(userRole)
  }

  function handleAdminPinSubmit() {
    if (!adminPin) {
      setPinError("Please enter the PIN")
      return
    }

    if (adminPin === ADMIN_PIN) {
      setAdminAccessGranted(true)
      setShowAdminPin(false)
      setAdminPin("")
      setPinError("")
    } else {
      setPinError("❌ Incorrect PIN")
      setAdminPin("")
    }
  }

  function handleOpenAdminAccess() {
    setShowAdminPin(true)
    setPinError("")
    setAdminPin("")
  }

  function handleCloseAdminPin() {
    setShowAdminPin(false)
    setPinError("")
  }

  if (selectedRole) {
    const role = roleList.find((r) => r.id === selectedRole)

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
              <h1>{isRegistering ? "Sign Up" : "Login"} as {role.name}</h1>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                isRegistering
                  ? handleRegister()
                  : handleLogin()
              }}
              className="login-form"
            >
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={`${role.id}@example.com`}
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {isRegistering && (
                <div className="form-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                  />
                </div>
              )}

              <button type="submit" className="btn-login-role">
                {isRegistering ? "Sign Up" : "Login"}
              </button>
            </form>

            <div className="login-toggle-section">
              <p className="toggle-text">
                {isRegistering
                  ? "Already have an account? "
                  : "Don't have an account? "}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(!isRegistering)
                    setConfirmPassword("")
                  }}
                  className="toggle-btn"
                >
                  {isRegistering ? "Login" : "Sign Up"}
                </button>
              </p>
            </div>
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

              <input
                type="password"
                value={adminPin}
                onChange={(e) => {
                  setAdminPin(e.target.value)
                  setPinError("")
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdminPinSubmit()
                }}
                maxLength="4"
              />

              {pinError && <p className="pin-error">{pinError}</p>}

              <div className="pin-buttons">
                <button onClick={handleAdminPinSubmit}>
                  Verify
                </button>
                <button onClick={handleCloseAdminPin}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="selector-content">
          <h2>Who are you?</h2>
          <p className="selector-subtitle">
            Choose your role to continue
          </p>

          <div className="role-cards">
            {roleList.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className="role-card"
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
            >
              🔑 Admin Access
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
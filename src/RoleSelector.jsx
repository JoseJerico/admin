import React, { useState } from "react";
import { supabase } from "./supabase";
import "./RoleSelector.css";
import QRCodeGenerator from './QRCodeGenerator'; // Adjust the path as needed

export default function RoleSelector({ onRoleSelect }) {
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [middleInitial, setMiddleInitial] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const [adminAccessGranted, setAdminAccessGranted] = useState(false);
  const [showAdminPin, setShowAdminPin] = useState(false);
  const [adminPin, setAdminPin] = useState("");
  const [pinError, setPinError] = useState("");

  const [technicianAccessGranted, setTechnicianAccessGranted] = useState(false);
  const [showTechnicianPin, setShowTechnicianPin] = useState(false);
  const [technicianPin, setTechnicianPin] = useState("");
  const [technicianPinError, setTechnicianPinError] = useState("");

  const ADMIN_PIN = "8888";
  const TECHNICIAN_PIN = "1234";  // Set technician PIN for validation

  const baseRoles = [
    { id: "customer", name: "Customer", icon: "👤", description: "Browse & book services", color: "#10b981" },
  ];

  let roleList = [...baseRoles];

  if (adminAccessGranted) {
    roleList = [{ id: "admin", name: "Admin", icon: "👨‍💼", description: "Manage schedules and technicians", color: "#667eea" }, ...roleList];
  }

  if (technicianAccessGranted) {
    roleList = [{ id: "technician", name: "Technician", icon: "🔧", description: "View jobs & work updates", color: "#3b82f6" }, ...roleList];
  }

  function handleTechnicianPinSubmit() {
    if (!technicianPin) {
      setTechnicianPinError("Please enter the Technician PIN");
      return;
    }
    if (technicianPin === TECHNICIAN_PIN) {
      setTechnicianAccessGranted(true);
      setShowTechnicianPin(false);
      setTechnicianPin("");
      setTechnicianPinError("");
    } else {
      setTechnicianPinError("❌ Incorrect Technician PIN");
      setTechnicianPin("");
    }
  }

  function handleAdminPinSubmit() {
    if (!adminPin) {
      setPinError("Please enter the PIN");
      return;
    }
    if (adminPin === ADMIN_PIN) {
      setAdminAccessGranted(true);
      setShowAdminPin(false);
      setAdminPin("");
      setPinError("");
    } else {
      setPinError("❌ Incorrect PIN");
      setAdminPin("");
    }
  }

  function handleOpenTechnicianAccess() {
    setShowTechnicianPin(true);
    setTechnicianPinError("");
    setTechnicianPin("");
  }

  function handleOpenAdminAccess() {
    setShowAdminPin(true);
    setPinError("");
    setAdminPin("");
  }

  // Close Admin PIN modal
  function handleCloseAdminPin() {
    setShowAdminPin(false);
    setPinError("");  // Clear any previous error messages
  }

  // Close Technician PIN modal
  function handleCloseTechnicianPin() {
    setShowTechnicianPin(false);
    setTechnicianPinError("");  // Clear any previous error messages
  }

  async function handleRegister() {
    // Check if all required fields are filled
    if (!email || !password || !firstName || !lastName || !middleInitial || !address || !mobileNumber || !age || !gender) {
      alert("All fields are required! Please fill in all the fields.");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@(gmail\.com|yahoo\.com|outlook\.com)$/;
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    if (!/^\d{11}$/.test(mobileNumber)) {
      alert("Mobile number must contain only 11 digits, no letters or symbols.");
      return;
    }
    if (!age || Number(age) < 18) {
      alert("You must be at least 18 years old.");
      return;
    }
    if (!gender) {
      alert("Please select a gender");
      return;
    }

    // Proceed with the registration
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      alert(error.message);
      return;
    }
    const user = data.user;
    if (!user) {
      alert("Signup failed");
      return;
    }

    const { data: roleData, error: roleError } = await supabase
      .from("roles")
      .select("id")
      .eq("name", selectedRole)
      .single();
    if (roleError || !roleData) {
      alert("Role not found in database");
      return;
    }

    try {
      await supabase.from("profiles").insert({
        id: user.id,
        role_id: roleData.id,
        full_name: `${firstName} ${middleInitial} ${lastName}`,
        username: email,
        avatar_url: null,
      });

      // Convert current time to PH timezone
      const phTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));

      await supabase.from("user_details").insert({
        id: user.id,
        user_id: user.id,
        first_name: firstName,
        middle_initial: middleInitial,
        last_name: lastName,
        address: address,
        mobile_number: mobileNumber,
        email: email,
        role: selectedRole,
        role_id: roleData.id,
        age: Number(age),
        gender: gender,
        is_verified: false,
        created_at: phTime,
      });

      alert(`Account created successfully! Philippine Time: ${phTime.toLocaleString()}`);
      setIsRegistering(false);
    } catch (insertError) {
      console.error("Database error:", insertError);
      alert(`Database error saving new user: ${insertError.message}`);
      setIsRegistering(false);
    }
  }

  async function handleLogin() {
    if (!email || !password) {
      alert("Email and password are required");
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert(error.message);
      return;
    }

    const user = data.user;
    if (!user) {
      alert("Login failed");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role_id, roles(name)")
      .eq("id", user.id)
      .single();
    if (profileError || !profile) {
      alert("Role not found for this user");
      return;
    }

    const userRole = profile.roles.name;
    if (userRole !== selectedRole) {
      alert(`This account is registered as ${userRole}`);
      return;
    }

    onRoleSelect(userRole, user);
  }

  if (selectedRole) {
    const role = roleList.find((r) => r.id === selectedRole);

    return (
      <div className="role-selector">
        <div className="login-container">
          <button onClick={() => setSelectedRole(null)} className="btn-back-role">← Back</button>
          <div className="login-box" style={{ borderTopColor: role.color }}>
            <div className="login-header">
              <div className="login-icon">{role.icon}</div>
              <h1>{isRegistering ? "Sign Up" : "Login"} as {role.name}</h1>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); isRegistering ? handleRegister() : handleLogin(); }} className="login-form">
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={`${role.id}@example.com`} />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>

              {isRegistering && (
                <>
                  <div className="form-group"><label>First Name</label><input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} /></div>
                  <div className="form-group"><label>Middle Initial</label><input type="text" value={middleInitial} onChange={(e) => setMiddleInitial(e.target.value)} /></div>
                  <div className="form-group"><label>Last Name</label><input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} /></div>
                  <div className="form-group"><label>Address</label><input type="text" value={address} onChange={(e) => setAddress(e.target.value)} /></div>
                  <div className="form-group"><label>Mobile Number</label><input type="text" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} placeholder="11-digit number" /></div>
                  <div className="form-group"><label>Age</label><input type="number" value={age} onChange={(e) => setAge(e.target.value)}/></div>
                  <div className="form-group"><label>Gender</label>
                    <select value={gender} onChange={(e) => setGender(e.target.value)}>
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group"><label>Confirm Password</label><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>
                </>
              )}

              <button type="submit" className="btn-login-role">{isRegistering ? "Sign Up" : "Login"}</button>
            </form>

            <div className="login-toggle-section">
              <p className="toggle-text">
                {isRegistering ? "Already have an account? " : "Don't have an account? "}
                <button type="button" onClick={() => { setIsRegistering(!isRegistering); setConfirmPassword(""); }} className="toggle-btn">{isRegistering ? "Login" : "Sign Up"}</button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
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
                  setAdminPin(e.target.value);
                  setPinError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdminPinSubmit();
                }}
                maxLength="4"
              />

              {pinError && <p className="pin-error">{pinError}</p>}

              <div className="pin-buttons">
                <button onClick={handleAdminPinSubmit}>Verify</button>
                <button onClick={handleCloseAdminPin}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {showTechnicianPin && (
          <div className="technician-pin-modal">
            <div className="technician-pin-box">
              <h2>🔐 Technician Access</h2>
              <p>Enter PIN to access technician portal</p>

              <input
                type="password"
                value={technicianPin}
                onChange={(e) => {
                  setTechnicianPin(e.target.value);
                  setTechnicianPinError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTechnicianPinSubmit();
                }}
                maxLength="4"
              />

              {technicianPinError && <p className="pin-error">{technicianPinError}</p>}

              <div className="pin-buttons">
                <button onClick={handleTechnicianPinSubmit}>Verify</button>
                <button onClick={() => setShowTechnicianPin(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        <div className="selector-content">
          <h2>Who are you?</h2>
          <p className="selector-subtitle">Choose your role to continue</p>

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
          <p>🔒 Secure Login • Online Booking System • Mobile Optimized</p>

          <div className="qr-code-container">
            <QRCodeGenerator url="https://adminchill.vercel.app" />
          </div>

          <div className="access-buttons">
            {!technicianAccessGranted && (
              <button
                onClick={handleOpenTechnicianAccess}
                className="btn-admin-access"
              >
                🔧 Technician Access
              </button>
            )}

            {!adminAccessGranted && (
              <button onClick={handleOpenAdminAccess} className="btn-admin-access">
                🔑 Admin Access
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
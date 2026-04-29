import React, { useState } from "react";
import { supabase } from "./supabase";
import "./RoleSelector.css";

export default function RoleSelector({ onRoleSelect }) {
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
  const [errorMessage, setErrorMessage] = useState("");

  // Back button function
  const handleBack = () => {
    setIsRegistering(false);  // Switch to login page
  };

  // Registration function
  async function handleRegister() {
    if (!email || !password || !firstName || !lastName || !middleInitial || !address || !mobileNumber || !age || !gender) {
      alert("All fields are required! Please fill in all the fields.");
      return;
    }

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

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setErrorMessage(error.message);
      return;
    }

    const user = data.user;
    if (!user) {
      setErrorMessage("Signup failed. Please try again.");
      return;
    }

    try {
      const phTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));

      const roleName = "customer"; // Default role

      const { data: roleData, error: roleError } = await supabase
        .from("roles")
        .select("id")
        .eq("name", roleName)
        .single();

      if (roleError || !roleData) {
        setErrorMessage("Role not found in database.");
        return;
      }

      await supabase.from("profiles").insert({
        id: user.id,
        full_name: `${firstName} ${middleInitial} ${lastName}`.trim(),
        username: email,
        avatar_url: null,
        role_id: roleData.id,
      });

      await supabase.from("user_details").insert({
        id: user.id,
        user_id: user.id,
        first_name: firstName,
        middle_initial: middleInitial,
        last_name: lastName,
        address: address,
        mobile_number: mobileNumber,
        email: email,
        age: Number(age),
        gender: gender,
        role: roleName,
        role_id: roleData.id,
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

  // Login handler
  async function handleLogin() {
    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Email and password are required.");
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErrorMessage(error.message);
      return;
    }

    const user = data.user;
    if (!user) {
      setErrorMessage("Login failed. Please try again.");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role_id, roles(name)")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.roles?.name) {
      setErrorMessage("Role not found for this user.");
      return;
    }

    onRoleSelect(profile.roles.name, user);
  }

  return (
    <div className="role-selector">
      <div className="login-container">
        <div className="login-box">
          <div className="login-header">
            <div className="login-icon">👤</div>
            <h1>{isRegistering ? "Create Customer Account" : "Login to Your Dashboard"}</h1>
            <p>{isRegistering
              ? "Register as a customer and book services."
              : "Enter your email and password to open the correct dashboard."}
            </p>
          </div>

          {/* Back Button only visible on the registration screen */}
          {isRegistering && (
            <button className="btn-back" onClick={handleBack}>Back</button>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              isRegistering ? handleRegister() : handleLogin();
            }}
            className="login-form"
          >
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
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
                <div className="form-group"><label>Age</label><input type="number" min={18} value={age} onChange={(e) => setAge(e.target.value)} /></div>
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

            <button type="submit" className="btn-login-role">{isRegistering ? "Create Account" : "Login"}</button>
            {errorMessage && <div className="error-message">{errorMessage}</div>}
          </form>

          <div className="login-toggle-section">
            <p className="toggle-text">
              {isRegistering ? "Already have an account? " : "New to RoomChill? "}
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setErrorMessage("");
                  setConfirmPassword("");
                }}
                className="toggle-btn"
              >
                {isRegistering ? "Login" : "Create Customer Account"}
              </button>
            </p>
          </div>

          {!isRegistering && (
           <div className="login-note"></div>
          )}
        </div>
      </div>
    </div>
  );
}
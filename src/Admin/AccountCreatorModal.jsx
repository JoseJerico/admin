import React, { useState } from 'react';
import { supabase } from '../supabase'; // Ensure to import supabase properly

export default function AccountCreatorModal({ onClose }) {
  // State for form fields
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
  const [role, setRole] = useState("");  // Role state
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Registration function
  async function handleRegister() {
    if (!email || !password || !firstName || !lastName || !middleInitial || !address || !mobileNumber || !age || !gender || !role) {
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

    // Normalize role to lowercase to match the database
    const normalizedRole = role.toLowerCase();  // Ensure role is lowercase

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      console.error("SignUp Error:", error);
      setErrorMessage(error.message);
      return;
    }

    const user = data.user;
    if (!user) {
      setErrorMessage("Signup failed. Please try again.");
      return;
    }

    console.log("User created successfully:", user);

    // Profile Creation
    try {
      const phTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));

      // Fetch role_id from roles table (query with normalized role name)
      const { data: roleData, error: roleError } = await supabase
        .from("roles")
        .select("id")
        .eq("name", normalizedRole)  // Use the normalized role (lowercase)
        .single();

      if (roleError || !roleData) {
        console.error("Role lookup failed:", roleError || "No role data found");
        setErrorMessage("Error fetching role. Please try again.");
        return;
      }

      const { error: profileError } = await supabase.from("profiles").insert({
        id: user.id,
        full_name: `${firstName} ${middleInitial} ${lastName}`.trim(),
        username: email,
        avatar_url: null,
        role_id: roleData.id, // Assign role_id
      });

      if (profileError) {
        console.error("Error inserting profile data:", profileError);
        setErrorMessage("Error saving profile data. Please try again.");
        return;
      }

      const { error: userDetailsError } = await supabase.from("user_details").insert({
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
        role: normalizedRole,  // Role in string format (now normalized)
        role_id: roleData.id, // Role ID
        is_verified: false,
        created_at: phTime,
      });

      if (userDetailsError) {
        console.error("Error inserting user details:", userDetailsError);
        setErrorMessage("Error saving user details. Please try again.");
        return;
      }

      alert(`Account created successfully! Philippine Time: ${phTime.toLocaleString()}`);
      setIsRegistering(false);
      onClose(); // Close the modal after successful registration
    } catch (insertError) {
      console.error("Database Error:", insertError);
      alert(`Database error saving new user: ${insertError.message}`);
      setIsRegistering(false);
    }
  }

  return (
    <div className="account-creator-modal-overlay" onClick={onClose}>
      <div className="account-creator-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Create Account</h2>

        {/* Registration Form */}
        <form onSubmit={(e) => e.preventDefault()}>
          <div>
            <label>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="you@example.com" 
            />
          </div>

          <div>
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>

          <div>
            <label>Confirm Password</label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
            />
          </div>

          <div>
            <label>First Name</label>
            <input 
              type="text" 
              value={firstName} 
              onChange={(e) => setFirstName(e.target.value)} 
            />
          </div>

          <div>
            <label>Middle Initial</label>
            <input 
              type="text" 
              value={middleInitial} 
              onChange={(e) => setMiddleInitial(e.target.value)} 
            />
          </div>

          <div>
            <label>Last Name</label>
            <input 
              type="text" 
              value={lastName} 
              onChange={(e) => setLastName(e.target.value)} 
            />
          </div>

          <div>
            <label>Address</label>
            <input 
              type="text" 
              value={address} 
              onChange={(e) => setAddress(e.target.value)} 
            />
          </div>

          <div>
            <label>Mobile Number</label>
            <input 
              type="text" 
              value={mobileNumber} 
              onChange={(e) => setMobileNumber(e.target.value)} 
              placeholder="11-digit number" 
            />
          </div>

          <div>
            <label>Age</label>
            <input 
              type="number" 
              value={age} 
              onChange={(e) => setAge(e.target.value)} 
              min={18} 
            />
          </div>

          <div>
            <label>Gender</label>
            <select 
              value={gender} 
              onChange={(e) => setGender(e.target.value)} 
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Role Selection */}
          <div>
            <label>Role</label>
            <select 
              value={role} 
              onChange={(e) => setRole(e.target.value)} 
            >
              <option value="">Select Role</option>
              <option value="Admin">Admin</option>
              <option value="Technician">Technician</option>
            </select>
          </div>

          {/* Submit Button */}
          <button type="submit" onClick={handleRegister}>Create Account</button>
        </form>

        <button onClick={onClose} className="btn-close">Close</button>
      </div>
    </div>
  );
}
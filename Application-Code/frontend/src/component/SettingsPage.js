import React, { useState, useEffect } from "react";
import "./css/SettingsPage.css";
import { useNavigate } from "react-router-dom";

const SettingsPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // Form States
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
//   const [avatarFile, setAvatarFile] = useState(null);
//   const [coverFile, setCoverFile] = useState(null);

  // Fetch current user
  const fetchCurrentUser = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/v1/user/current-user", {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.data);
        setFullname(data.data.fullname || "");
        setEmail(data.data.email || "");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const showMessage = (msg, isError = false) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 4000);
  };

  // Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) return showMessage("Both fields required", true);

    try {
      const res = await fetch("http://localhost:8000/api/v1/user/change-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        showMessage("Password changed successfully!");
        setOldPassword("");
        setNewPassword("");
      } else {
        showMessage(data.message || "Failed to change password", true);
      }
    } catch (err) {
      showMessage("Error changing password", true);
    }
  };

  // Update Account Details
  const handleUpdateDetails = async (e) => {
    e.preventDefault();
    if (!fullname && !email) return;

    try {
      const res = await fetch("http://localhost:8000/api/v1/user/update-account-details", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullname, email }),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.data);
        showMessage("Account updated successfully!");
      }
    } catch (err) {
      showMessage("Update failed", true);
    }
  };

  // Update Avatar
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // setAvatarFile(file);

    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await fetch("http://localhost:8000/api/v1/user/update-avtar", {
        method: "PATCH",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.data);
        showMessage("Avatar updated!");
      }
    } catch (err) {
      showMessage("Avatar upload failed", true);
    }
  };

  // Update Cover Image
  const handleCoverChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // setCoverFile(file);

    const formData = new FormData();
    formData.append("coverImage", file);

    try {
      const res = await fetch("http://localhost:8000/api/v1/user/update-cover-image", {
        method: "PATCH",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.data);
        showMessage("Cover image updated!");
      }
    } catch (err) {
      showMessage("Cover upload failed", true);
    }
  };

  // Logout
  const handleLogout = async () => {
  
    try {
      const res = await fetch("http://localhost:8000/api/v1/user/logout", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        showMessage("Logged out successfully");
        setTimeout(() => navigate("/login"), 1000);
      }
    } catch (err) {
      showMessage("Logout failed", true);
    }
  };

  if (loading) return <div className="set-loading">Loading settings...</div>;

  return (
    <div className="set-container">
      {/* Message Toast */}
      {message && (
        <div className={`set-toast ${message.includes("failed") || message.includes("Error") ? "error" : "success"}`}>
          {message}
        </div>
      )}

      <div className="set-header">
        <h2>Account Settings</h2>
      </div>

      {/* Profile Preview */}
      <div className="set-profile-card">
        <div className="set-cover-wrapper">
          <img
            src={user?.coverImage || "/default-cover.jpg"}
            alt="Cover"
            className="set-cover"
          />
          <label className="set-cover-upload">
            Change Cover
            <input type="file" accept="image/*" onChange={handleCoverChange} />
          </label>
        </div>

        <div className="set-avatar-wrapper">
          <img src={user?.avatar || "/default-avatar.jpg"} alt="Avatar" className="set-avatar" />
          <label className="set-avatar-upload">
            Change
            <input type="file" accept="image/*" onChange={handleAvatarChange} />
          </label>
        </div>

        <h3 className="set-username">{user?.username}</h3>
      </div>

      
      {/* Update Details */}
      <div className="set-section">
        <h3>Update Account Details</h3>
        <form onSubmit={handleUpdateDetails} className="set-form">
          <input
            type="text"
            placeholder="Full Name"
            value={fullname}
            onChange={(e) => setFullname(e.target.value)}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit">Save Changes</button>
        </form>
      </div>

      {/* Change Password */}
      <div className="set-section">
        <h3>Change Password</h3>
        <form onSubmit={handleChangePassword} className="set-form">
          <input
            type="password"
            placeholder="Old Password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <button type="submit">Update Password</button>
        </form>
      </div>


      {/* Logout */}
      <div className="set-section">
        <button onClick={handleLogout} className="set-logout-btn">
          Logout
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
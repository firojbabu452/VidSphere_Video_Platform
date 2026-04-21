import React, { useState } from "react";
import "./css/Header.css";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    if (!query.trim()) return; 
    navigate(`/s/${query}`);
  };

  const handleLogout = async () => {
  
    try {
      const res = await fetch("http://localhost:8000/api/v1/user/logout", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setTimeout(() => navigate("/login"), 1000);
      }
    } catch (err) {
      alert("Logout failed", true);
    }
  };


  return (
    <header className="header-container">
      {/* ---- LEFT ---- */}
      <div className="header-logo">PLAY</div>

      {/* ---- CENTER (search) ---- */}
      <div className="header-search-wrapper">
        <div className="header-search">
          <input
            type="text"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={handleSearch}>🔍</button>
        </div>
      </div>

      {/* ---- RIGHT ---- */}
      <nav className="header-right">
        <button className="header-signup-btn" onClick={handleLogout} >Sign out</button>
      </nav>
    </header>
  );
};

export default Header;

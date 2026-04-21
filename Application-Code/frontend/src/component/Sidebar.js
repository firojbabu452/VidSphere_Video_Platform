// Sidebar.js
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import "./css/Sidebar.css";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => setIsOpen(!isOpen);

  const navItems = [
    { to: "/", icon: "🏠", label: "Home" },
    { to: "/like-videos", icon: "❤️", label: "Liked Videos" },
    { to: "/my-watchhistory", icon: "🕒", label: "History" },
    { to: "/my-channel", icon: "📂", label: "My Content" },
    { to: "/commente-videos", icon: "📑", label: "Comments" },
    { to: "/subscribed", icon: "👥", label: "Subscribed" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Hamburger Button - Visible only on mobile */}
      <button className="mobile-menu-btn" onClick={toggleSidebar}>
        {isOpen ? "✕" : "☰"}
      </button>

      {/* Sidebar */}
      <aside className={`sidebar-container ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-inner">
          <ul className="sidebar-nav">
            {navItems.map((item) => (
              <li key={item.to} className="sidebar-item">
                <Link
                  to={item.to}
                  className={`sidebar-link ${isActive(item.to) ? 'active' : ''}`}
                  onClick={() => setIsOpen(false)} // Close on mobile after click
                >
                  <span className="icon">{item.icon}</span>
                  <span className="label">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="sidebar-bottom">
            {/* <Link to="/support" className="sidebar-bottom-btn">
              ⚙️ Support
            </Link> */}
            <Link to="/settings" className="sidebar-bottom-btn">
              ⚙️ Settings
            </Link>
          </div>
        </div>
      </aside>

      {/* Overlay when sidebar is open on mobile */}
      {isOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}
    </>
  );
};

export default Sidebar;
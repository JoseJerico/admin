import React, { useState } from 'react';
import './Sidebar.css';

export default function Sidebar({ user, onLogout, fullName, roleName, activeMenu, setActiveMenu }) {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { icon: '📊', label: 'Dashboard', id: 'dashboard' },
    { icon: '📅', label: 'Bookings', id: 'bookings' },
    { icon: '💳', label: 'Online Payments', id: 'payments' }, // 👈 Dito ko pinalitan
    { icon: '👥', label: 'Technicians/Admins', id: 'technicians' },
    { icon: '⭐', label: 'Feedback', id: 'feedback' },
  ];

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo Section */}
      <div className="sidebar-logo">
        <div className="logo-icon">⚡</div>
        {!collapsed && <div className="logo-text">Admin Panel</div>}
      </div>

      {/* Menu Items */}
      <nav className="sidebar-nav">
        {menuItems.map(item => (
          <div
            key={item.id}
            className={`nav-item ${activeMenu === item.id ? 'active' : ''}`}
            onClick={() => setActiveMenu(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            {!collapsed && <span className="nav-label">{item.label}</span>}
          </div>
        ))}
      </nav>

      {/* User Profile Section */}
      <div className="sidebar-footer">
        <div className="user-avatar">{fullName?.charAt(0).toUpperCase()}</div>
        {!collapsed && (
          <div className="user-details">
            <div className="user-name">{fullName}</div>
            <div className="user-role">{roleName}</div>
          </div>
        )}
      </div>

      {/* Logout Button */}
      <button onClick={onLogout} className="btn-logout-sidebar">
        <span>🚪</span>
        {!collapsed && <span>Logout</span>}
      </button>

      {/* Collapse Toggle */}
      <button
        className="sidebar-toggle"
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? 'Expand' : 'Collapse'}
      >
        {collapsed ? '→' : '←'}
      </button>
    </div>
  );
}
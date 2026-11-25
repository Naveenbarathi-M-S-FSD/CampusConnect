import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getInitials, getRoleInfo } from '../utils/helpers';

const NAV = [
  { to: '/feed', icon: '🏠', label: 'Feed' },
  { to: '/announcements', icon: '📢', label: 'Announcements' },
  { to: '/messages', icon: '💬', label: 'Messages' },
  { to: '/notifications', icon: '🔔', label: 'Notifications' },
  { to: '/directory', icon: '👥', label: 'Directory' },
  { to: '/profile', icon: '👤', label: 'My Profile' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const roleInfo = getRoleInfo(user?.role);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      <div
        className={`mobile-overlay ${sidebarOpen ? 'show' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-mark">C</div>
          <div className="logo-text">Campus<span>Connect</span></div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Navigation</div>
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}

          <div className="nav-section-label" style={{ marginTop: 8 }}>Settings</div>
          <button className="nav-item" style={{ width: '100%', textAlign: 'left' }} onClick={toggleTheme}>
            <span className="nav-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button className="nav-item" style={{ width: '100%', textAlign: 'left' }} onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            <span>Logout</span>
          </button>
        </nav>

        <div className="sidebar-user">
          <div className="avatar avatar-sm" style={{ fontSize: 12 }}>
            {user?.avatar
              ? <img src={user.avatar} alt={user.name} />
              : getInitials(user?.name)
            }
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-role" style={{ color: roleInfo.color }}>
              {roleInfo.label}
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="topbar">
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>☰</button>
          <div className="topbar-title font-display">
            {NAV.find(n => window.location.pathname.startsWith(n.to))?.label || 'CampusConnect'}
          </div>
          <div className="topbar-actions">
            <NavLink to="/notifications" className="btn btn-ghost btn-icon" title="Notifications">🔔</NavLink>
            <NavLink to="/messages" className="btn btn-ghost btn-icon" title="Messages">💬</NavLink>
            <NavLink to="/profile" className="avatar avatar-sm" style={{ cursor: 'pointer' }}>
              {user?.avatar ? <img src={user.avatar} alt={user.name} /> : getInitials(user?.name)}
            </NavLink>
          </div>
        </header>

        <Outlet />
      </div>
    </div>
  );
}

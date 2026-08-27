import React from 'react';
import { useAuth } from '../../Context/AuthContext';
import {
  MdDashboard,
  MdSlideshow,
  MdCampaign,
  MdNewspaper,
  MdGroups,
  MdScience,
  MdMail,
  MdEmojiEvents,
  MdLogout
} from 'react-icons/md';

const navItems = [
  {
    section: 'MAIN',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: MdDashboard, route: '/dashboard' },
      { id: 'enquiries', label: 'Contact Enquiries', icon: MdMail, route: '/enquiries' },
      { id: 'sliders', label: 'Home Sliders', icon: MdSlideshow, route: '/sliders' },
      { id: 'news', label: 'News & Events', icon: MdCampaign, route: '/news-events' },
      { id: 'newsletters', label: 'Newsletters', icon: MdNewspaper, route: '/newsletters' },
    ]
  },
  {
    section: 'INSTITUTION & ACADEMICS',
    items: [
      { id: 'leadership', label: 'Leadership', icon: MdGroups, route: '/leadership' },
      { id: 'research', label: 'Research & Publications', icon: MdScience, route: '/research' },
      { id: 'achievements', label: 'Student Achievements', icon: MdEmojiEvents, route: '/achievements' },
    ]
  }
];

export default function Sidebar({ active, onNav }) {
  const { user, logout } = useAuth();
  const userName = user?.name || 'Admin User';
  const userRole = 'Administrator';
  const initial = userName.charAt(0).toUpperCase();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      logout();
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">SN</div>
        <div className="logo-text">
          <h2>SRM Nursing</h2>
          <p>College of Nursing</p>
        </div>
        <span className="admin-badge">Admin</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(section => (
          <div key={section.section}>
            <p className="nav-section-label">{section.section}</p>
            {section.items.map(item => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  className={`nav-item${active === item.id ? ' active' : ''}`}
                  onClick={() => onNav(item.id, item.route)}
                >
                  <Icon />
                  {item.label}
                  {item.badge && <span className="nav-badge">{item.badge}</span>}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="user-avatar-sm">{initial}</div>
          <div className="user-info">
            <h4>{userName}</h4>
            <p>{userRole}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign Out"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: 4,
              color: '#64748b',
              transition: 'color 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#dc2626'}
            onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
          >
            <MdLogout style={{ fontSize: 18 }} />
          </button>
        </div>
      </div>
    </aside>
  );
}

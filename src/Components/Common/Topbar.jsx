import React from 'react';
import { useAuth } from '../../Context/AuthContext';

const pageTitles = {
  dashboard: { title: 'Dashboard', path: 'SRM Admin > Dashboard' },
  enquiries: { title: 'Contact Enquiries', path: 'SRM Admin > Contact Enquiries' },
  sliders: { title: 'Home Sliders', path: 'SRM Admin > Home Sliders' },
  news: { title: 'News & Events', path: 'SRM Admin > News & Events' },
  affiliations: { title: 'Affiliations', path: 'SRM Admin > Affiliations' },
  statutes: { title: 'Statutory Disclosure', path: 'SRM Admin > Statutory Disclosure' },
  newsletters: { title: 'Newsletters', path: 'SRM Admin > Newsletters' },
  leadership: { title: 'Leadership', path: 'SRM Admin > Leadership' },
  research: { title: 'Research & Publications', path: 'SRM Admin > Research & Publications' },
  achievements: { title: 'Student Achievements', path: 'SRM Admin > Student Achievements' },
};

export default function Topbar({ page }) {
  const { user } = useAuth();
  const info = pageTitles[page] || pageTitles.dashboard;
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'A';

  return (
    <header className="topbar">
      <div className="topbar-breadcrumb">
        <p className="breadcrumb-path">{info.path}</p>
        <h1>{info.title}</h1>
      </div>
      <div className="topbar-actions">
        <div className="topbar-user-avatar" title={user?.name || 'Admin'}>{initial}</div>
      </div>
    </header>
  );
}

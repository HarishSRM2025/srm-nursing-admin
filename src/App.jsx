import React from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { AuthProvider } from './Context/AuthContext';
import ProtectedRoute from './Components/Common/ProtectedRoute';
import Auth from './Pages/Auth';
import Dashboard from './Pages/Dashboard';
import Enquiries from './Pages/Enquiries';
import NewsEvents from './Pages/NewsEvents';
import EventBulkUpload from './Pages/EventBulkUpload';
import Sliders from './Pages/Sliders';
import Newsletters from './Pages/Newsletters';
import Statutes from './Pages/Statutes';
import Affiliations from './Pages/Affiliations';
import Leadership from './Pages/Leadership';
import Research from './Pages/Research';
import Achievements from './Pages/Achievements';
import Sidebar from './Components/Common/Sidebar';
import Topbar from './Components/Common/Topbar';
import './assets/styles/main.css';

const pageMap = {
  '/dashboard': { id: 'dashboard', title: 'Dashboard' },
  '/': { id: 'dashboard', title: 'Dashboard' },
  '/enquiries': { id: 'enquiries', title: 'Contact Enquiries' },
  '/sliders': { id: 'sliders', title: 'Home Sliders' },
  '/news-events/bulk-upload': { id: 'events-import', title: 'Bulk Upload Events' },
  '/news-events': { id: 'news', title: 'News & Events' },
  '/affiliations': { id: 'affiliations', title: 'Affiliations' },
  '/statutes': { id: 'statutes', title: 'Statutory Disclosure' },
  '/newsletters': { id: 'newsletters', title: 'Newsletters' },
  '/leadership': { id: 'leadership', title: 'Leadership' },
  '/research': { id: 'research', title: 'Research & Publications' },
  '/achievements': { id: 'achievements', title: 'Student Achievements' },
};

function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const getActivePage = () => {
    const path = location.pathname;
    const matched = Object.keys(pageMap).find(p => p !== '/' && path.startsWith(p));
    return matched ? pageMap[matched] : pageMap['/'];
  };

  const activeConfig = getActivePage();
  const activePage = activeConfig.id;

  const handleNav = (id, route) => {
    if (route) {
      navigate(route);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar active={activePage} onNav={handleNav} />
      <div className="main-content">
        <Topbar page={activePage} />
        <main className="page-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/enquiries" element={<Enquiries />} />
            <Route path="/sliders" element={<Sliders />} />
            <Route path="/news-events" element={<NewsEvents />} />
            <Route path="/news-events/bulk-upload" element={<EventBulkUpload />} />
            <Route path="/affiliations" element={<Affiliations />} />
            <Route path="/statutes" element={<Statutes />} />
            <Route path="/newsletters" element={<Newsletters />} />
            <Route path="/leadership" element={<Leadership />} />
            <Route path="/research" element={<Research />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Auth />} />
        <Route path="/signin" element={<Auth />} />
        <Route path="/signup" element={<Auth />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;

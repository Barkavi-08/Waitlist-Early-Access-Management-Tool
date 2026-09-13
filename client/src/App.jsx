import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  const [activeView, setActiveView] = useState('home'); // 'home' | 'admin-login' | 'admin-dashboard'
  const [totalWaitlist, setTotalWaitlist] = useState(0);
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('nova_admin_token') || '');
  const [adminUser, setAdminUser] = useState(() => localStorage.getItem('nova_admin_user') || '');

  // Keep admin token persisted in localStorage
  useEffect(() => {
    if (adminToken) {
      localStorage.setItem('nova_admin_token', adminToken);
      localStorage.setItem('nova_admin_user', adminUser);
    } else {
      localStorage.removeItem('nova_admin_token');
      localStorage.removeItem('nova_admin_user');
    }
  }, [adminToken, adminUser]);

  const handleLoginSuccess = (token, username) => {
    setAdminToken(token);
    setAdminUser(username);
    setActiveView('admin-dashboard');
  };

  const handleAdminLogout = () => {
    setAdminToken('');
    setAdminUser('');
    setActiveView('home');
  };

  return (
    <div className="app-wrapper">
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        totalWaitlist={totalWaitlist}
        isAdminLoggedIn={Boolean(adminToken)}
        onAdminLogout={handleAdminLogout}
      />

      <main className="main-content">
        {activeView === 'home' && (
          <HomePage onTotalChange={(count) => setTotalWaitlist(count)} />
        )}

        {activeView === 'admin-login' && (
          <AdminLogin onLoginSuccess={handleLoginSuccess} />
        )}

        {activeView === 'admin-dashboard' && (
          adminToken ? (
            <AdminDashboard token={adminToken} />
          ) : (
            <AdminLogin onLoginSuccess={handleLoginSuccess} />
          )
        )}
      </main>

      <Footer />
    </div>
  );
}

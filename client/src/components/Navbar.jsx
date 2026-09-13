import React from 'react';
import { Rocket, ShieldCheck, Users, LogOut } from 'lucide-react';

export default function Navbar({ activeView, setActiveView, totalWaitlist = 0, isAdminLoggedIn, onAdminLogout }) {
  return (
    <header className="navbar">
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Brand Logo */}
        <a 
          href="#home" 
          className="nav-logo"
          onClick={(e) => {
            e.preventDefault();
            setActiveView('home');
          }}
        >
          <div className="logo-icon">
            <Rocket size={18} />
          </div>
          <span>Nova<span style={{ color: 'var(--accent-primary)' }}>.waitlist</span></span>
        </a>

        {/* Center / Counter */}
        {totalWaitlist > 0 && activeView === 'home' && (
          <div className="live-counter-badge" style={{ display: 'none', md: 'inline-flex' }}>
            <span className="pulsing-dot"></span>
            <span><strong>{totalWaitlist.toLocaleString()}</strong> people in line</span>
          </div>
        )}

        {/* Right Nav Actions */}
        <div className="nav-actions">
          {activeView === 'home' ? (
            <>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  const el = document.getElementById('how-it-works');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                How It Works
              </button>

              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setActiveView(isAdminLoggedIn ? 'admin-dashboard' : 'admin-login')}
              >
                <ShieldCheck size={15} />
                <span>Admin Portal</span>
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setActiveView('home')}
              >
                <Users size={15} />
                <span>Public Waitlist</span>
              </button>

              {isAdminLoggedIn && (
                <button
                  className="btn btn-danger btn-sm"
                  onClick={onAdminLogout}
                >
                  <LogOut size={15} />
                  <span>Logout</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}

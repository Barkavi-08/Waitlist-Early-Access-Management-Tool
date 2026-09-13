import React, { useState, useEffect } from 'react';
import { User, Mail, Gift, ArrowRight, Search, Loader2 } from 'lucide-react';
import { joinWaitlist, getStatus } from '../utils/api';

export default function WaitlistForm({ onUserSuccess, initialRef = '' }) {
  const [activeTab, setActiveTab] = useState('join'); // 'join' or 'lookup'

  // Join form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [refCode, setRefCode] = useState(initialRef);

  // Lookup form state
  const [lookupEmail, setLookupEmail] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Update ref code if initialRef changes from URL query parameter
  useEffect(() => {
    if (initialRef) {
      setRefCode(initialRef);
      setInfoMessage(`You were invited via referral code: ${initialRef} 🎉`);
    }
  }, [initialRef]);

  // Handle Join Waitlist submission
  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    // Validation
    if (!name.trim() || name.trim().length < 2) {
      setError('Please enter your full name (minimum 2 letters).');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setError('Please provide a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const response = await joinWaitlist({
        name: name.trim(),
        email: email.trim(),
        ref: refCode.trim() || null,
      });

      if (response?.data) {
        onUserSuccess(response.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to join waitlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Position Lookup submission
  const handleLookupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!lookupEmail.trim()) {
      setError('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    try {
      const response = await getStatus({ email: lookupEmail.trim() });
      if (response?.data) {
        onUserSuccess(response.data);
      }
    } catch (err) {
      setError(err.message || 'No signup found with this email. Please join the waitlist first.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ maxWidth: '520px', margin: '0 auto', textAlign: 'left' }}>
      {/* Tab Switcher */}
      <div style={{ textAlign: 'center' }}>
        <div className="switch-tabs">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'join' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('join');
              setError('');
            }}
          >
            Join the Waitlist
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'lookup' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('lookup');
              setError('');
            }}
          >
            Check My Position
          </button>
        </div>
      </div>

      {/* Info Message (e.g. Referral banner) */}
      {infoMessage && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#34d399',
          padding: '10px 14px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.85rem',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <Gift size={16} />
          <span>{infoMessage}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#f87171',
          padding: '10px 14px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.85rem',
          marginBottom: '16px',
        }}>
          {error}
        </div>
      )}

      {/* Join Waitlist Form */}
      {activeTab === 'join' && (
        <form onSubmit={handleJoinSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="fullName">
              Full Name
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="fullName"
                type="text"
                className="input-field"
                placeholder="e.g. Alex Johnson"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="emailAddress">
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="emailAddress"
                type="email"
                className="input-field"
                placeholder="alex@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="referralCode">
              Referral Code <span style={{ color: 'var(--text-subtle)', fontWeight: 400 }}>(Optional)</span>
            </label>
            <input
              id="referralCode"
              type="text"
              className="input-field"
              placeholder="e.g. REF-A94B1"
              value={refCode}
              onChange={(e) => setRefCode(e.target.value.toUpperCase())}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '10px', padding: '13px' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Securing your spot...</span>
              </>
            ) : (
              <>
                <span>Get Early Access</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-subtle)', marginTop: '14px' }}>
            🔒 Instant confirmation. No spam, ever.
          </p>
        </form>
      )}

      {/* Lookup Position Form */}
      {activeTab === 'lookup' && (
        <form onSubmit={handleLookupSubmit}>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Already signed up? Enter your registered email to check your rank, referral count, and get your link.
          </p>

          <div className="form-group">
            <label className="form-label" htmlFor="lookupEmail">
              Registered Email Address
            </label>
            <input
              id="lookupEmail"
              type="email"
              className="input-field"
              placeholder="your.email@example.com"
              value={lookupEmail}
              onChange={(e) => setLookupEmail(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '10px', padding: '13px' }}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Finding your position...</span>
              </>
            ) : (
              <>
                <Search size={16} />
                <span>View My Status</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

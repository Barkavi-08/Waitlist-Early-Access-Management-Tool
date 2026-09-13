import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  Clock, 
  Share2, 
  Download, 
  Search, 
  Filter, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Mail, 
  RefreshCw, 
  ChevronRight,
  TrendingUp,
  Database,
  Send,
  Sparkles,
  Layers,
  Award
} from 'lucide-react';
import { 
  getAdminStats, 
  getAdminUsers, 
  updateUserStatus, 
  batchGrantAccess, 
  deleteUser, 
  getEmailLogs, 
  getCsvExportUrl 
} from '../utils/api';

export default function AdminDashboard({ token }) {
  // Navigation tabs within Admin Panel
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'emails'

  // Data state
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('rank');
  const [sortOrder, setSortOrder] = useState('asc');

  // Checkbox selections for batch actions
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [batchCountInput, setBatchCountInput] = useState(5);

  // Feedback notifications
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Email modal preview
  const [previewEmail, setPreviewEmail] = useState(null);

  // Fetch stats and user list
  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, usersRes] = await Promise.all([
        getAdminStats(token),
        getAdminUsers(token, {
          search,
          status: statusFilter,
          sortBy,
          order: sortOrder,
        }),
      ]);

      setStats(statsRes?.data || null);
      setUsers(usersRes?.data?.users || []);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch email logs
  const loadEmailLogs = async () => {
    try {
      const res = await getEmailLogs(token);
      setEmails(res?.data || []);
    } catch (err) {
      console.error('Failed to load email logs:', err);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [search, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    if (activeTab === 'emails') {
      loadEmailLogs();
    }
  }, [activeTab]);

  const showNotification = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 4000);
  };

  // 1. Toggle status for individual user
  const handleStatusChange = async (userId, newStatus) => {
    setActionLoading(true);
    try {
      await updateUserStatus(token, userId, newStatus);
      showNotification(`User status changed to '${newStatus}'.`);
      await loadDashboardData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Batch Grant Access (e.g. Next N waitlisted users)
  const handleBatchGrantNextN = async () => {
    if (batchCountInput < 1) return;
    if (!window.confirm(`Are you sure you want to release access to the top ${batchCountInput} waitlisted users?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await batchGrantAccess(token, { count: Number(batchCountInput) });
      showNotification(res.message || `Granted access to ${res.data?.grantedCount} users!`);
      await loadDashboardData();
      setSelectedUserIds([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Batch Grant Access for checked users
  const handleBatchGrantSelected = async () => {
    if (selectedUserIds.length === 0) return;
    if (!window.confirm(`Grant early access to the ${selectedUserIds.length} selected users?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await batchGrantAccess(token, { userIds: selectedUserIds });
      showNotification(res.message || `Granted access to ${res.data?.grantedCount} selected users!`);
      setSelectedUserIds([]);
      await loadDashboardData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Delete user
  const handleDeleteUser = async (userId, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from the waitlist?`)) {
      return;
    }

    setActionLoading(true);
    try {
      await deleteUser(token, userId);
      showNotification(`User '${name}' removed.`);
      await loadDashboardData();
      setSelectedUserIds((prev) => prev.filter((id) => id !== userId));
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Checkbox handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUserIds(users.map((u) => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="container" style={{ padding: '30px 20px' }}>
      {/* Top Banner / Heading */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Admin Waitlist Console</h1>
            {stats?.databaseEngine && (
              <span className="badge badge-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Database size={12} /> {stats.databaseEngine}
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Monitor signups, ranking algorithm, referral conversion, and release early access in waves.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <a
            href={getCsvExportUrl(token)}
            download="waitlist_export.csv"
            className="btn btn-secondary btn-sm"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </a>

          <button
            className="btn btn-secondary btn-sm"
            onClick={loadDashboardData}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Alert Messages */}
      {message && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#34d399',
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
          fontWeight: 600,
        }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#f87171',
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
          fontWeight: 600,
        }}>
          {error}
        </div>
      )}

      {/* Metrics / Statistics Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Total Signups</span>
            <span className="stat-value">{stats.totalUsers}</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>Total registered leads</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">Waiting in Queue</span>
            <span className="stat-value" style={{ color: 'var(--warning)' }}>{stats.waitlistedUsers}</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>Pending invitations</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">Access Granted</span>
            <span className="stat-value" style={{ color: 'var(--success)' }}>{stats.grantedUsers}</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>Early adopters unlocked</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">Total Referrals</span>
            <span className="stat-value" style={{ color: 'var(--accent-secondary)' }}>{stats.totalReferrals}</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>Viral growth loops</span>
          </div>

          <div className="stat-card">
            <span className="stat-label">Viral Referral Rate</span>
            <span className="stat-value" style={{ color: '#ec4899' }}>{stats.viralRate}%</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>Signups via friend invite</span>
          </div>
        </div>
      )}

      {/* Sub-Navigation (Users Table vs Email Outbox) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '14px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn btn-sm ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={14} /> Waitlist Directory ({users.length})
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'emails' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('emails')}
          >
            <Mail size={14} /> Email Outbox &amp; Activity Log
          </button>
        </div>

        {/* Batch Release Bar */}
        {activeTab === 'users' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Release Next:</span>
            <input
              type="number"
              min="1"
              max="100"
              value={batchCountInput}
              onChange={(e) => setBatchCountInput(Math.max(1, parseInt(e.target.value) || 1))}
              style={{
                width: '60px',
                padding: '6px 8px',
                borderRadius: '6px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                fontSize: '0.85rem',
                textAlign: 'center',
              }}
            />
            <button
              className="btn btn-success btn-sm"
              onClick={handleBatchGrantNextN}
              disabled={actionLoading}
            >
              <Sparkles size={14} /> Grant Top {batchCountInput}
            </button>

            {selectedUserIds.length > 0 && (
              <button
                className="btn btn-primary btn-sm"
                onClick={handleBatchGrantSelected}
                disabled={actionLoading}
              >
                <CheckCircle size={14} /> Grant Selected ({selectedUserIds.length})
              </button>
            )}
          </div>
        )}
      </div>

      {/* TAB 1: USERS DIRECTORY */}
      {activeTab === 'users' && (
        <>
          {/* Search & Filter Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '16px',
            background: 'rgba(15, 23, 42, 0.5)',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}>
            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '220px' }}>
              <Search size={16} style={{ color: 'var(--text-subtle)' }} />
              <input
                type="text"
                placeholder="Search by name, email, or referral code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#fff',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '0.85rem',
                }}
              >
                <option value="all">All Statuses</option>
                <option value="waitlisted">Waitlisted Only</option>
                <option value="granted">Access Granted Only</option>
                <option value="revoked">Revoked Only</option>
              </select>
            </div>

            {/* Sort Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Sort by:</span>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [sb, so] = e.target.value.split('-');
                  setSortBy(sb);
                  setSortOrder(so);
                }}
                style={{
                  background: 'rgba(15, 23, 42, 0.8)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '0.85rem',
                }}
              >
                <option value="rank-asc">Rank (Highest first)</option>
                <option value="referral_count-desc">Most Referrals</option>
                <option value="created_at-desc">Newest Signups</option>
                <option value="created_at-asc">Oldest Signups</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={users.length > 0 && selectedUserIds.length === users.length}
                    />
                  </th>
                  <th>Rank</th>
                  <th>User Details</th>
                  <th>Referral Code</th>
                  <th>Referred By</th>
                  <th>Referrals</th>
                  <th>Status</th>
                  <th>Signup Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-subtle)' }}>
                      No waitlist users found matching your filters.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isSelected = selectedUserIds.includes(u.id);
                    return (
                      <tr key={u.id} style={{ background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'transparent' }}>
                        <td>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectOne(u.id)}
                          />
                        </td>
                        <td>
                          <span style={{
                            fontWeight: 800,
                            fontSize: '0.92rem',
                            color: u.rank <= 3 ? '#f59e0b' : 'var(--text-main)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            {u.rank <= 3 && <Award size={14} />} #{u.rank}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#fff' }}>{u.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>{u.email}</div>
                        </td>
                        <td>
                          <code style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.82rem' }}>
                            {u.referral_code}
                          </code>
                        </td>
                        <td>
                          {u.referred_by ? (
                            <span style={{ fontSize: '0.82rem', color: 'var(--accent-secondary)' }}>
                              {u.referred_by}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.82rem', color: 'var(--text-subtle)' }}>Organic</span>
                          )}
                        </td>
                        <td>
                          <span style={{
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            color: u.referral_count > 0 ? 'var(--accent-secondary)' : 'var(--text-subtle)'
                          }}>
                            {u.referral_count}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-${u.status}`}>
                            {u.status}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            {u.status !== 'granted' && (
                              <button
                                className="btn btn-success btn-sm"
                                title="Grant Early Access"
                                onClick={() => handleStatusChange(u.id, 'granted')}
                                disabled={actionLoading}
                              >
                                <CheckCircle size={13} /> Grant
                              </button>
                            )}

                            {u.status !== 'waitlisted' && (
                              <button
                                className="btn btn-secondary btn-sm"
                                title="Move back to Waitlisted"
                                onClick={() => handleStatusChange(u.id, 'waitlisted')}
                                disabled={actionLoading}
                              >
                                <Clock size={13} /> Waitlist
                              </button>
                            )}

                            <button
                              className="btn btn-danger btn-sm"
                              title="Delete user"
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              disabled={actionLoading}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* TAB 2: EMAIL OUTBOX & ACTIVITY LOGS */}
      {activeTab === 'emails' && (
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Sent &amp; Simulated Email Log</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Every transactional welcome email and early-access invitation is archived here for inspection.
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={loadEmailLogs}>
              <RefreshCw size={13} /> Refresh Outbox
            </button>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Recipient</th>
                  <th>Subject</th>
                  <th>Type</th>
                  <th>Dispatch Time</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {emails.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-subtle)' }}>
                      No emails sent yet. Join the waitlist or grant access to test email notifications!
                    </td>
                  </tr>
                ) : (
                  emails.map((e) => (
                    <tr key={e.id}>
                      <td style={{ fontWeight: 600, color: '#fff' }}>{e.recipient}</td>
                      <td>{e.subject}</td>
                      <td>
                        <span className="badge badge-pill" style={{ fontSize: '0.72rem' }}>
                          {e.type}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {new Date(e.created_at).toLocaleString()}
                      </td>
                      <td>
                        <span className="badge badge-granted" style={{ fontSize: '0.72rem' }}>
                          {e.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setPreviewEmail(e)}
                        >
                          View HTML Preview
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Email Preview Modal */}
      {previewEmail && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '20px',
        }}>
          <div style={{
            background: '#ffffff',
            color: '#1e293b',
            maxWidth: '620px',
            width: '100%',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
            maxHeight: '85vh',
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '16px' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>Email Dispatch Viewer</h4>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                  To: <strong>{previewEmail.recipient}</strong> &bull; Subject: <strong>{previewEmail.subject}</strong>
                </div>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setPreviewEmail(null)}
                style={{ color: '#000', borderColor: '#cbd5e1' }}
              >
                Close
              </button>
            </div>

            <div 
              dangerouslySetInnerHTML={{ __html: previewEmail.content }} 
              style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

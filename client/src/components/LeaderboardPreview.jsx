import React from 'react';
import { Trophy, Flame, UserCheck } from 'lucide-react';

export default function LeaderboardPreview({ topReferrers = [] }) {
  if (!topReferrers || topReferrers.length === 0) return null;

  return (
    <div style={{ maxWidth: '640px', margin: '40px auto 0', textAlign: 'center' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
        <Trophy size={16} /> Top Advocates Leaderboard
      </div>
      <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '16px' }}>
        Community Members Leading the Queue
      </h3>

      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--bg-card-border)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}>
        {topReferrers.map((user, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              borderBottom: idx !== topReferrers.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
              background: idx === 0 ? 'rgba(245, 158, 11, 0.04)' : 'transparent',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 800,
                background: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : 'rgba(255, 255, 255, 0.1)',
                color: idx < 3 ? '#000' : '#fff'
              }}>
                {idx + 1}
              </span>
              <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>{user.name}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <strong>{user.referralCount}</strong> referrals
              </span>
              <span className="badge badge-pill" style={{ fontSize: '0.72rem' }}>
                Priority #{user.rank}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

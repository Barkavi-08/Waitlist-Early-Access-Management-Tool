import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Check, 
  Copy, 
  Share2, 
  Award, 
  Users, 
  Sparkles, 
  Mail, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  Twitter,
  Linkedin,
  MessageCircle
} from 'lucide-react';

export default function StatusCard({ user, onReset }) {
  const [copied, setCopied] = useState(false);

  // Trigger celebratory confetti on initial load
  useEffect(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#8b5cf6', '#d946ef', '#10b981'],
      });
    } catch (e) {
      // Ignore if canvas not supported
    }
  }, []);

  const handleCopy = () => {
    if (user?.referralUrl) {
      navigator.clipboard.writeText(user.referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const shareText = encodeURIComponent(
    `I just joined the early-access waitlist for Nova! Join with my link to skip ahead in line:`
  );
  const shareUrl = encodeURIComponent(user?.referralUrl || '');

  const twitterShare = `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`;
  const whatsappShare = `https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}`;
  const linkedinShare = `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`;
  const mailtoShare = `mailto:?subject=${encodeURIComponent("Join me on the Nova waitlist!")}&body=${shareText}%0A%0A${shareUrl}`;

  const isGranted = user?.status === 'granted';

  return (
    <div className="glass-card" style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center', position: 'relative' }}>
      {/* Header status badge */}
      <div style={{ marginBottom: '16px' }}>
        {isGranted ? (
          <span className="badge badge-granted" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
            <CheckCircle2 size={15} /> Access Granted 🎉
          </span>
        ) : (
          <span className="badge badge-waitlisted" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
            <Clock size={15} /> Waitlisted &bull; Position #{user?.rank || 1}
          </span>
        )}
      </div>

      <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px' }}>
        {isGranted ? `Congratulations, ${user?.name}!` : `You're on the list, ${user?.name}!`}
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '24px' }}>
        {isGranted 
          ? 'Your early-access invitation has been unlocked! Check your inbox for login instructions.'
          : 'Share your personal referral link with friends to climb higher in line.'}
      </p>

      {/* Main Stats Row */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '12px', 
        background: 'rgba(15, 23, 42, 0.6)', 
        padding: '18px 12px', 
        borderRadius: 'var(--radius-md)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        marginBottom: '24px'
      }}>
        {/* Waitlist Position */}
        <div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Waitlist Rank
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
            #{user?.rank}
          </div>
        </div>

        {/* Referrals Count */}
        <div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Referrals Earned
          </span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-secondary)', marginTop: '2px' }}>
            {user?.referralCount || 0}
          </div>
        </div>

        {/* Access Status */}
        <div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
            Access Status
          </span>
          <div style={{ 
            fontSize: '1rem', 
            fontWeight: 700, 
            marginTop: '8px', 
            color: isGranted ? 'var(--success)' : 'var(--warning)',
            textTransform: 'capitalize' 
          }}>
            {user?.status}
          </div>
        </div>
      </div>

      {/* Gamification / Tier Perks Banner */}
      {user?.perks && (
        <div style={{
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '14px',
          marginBottom: '24px',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{
            background: 'var(--accent-gradient)',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            color: '#fff'
          }}>
            <Award size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fff' }}>
              Tier: {user.perks.tier} &bull; {user.perks.badge}
            </div>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {user.perks.description}
            </div>
          </div>
        </div>
      )}

      {/* Referral Link & Copy Box */}
      <div style={{ textAlign: 'left', marginBottom: '20px' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
          Your Personal Referral Link:
        </label>
        
        <div className="copy-box">
          <input 
            type="text" 
            readOnly 
            value={user?.referralUrl || ''} 
            className="copy-input"
            onClick={(e) => e.target.select()}
          />
          <button className={`btn ${copied ? 'btn-success' : 'btn-primary'} btn-sm`} onClick={handleCopy}>
            {copied ? (
              <>
                <Check size={14} />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Social Share Buttons */}
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
          Quick Share on Social Media:
        </p>
        <div className="share-buttons" style={{ justifyContent: 'center' }}>
          <a href={twitterShare} target="_blank" rel="noopener noreferrer" className="share-btn twitter">
            <Twitter size={14} /> Twitter / X
          </a>
          <a href={whatsappShare} target="_blank" rel="noopener noreferrer" className="share-btn whatsapp">
            <MessageCircle size={14} /> WhatsApp
          </a>
          <a href={linkedinShare} target="_blank" rel="noopener noreferrer" className="share-btn linkedin">
            <Linkedin size={14} /> LinkedIn
          </a>
          <a href={mailtoShare} className="share-btn email">
            <Mail size={14} /> Email
          </a>
        </div>
      </div>

      {/* Footer Details */}
      <div style={{ 
        borderTop: '1px solid rgba(255, 255, 255, 0.08)', 
        paddingTop: '16px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        fontSize: '0.8rem',
        color: 'var(--text-subtle)'
      }}>
        <span>Referral Code: <strong style={{ color: 'var(--text-main)' }}>{user?.referralCode}</strong></span>
        <button 
          onClick={onReset}
          style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 600 }}
        >
          Check another email &rarr;
        </button>
      </div>
    </div>
  );
}

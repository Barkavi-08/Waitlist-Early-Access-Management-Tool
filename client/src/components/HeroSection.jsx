import React from 'react';
import { Sparkles, ArrowDown, Users, Flame } from 'lucide-react';

export default function HeroSection({ totalWaitlist = 0, onJoinClick }) {
  return (
    <section className="hero-section">
      {/* Category Pill */}
      <div className="hero-pill">
        <Sparkles size={14} style={{ color: '#a855f7' }} />
        <span>Next-Generation Developer Workspace &bull; Private Alpha</span>
      </div>

      {/* Main Title */}
      <h1 className="hero-title">
        The workspace built for <br />
        <span className="gradient-text">hyper-speed teams.</span>
      </h1>

      {/* Subtitle / Description */}
      <p className="hero-desc">
        Startups launching a new product need to manage demand before full rollout.
        Join the exclusive early-access waitlist, invite your network, and move up the queue
        with every referral.
      </p>

      {/* Live Counter & Call-to-Action */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <button className="btn btn-primary" onClick={onJoinClick} style={{ fontSize: '1.05rem', padding: '14px 28px' }}>
          <Flame size={18} />
          <span>Join the Waitlist Now</span>
        </button>

        <div className="live-counter-badge" style={{ marginTop: '8px' }}>
          <span className="pulsing-dot"></span>
          <span>
            Join <strong>{totalWaitlist > 0 ? totalWaitlist.toLocaleString() : '15+'}</strong> early adopters currently in line
          </span>
        </div>
      </div>
    </section>
  );
}

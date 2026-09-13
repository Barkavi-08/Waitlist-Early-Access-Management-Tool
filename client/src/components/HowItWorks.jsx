import React from 'react';
import { UserPlus, Link2, Share2, TrendingUp } from 'lucide-react';

const steps = [
  {
    number: '1',
    icon: UserPlus,
    title: 'Sign Up for Early Access',
    desc: 'Enter your full name and email to claim your initial spot on the waitlist queue.',
  },
  {
    number: '2',
    icon: Link2,
    title: 'Get Your Referral Link',
    desc: 'Immediately receive your custom referral code and dedicated invite URL.',
  },
  {
    number: '3',
    icon: Share2,
    title: 'Share With Friends',
    desc: 'Send your referral link to friends, colleagues, or post it across social media.',
  },
  {
    number: '4',
    icon: TrendingUp,
    title: 'Jump Up the Queue',
    desc: 'Every person who signs up through your link boosts your rank toward priority rollout.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" style={{ padding: '60px 0 30px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: '8px' }}>
          How the <span className="gradient-text">Referral System</span> Works
        </h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '540px', margin: '0 auto' }}>
          Skip the line organically. Our referral-based algorithm rewards you for helping spread the word.
        </p>
      </div>

      <div className="how-it-works-grid">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.number} className="step-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div className="step-number">{s.number}</div>
                <Icon size={22} style={{ color: 'var(--accent-secondary)' }} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px', color: '#fff' }}>
                {s.title}
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                {s.desc}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

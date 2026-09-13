import React from 'react';
import { Heart, Code2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <p style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Waitlist & Early-Access Management Tool</span>
          <span>&bull;</span>
          <span>BSc Computer Science Final Project</span>
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
          Built with React.js, Node.js, Express &amp; PostgreSQL / Local Storage Engine
        </p>
      </div>
    </footer>
  );
}

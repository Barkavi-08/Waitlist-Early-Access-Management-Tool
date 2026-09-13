import React, { useState, useEffect, useRef } from 'react';
import HeroSection from '../components/HeroSection';
import WaitlistForm from '../components/WaitlistForm';
import StatusCard from '../components/StatusCard';
import HowItWorks from '../components/HowItWorks';
import LeaderboardPreview from '../components/LeaderboardPreview';
import { getPublicStats } from '../utils/api';

export default function HomePage({ onTotalChange }) {
  const [activeUserData, setActiveUserData] = useState(null);
  const [totalWaitlist, setTotalWaitlist] = useState(0);
  const [topReferrers, setTopReferrers] = useState([]);
  const [initialRef, setInitialRef] = useState('');
  const formRef = useRef(null);

  // Check URL query parameters for referral code (e.g. ?ref=CODE)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setInitialRef(ref.toUpperCase());
      // Smooth scroll to form if referral link was clicked
      setTimeout(() => {
        if (formRef.current) {
          formRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 400);
    }
  }, []);

  // Fetch public statistics on mount
  useEffect(() => {
    async function loadStats() {
      try {
        const res = await getPublicStats();
        if (res?.data) {
          setTotalWaitlist(res.data.totalWaitlist || 0);
          setTopReferrers(res.data.topReferrers || []);
          if (onTotalChange) {
            onTotalChange(res.data.totalWaitlist || 0);
          }
        }
      } catch (err) {
        console.error('Failed to load public waitlist stats:', err);
      }
    }
    loadStats();
  }, [onTotalChange]);

  const handleJoinClick = () => {
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleUserSuccess = (userData) => {
    setActiveUserData(userData);
    // Refresh public stats count
    getPublicStats()
      .then((res) => {
        if (res?.data) {
          setTotalWaitlist(res.data.totalWaitlist || 0);
          setTopReferrers(res.data.topReferrers || []);
          if (onTotalChange) onTotalChange(res.data.totalWaitlist || 0);
        }
      })
      .catch(() => {});
  };

  return (
    <div className="container">
      {/* Hero Section */}
      <HeroSection totalWaitlist={totalWaitlist} onJoinClick={handleJoinClick} />

      {/* Main Interaction Area (Form or Status Card) */}
      <div ref={formRef} style={{ paddingTop: '20px', paddingBottom: '30px' }}>
        {activeUserData ? (
          <StatusCard 
            user={activeUserData} 
            onReset={() => setActiveUserData(null)} 
          />
        ) : (
          <WaitlistForm 
            onUserSuccess={handleUserSuccess} 
            initialRef={initialRef} 
          />
        )}
      </div>

      {/* Leaderboard Preview */}
      <LeaderboardPreview topReferrers={topReferrers} />

      {/* How it works 4-step guide */}
      <HowItWorks />
    </div>
  );
}

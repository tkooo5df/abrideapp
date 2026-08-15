import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ReferralTracker() {
  const location = useLocation();

  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(location.search);
      const ref = searchParams.get('ref');
      const utmSource = searchParams.get('utm_source');
      
      const source = ref || utmSource;
      
      if (source) {
        // Save to localStorage, only if not already saved to prevent overwriting
        // Or overwrite if they clicked a new ref link. We'll overwrite to track the latest source.
        localStorage.setItem('referral_source', source);
      }
    } catch (error) {
      console.error('Error tracking referral source:', error);
    }
  }, [location.search]);

  return null;
}

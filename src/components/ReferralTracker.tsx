import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ReferralTracker() {
  const location = useLocation();

  useEffect(() => {
    try {
      // 1. Check for explicit URL parameters first (utm_source, ref, etc)
      const searchParams = new URLSearchParams(location.search);
      const ref = searchParams.get('ref');
      const utmSource = searchParams.get('utm_source');
      
      let source = ref || utmSource;
      
      // 2. If no explicit parameters, check the HTTP Referrer (where the user clicked from)
      if (!source && document.referrer) {
        try {
          const referrerUrl = new URL(document.referrer);
          // Only save it if it's not coming from our own website
          if (!referrerUrl.hostname.includes('abride.online') && !referrerUrl.hostname.includes('localhost')) {
            // Examples: "facebook.com", "google.com", "instagram.com"
            source = referrerUrl.hostname.replace('www.', ''); 
            
            // Clean up common referrers for better readability
            if (source === 'l.facebook.com' || source === 'm.facebook.com') source = 'facebook.com';
            if (source === 'l.instagram.com') source = 'instagram.com';
            if (source === 't.co') source = 'twitter.com';
            if (source === 'android-app://com.google.android.googlequicksearchbox') source = 'google app';
          }
        } catch (e) {
          // If referrer is not a valid URL, ignore
        }
      }
      
      if (source) {
        // Only save to localStorage if it's not already set, 
        // OR if this is a new explicit parameter (ref/utm) which overrides the old one.
        const existingSource = localStorage.getItem('referral_source');
        if (!existingSource || (ref || utmSource)) {
          localStorage.setItem('referral_source', source);
        }
      }
    } catch (error) {
      console.error('Error tracking referral source:', error);
    }
  }, [location.search]);

  return null;
}

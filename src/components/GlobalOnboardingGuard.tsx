import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export const GlobalOnboardingGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    if (user && profile) {
      // إذا كان الحساب جديداً ولم يكمل إعداداته (onboarding_completed != true)
      if (profile.onboarding_completed !== true) {
        const allowedPaths = ['/google-signup', '/auth/callback', '/auth/signin'];
        
        // نوجهه إجبارياً إلى صفحة إكمال البيانات إذا لم يكن فيها بالفعل
        if (!allowedPaths.includes(location.pathname)) {
          navigate('/google-signup', { replace: true });
        }
      }
    }
  }, [user, profile, loading, location.pathname, navigate]);

  return <>{children}</>;
};

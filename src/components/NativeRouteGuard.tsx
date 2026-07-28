import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIsNativeApp } from '@/hooks/useIsNativeApp';

export const NativeRouteGuard = ({ children }: { children: React.ReactNode }) => {
  const isNative = useIsNativeApp();
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Only apply this guard for the native app
    if (!isNative || loading) return;

    const path = location.pathname;
    
    // Allow access to auth-related pages and the onboarding itself
    // We also allow policy pages since they might be needed during signup
    const isAllowedPath = 
      path.startsWith('/auth') || 
      path === '/login' || 
      path === '/google-signup' || 
      path === '/app-onboarding' ||
      path === '/terms' ||
      path === '/privacy';

    if (!user && !isAllowedPath) {
      // If they are on native app, not logged in, and trying to access main app features,
      // force them to onboarding (which leads to login)
      navigate('/app-onboarding', { replace: true });
    }
  }, [isNative, user, loading, location.pathname, navigate]);

  // Show a loading spinner while determining auth state in native app
  // to prevent a brief flash of the home screen before redirecting
  if (isNative && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
};

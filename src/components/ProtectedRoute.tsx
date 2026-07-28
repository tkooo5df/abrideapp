import { useAuth } from "@/hooks/useAuth";
import { useLocalAuth } from "@/hooks/useLocalAuth";
import { useDatabase } from "@/hooks/useDatabase";
import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import ProfileCompletionCheck from "./ProfileCompletionCheck";

interface ProtectedRouteProps {
  allowedRoles?: ('admin' | 'driver' | 'passenger')[];
  requireRole?: 'admin' | 'driver' | 'passenger';
}

const ProtectedRoute = ({ allowedRoles, requireRole }: ProtectedRouteProps) => {
  const { session, loading: authLoading, profile } = useAuth();
  const { user: localUser } = useLocalAuth();
  const { isLocal, getDatabaseService } = useDatabase();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get the current user based on the database type
  const currentUser = isLocal ? localUser : (session?.user || null);
  const currentUserRole = isLocal ? localUser?.role : profile?.role;

  // Fetch user profile for role checking
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (currentUser && isLocal) {
        try {
          const db = getDatabaseService();
          const userProfile = await db.getProfile(currentUser.id);
          setUserProfile(userProfile);
        } catch (error) {
        }
      } else if (profile) {
        setUserProfile(profile);
      }
      setLoading(false);
    };

    if (!authLoading) {
      fetchUserProfile();
    }
  }, [currentUser, isLocal, profile, authLoading]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!currentUser) {
    return <Navigate to="/auth/signin" replace />;
  }

  // Check role-based access if specified
  if (requireRole || allowedRoles) {
    const userRole = currentUserRole || userProfile?.role;
    
    if (requireRole && userRole !== requireRole) {
      return <Navigate to="/dashboard" replace />;
    }
    
    if (allowedRoles && !allowedRoles.includes(userRole as any)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Wrap the outlet with profile completion check
  return (
    <ProfileCompletionCheck>
      <Outlet />
    </ProfileCompletionCheck>
  );
};

export default ProtectedRoute;
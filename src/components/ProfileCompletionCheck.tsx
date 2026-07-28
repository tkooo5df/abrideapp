import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLocalAuth } from '@/hooks/useLocalAuth';
import { useDatabase } from '@/hooks/useDatabase';
import { toast } from '@/hooks/use-toast';

interface ProfileCompletionCheckProps {
  children: React.ReactNode;
}

const ProfileCompletionCheck = ({ children }: ProfileCompletionCheckProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: supabaseUser, profile: authProfile, loading: authLoading } = useAuth();
  const { user: localUser, loading: localLoading } = useLocalAuth();
  const { isLocal, getDatabaseService } = useDatabase();
  
  const user = isLocal ? localUser : supabaseUser;
  const profile = isLocal ? localUser : authProfile;
  const isLoading = isLocal ? localLoading : authLoading;
  const [profileChecked, setProfileChecked] = useState(false);
  const [hasShownNotification, setHasShownNotification] = useState(false);

  useEffect(() => {
    const checkProfileCompletion = async () => {
      // Don't check if still loading or no user
      if (isLoading || !user) {
        return;
      }
      
      try {
        let userProfile = null;
        
        // For local database, check if user has completed profile
        if (isLocal) {
          const db = getDatabaseService();
          userProfile = await db.getProfile(user.id);
        } else {
          userProfile = authProfile;
        }
        
        if (userProfile) {
          // Check if essential profile fields are filled
          const isProfileComplete = userProfile.fullName && 
                                   userProfile.phone && 
                                   userProfile.wilaya && 
                                   userProfile.commune;
          
          // Only show notification once and only if profile is incomplete and not on profile page
          if (!isProfileComplete && location.pathname !== '/profile' && !hasShownNotification) {
            // Show toast notification instead of automatic redirect
            toast({
              title: 'معلومات الملف الشخصي مطلوبة',
              description: 'يرجى ملء معلومات الملف الشخصي الخاصة بك للمتابعة',
              variant: 'default'
            });
            setHasShownNotification(true);
          }
        }
      } catch (error) {
      } finally {
        setProfileChecked(true);
      }
    };
    
    checkProfileCompletion();
  }, [user, profile, isLocal, isLoading, authProfile, location.pathname, hasShownNotification]);

  // Don't render children until profile check is complete
  if (isLoading || !profileChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحقق من الملف الشخصي...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProfileCompletionCheck;
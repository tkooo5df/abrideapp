import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Profile from '@/components/profile/Profile';
import EditProfile from '@/components/profile/EditProfile';
import { useAuth } from '@/hooks/useAuth';
import { useLocalAuth } from '@/hooks/useLocalAuth';
import { useDatabase } from '@/hooks/useDatabase';
import { isProfileComplete } from '@/utils/profileValidation';
import { Edit } from 'lucide-react'; // Import the Edit icon

const ProfilePage = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { profile: authProfile } = useAuth();
  const { user: localUser } = useLocalAuth();
  const { isLocal, getDatabaseService } = useDatabase();
  
  const user = isLocal ? localUser : authProfile;
  const [profileUser, setProfileUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Check if we should start in edit mode (from profile completion check)
  useEffect(() => {
    const loadProfileUser = async () => {
      setLoading(true);
      try {
        const userId = searchParams.get('userId');
        
        // If userId is provided, load that user's profile
        if (userId) {
          // Check if current user is trying to view their own profile
          if (user && user.id === userId) {
            setProfileUser(user);
          } else {
            // Load the specified user's profile
            const db = getDatabaseService();
            const userProfile = await db.getProfile(userId);
            setProfileUser(userProfile);
          }
        } else {
          // Load current user's profile
          setProfileUser(user);
          
          // Check if profile is incomplete and auto-switch to edit mode
          const editParam = searchParams.get('edit');
          if (editParam === 'true') {
            setIsEditing(true);
          }
          
          // Also check if profile is incomplete and auto-switch to edit mode
          if (user) {
            // For local database
            if (isLocal) {
              const db = getDatabaseService();
              const userProfile = await db.getProfile(user.id);
              
              if (userProfile && !isProfileComplete(userProfile)) {
                setIsEditing(true);
              }
            } 
            // For Supabase
            else if (!isProfileComplete(authProfile)) {
              setIsEditing(true);
            }
          }
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };
    
    loadProfileUser();
  }, [searchParams, user, isLocal, authProfile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // If trying to view another user's profile but not logged in
  if (searchParams.get('userId') && !user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">يجب تسجيل الدخول لعرض الملف الشخصي</h2>
              <button 
                onClick={() => navigate('/auth/signin')}
                className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-hover transition-colors"
              >
                تسجيل الدخول
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // If trying to view a profile that doesn't exist
  if (searchParams.get('userId') && !profileUser) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">المستخدم غير موجود</h2>
              <button 
                onClick={() => navigate('/')}
                className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-hover transition-colors"
              >
                العودة للرئيسية
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {isEditing ? (
            <EditProfile onBack={() => setIsEditing(false)} />
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">
                  {searchParams.get('userId') ? 'ملف السائق' : 'الملف الشخصي'}
                </h1>
                {/* Only show edit button for current user's profile */}
                {!searchParams.get('userId') && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 text-primary hover:text-primary-hover transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                    تعديل
                  </button>
                )}
              </div>
              <div>
                {/* Pass the profileUser to the Profile component */}
                <Profile userProfile={profileUser} />
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { uploadPendingAvatar } from '@/utils/avatarUpload';
import { TelegramService } from '@/integrations/telegram/telegramService';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [hasProcessed, setHasProcessed] = useState(false);

  useEffect(() => {
    const checkAndRedirect = async () => {
      if (!user || loading || hasProcessed) {
        return;
      }
      
      setHasProcessed(true);
      setCheckingProfile(true);
      
      // تحقق من الإرسال لكي لا يُرسل الإشعار سوى مرة واحدة فقط لهذا المستخدم
      const telegramNotified = localStorage.getItem('googleTelegramNotified');
      
      // 🔥 التحقق من مصدر الطلب: SignUp أم SignIn
      const isGoogleSignUp = localStorage.getItem('googleSignUpInProgress') === 'true';
      const isGoogleSignIn = localStorage.getItem('googleSignInInProgress') === 'true';
      
      try {
        if (!user.email) {
          await supabase.auth.signOut();
          localStorage.removeItem('googleSignUpInProgress');
          localStorage.removeItem('googleSignInInProgress');
          const errorMessage = 'لا يوجد بريد إلكتروني. يجب عليك إنشاء حساب جديد أولاً من صفحة التسجيل.';
          navigate('/auth/signin?error=no_email&message=' + encodeURIComponent(errorMessage));
          return;
        }

        // Check profile by email or user ID
        const normalizedEmail = user.email.toLowerCase().trim();
        
        let { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', normalizedEmail)
          .maybeSingle();

        if (!profile) {
          const { data: profileById } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();
          profile = profileById;
        }

        // If no profile exists yet in profiles table, create initial profile
        if (!profile) {
          const googleName = user.user_metadata?.full_name || user.user_metadata?.name || '';
          const nameParts = googleName.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          const googleAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

          const { data: newProfile } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              email: user.email,
              first_name: firstName,
              last_name: lastName,
              full_name: googleName,
              avatar_url: googleAvatar,
              role: 'passenger', // Initial placeholder until selected in slides
              onboarding_completed: false
            })
            .select('*')
            .maybeSingle();
          
          profile = newProfile;
        } else if (user.user_metadata) {
          // Update profile with Google name/avatar if missing
          const googleName = user.user_metadata.full_name || user.user_metadata.name || '';
          const nameParts = googleName.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          const googleAvatar = user.user_metadata.avatar_url || user.user_metadata.picture || null;

          if (!profile.first_name || !profile.avatar_url || !profile.full_name) {
            await supabase
              .from('profiles')
              .update({
                first_name: profile.first_name || firstName,
                last_name: profile.last_name || lastName,
                full_name: profile.full_name || googleName,
                avatar_url: profile.avatar_url || googleAvatar,
              })
              .eq('id', user.id);
          }
        }
        
        // Upload pending avatar if exists
        await uploadPendingAvatar(user.id);
        
        // Clean up flags
        localStorage.removeItem('googleSignUpInProgress');
        localStorage.removeItem('googleSignInInProgress');
        
        // Check if onboarding is completed
        if (!profile || !profile.onboarding_completed) {
          // First time Google user or incomplete onboarding -> GO TO SLIDES!
          navigate('/google-signup', { replace: true });
        } else {
          // Returning user with completed onboarding -> GO TO HOME!
          navigate('/', { replace: true });
        }
      } catch (error) {
        await supabase.auth.signOut();
        localStorage.removeItem('googleSignUpInProgress');
        localStorage.removeItem('googleSignInInProgress');
        const errorMessage = 'حدث خطأ أثناء التحقق من الحساب. يرجى المحاولة مرة أخرى.';
        navigate('/auth/signin?error=check_failed&message=' + encodeURIComponent(errorMessage));
      } finally {
        setCheckingProfile(false);
      }
    };

    if (!loading && user && !hasProcessed) {
      checkAndRedirect();
    } else if (!loading && !user) {
      // No user, redirect to sign in
      navigate('/auth/signin');
    }
  }, [user, loading, navigate, hasProcessed]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">جاري معالجة تسجيل الدخول...</h2>
          <p className="text-muted-foreground">يرجى الانتظار بينما نجهز حسابك</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthCallback;

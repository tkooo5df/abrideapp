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

        // 🔥 التحقق القاطع من وجود البريد الإلكتروني في جدول profiles
        // هذه هي الطريقة المطلوبة: التحقق من البريد أولاً قبل السماح بتسجيل الدخول
        const normalizedEmail = user.email.toLowerCase().trim();
        
        const { data: existingProfileByEmail, error: profileCheckError } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', normalizedEmail)
          .maybeSingle();

        // إذا حدث خطأ في التحقق، رفض تسجيل الدخول
        if (profileCheckError) {
          await supabase.auth.signOut();
          localStorage.removeItem('googleSignUpInProgress');
          localStorage.removeItem('googleSignInInProgress');
          const errorMessage = 'حدث خطأ أثناء التحقق من الحساب. يرجى المحاولة مرة أخرى.';
          navigate('/auth/signin?error=check_failed&message=' + encodeURIComponent(errorMessage));
          return;
        }

        let profile;

        // إذا وجد profile بنفس البريد الإلكتروني
        if (existingProfileByEmail) {
          // 🔥 التحقق من تاريخ إنشاء profile
          // إذا كان profile تم إنشاؤه للتو (خلال آخر 30 ثانية) وكان هذا من SignIn
          // يعني أن الـ trigger أنشأ profile تلقائياً - يجب حذفه ورفض تسجيل الدخول
          if (existingProfileByEmail.created_at) {
            const profileAge = new Date().getTime() - new Date(existingProfileByEmail.created_at).getTime();
            const isJustCreated = profileAge < 30 * 1000; // 30 ثانية (زيادة الوقت للتأكد)
            
            // 🔥 إذا كان profile تم إنشاؤه للتو (أقل من 30 ثانية) وكان هذا من SignIn (وليس SignUp)
            // يعني أن الـ trigger أنشأ profile تلقائياً - يجب حذفه ورفض تسجيل الدخول
            if (isJustCreated && (isGoogleSignIn || !isGoogleSignUp)) {
              // حذف profile وuser الذي تم إنشاؤه تلقائياً
              const deleteResult = await supabase
                .from('profiles')
                .delete()
                .eq('id', user.id);
              
              // التحقق من نجاح الحذف
              if (!deleteResult.error) {
                // التحقق مرة أخرى من أن profile تم حذفه
                const { data: verifyDelete } = await supabase
                  .from('profiles')
                  .select('id')
                  .eq('id', user.id)
                  .maybeSingle();
                
                if (verifyDelete) {
                  // محاولة حذف مرة أخرى
                  await supabase
                    .from('profiles')
                    .delete()
                    .eq('id', user.id);
                }
              }
              
              // رفض تسجيل الدخول دائماً في هذه الحالة
              await supabase.auth.signOut();
              localStorage.removeItem('googleSignUpInProgress');
              localStorage.removeItem('googleSignInInProgress');
              const errorMessage = 'لا يوجد حساب بهذا البريد الإلكتروني. يرجى إنشاء حساب جديد من صفحة التسجيل.';
              const errorUrl = '/auth/signup?error=no_account&message=' + encodeURIComponent(errorMessage);
              navigate(errorUrl, { replace: true });
              return;
            }
            
          }
          
          // 🔥 تحقق إضافي: إذا كان هذا من SignIn وprofile موجود
          // يجب التأكد من أن profile ليس تم إنشاؤه للتو (أقل من دقيقة)
          // لأن profile يجب أن يكون موجوداً مسبقاً من SignUp
          if (isGoogleSignIn && !isGoogleSignUp && existingProfileByEmail.created_at) {
            const profileAgeSeconds = Math.floor((new Date().getTime() - new Date(existingProfileByEmail.created_at).getTime()) / 1000);
            
            // إذا كان profile تم إنشاؤه خلال آخر دقيقة، يعني أنه من محاولة SignIn سابقة
            // يجب رفض تسجيل الدخول
            if (profileAgeSeconds < 60) {
              // محاولة حذف profile مرة أخرى
              await supabase
                .from('profiles')
                .delete()
                .eq('id', user.id);
              
              await supabase.auth.signOut();
              localStorage.removeItem('googleSignUpInProgress');
              localStorage.removeItem('googleSignInInProgress');
              const errorMessage = 'لا يوجد حساب بهذا البريد الإلكتروني. يرجى إنشاء حساب جديد من صفحة التسجيل.';
              const errorUrl = '/auth/signup?error=no_account&message=' + encodeURIComponent(errorMessage);
              navigate(errorUrl, { replace: true });
              return;
            }
          }
          
          profile = existingProfileByEmail;
          // السماح بتسجيل الدخول مباشرة - البريد موجود في profiles
        } else {
          // 🔥 لا يوجد profile بهذا البريد الإلكتروني
          // رفض تسجيل الدخول دائماً - لا نسمح بإنشاء حساب جديد من AuthCallback
          // يجب إنشاء الحساب من صفحة SignUp فقط
          await supabase.auth.signOut();
          localStorage.removeItem('googleSignUpInProgress');
          localStorage.removeItem('googleSignInInProgress');
          const errorMessage = 'لا يوجد حساب بهذا البريد الإلكتروني. يرجى إنشاء حساب جديد من صفحة التسجيل.';
          const errorUrl = '/auth/signup?error=no_account&message=' + encodeURIComponent(errorMessage);
          navigate(errorUrl, { replace: true });
          return;
        }

        // At this point, profile should exist - update with Google data if needed
        if (profile && user.user_metadata) {
          const googleName = user.user_metadata.full_name || user.user_metadata.name || '';
          const nameParts = googleName.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          const googleAvatar = user.user_metadata.avatar_url || user.user_metadata.picture || null;
          
          const needsUpdate = 
            (!profile.first_name && firstName) ||
            (!profile.last_name && lastName) ||
            (!profile.avatar_url && googleAvatar) ||
            (!profile.full_name && googleName);
          
          if (needsUpdate) {
            await supabase
              .from('profiles')
              .update({
                first_name: profile.first_name || firstName,
                last_name: profile.last_name || lastName,
                full_name: profile.full_name || googleName,
                avatar_url: profile.avatar_url || googleAvatar,
                email: user.email || profile.email,
              })
              .eq('id', user.id);
            
            // Re-fetch profile to get updated data
            const { data: updatedProfile } = await supabase
              .from('profiles')
              .select('id, first_name, last_name, full_name, wilaya, age, ksar, role, phone, created_at, email, avatar_url')
              .eq('id', user.id)
              .single();
            
            if (updatedProfile) {
              profile = updatedProfile;
            }
          }
        }
        
        // Upload pending avatar if exists
        await uploadPendingAvatar(user.id);
        
        // Check if profile is valid (has email)
        if (!profile || !profile.email) {
          await supabase.auth.signOut();
          localStorage.removeItem('googleSignUpInProgress');
          const errorMessage = 'حدث خطأ أثناء التحقق من الحساب. يرجى المحاولة مرة أخرى.';
          navigate('/auth/signin?error=check_failed&message=' + encodeURIComponent(errorMessage));
          return;
        }
        
        // Profile is valid, allow sign-in
        localStorage.removeItem('googleSignUpInProgress');
        localStorage.removeItem('googleSignInInProgress');
        
        // 🔥 Send notifications to admin if this is a new user registration
        // Send notification if profile was created within last 2 minutes (to catch new registrations)
        const profileAge = profile.created_at ? 
          (new Date().getTime() - new Date(profile.created_at).getTime()) : 
          Infinity;
        const isRecentProfile = profileAge < 2 * 60 * 1000; // 2 minutes
        
        const shouldNotify = isRecentProfile && !telegramNotified;
        
        if (shouldNotify) {
          try {
            // Use NotificationService which sends both Telegram and in-app notifications to admins
            const { NotificationService } = await import('@/integrations/database/notificationService');
            await NotificationService.notifyNewUserRegistration({
              userId: user.id,
              userRole: profile.role as 'driver' | 'passenger' | 'admin' | 'developer',
              userName: profile.full_name || `${profile.first_name} ${profile.last_name}`.trim() || user.email || 'مستخدم',
              userEmail: user.email || '',
            });
            
            // Mark as notified to prevent duplicate notifications
            localStorage.setItem('googleTelegramNotified', 'true');
          } catch (notificationError) {
            // Silent fail - don't block the sign-in process
          }
        }
        
        navigate('/');
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

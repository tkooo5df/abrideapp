import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);

  useEffect(() => {
    // Handle password reset flow
    const handlePasswordReset = async () => {
      try {
        // Check for hash in URL (from password reset email link)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');
        const refreshToken = hashParams.get('refresh_token');

        // Also check URL search params (some browsers may put it there)
        const urlAccessToken = searchParams.get('access_token');
        const urlType = searchParams.get('type');
        const urlRefreshToken = searchParams.get('refresh_token');

        const finalAccessToken = accessToken || urlAccessToken;
        const finalType = type || urlType;
        const finalRefreshToken = refreshToken || urlRefreshToken;
        // If we have tokens from password reset link, set the session
        if (finalAccessToken && finalRefreshToken && finalType === 'recovery') {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: finalAccessToken,
            refresh_token: finalRefreshToken
          });

          if (sessionError) {
            setError('رابط إعادة التعيين غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد.');
            setInitializing(false);
            return;
          }

          if (data.session) {
            setHasValidSession(true);
            
            // Clear hash from URL
            window.history.replaceState(null, '', window.location.pathname);
          } else {
            setError('رابط إعادة التعيين غير صالح. يرجى طلب رابط جديد.');
          }
        } else {
          // No tokens in URL, check if we have an existing session
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            setHasValidSession(true);
          } else {
            // No session and no tokens - redirect to sign in
            navigate('/auth/signin?redirect=reset-password');
            return;
          }
        }
      } catch (error: any) {
        setError('حدث خطأ أثناء معالجة رابط إعادة التعيين. يرجى المحاولة مرة أخرى.');
      } finally {
        setInitializing(false);
      }
    };

    handlePasswordReset();
  }, [navigate, searchParams]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Validation
    if (password.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError("كلمات المرور غير متطابقة");
      setLoading(false);
      return;
    }

    try {
      // Get current user info before updating password
      const { data: { user }, error: getUserError } = await supabase.auth.getUser();
      
      if (getUserError) {
        setError('حدث خطأ أثناء جلب معلومات المستخدم. يرجى المحاولة مرة أخرى.');
        setLoading(false);
        return;
      }

      if (!user) {
        setError('لم يتم العثور على المستخدم. يرجى طلب رابط إعادة تعيين جديد.');
        setLoading(false);
        return;
      }

      const userEmail = user.email || '';
      const userId = user.id;
      // Update password in Supabase Auth (this automatically updates the database)
      const { data: updateData, error: updateError } = await supabase.auth.updateUser({ 
        password: password 
      });

      if (updateError) {
        setError(updateError.message || 'حدث خطأ أثناء تحديث كلمة المرور. يرجى المحاولة مرة أخرى.');
        setLoading(false);
        return;
      }

      if (!updateData.user) {
        setError('حدث خطأ أثناء تحديث كلمة المرور. يرجى المحاولة مرة أخرى.');
        setLoading(false);
        return;
      }
      // Verify the password was updated by checking the session
      const { data: { session: newSession } } = await supabase.auth.getSession();
      if (newSession) {
      } else {
      }

      setSuccess('تم تحديث كلمة المرور بنجاح في قاعدة البيانات. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.');
      
      // Send password changed notification via email
      if (userId && userEmail) {
        try {
          const { NotificationService } = await import('@/integrations/database/notificationService');
          
          // Get user profile to determine role
          const { BrowserDatabaseService } = await import('@/integrations/database/browserServices');
          const profile = await BrowserDatabaseService.getProfile(userId);
          const userRole = profile?.role as 'driver' | 'passenger' | 'admin' | 'developer' | undefined;
          
          await NotificationService.notifyPasswordChanged(userId, userEmail, userRole);
        } catch (notificationError: any) {
          // Don't fail password reset if notification fails
        }
      }
      
      setTimeout(() => navigate('/auth/signin'), 2000);
    } catch (error: any) {
      setError(error.message || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking session
  if (initializing) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <Card>
              <CardContent className="p-8 text-center">
                <Lock className="h-8 w-8 animate-pulse mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">جاري التحقق من رابط إعادة التعيين...</p>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Show error if no valid session
  if (!hasValidSession && error) {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
                  <Lock className="h-8 w-8 text-primary" />
                  خطأ في إعادة التعيين
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Button onClick={() => navigate('/forgot-password')} className="w-full">
                  طلب رابط جديد
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
                <Lock className="h-8 w-8 text-primary" />
                إعادة تعيين كلمة المرور
              </CardTitle>
              <CardDescription>
                أدخل كلمة المرور الجديدة
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">كلمة المرور الجديدة</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="أدخل كلمة المرور الجديدة (6 أحرف على الأقل)"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="أعد إدخال كلمة المرور"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Requirements */}
                <div className="text-sm text-muted-foreground">
                  <p>متطلبات كلمة المرور:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li className={password.length >= 6 ? "text-green-600" : ""}>
                      6 أحرف على الأقل
                    </li>
                    <li className={password === confirmPassword && password.length > 0 ? "text-green-600" : ""}>
                      تطابق كلمات المرور
                    </li>
                  </ul>
                </div>

                {/* Error and Success Messages */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
                </Button>
              </form>

              {/* Help Text */}
              <div className="text-center text-sm text-muted-foreground">
                <p>بعد تحديث كلمة المرور، ستحتاج لتسجيل الدخول مرة أخرى.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ResetPassword;
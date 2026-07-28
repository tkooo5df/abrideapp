import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, Mail, Lock, Chrome, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Capacitor } from '@capacitor/core';
const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Check for error messages from URL params (from AuthCallback redirect)
  useEffect(() => {
    const searchString = location.search || window.location.search;
    const urlParams = new URLSearchParams(searchString);
    const errorParam = urlParams.get('error');
    const messageParam = urlParams.get('message');
    
    if (errorParam && messageParam) {
      try {
        const decodedMessage = decodeURIComponent(messageParam);
        setError(decodedMessage);

        const toastId = setTimeout(() => {
          toast({
            title: "⚠️ لا يمكن تسجيل الدخول",
            description: decodedMessage,
            variant: "destructive",
            duration: 6000,
          });
        }, 300);

        const cleanupId = setTimeout(() => {
          if (window.location.search) {
            window.history.replaceState({}, '', window.location.pathname);
          }
        }, 800);

        return () => {
          clearTimeout(toastId);
          clearTimeout(cleanupId);
        };
      } catch (error) {
        setError('حدث خطأ أثناء معالجة رسالة الخطأ');
      }
    }
  }, [location.search, location.pathname, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!email.trim()) {
      setError('البريد الإلكتروني مطلوب');
      setIsLoading(false);
      return;
    }
    if (!password.trim()) {
      setError('كلمة المرور مطلوبة');
      setIsLoading(false);
      return;
    }

    try {
      await signIn(email, password);

      navigate('/');

      toast({
        title: 'تم تسجيل الدخول بنجاح',
        description: 'مرحباً بك مرة أخرى!',
      });
    } catch (err) {
      let errorMessage = 'حدث خطأ أثناء تسجيل الدخول. يرجى التحقق من بياناتك والمحاولة مرة أخرى';
      if (err && typeof err === 'object' && 'message' in err) {
        const errorWithMessage = err as { message?: string };
        if (typeof errorWithMessage.message === 'string') {
          errorMessage = errorWithMessage.message;
        }
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      // 🔥 تعيين flag لتحديد أن هذا تسجيل دخول وليس تسجيل
      // هذا مهم للتحقق في AuthCallback
      localStorage.removeItem('googleSignUpInProgress');
      localStorage.setItem('googleSignInInProgress', 'true');
      
      if (Capacitor.isNativePlatform()) {
        const res = await GoogleAuth.signIn();
        
        const idToken = res.authentication.idToken;
        if (!idToken) throw new Error("لم نتمكن من الحصول على تفويض من جوجل");
        
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });
        
        if (error) throw error;
        // Redirect to callback to run the usual logic
        window.location.href = '/auth/callback';
      } else {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: Capacitor.isNativePlatform() 
              ? 'com.abride.app://auth' 
              : `${window.location.origin}/auth/callback`,
          },
        });
        if (error) {
          throw error;
        }
      }
    } catch (error: any) {
        console.error('Google sign in error:', error);
        toast({
          variant: "destructive",
          title: "خطأ في تسجيل الدخول",
          description: error.message || "حدث خطأ أثناء تسجيل الدخول بحساب Google",
        });
        localStorage.removeItem('googleSignInInProgress');
        setError(error.message || "حدث خطأ أثناء تسجيل الدخول بـ Google");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="w-full max-w-lg md:max-w-xl mx-auto flex flex-col items-center justify-center">
          <Card className="w-full">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
                <Lock className="h-8 w-8 text-primary" />
                تسجيل الدخول
              </CardTitle>
              <CardDescription>
                أدخل بياناتك للوصول إلى حسابك
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive" className="border-2 border-red-500 bg-red-50 dark:bg-red-950">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <AlertDescription className="font-semibold text-red-900 dark:text-red-100">
                    <div className="space-y-3">
                      <p className="text-base">{error}</p>
                      {(error.includes('لا يوجد حساب') || error.includes('إنشاء حساب') || error.includes('no_account')) && (
                        <div className="pt-3 border-t border-red-300 dark:border-red-800">
                          <p className="text-sm text-red-800 dark:text-red-200 mb-3 font-normal">
                            يمكنك إنشاء حساب جديد من هنا:
                          </p>
                          <Link 
                            to="/auth/signup" 
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 bg-red-600 text-white hover:bg-red-700 active:bg-red-800 h-10 px-6 py-2 shadow-md hover:shadow-lg"
                          >
                            إنشاء حساب جديد
                          </Link>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="أدخل بريدك الإلكتروني"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">كلمة المرور</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="أدخل كلمة المرور"
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

                <div className="flex items-center justify-between">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    نسيت كلمة المرور؟
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isLoading || isGoogleLoading}
                >
                  {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">أو</span>
                </div>
              </div>

              {/* Google Sign In Button */}
              <Button 
                type="button"
                variant="outline" 
                className="w-full" 
                size="lg"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isLoading}
              >
                <Chrome className="h-4 w-4 mr-2" />
                {isGoogleLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول بـ Google"}
              </Button>

              <div className="text-center text-sm">
                ليس لديك حساب؟{" "}
                <Link to="/auth/signup" className="text-primary hover:underline font-medium">
                  إنشاء حساب جديد
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SignIn;
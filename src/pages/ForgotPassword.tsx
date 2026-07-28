import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useState, useRef } from "react";
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lastRequestTime, setLastRequestTime] = useState<number | null>(null);
  const isSubmittingRef = useRef(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isSubmittingRef.current || loading) {
      return;
    }

    setError(null);
    setSuccess(null);

    // Basic validation
    if (!email.trim()) {
      setError("البريد الإلكتروني مطلوب");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("البريد الإلكتروني غير صحيح");
      return;
    }

    // Rate limiting: prevent multiple requests within 60 seconds
    const now = Date.now();
    if (lastRequestTime && now - lastRequestTime < 60000) {
      const remainingSeconds = Math.ceil((60000 - (now - lastRequestTime)) / 1000);
      setError(`يرجى الانتظار ${remainingSeconds} ثانية قبل إعادة المحاولة`);
      return;
    }

    // Set submitting flag
    isSubmittingRef.current = true;
    setLoading(true);
    setLastRequestTime(now);

    try {
      // Add timeout handling (30 seconds)
      const timeoutPromise = new Promise<{ error: Error }>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Request timeout: تم تجاوز وقت الانتظار. يرجى المحاولة مرة أخرى.'));
        }, 30000);
      });

      // Use the site URL from environment or current origin
      const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
      const redirectUrl = `${siteUrl}/reset-password`;
      const resetPromise = supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
        emailRedirectTo: redirectUrl,
      });

      let result: { error: any } | null = null;
      try {
        result = await Promise.race([resetPromise, timeoutPromise]) as { error: any };
      } catch (timeoutError: any) {
        // Handle timeout error
        if (timeoutError.message?.includes("timeout") || timeoutError.message?.includes("تم تجاوز وقت الانتظار")) {
          throw new Error('Request timeout: تم تجاوز وقت الانتظار. يرجى المحاولة مرة أخرى. قد تكون هناك مشكلة في Supabase Auth service.');
        }
        throw timeoutError;
      }

      const { error } = result || { error: null };

      if (error) {
        // Handle specific error cases
        if (error.message.includes("User not found") || error.message.includes("user not found")) {
          setError("لا يوجد حساب مسجل بهذا البريد الإلكتروني");
        } else if (error.message.includes("429") || error.status === 429 || error.message.includes("rate limit") || error.message.includes("too many requests")) {
          setError("تم إرسال طلبات كثيرة جداً. يرجى الانتظار دقيقة واحدة قبل المحاولة مرة أخرى.");
          // Reset lastRequestTime to enforce wait period
          setLastRequestTime(now);
        } else if (error.message.includes("504") || error.status === 504 || error.message.includes("timeout") || error.message.includes("gateway")) {
          setError("انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى بعد لحظات.");
        } else if (error.message.includes("500") || error.status === 500 || error.message.includes("Internal Server Error") || error.message.includes("internal server error")) {
          setError("حدث خطأ في الخادم. يرجى التحقق من إعدادات SMTP في Supabase Dashboard أو المحاولة مرة أخرى بعد لحظات. إذا استمرت المشكلة، يرجى التواصل مع الدعم.");
        } else if (error.message.includes("SMTP") || error.message.includes("smtp") || error.message.includes("email") || error.message.includes("mail")) {
          setError("مشكلة في إعدادات البريد الإلكتروني. يرجى التحقق من إعدادات SMTP في Supabase Dashboard.");
        } else {
          setError(error.message || "حدث خطأ أثناء إرسال رابط إعادة تعيين كلمة المرور. يرجى المحاولة مرة أخرى.");
        }
      } else {
        setSuccess("تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني. يرجى التحقق من صندوق الوارد والرسائل غير المرغوب فيها.");
        // Clear email after success
        setEmail("");
      }
    } catch (error: any) {
      // Handle network errors
      if (error.message?.includes("Failed to fetch") || error.message?.includes("network") || error.message?.includes("ERR_TIMED_OUT") || error.message?.includes("timeout") || error.message?.includes("TIMED_OUT")) {
        setError("تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى. إذا استمرت المشكلة، قد تكون هناك مشكلة في Supabase Auth service.");
      } else if (error.message?.includes("Request timeout") || error.message?.includes("تم تجاوز وقت الانتظار")) {
        setError("تم تجاوز وقت الانتظار. يرجى المحاولة مرة أخرى. قد تكون هناك مشكلة في Supabase Auth service.");
      } else {
        setError(error.message || "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.");
      }
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
                <Mail className="h-8 w-8 text-primary" />
                نسيت كلمة المرور؟
              </CardTitle>
              <CardDescription>
                أدخل بريدك الإلكتروني لإعادة تعيين كلمة المرور
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {error && (
                  <Alert>
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
                  {loading ? "جاري الإرسال..." : "إرسال رابط إعادة التعيين"}
                </Button>
              </form>

              {/* Back to Sign In */}
              <div className="text-center">
                <Link 
                  to="/auth/signin" 
                  className="inline-flex items-center text-sm text-primary hover:underline"
                >
                  <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                  العودة إلى تسجيل الدخول
                </Link>
              </div>

              {/* Help Text */}
              <div className="text-center text-sm text-muted-foreground">
                <p>لم تتلق الرسالة؟ تحقق من مجلد الرسائل غير المرغوب فيها أو جرب مرة أخرى.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ForgotPassword;
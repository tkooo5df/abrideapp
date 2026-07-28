import { Home, Search, User, Menu } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { getDisplayName } from "@/utils/displayName";
import { useIsNativeApp } from "@/hooks/useIsNativeApp";

const BottomNavigationBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const isNativeApp = useIsNativeApp();
  
  // Get display name
  const displayName = getDisplayName([
    profile,
    user?.user_metadata,
  ], {
    fallback: 'مستخدم',
    email: user?.email ?? null,
  });

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navigationItems = [
    {
      label: "الرئيسية",
      icon: Home,
      path: "/",
    },
    {
      label: "الرحلات",
      icon: Search,
      path: "/current-trips",
    },
    {
      label: "الحساب",
      icon: User,
      path: user ? "/dashboard" : "/login",
    },
  ];

  return (
    <>
      {/* Bottom Navigation Bar */}
      <div className={`fixed bottom-0 left-0 right-0 bg-background/85 backdrop-blur-xl border-t border-border/50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 ${isNativeApp ? 'block' : 'md:hidden'} pb-[env(safe-area-inset-bottom)]`}>
        <div className="flex items-center justify-around h-16 px-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`h-6 w-6 mb-1 ${active ? "fill-primary" : ""}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}

          {/* Sidebar Menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground hover:text-foreground transition-colors">
                <Menu className="h-6 w-6 mb-1" />
                <span className="text-xs font-medium">القائمة</span>
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]" dir="rtl">
              <SheetTitle className="text-xl font-bold text-primary mb-2">
                أبري
              </SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground mb-4 pb-4 border-b border-border">
                {user ? `مرحباً، ${displayName}` : 'تصفح القائمة واختر ما تريد'}
              </SheetDescription>
              
              <div className="flex flex-col h-[calc(100%-100px)]">
                {/* Menu Items */}
                <div className="flex-1 space-y-2">
                  {user ? (
                    <>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-right"
                        onClick={() => {
                          navigate("/dashboard");
                          setOpen(false);
                        }}
                      >
                        <User className="ml-2 h-5 w-5" />
                        لوحة التحكم
                      </Button>

                      <Button
                        variant="ghost"
                        className="w-full justify-start text-right"
                        onClick={() => {
                          navigate("/current-trips");
                          setOpen(false);
                        }}
                      >
                        <Search className="ml-2 h-5 w-5" />
                        الرحلات
                      </Button>

                      <Button
                        variant="ghost"
                        className="w-full justify-start text-right"
                        onClick={() => {
                          navigate("/");
                          setOpen(false);
                        }}
                      >
                        <Home className="ml-2 h-5 w-5" />
                        الصفحة الرئيسية
                      </Button>

                      <div className="border-t border-border my-4" />

                      <Button
                        variant="ghost"
                        className="w-full justify-start text-right text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={async () => {
                          await signOut();
                          setOpen(false);
                          navigate("/");
                        }}
                      >
                        تسجيل الخروج
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-right"
                        onClick={() => {
                          navigate("/");
                          setOpen(false);
                        }}
                      >
                        <Home className="ml-2 h-5 w-5" />
                        الصفحة الرئيسية
                      </Button>

                      <Button
                        variant="ghost"
                        className="w-full justify-start text-right"
                        onClick={() => {
                          navigate("/current-trips");
                          setOpen(false);
                        }}
                      >
                        <Search className="ml-2 h-5 w-5" />
                        الرحلات
                      </Button>

                      <div className="border-t border-border my-4" />

                      <Button
                        className="w-full"
                        onClick={() => {
                          navigate("/login");
                          setOpen(false);
                        }}
                      >
                        تسجيل الدخول
                      </Button>

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          navigate("/auth/signup");
                          setOpen(false);
                        }}
                      >
                        إنشاء حساب
                      </Button>
                    </>
                  )}
                </div>

                {/* Footer */}
                <div className="border-t border-border pt-4 mt-4">
                  <p className="text-xs text-center text-muted-foreground">
                    أبري - منصة النقل الذكية
                  </p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Spacer to prevent content from being hidden behind the bar */}
      <div className={`h-16 ${isNativeApp ? 'block' : 'md:hidden'}`} />
    </>
  );
};

export default BottomNavigationBar;


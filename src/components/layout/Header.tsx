import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Car, Menu, X, User, LogOut, Settings, Bell, Check, Clock, Database, MapPin, Calendar, AlertTriangle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useLocalAuth } from "@/hooks/useLocalAuth";
import { useDatabase } from "@/hooks/useDatabase";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { NotificationService } from "@/integrations/database/notificationService";
import { toast } from "@/hooks/use-toast";
import { getDisplayName } from "@/utils/displayName";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BrowserDatabaseService } from "@/integrations/database/browserServices";
import { wilayas } from "@/data/wilayas";
import { useIsNativeApp } from "@/hooks/useIsNativeApp";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showTripDetailsDialog, setShowTripDetailsDialog] = useState(false);
  const [selectedTripDetails, setSelectedTripDetails] = useState<any>(null);
  const [loadingTripDetails, setLoadingTripDetails] = useState(false);
  const { session, profile } = useAuth();
  const { user: localUser, signOut: localSignOut } = useLocalAuth();
  const { isLocal } = useDatabase();
  const navigate = useNavigate();
  const isNativeApp = useIsNativeApp();
  
  // Use local user if using local database, otherwise use Supabase
  const currentUser = isLocal ? localUser : (session ? { ...profile, id: session.user.id } : null);
  const isAuthenticated = isLocal ? !!localUser : !!session;
  
  // Get the full name from available sources - prioritize profile data over session metadata
  const getFullUserName = () => {
    // Handle LocalUser (has camelCase properties)
    if (isLocal && localUser) {
      if (localUser.fullName) return localUser.fullName;
      if (localUser.firstName && localUser.lastName) {
        return `${localUser.firstName} ${localUser.lastName}`;
      }
      if (localUser.firstName) return localUser.firstName;
      if (localUser.lastName) return localUser.lastName;
    }
    
    // Handle Supabase profile (has snake_case properties) - ALWAYS prioritize profile data
    // This ensures we use the most up-to-date name from the database
    if (!isLocal && profile) {
      if (profile.full_name) return profile.full_name;
      if (profile.first_name && profile.last_name) {
        return `${profile.first_name} ${profile.last_name}`;
      }
      if (profile.first_name) return profile.first_name;
      if (profile.last_name) return profile.last_name;
    }
    
    // Only use session user_metadata if profile is not loaded yet (during initial load)
    // This prevents showing stale data from metadata
    if (!isLocal && session?.user?.user_metadata && !profile) {
      const metadata = session.user.user_metadata;
      if (metadata.full_name) return metadata.full_name;
      if (metadata.first_name && metadata.last_name) {
        return `${metadata.first_name} ${metadata.last_name}`;
      }
      if (metadata.first_name) return metadata.first_name;
      if (metadata.last_name) return metadata.last_name;
      if (metadata.name) return metadata.name;
    }
    
    // Final fallback
    return getDisplayName([
      currentUser,
      profile,
      session?.user?.user_metadata,
    ], {
      fallback: 'مستخدم',
      email: session?.user?.email ?? currentUser?.email ?? null,
    });
  };
  
  // Recalculate displayName whenever profile or session changes
  const displayName = getFullUserName();

  const handleSignOut = async () => {
    try {
      if (isLocal) {
        localSignOut();
      } else {
        const { error } = await supabase.auth.signOut();
        if (error) {
          return;
        }
      }
      navigate("/");
    } catch (error) {
    }
  };

  // Load notifications for authenticated users
  const loadNotifications = async () => {
    if (!currentUser) {
      return;
    }
    
    try {
      const userNotifications = await NotificationService.getUserNotifications(currentUser.id);
      setNotifications(userNotifications || []);
      setUnreadCount((userNotifications || []).filter((n: any) => !n.isRead).length);
    } catch (error) {
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  // Load notifications when user changes
  useEffect(() => {
    if (currentUser) {
      loadNotifications();
      
      // Set up interval to refresh notifications every 30 seconds
      const interval = setInterval(() => {
        loadNotifications();
      }, 30000);
      
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [currentUser?.id]);

  // Handle notification click
  const handleNotificationClick = async (notification: any) => {
    try {
      // Mark as read if not already read
      if (!notification.isRead) {
        await NotificationService.markAsRead(notification.id);
        // Update local state
        setNotifications(prev => 
          prev.map((n: any) => n.id === notification.id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      // Close the dropdown
      setShowNotifications(false);

      // Navigate to relevant page if actionUrl exists
      if (notification.actionUrl) {
        navigate(notification.actionUrl);
      } else if (notification.relatedType === 'booking') {
        navigate('/user-dashboard?tab=bookings');
      } else if (notification.relatedType === 'trip') {
        // إذا كان هناك tripId في relatedId، افتح نافذة تفاصيل الرحلة
        if (notification.relatedId) {
          await loadTripDetails(notification.relatedId);
        } else {
          // وإلا انتقل إلى تبويب الرحلات
          navigate('/user-dashboard?tab=trips');
        }
      }
    } catch (error) {
    }
  };

  // Load trip details for popup
  const loadTripDetails = async (tripId: string) => {
    try {
      setLoadingTripDetails(true);
      const trip = await BrowserDatabaseService.getTripById(tripId);
      if (trip) {
        setSelectedTripDetails(trip);
        setShowTripDetailsDialog(true);
      } else {
        toast({
          title: "خطأ",
          description: "لم يتم العثور على تفاصيل الرحلة",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحميل تفاصيل الرحلة",
        variant: "destructive"
      });
    } finally {
      setLoadingTripDetails(false);
    }
  };

  // Helper function to get wilaya name
  const getWilayaName = (wilayaId: number | string) => {
    const wilaya = wilayas.find(w => w.id === Number(wilayaId));
    return wilaya ? wilaya.name : `ولاية ${wilayaId}`;
  };

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showNotifications && !target.closest('[data-notification-dropdown]')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      await loadNotifications(); // Refresh the list
    } catch (error) {
    }
  };

  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'الآن';
    if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`;
    if (diffInMinutes < 1440) return `منذ ${Math.floor(diffInMinutes / 60)} ساعة`;
    return date.toLocaleDateString('ar-DZ');
  };

  if (isNativeApp) {
    return (
      <header className="bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 border-b border-border sticky top-0 z-50 pt-[env(safe-area-inset-top)]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              {window.location.pathname !== '/' && (
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
                  <ArrowRight className="h-5 w-5" />
                </Button>
              )}
              <h1 className="font-bold text-lg text-primary">أبريد</h1>
            </div>
            
            {isAuthenticated && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="relative gap-2 rounded-full"
                onClick={() => navigate('/user-dashboard?tab=notifications')}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px]"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
            )}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
            <img 
              src="/logo.svg" 
              alt="منصة أبريد Logo" 
              className="h-16 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link 
              to="/" 
              className="px-3 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors rounded-md hover:bg-accent"
            >
              الرئيسية
            </Link>
            <Link 
              to="/current-trips" 
              className="px-3 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors rounded-md hover:bg-accent"
            >
              الرحلات الحالية
            </Link>
            <Link 
              to="/about" 
              className="px-3 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors rounded-md hover:bg-accent"
            >
              حولنا
            </Link>
            <Link 
              to="/contact" 
              className="px-3 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors rounded-md hover:bg-accent"
            >
              اتصل بنا
            </Link>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Notifications - Only show for authenticated users */}
            {isAuthenticated && (
              <div className="relative" data-notification-dropdown>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="relative gap-2 rounded-full"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px]"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Button>
                
                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute left-0 top-full mt-2 bg-popover border border-border rounded-xl shadow-lg w-80 max-w-[90vw] z-50 max-h-96">
                    <div className="p-4 border-b border-border">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm">الإشعارات</h3>
                        {unreadCount > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {unreadCount} جديد
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <ScrollArea className="max-h-64">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground text-sm">
                          لا توجد إشعارات
                        </div>
                      ) : (
                        <div className="divide-y divide-border">
                          {notifications.map((notification: any) => (
                            <div 
                              key={notification.id} 
                              className={cn(
                                "p-4 hover:bg-accent/50 transition-colors cursor-pointer",
                                !notification.isRead && "bg-primary/5 border-r-2 border-r-primary"
                              )}
                              onClick={() => handleNotificationClick(notification)}
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="text-sm font-medium truncate">{notification.title}</p>
                                    {!notification.isRead ? (
                                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                                    ) : (
                                      <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    <span>{formatNotificationTime(notification.createdAt)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                    
                    {notifications.length > 0 && (
                      <div className="p-3 border-t border-border">
                        <Link 
                          to="/user-dashboard" 
                          className="text-sm text-primary hover:underline"
                          onClick={() => setShowNotifications(false)}
                        >
                          عرض جميع الإشعارات
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Auth Buttons */}
            <div className="hidden sm:flex items-center gap-2">
              {isAuthenticated ? (
                <div className="relative group">
                  <Button variant="ghost" className="gap-2 px-3 rounded-full">
                    <User className="h-4 w-4" />
                    <span className="text-sm max-w-[100px] truncate hidden md:inline">
                      {displayName}
                    </span>
                  </Button>
                  <div className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 min-w-[200px] z-50">
                    <div className="p-3 border-b border-border">
                      <p className="text-sm font-medium truncate">{displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {currentUser?.role === 'driver' ? 'سائق' :
                         currentUser?.role === 'passenger' ? 'راكب' :
                         currentUser?.role === 'admin' ? 'مدير' : 'عضو'}
                      </p>
                    </div>
                    <Link 
                      to={currentUser?.role === 'admin' ? '/admin' : '/dashboard'} 
                      className="block px-4 py-2 text-sm text-foreground hover:bg-accent"
                    >
                      <Settings className="h-4 w-4 mr-2 inline" />
                      {currentUser?.role === 'admin' ? 'لوحة الإدارة' : 'لوحة التحكم'}
                    </Link>
                    {/* Add Database Settings menu item - Admin Only */}
                    {currentUser?.role === 'admin' && (
                      <Link 
                        to="/database-settings" 
                        className="block px-4 py-2 text-sm text-foreground hover:bg-accent"
                      >
                        <Database className="h-4 w-4 mr-2 inline" />
                        إعدادات قاعدة البيانات
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 flex items-center"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      تسجيل الخروج
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <Link to="/auth/signin">
                    <Button variant="ghost" size="sm" className="rounded-full">
                      <User className="h-4 w-4 mr-1" />
                      <span className="hidden md:inline">
                        تسجيل الدخول
                      </span>
                    </Button>
                  </Link>
                  <Button 
                    variant="hero" 
                    size="sm"
                    className="rounded-full px-4"
                    onClick={() => {
                      navigate('/auth/signup');
                    }}
                  >
                    إنشاء حساب
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-full"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border py-4 mt-2">
            <nav className="flex flex-col gap-1">
              <Link 
                to="/" 
                className="px-4 py-3 text-foreground hover:text-primary transition-colors rounded-lg hover:bg-accent"
                onClick={() => setIsMenuOpen(false)}
              >
                الرئيسية
              </Link>
              <Link 
                to="/current-trips" 
                className="px-4 py-3 text-foreground hover:text-primary transition-colors rounded-lg hover:bg-accent"
                onClick={() => setIsMenuOpen(false)}
              >
                الرحلات الحالية
              </Link>
              <Link 
                to="/about" 
                className="px-4 py-3 text-foreground hover:text-primary transition-colors rounded-lg hover:bg-accent"
                onClick={() => setIsMenuOpen(false)}
              >
                حولنا
              </Link>
              <Link 
                to="/contact" 
                className="px-4 py-3 text-foreground hover:text-primary transition-colors rounded-lg hover:bg-accent"
                onClick={() => setIsMenuOpen(false)}
              >
                اتصل بنا
              </Link>
              {currentUser?.role === 'admin' && (
                <Link 
                  to="/admin" 
                  className="px-4 py-3 text-foreground hover:text-primary transition-colors rounded-lg hover:bg-accent"
                  onClick={() => setIsMenuOpen(false)}
                >
                  لوحة الإدارة
                </Link>
              )}
              <div className="flex flex-col gap-2 pt-4 border-t border-border mt-2">
                {isAuthenticated ? (
                  <>
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-medium truncate">{displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {currentUser?.role === 'driver' ? 'سائق' :
                         currentUser?.role === 'passenger' ? 'راكب' :
                         currentUser?.role === 'admin' ? 'مدير' : 'عضو'}
                      </p>
                    </div>
                    
                    {/* Mobile Notifications */}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start relative px-4 py-3 rounded-lg"
                      onClick={() => {
                        setIsMenuOpen(false);
                        navigate('/dashboard?tab=notifications');
                      }}
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      الإشعارات
                      {unreadCount > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                      )}
                    </Button>
                    
                    <Link 
                      to="/dashboard" 
                      className="px-4 py-3 text-foreground hover:text-primary transition-colors rounded-lg hover:bg-accent"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4 mr-2 inline" />
                      لوحة التحكم
                    </Link>
                    
                    {currentUser?.role === 'admin' && (
                      <Link 
                        to="/admin/dashboard" 
                        className="px-4 py-3 text-foreground hover:text-primary transition-colors rounded-lg hover:bg-accent"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4 mr-2 inline" />
                        لوحة الإدارة
                      </Link>
                    )}
                    {/* Add Database Settings menu item for mobile - Admin Only */}
                    {currentUser?.role === 'admin' && (
                      <Link 
                        to="/database-settings" 
                        className="px-4 py-3 text-foreground hover:text-primary transition-colors rounded-lg hover:bg-accent"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Database className="h-4 w-4 mr-2 inline" />
                        إعدادات قاعدة البيانات
                      </Link>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start text-destructive hover:text-destructive px-4 py-3 rounded-lg"
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleSignOut();
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      تسجيل الخروج
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/auth/signin" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="ghost" size="sm" className="w-full justify-start px-4 py-3 rounded-lg">
                        <User className="h-4 w-4 mr-2" />
                        تسجيل الدخول
                      </Button>
                    </Link>
                    <Button 
                      variant="hero" 
                      size="sm" 
                      className="w-full rounded-lg px-4 py-3"
                      onClick={() => {
                        setIsMenuOpen(false);
                        navigate('/auth/signup');
                      }}
                    >
                      إنشاء حساب
                    </Button>
                    <Link to="/admin" onClick={() => setIsMenuOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full justify-start px-4 py-3 rounded-lg">
                        <Settings className="h-4 w-4 mr-2" />
                        لوحة الإدارة
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>

      {/* Trip Details Dialog */}
      <Dialog open={showTripDetailsDialog} onOpenChange={setShowTripDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              تفاصيل الرحلة
            </DialogTitle>
            <DialogDescription>
              عرض تفاصيل الرحلة الكاملة
            </DialogDescription>
          </DialogHeader>
          
          {loadingTripDetails ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="mr-3">جاري تحميل التفاصيل...</span>
            </div>
          ) : selectedTripDetails ? (
            <div className="space-y-4">
              {/* Trip Status */}
              {selectedTripDetails.status === 'cancelled' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-900 mb-2">تم إلغاء الرحلة</h4>
                      {selectedTripDetails.cancellationReason && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-red-800 mb-1">سبب الإلغاء:</p>
                          <p className="text-sm text-red-700 bg-white p-3 rounded border border-red-200">
                            {selectedTripDetails.cancellationReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Route Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">من</span>
                  </div>
                  <p className="text-lg font-semibold text-blue-900">
                    {selectedTripDetails.fromWilayaName || getWilayaName(selectedTripDetails.fromWilayaId)}
                    {selectedTripDetails.fromWilayaId === 47 && (selectedTripDetails as any).fromKsar && (
                      <span className="text-xs text-primary font-medium"> - {(selectedTripDetails as any).fromKsar}</span>
                    )}
                  </p>
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900">إلى</span>
                  </div>
                  <p className="text-lg font-semibold text-green-900">
                    {selectedTripDetails.toWilayaName || getWilayaName(selectedTripDetails.toWilayaId)}
                    {selectedTripDetails.toWilayaId === 47 && (selectedTripDetails as any).toKsar && (
                      <span className="text-xs text-primary font-medium"> - {(selectedTripDetails as any).toKsar}</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">تاريخ الانطلاق</span>
                  </div>
                  <p className="text-base font-semibold text-gray-900">
                    {new Date(selectedTripDetails.departureDate).toLocaleDateString('ar-DZ', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">وقت الانطلاق</span>
                  </div>
                  <p className="text-base font-semibold text-gray-900">
                    {selectedTripDetails.departureTime}
                  </p>
                </div>
              </div>

              {/* Seats and Price */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">المقاعد</span>
                  </div>
                  <p className="text-base font-semibold text-purple-900">
                    {selectedTripDetails.availableSeats || 0} / {selectedTripDetails.totalSeats || 0} متاح
                  </p>
                </div>
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Car className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-900">السعر</span>
                  </div>
                  <p className="text-base font-semibold text-yellow-900">
                    {selectedTripDetails.pricePerSeat || 0} دج / مقعد
                  </p>
                </div>
              </div>

              {/* Description */}
              {selectedTripDetails.description && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">الوصف</h4>
                  <p className="text-sm text-gray-900">{selectedTripDetails.description}</p>
                </div>
              )}

              {/* Status Badge */}
              <div className="flex items-center justify-center">
                <Badge 
                  variant={
                    selectedTripDetails.status === 'cancelled' ? 'destructive' :
                    selectedTripDetails.status === 'completed' ? 'default' :
                    selectedTripDetails.status === 'scheduled' ? 'secondary' : 'outline'
                  }
                  className="text-sm px-4 py-2"
                >
                  {selectedTripDetails.status === 'cancelled' ? 'ملغاة' :
                   selectedTripDetails.status === 'completed' ? 'مكتملة' :
                   selectedTripDetails.status === 'scheduled' ? 'مجدولة' :
                   selectedTripDetails.status === 'fully_booked' ? 'ممتلئة' :
                   selectedTripDetails.status}
                </Badge>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>لم يتم العثور على تفاصيل الرحلة</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default Header;
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BrowserDatabaseService } from "@/integrations/database/browserServices";
import { useToast } from "@/hooks/use-toast";
import BookingModal from "@/components/booking/BookingModal";
import LoginPromptModal from "@/components/auth/LoginPromptModal";
import ProfileCompletionModal from "@/components/booking/ProfileCompletionModal";
import { validateProfileForBooking } from "@/utils/profileValidation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useLocalAuth } from "@/hooks/useLocalAuth";
import { useDatabase } from "@/hooks/useDatabase";
import { Loader2 } from "lucide-react";

const BookingConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const { toast } = useToast();

  // Check authentication
  const { user: supabaseUser, profile: authProfile } = useAuth();
  const { user: localUser } = useLocalAuth();
  const { isLocal, getDatabaseService } = useDatabase();
  const user = isLocal ? localUser : supabaseUser;
  const isAuthenticated = user && user.id;
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showProfileCompletionModal, setShowProfileCompletionModal] = useState(false);
  const [missingProfileFields, setMissingProfileFields] = useState<string[]>([]);

  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check authentication and profile completion
  useEffect(() => {
    const checkAuthAndProfile = async () => {
      if (!isAuthenticated) {
        setShowLoginPrompt(true);
        return;
      }

      // Check profile completion
      try {
        let userProfile = null;
        
        if (isLocal) {
          // For local database
          const db = getDatabaseService();
          userProfile = await db.getProfile(user.id);
        } else {
          // For Supabase, use authProfile or fetch it
          if (authProfile) {
            userProfile = authProfile;
          } else {
            userProfile = await BrowserDatabaseService.getProfile(user.id);
          }
        }

        // Validate profile
        if (userProfile) {
          const validation = validateProfileForBooking(userProfile);
          if (!validation.isValid) {
            setMissingProfileFields(validation.missingFields);
            setShowProfileCompletionModal(true);
            toast({
              title: "معلومات الملف الشخصي ناقصة",
              description: validation.message,
              variant: "destructive"
            });
            return;
          }
        } else {
          // Profile not found
          toast({
            title: "خطأ",
            description: "لم يتم العثور على الملف الشخصي. يرجى إكمال بياناتك أولاً.",
            variant: "destructive"
          });
          navigate("/dashboard?tab=profile-edit");
          return;
        }
      } catch (error) {
        toast({
          title: "خطأ",
          description: "حدث خطأ أثناء التحقق من الملف الشخصي.",
          variant: "destructive"
        });
      }
    };

    checkAuthAndProfile();
  }, [isAuthenticated, user, isLocal, authProfile, getDatabaseService, navigate, toast]);

  // Load trip data from tripId
  useEffect(() => {
    if (!isAuthenticated || showProfileCompletionModal) return; // Don't load trip if not authenticated or profile incomplete

    const loadTrip = async () => {
      try {
        const tripId = queryParams.get("tripId");
        if (!tripId) {
          toast({
            title: "خطأ",
            description: "معرف الرحلة مفقود",
            variant: "destructive"
          });
          navigate("/");
          return;
        }

        // Fetch trip details
        const trips = await BrowserDatabaseService.getTripsWithDetails();
        const foundTrip = trips.find((t: any) => t.id === tripId);
        
        if (!foundTrip) {
          toast({
            title: "خطأ",
            description: "الرحلة غير موجودة",
            variant: "destructive"
          });
          navigate("/");
          return;
        }

        setTrip(foundTrip);
        setIsModalOpen(true);
        setLoading(false);
      } catch (error) {
        toast({
          title: "خطأ",
          description: "فشل في تحميل بيانات الرحلة",
          variant: "destructive"
        });
        navigate("/");
      }
    };

    loadTrip();
  }, [isAuthenticated, showProfileCompletionModal, queryParams, navigate, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto py-20 flex justify-center items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="mr-3 text-lg">جاري تحميل بيانات الرحلة...</span>
        </div>
        <Footer />
      </div>
    );
  }

  // If user is not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto py-20">
          <LoginPromptModal
            isOpen={showLoginPrompt}
            onClose={() => navigate("/")}
            title="تسجيل الدخول مطلوب للحجز"
            description="لإكمال عملية الحجز، يرجى تسجيل الدخول أو إنشاء حساب جديد"
          />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto py-10">
        {/* Booking Modal */}
        {trip && (
          <BookingModal 
            trip={trip}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              navigate("/");
            }}
            onSuccess={() => {
              // Success handled by BookingModal
            }}
          />
        )}
      </div>

      {/* Profile Completion Modal */}
      <ProfileCompletionModal
        isOpen={showProfileCompletionModal}
        onClose={() => {
          setShowProfileCompletionModal(false);
          navigate("/dashboard?tab=profile-edit");
        }}
        missingFields={missingProfileFields}
      />

      <Footer />
    </div>
  );
};

export default BookingConfirmation;
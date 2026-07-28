import { useState, useEffect } from 'react';
import { Star, MessageSquare, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface DriverRatingsDisplayProps {
  driverId: string;
  showTitle?: boolean;
}

interface Rating {
  bookingId: number;
  passengerId: string;
  rating: number;
  comment?: string;
  timestamp: string;
  passengerName?: string;
  passengerAvatarUrl?: string;
  passengerEmail?: string;
}

export const DriverRatingsDisplay = ({ driverId, showTitle = true }: DriverRatingsDisplayProps) => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchRatings();
  }, [driverId]);

  const buildAvatarUrl = (avatarPath?: string | null) => {
    if (!avatarPath) {
      return null;
    }

    if (avatarPath.startsWith('http')) {
      return avatarPath;
    }

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(avatarPath);

    return data?.publicUrl ?? null;
  };

  const fetchRatings = async () => {
    setLoading(true);

    try {
      // جلب التقييمات من جدول ratings باستخدام استعلام مباشر
      const { data: ratingsData, error: ratingsError } = await supabase
        .rpc('get_driver_ratings', { driver_id: driverId });

      if (ratingsError) {
        // إذا فشل الاستعلام، جرب الطريقة البديلة
        const { data: directData, error: directError } = await supabase
          .from('ratings' as any)
          .select(`
            booking_id,
            passenger_id,
            rating,
            comment,
            created_at,
            passenger:profiles!ratings_passenger_id_fkey(
              full_name,
              avatar_url,
              email
            )
          `)
          .eq('driver_id', driverId)
          .order('created_at', { ascending: false });

        if (directError) {
          setRatings([]);
          setAverageRating(0);
          return;
        }
        // معالجة البيانات المباشرة
        const formattedRatings: Rating[] = directData?.map((rating: any) => ({
          bookingId: rating.booking_id,
          passengerId: rating.passenger_id,
          rating: rating.rating,
          comment: rating.comment,
          timestamp: rating.created_at,
          passengerName: rating.passenger?.full_name || 'راكب',
          passengerAvatarUrl: buildAvatarUrl(rating.passenger?.avatar_url),
          passengerEmail: rating.passenger?.email || null
        })) || [];

        const averageRating = formattedRatings.length > 0 
          ? formattedRatings.reduce((sum, rating) => sum + rating.rating, 0) / formattedRatings.length
          : 0;
        setRatings(formattedRatings);
        setAverageRating(averageRating);
        return;
      }
      // معالجة البيانات من RPC
      const formattedRatings: Rating[] = ratingsData?.map((rating: any) => ({
        bookingId: rating.booking_id,
        passengerId: rating.passenger_id,
        rating: rating.rating,
        comment: rating.comment,
        timestamp: rating.created_at,
        passengerName: rating.passenger_name || 'راكب',
        passengerAvatarUrl: buildAvatarUrl(rating.passenger_avatar_url),
        passengerEmail: rating.passenger_email
      })) || [];
      // حساب متوسط التقييم من البيانات المحملة مباشرة
      const averageRating = formattedRatings.length > 0 
        ? formattedRatings.reduce((sum, rating) => sum + rating.rating, 0) / formattedRatings.length
        : 0;
      setRatings(formattedRatings);
      setAverageRating(averageRating);
    } catch (error) {
      // في حالة الخطأ، اعرض قائمة فارغة
      setRatings([]);
      setAverageRating(0);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5" dir="ltr">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">جاري التحميل...</div>
        </CardContent>
      </Card>
    );
  }

  if (ratings.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-2">
            <Star className="h-12 w-12 text-muted-foreground mx-auto" />
            <div className="text-muted-foreground">
              لا توجد تقييمات بعد
            </div>
            <div className="text-sm text-muted-foreground">
              ستظهر التقييمات هنا بعد أن يكمل الركاب رحلاتهم ويقيموا تجربتهم
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {showTitle && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>التقييمات ({ratings.length})</span>
              {averageRating > 0 ? (
                <Badge variant="outline" className="text-lg">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 mr-1" />
                  {averageRating.toFixed(1)}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-lg text-muted-foreground">
                  <Star className="h-5 w-5 text-muted-foreground mr-1" />
                  لا يوجد تقييم
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      )}

      <div className="space-y-3">
        {ratings.map((rating, index) => (
          <Card key={`${rating.bookingId}-${index}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    {rating.passengerAvatarUrl ? (
                      <img 
                        src={rating.passengerAvatarUrl} 
                        alt={rating.passengerName || 'راكب'}
                        className="h-8 w-8 rounded-full object-cover"
                        onError={(e) => {
                          // في حالة فشل تحميل الصورة، إخفاء الصورة وإظهار الأيقونة الافتراضية
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) {
                            fallback.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <AvatarFallback style={{ display: rating.passengerAvatarUrl ? 'none' : 'flex' }}>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium">{rating.passengerName || 'راكب'}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(rating.timestamp).toLocaleDateString('ar-DZ', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
                {renderStars(rating.rating)}
              </div>

              {rating.comment && (
                <div className="mt-3 p-3 bg-muted rounded-lg">
                  <div className="flex items-start gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <p className="text-sm text-muted-foreground">{rating.comment}</p>
                  </div>
                </div>
              )}

              <div className="mt-2 text-xs text-muted-foreground">
                حجز #{rating.bookingId}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};


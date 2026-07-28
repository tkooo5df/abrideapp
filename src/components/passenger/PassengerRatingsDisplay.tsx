import { useState, useEffect } from 'react';
import { Star, MessageSquare, User, Car } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

interface PassengerRatingsDisplayProps {
  passengerId: string;
  showTitle?: boolean;
}

interface PassengerRating {
  bookingId: number;
  driverId: string;
  rating: number;
  comment?: string;
  timestamp: string;
  driverName?: string;
  driverAvatarUrl?: string;
  driverEmail?: string;
}

export const PassengerRatingsDisplay = ({ passengerId, showTitle = true }: PassengerRatingsDisplayProps) => {
  const [ratings, setRatings] = useState<PassengerRating[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchRatings();
  }, [passengerId]);

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
      // جلب التقييمات من جدول passenger_ratings
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('passenger_ratings' as any)
        .select(`
          booking_id,
          driver_id,
          rating,
          comment,
          created_at,
          driver:profiles!passenger_ratings_driver_id_fkey(
            full_name,
            avatar_url,
            email
          )
        `)
        .eq('passenger_id', passengerId)
        .order('created_at', { ascending: false });

      if (ratingsError) {
        setRatings([]);
        setAverageRating(0);
        return;
      }
      // معالجة البيانات
      const formattedRatings: PassengerRating[] = ratingsData?.map((rating: any) => ({
        bookingId: rating.booking_id,
        driverId: rating.driver_id,
        rating: rating.rating,
        comment: rating.comment,
        timestamp: rating.created_at,
        driverName: rating.driver?.full_name || 'سائق',
        driverAvatarUrl: buildAvatarUrl(rating.driver?.avatar_url),
        driverEmail: rating.driver?.email || null
      })) || [];

      // حساب متوسط التقييم
      const averageRating = formattedRatings.length > 0 
        ? formattedRatings.reduce((sum, rating) => sum + rating.rating, 0) / formattedRatings.length
        : 0;
      setRatings(formattedRatings);
      setAverageRating(averageRating);
    } catch (error) {
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
              ستظهر تقييمات السائقين هنا بعد إتمام رحلاتك
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {showTitle && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>تقييمات السائقين ({ratings.length})</span>
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
                    {rating.driverAvatarUrl ? (
                      <img 
                        src={rating.driverAvatarUrl} 
                        alt={rating.driverName || 'سائق'}
                        className="h-8 w-8 rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) {
                            fallback.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <AvatarFallback style={{ display: rating.driverAvatarUrl ? 'none' : 'flex' }}>
                      <Car className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium">{rating.driverName || 'سائق'}</div>
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

export default PassengerRatingsDisplay;


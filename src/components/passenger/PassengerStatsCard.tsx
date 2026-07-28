import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Route, 
  XCircle, 
  Star, 
  Calendar,
  TrendingUp
} from 'lucide-react';

interface PassengerStatsCardProps {
  totalTrips: number;
  totalCancellations: number;
  totalBookings: number;
  averageRating: number;
  ratingsCount: number;
}

export const PassengerStatsCard = ({
  totalTrips,
  totalCancellations,
  totalBookings,
  averageRating,
  ratingsCount
}: PassengerStatsCardProps) => {
  // Calculate cancellation rate
  const cancellationRate = totalBookings > 0 
    ? ((totalCancellations / totalBookings) * 100).toFixed(1)
    : '0';

  // Determine reliability badge
  const getReliabilityBadge = () => {
    const rate = parseFloat(cancellationRate);
    if (rate === 0) {
      return { text: 'ممتاز', variant: 'default' as const, color: 'text-green-600' };
    } else if (rate < 10) {
      return { text: 'جيد جداً', variant: 'secondary' as const, color: 'text-blue-600' };
    } else if (rate < 20) {
      return { text: 'جيد', variant: 'secondary' as const, color: 'text-yellow-600' };
    } else {
      return { text: 'يحتاج تحسين', variant: 'destructive' as const, color: 'text-red-600' };
    }
  };

  const reliability = getReliabilityBadge();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>إحصائيات الراكب</span>
          <Badge variant={reliability.variant}>
            {reliability.text}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Total Trips */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Route className="h-4 w-4" />
              <span className="text-sm">الرحلات المكتملة</span>
            </div>
            <div className="text-2xl font-bold text-primary">
              {totalTrips}
            </div>
          </div>

          {/* Total Bookings */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">مرات الحجز</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {totalBookings}
            </div>
          </div>

          {/* Cancellations */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <XCircle className="h-4 w-4" />
              <span className="text-sm">الإلغاءات</span>
            </div>
            <div className="text-2xl font-bold text-red-600">
              {totalCancellations}
              <span className="text-sm text-muted-foreground ml-2">
                ({cancellationRate}%)
              </span>
            </div>
          </div>

          {/* Average Rating */}
          <div className="space-y-2 col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Star className="h-4 w-4" />
              <span className="text-sm">التقييم</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-yellow-600">
                {averageRating > 0 ? averageRating.toFixed(1) : '-'}
              </div>
              {ratingsCount > 0 && (
                <div className="text-sm text-muted-foreground">
                  ({ratingsCount} تقييم)
                </div>
              )}
            </div>
          </div>

          {/* Completion Rate */}
          <div className="space-y-2 col-span-2 md:col-span-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">معدل إتمام الرحلات</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold text-green-600">
                {totalBookings > 0 
                  ? ((totalTrips / totalBookings) * 100).toFixed(1)
                  : '0'}%
              </div>
              <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-green-600 h-full transition-all duration-500"
                  style={{ 
                    width: `${totalBookings > 0 ? (totalTrips / totalBookings) * 100 : 0}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-4 pt-4 border-t space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">حالة الحساب:</span>
            <Badge variant={reliability.variant}>
              {reliability.text}
            </Badge>
          </div>
          
          {parseFloat(cancellationRate) > 15 && (
            <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
              ⚠️ معدل الإلغاءات مرتفع. حاول الالتزام بالحجوزات المؤكدة لتحسين تقييمك.
            </div>
          )}

          {averageRating >= 4.5 && ratingsCount >= 5 && (
            <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
              ✅ راكب ممتاز! استمر في هذا الأداء الرائع.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PassengerStatsCard;


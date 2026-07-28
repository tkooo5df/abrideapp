import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, User, Phone, Calendar, Clock, Car, Users, Eye, Check, Navigation } from 'lucide-react';
import RatingStars from '@/components/RatingStars';

interface BookingCardProps {
  booking: {
    id: number;
    status: string;
    pickup_location: string;
    destination_location: string;
    driver_name: string;
    driver_phone: string;
    price: number;
    seats: number;
    payment_method: string;
    created_at: string;
    driver_id?: string;
    driver_rating?: number;
    driver_average_rating?: number;
    driver_ratings_count?: number;
    driver?: {
      averageRating?: number;
      rating?: number;
      totalRatings?: number;
      ratingsCount?: number;
    };
  };
  onCompleteTrip?: () => void;
  onViewDetails?: () => void;
}

export default function EnhancedBookingCard({ booking, onCompleteTrip, onViewDetails }: BookingCardProps) {
  const [showMap, setShowMap] = useState(false);

  // Parse locations (assuming they're stored as JSON strings)
  const pickup = booking.pickup_location ? JSON.parse(booking.pickup_location) : null;
  const destination = booking.destination_location ? JSON.parse(booking.destination_location) : null;

  // Mock driver position (in real app, this would come from real-time data)
  const [driverPos] = useState({
    lat: pickup?.lat + (Math.random() - 0.5) * 0.01,
    lng: pickup?.lng + (Math.random() - 0.5) * 0.01,
  });

  const driverRating =
    booking.driver_rating ??
    booking.driver_average_rating ??
    booking.driver?.averageRating ??
    booking.driver?.rating ??
    0;

  const driverRatingsCount =
    booking.driver_ratings_count ??
    booking.driver?.totalRatings ??
    booking.driver?.ratingsCount ??
    0;

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; className: string }> = {
      pending: { text: 'في الانتظار', className: 'bg-yellow-100 text-yellow-800' },
      confirmed: { text: 'مؤكد', className: 'bg-blue-100 text-blue-800' },
      enroute: { text: 'جاري', className: 'bg-green-100 text-green-800' },
      completed: { text: 'مكتمل', className: 'bg-gray-100 text-gray-800' },
      cancelled: { text: 'ملغي', className: 'bg-red-100 text-red-800' },
    };
    return statusMap[status] || { text: status, className: 'bg-gray-100 text-gray-800' };
  };

  const statusInfo = getStatusBadge(booking.status);

  return (
    <Card className="w-full relative">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Status and ID */}
            <div className="flex items-center gap-2 mb-2">
              <Badge className={statusInfo.className}>
                {statusInfo.text}
              </Badge>
              <span className="text-sm text-muted-foreground">#{booking.id}</span>
            </div>

            {/* Route */}
            <div className="flex flex-wrap items-center gap-2 text-lg font-medium">
              <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="truncate">{pickup?.address || 'نقطة الاستلام'}</span>
              <span className="text-muted-foreground">←</span>
              <span className="truncate">{destination?.address || 'الوجهة'}</span>
            </div>

            {/* Driver Info with rating stars at the top */}
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-2">
              <User className="h-4 w-4" />
              <span>السائق: {booking.driver_name}</span>
              {driverRating > 0 && (
                <div className="flex items-center gap-2">
                  <RatingStars rating={driverRating} iconClassName="h-3 w-3" />
                  <span className="text-xs font-medium">{driverRating.toFixed(1)}</span>
                  {driverRatingsCount > 0 && (
                    <span className="text-[10px] text-muted-foreground">({driverRatingsCount})</span>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{booking.driver_phone}</span>
            </div>
          </div>

          {/* Available seats in box */}
          <div className="absolute top-4 right-4 bg-white border-2 border-blue-500 rounded-lg w-12 h-12 flex items-center justify-center shadow-lg">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{booking.seats}</div>
              <div className="text-xs text-blue-500">مقاعد</div>
            </div>
          </div>
        </div>

        {/* Trip Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{new Date(booking.created_at).toLocaleDateString('ar-SA')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{new Date(booking.created_at).toLocaleTimeString('ar-SA')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Car className="h-4 w-4 text-muted-foreground" />
            <span>سيارة عادة</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{booking.seats}/4 مقاعد</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={onCompleteTrip}
            className="flex-1 bg-primary hover:bg-primary-hover"
          >
            <Check className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">إكمال الرحلة</span>
            <span className="sm:hidden">إكمال</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowMap(!showMap)}
            className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
          >
            <Navigation className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">عرض الاتجاه</span>
            <span className="sm:hidden">اتجاه</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={onViewDetails}
          >
            <Eye className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">عرض الخريطة</span>
            <span className="sm:hidden">عرض</span>
          </Button>
        </div>
      </CardHeader>

      {/* Price in rectangle */}

    </Card>
  );
}

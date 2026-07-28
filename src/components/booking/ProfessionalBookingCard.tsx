import { memo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  User,
  Phone,
  Calendar,
  Clock,
  Car,
  Star,
  Plus,
  Eye
} from "lucide-react";
import RatingStars from "@/components/RatingStars";

interface ProfessionalBookingCardProps {
  from: string;
  to: string;
  driverName: string;
  driverPhone: string;
  date: string;
  time: string;
  price: number;
  availableSeats: number;
  totalSeats: number;
  driverRating: number;
  driverRatingsCount?: number;
  onBookSeat: () => void;
  onViewDetails: () => void;
}

const ProfessionalBookingCard = ({
  from,
  to,
  driverName,
  driverPhone,
  date,
  time,
  price,
  availableSeats,
  totalSeats,
  driverRating,
  driverRatingsCount,
  onBookSeat,
  onViewDetails
}: ProfessionalBookingCardProps) => {
  return (
    <Card className="overflow-hidden border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        {/* Header with route, driver info, and price */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            {/* Route information */}
            <div className="flex items-center gap-2 text-lg font-medium">
              <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="truncate">{trip.fromWilayaName}</span>
              <span className="text-muted-foreground">→</span>
              <span className="truncate">{trip.toWilayaName}</span>
            </div>
            
            {/* Driver information with rating stars */}
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>السائق: {driverName}</span>
              <Phone className="h-4 w-4" />
              <span>{driverPhone}</span>
            </div>
          </div>
          
          {/* Price display on the right */}
          <div className="text-right">
            <div className="text-lg font-bold text-primary">{price} دج</div>
            <div className="text-sm text-muted-foreground">{availableSeats}/{totalSeats} مقاعد متاحة</div>
          </div>
        </div>

        {/* Trip details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{date}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{time}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Car className="h-4 w-4 text-muted-foreground" />
            <span>سيارة عادة</span>
          </div>
          {driverRating > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{driverRating.toFixed(1)}</span>
              <RatingStars rating={driverRating} />
              {driverRatingsCount != null && (
                <span className="text-xs text-muted-foreground">({driverRatingsCount})</span>
              )}
            </div>
          )}
        </div>

        {/* Action buttons - reordered: Booking → Price → Details */}
        <div className="flex gap-2">
          <Button 
            onClick={() => {
              // Add safety check before calling onBookSeat
              if (onBookSeat && typeof onBookSeat === 'function') {
                onBookSeat();
              } else {
              }
            }}
            className="flex-1 flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium ring-offset-background transition-[color,background-color,border-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-secondary text-secondary-foreground hover:bg-secondary-hover shadow-sm h-10 px-4 py-2"
            disabled={!onBookSeat || typeof onBookSeat !== 'function'}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">حجز مقعد</span>
            <span className="sm:hidden">حجز</span>
          </Button>
          
          {/* Price display as a button-like element */}
          <div className="flex-1 bg-primary text-white rounded-lg py-2 px-4 text-center shadow-lg h-10 flex items-center justify-center">
            <div className="flex items-center">
              <span className="text-lg font-bold">{price}</span>
              <span className="text-sm mr-1">دج</span>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            onClick={onViewDetails}
            className="flex-1 inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background transition-[color,background-color,border-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-border bg-background hover:bg-accent hover:text-accent-foreground h-10 rounded-md px-4"
          >
            <Eye className="h-4 w-4" />
            <span className="hidden sm:inline">تفاصيل</span>
            <span className="sm:hidden">تفاصيل</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Add memoization to prevent unnecessary re-renders
export default memo(ProfessionalBookingCard);
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Phone,
  MessageCircle,
  Navigation,
  CreditCard
} from "lucide-react";
import RatingStars from "@/components/RatingStars";

interface Reservation {
  id: string;
  from: string;
  to: string;
  date: string;
  time: string;
  status: "confirmed" | "pending" | "completed" | "cancelled";
  price: number;
  passengers: number;
  driver: {
    name: string;
    rating: number;
    phone: string;
    avatar: string;
    vehicle: string;
  };
  paymentMethod: string;
}

interface ReservationCardProps {
  reservation: Reservation;
  onContact?: (reservation: Reservation) => void;
  onTrack?: (reservation: Reservation) => void;
  onCancel?: (reservation: Reservation) => void;
}

const ReservationCard = ({ reservation, onContact, onTrack, onCancel }: ReservationCardProps) => {
  const getStatusBadge = (status: string) => {
    const statusMap = {
      confirmed: { label: "مؤكد", variant: "default" as const, color: "bg-green-100 text-green-800" },
      pending: { label: "في الانتظار", variant: "secondary" as const, color: "bg-yellow-100 text-yellow-800" },
      completed: { label: "مكتمل", variant: "outline" as const, color: "bg-blue-100 text-blue-800" },
      cancelled: { label: "ملغي", variant: "destructive" as const, color: "bg-red-100 text-red-800" }
    };
    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  };

  const statusInfo = getStatusBadge(reservation.status);

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md relative">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
            <span className="text-sm text-muted-foreground">#{reservation.id}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Route Information */}
        <div className="flex items-center gap-2 text-lg font-medium">
          <MapPin className="h-5 w-5 text-primary" />
          <span>{reservation.from}</span>
          <div className="flex-1 border-t border-dashed border-muted-foreground/30 mx-2" />
          <span>{reservation.to}</span>
        </div>

        {/* Trip Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{reservation.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{reservation.time}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{reservation.passengers} راكب</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span>{reservation.paymentMethod}</span>
          </div>
        </div>

        {/* Driver Information with rating stars at the top */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={reservation.driver.avatar} />
                <AvatarFallback>{reservation.driver.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-semibold">{reservation.driver.name}</h4>
                {reservation.driver.rating > 0 && (
                  <div className="flex items-center gap-2">
                    <RatingStars rating={reservation.driver.rating} iconClassName="h-3 w-3" />
                    <span className="text-sm font-medium">{reservation.driver.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">{reservation.driver.vehicle}</p>
              <p className="text-xs text-muted-foreground">{reservation.driver.phone}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {reservation.status === "confirmed" && (
              <>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => onContact?.(reservation)}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  اتصال
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => onTrack?.(reservation)}
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  تتبع
                </Button>
              </>
            )}
            
            {reservation.status === "pending" && (
              <Button 
                size="sm" 
                variant="destructive" 
                className="flex-1"
                onClick={() => onCancel?.(reservation)}
              >
                إلغاء الحجز
              </Button>
            )}
            
            {reservation.status === "completed" && (
              <Button size="sm" variant="outline" className="flex-1">
                <MessageCircle className="h-4 w-4 mr-2" />
                تقييم الرحلة
              </Button>
            )}
          </div>
        </div>

        {/* Price in bottom right corner - green color */}
        
        {/* Available seats in frame */}
        <div className="absolute top-4 right-4 bg-white border-2 border-primary rounded-lg w-10 h-10 flex items-center justify-center shadow-md">
          <span className="text-lg font-bold text-primary">{reservation.passengers}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReservationCard;
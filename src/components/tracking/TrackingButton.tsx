import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';

interface TrackingButtonProps {
  bookingId?: string;
  tripId?: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
  className?: string;
}

export const TrackingButton = ({
  bookingId,
  tripId,
  variant = 'default',
  size = 'default',
  showLabel = true,
  className = '',
}: TrackingButtonProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (bookingId) {
      navigate(`/trip-tracking?bookingId=${bookingId}`);
    } else if (tripId) {
      navigate(`/trip-tracking?tripId=${tripId}`);
    }
  };

  if (!bookingId && !tripId) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={`gap-2 ${className}`}
    >
      <Navigation className="h-4 w-4" />
      {showLabel && 'تتبع الرحلة'}
    </Button>
  );
};

interface ViewAllDriversButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export const ViewAllDriversButton = ({
  variant = 'default',
  size = 'default',
  className = '',
}: ViewAllDriversButtonProps) => {
  const navigate = useNavigate();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => navigate('/drivers-map')}
      className={`gap-2 ${className}`}
    >
      <MapPin className="h-4 w-4" />
      خريطة السائقين
    </Button>
  );
};



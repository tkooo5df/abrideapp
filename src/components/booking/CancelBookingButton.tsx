import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { BrowserDatabaseService } from '@/integrations/database/browserServices';
import { X, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface CancelBookingButtonProps {
  bookingId: string;
  onCancelled?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

const CancelBookingButton: React.FC<CancelBookingButtonProps> = ({
  bookingId,
  onCancelled,
  disabled = false,
  variant = 'destructive',
  size = 'default',
  className = ''
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCancelBooking = async () => {
    setLoading(true);
    try {
      await BrowserDatabaseService.cancelBooking(bookingId, 'Cancelled by passenger');
      
      toast({
        title: "تم إلغاء الحجز بنجاح",
        description: "تم إلغاء حجزك وإعادة المقعد للرحلة تلقائياً",
      });

      if (onCancelled) {
        onCancelled();
      }
    } catch (error) {
      toast({
        title: "خطأ في إلغاء الحجز",
        description: "حدث خطأ أثناء إلغاء الحجز. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={disabled || loading}
          className={`flex items-center gap-2 ${className}`}
        >
          <X className="h-4 w-4" />
          {loading ? 'جاري الإلغاء...' : 'إلغاء الحجز'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            تأكيد إلغاء الحجز
          </AlertDialogTitle>
          <AlertDialogDescription>
            هل أنت متأكد من إلغاء هذا الحجز؟ سيتم إعادة المقعد للرحلة تلقائياً ويمكن للركاب الآخرين حجزه.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancelBooking}
            className="bg-red-600 hover:bg-red-700"
          >
            نعم، ألغِ الحجز
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CancelBookingButton;

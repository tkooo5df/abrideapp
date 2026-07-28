import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface RatingPassengerSectionProps {
  bookingId: number;
  passengerId: string;
  passengerName?: string;
  existingRating?: number | null;
  existingComment?: string | null;
  onRatingSubmit?: () => void;
}

export const RatingPassengerSection = ({
  bookingId,
  passengerId,
  passengerName,
  existingRating,
  existingComment,
  onRatingSubmit
}: RatingPassengerSectionProps) => {
  // Try to load rating from localStorage if not provided
  const loadRatingFromStorage = () => {
    try {
      const ratingsKey = `passenger_rating_${bookingId}`;
      const savedRating = localStorage.getItem(ratingsKey);
      if (savedRating) {
        const parsed = JSON.parse(savedRating);
        return {
          rating: parsed.rating || 0,
          comment: parsed.comment || ''
        };
      }
    } catch (error) {
    }
    return {
      rating: existingRating || 0,
      comment: existingComment || ''
    };
  };

  const initialRating = loadRatingFromStorage();
  const [rating, setRating] = useState(initialRating.rating);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(initialRating.comment);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(!initialRating.rating);
  const { toast } = useToast();

  useEffect(() => {
    // Reload rating if booking changes
    const loaded = loadRatingFromStorage();
    setRating(loaded.rating);
    setComment(loaded.comment);
    setIsEditing(!loaded.rating);
  }, [bookingId]);

  const handleSubmitRating = async () => {
    if (rating === 0) {
      toast({
        title: "تنبيه",
        description: "الرجاء اختيار تقييم بالنجوم",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const currentDate = new Date().toISOString();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // حفظ التقييم في جدول passenger_ratings
      // أولاً، تحقق من وجود تقييم سابق
      const { data: existingRating, error: checkError } = await supabase
        .from('passenger_ratings' as any)
        .select('id')
        .eq('booking_id', bookingId)
        .eq('driver_id', user.id)
        .single();

      let ratingError = null;

      if (existingRating) {
        // تحديث التقييم الموجود
        const { error } = await supabase
          .from('passenger_ratings' as any)
          .update({
            rating: rating,
            comment: comment || null,
            updated_at: currentDate
          })
          .eq('id', existingRating.id);
        
        ratingError = error;
      } else {
        // إنشاء تقييم جديد
        const { error } = await supabase
          .from('passenger_ratings' as any)
          .insert({
            booking_id: bookingId,
            driver_id: user.id,
            passenger_id: passengerId,
            rating: rating,
            comment: comment || null,
            created_at: currentDate,
            updated_at: currentDate
          });
        
        ratingError = error;
      }

      if (ratingError) {
        throw ratingError;
      }

      // Save to localStorage as backup
      const ratingsKey = `passenger_rating_${bookingId}`;
      localStorage.setItem(ratingsKey, JSON.stringify({
        rating,
        comment,
        timestamp: currentDate
      }));

      toast({
        title: "نجح",
        description: `تم حفظ تقييمك للراكب ${passengerName || ''}`,
      });
      
      setIsEditing(false);
      
      // Call callback if provided
      if (onRatingSubmit) {
        onRatingSubmit();
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ التقييم. الرجاء المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isEditing && rating > 0) {
    return (
      <div className="space-y-2 p-4 border rounded-lg bg-muted/20">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">تقييمك للراكب {passengerName || ''}</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsEditing(true)}
          >
            تعديل
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-5 w-5 ${
                  star <= rating 
                    ? 'fill-yellow-400 text-yellow-400' 
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">({rating}/5)</span>
        </div>
        {comment && (
          <p className="text-sm text-muted-foreground mt-2">{comment}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div>
        <h3 className="font-semibold mb-2">
          قيّم الراكب {passengerName || ''}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          ساعد السائقين الآخرين من خلال تقييم تجربتك مع هذا الراكب
        </p>
      </div>

      {/* Star Rating */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">التقييم:</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="focus:outline-none transition-transform hover:scale-110"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
            >
              <Star
                className={`h-6 w-6 ${
                  star <= (hoverRating || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <span className="text-sm text-muted-foreground">({rating}/5)</span>
        )}
      </div>

      {/* Comment */}
      <div>
        <label className="text-sm font-medium mb-2 block">
          تعليق (اختياري):
        </label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="شارك تجربتك مع هذا الراكب..."
          rows={3}
          className="resize-none"
        />
      </div>

      {/* Submit Button */}
      <div className="flex gap-2">
        <Button
          onClick={handleSubmitRating}
          disabled={isSubmitting || rating === 0}
          className="flex-1"
        >
          {isSubmitting ? 'جاري الحفظ...' : 'حفظ التقييم'}
        </Button>
        {!initialRating.rating && rating > 0 && (
          <Button
            variant="outline"
            onClick={() => {
              setRating(0);
              setComment('');
            }}
          >
            إلغاء
          </Button>
        )}
      </div>
    </div>
  );
};

export default RatingPassengerSection;


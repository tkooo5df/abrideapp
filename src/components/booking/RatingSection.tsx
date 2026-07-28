import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface RatingSectionProps {
  bookingId: number;
  driverId: string;
  driverName?: string;
  existingRating?: number | null;
  existingComment?: string | null;
  onRatingSubmit?: () => void;
}

export const RatingSection = ({
  bookingId,
  driverId,
  driverName,
  existingRating,
  existingComment,
  onRatingSubmit
}: RatingSectionProps) => {
  // Try to load rating from localStorage if not provided
  const loadRatingFromStorage = () => {
    try {
      const ratingsKey = `booking_ratings_${bookingId}`;
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

      // حفظ التقييم في جدول ratings فقط
      // أولاً، تحقق من وجود تقييم سابق
      const { data: existingRating, error: checkError } = await supabase
        .from('ratings' as any)
        .select('id')
        .eq('booking_id', bookingId)
        .eq('passenger_id', user.id)
        .single();

      let ratingError = null;

      if (existingRating) {
        // تحديث التقييم الموجود
        const { error } = await supabase
          .from('ratings' as any)
          .update({
            rating: rating,
            comment: comment || null,
            updated_at: currentDate
          })
          .eq('id', existingRating.id);
        ratingError = error;
      } else {
        // إدراج تقييم جديد
        const { error } = await supabase
          .from('ratings' as any)
          .insert({
            booking_id: bookingId,
            driver_id: driverId,
            passenger_id: user.id,
            rating: rating,
            comment: comment || null,
            created_at: currentDate,
            updated_at: currentDate
          });
        ratingError = error;
      }

      if (ratingError) {
        throw new Error('فشل في حفظ التقييم');
      }

      // حفظ محلي كنسخة احتياطية
      try {
        const ratingsKey = `booking_ratings_${bookingId}`;
        localStorage.setItem(ratingsKey, JSON.stringify({
          bookingId,
          driverId,
          rating,
          comment,
          timestamp: currentDate
        }));
      } catch (storageError) {
      }

      toast({
        title: "تم بنجاح",
        description: "تم حفظ تقييمك وإضافته لملف السائق",
      });

      setIsEditing(false);
      if (onRatingSubmit) {
        onRatingSubmit();
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ التقييم",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">تقييم الرحلة</h4>
        {existingRating && !isEditing && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsEditing(true)}
            className="text-xs"
          >
            تعديل التقييم
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-muted-foreground">
              قيّم تجربتك مع {driverName || 'السائق'}
            </label>
            <div className="flex gap-1" dir="ltr">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                  disabled={isSubmitting}
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoverRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-muted-foreground">
              أضف تعليقاً (اختياري)
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="شارك تجربتك مع الآخرين..."
              className="resize-none"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleSubmitRating}
              disabled={isSubmitting || rating === 0}
              size="sm"
              className="flex-1"
            >
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ التقييم'}
            </Button>
            {existingRating && (
              <Button
                variant="outline"
                onClick={() => {
                  setRating(existingRating);
                  setComment(existingComment || '');
                  setIsEditing(false);
                }}
                size="sm"
                disabled={isSubmitting}
              >
                إلغاء
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-1" dir="ltr">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-6 w-6 ${
                  star <= rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          {comment && (
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              {comment}
            </p>
          )}
        </div>
      )}
    </div>
  );
};


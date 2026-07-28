import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface RatingPopupProps {
  bookingId: string;
  userId: string;
  targetUserId: string;
  targetType: 'driver' | 'passenger';
  onRatingSubmit: () => void;
  onClose: () => void;
}

const RatingPopup = ({ 
  bookingId, 
  userId, 
  targetUserId, 
  targetType,
  onRatingSubmit,
  onClose 
}: RatingPopupProps) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: 'خطأ',
        description: 'يرجى اختيار تقييم',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      
      // Create review object
      const review = {
        id: `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        booking_id: bookingId,
        reviewer_id: userId,
        target_user_id: targetUserId,
        target_type: targetType,
        rating: rating,
        comment: comment,
        created_at: new Date().toISOString()
      };

      // Save to localStorage for now (temporary solution)
      const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
      reviews.push(review);
      localStorage.setItem('reviews', JSON.stringify(reviews));

      toast({
        title: 'نجاح',
        description: 'تم إرسال التقييم بنجاح'
      });

      onRatingSubmit();
      onClose();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء إرسال التقييم',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
      <Card className="w-full max-w-sm sm:max-w-md mx-auto">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">تقييم الرحلة</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            {targetType === 'driver' 
              ? 'قيم تجربتك مع السائق' 
              : 'قيم تجربتك مع الراكب'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
          <div className="flex justify-center">
            <div className="flex gap-1 sm:gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-6 w-6 sm:h-8 sm:w-8 cursor-pointer transition-colors ${
                    star <= rating 
                      ? 'fill-yellow-500 text-yellow-500' 
                      : 'text-gray-300 hover:text-yellow-400'
                  }`}
                  onClick={() => setRating(star)}
                />
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="comment" className="text-sm sm:text-base">تعليق (اختياري)</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="شارك تجربتك..."
              className="min-h-[80px] sm:min-h-[100px] text-sm sm:text-base resize-none"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 p-3 sm:p-6">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={loading}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            إلغاء
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || rating === 0}
            className="w-full sm:w-auto order-1 sm:order-2"
          >
            {loading ? 'جاري الإرسال...' : 'إرسال التقييم'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default RatingPopup;
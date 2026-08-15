import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { PlatformReviewsService } from '@/integrations/database/platformReviewsService';

interface ReviewSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReviewSubmitModal({ isOpen, onClose, onSuccess }: ReviewSubmitModalProps) {
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [name, setName] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  
  const { toast } = useToast();
  const { user, profile } = useAuth();

  // Pre-fill name if logged in
  const defaultName = profile?.fullName || profile?.firstName ? `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmittingRef.current) return;
    
    const finalName = name.trim() || defaultName;
    
    if (!finalName) {
      toast({
        title: "الاسم مطلوب",
        description: "يرجى إدخال اسمك لتقديم التقييم",
        variant: "destructive"
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: "التقييم مطلوب",
        description: "يرجى اختيار عدد النجوم",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    isSubmittingRef.current = true;

    try {
      const { success, error } = await PlatformReviewsService.submitReview({
        reviewer_name: finalName,
        rating,
        comment: comment.trim(),
        user_id: user?.id
      });

      if (success) {
        toast({
          title: "شكراً لك!",
          description: "تم إرسال تقييمك بنجاح.",
        });
        setName('');
        setComment('');
        setRating(5);
        onSuccess();
        onClose();
      } else {
        throw error;
      }
    } catch (err: any) {
      toast({
        title: "خطأ",
        description: err.message || "حدث خطأ أثناء إرسال التقييم. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={onClose}
      />
      <Card className="w-full max-w-md relative z-10 shadow-xl border-0 animate-in zoom-in-95 duration-200">
        <CardHeader className="bg-primary/5 border-b pb-4">
          <CardTitle className="text-xl font-bold text-center text-primary">تقييم المنصة</CardTitle>
          <p className="text-center text-sm text-muted-foreground mt-1">
            رأيك يهمنا ويساعدنا على تحسين خدماتنا
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Rating Stars */}
            <div className="flex flex-col items-center space-y-2">
              <Label className="text-base font-medium">ما هو تقييمك لخدماتنا؟</Label>
              <div className="flex gap-1" dir="ltr">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="p-1 transition-all hover:scale-110 focus:outline-none"
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => setRating(star)}
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= (hoveredRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="name">الاسم</Label>
              <Input
                id="name"
                placeholder="أدخل اسمك"
                value={name || defaultName}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {/* Comment Textarea */}
            <div className="space-y-2">
              <Label htmlFor="comment">تعليقك (اختياري)</Label>
              <Textarea
                id="comment"
                placeholder="أخبرنا عن تجربتك مع المنصة..."
                className="min-h-[100px] resize-none"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                إلغاء
              </Button>
              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting || rating === 0}
              >
                {isSubmitting ? "جاري الإرسال..." : "إرسال التقييم"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, MessageSquareQuote } from 'lucide-react';
import { PlatformReview, PlatformReviewsService } from '@/integrations/database/platformReviewsService';
import { ReviewSubmitModal } from './ReviewSubmitModal';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

export default function PlatformReviewsSection() {
  const [reviews, setReviews] = useState<PlatformReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadReviews = async () => {
    setIsLoading(true);
    try {
      const data = await PlatformReviewsService.getApprovedReviews(10);
      setReviews(data);
    } catch (error) {
      console.error("Failed to load reviews", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  return (
    <section className="py-16 bg-gradient-to-b from-background to-primary/5">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
            ماذا يقول مستخدمونا؟
          </h2>
          <p className="max-w-[700px] text-muted-foreground md:text-lg">
            آراء وتجارب مستخدمي منصة طريق عبر مختلف الولايات
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : reviews.length > 0 ? (
          <div className="max-w-5xl mx-auto px-10">
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              plugins={[
                Autoplay({
                  delay: 4000,
                  stopOnInteraction: true,
                }),
              ]}
              className="w-full"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {reviews.map((review) => (
                  <CarouselItem key={review.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                    <Card className="h-full border-primary/10 shadow-sm hover:shadow-md transition-shadow duration-300">
                      <CardContent className="p-6 flex flex-col h-full relative">
                        <MessageSquareQuote className="absolute top-4 left-4 w-8 h-8 text-primary/10" />
                        
                        <div className="flex items-center gap-1 mb-4 text-yellow-400" dir="ltr">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-gray-200 dark:text-gray-700'}`} 
                            />
                          ))}
                        </div>
                        
                        <p className="text-gray-700 dark:text-gray-300 mb-6 flex-grow leading-relaxed italic">
                          "{review.comment || 'خدمة ممتازة'}"
                        </p>
                        
                        <div className="mt-auto flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                            {review.reviewer_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{review.reviewer_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString('ar-DZ')}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="-right-4 md:-right-12" />
              <CarouselNext className="-left-4 md:-left-12" />
            </Carousel>
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-muted-foreground mb-4">كن أول من يقيم خدماتنا!</p>
          </div>
        )}

        <div className="flex justify-center mt-12">
          <Button 
            size="lg" 
            className="rounded-full shadow-lg hover:shadow-xl transition-all"
            onClick={() => setIsModalOpen(true)}
          >
            <Star className="w-5 h-5 ml-2 fill-current" />
            أضف تقييمك
          </Button>
        </div>
      </div>

      <ReviewSubmitModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={loadReviews}
      />
    </section>
  );
}

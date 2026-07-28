import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Car, ShieldCheck, Map } from 'lucide-react';

const AppOnboarding = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const slides = [
    {
      title: "أهلاً بك في أبريد",
      description: "منصة النقل الذكية الأولى التي تجمع بين السائقين والركاب في منطقتك",
      icon: <Car className="w-24 h-24 text-primary mb-6" />
    },
    {
      title: "رحلات سريعة وآمنة",
      description: "نضمن لك رحلات مريحة بأسعار مناسبة مع سائقين موثوقين",
      icon: <ShieldCheck className="w-24 h-24 text-primary mb-6" />
    },
    {
      title: "سهولة في التنقل",
      description: "حدد وجهتك وانطلق في ثوانٍ. تواصل مباشر بين السائق والراكب",
      icon: <Map className="w-24 h-24 text-primary mb-6" />
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center mt-10">
        <div className="animate-in fade-in zoom-in duration-500 flex flex-col items-center" key={currentSlide}>
          {slides[currentSlide].icon}
          <h1 className="text-3xl font-bold mb-4 text-foreground">{slides[currentSlide].title}</h1>
          <p className="text-lg text-muted-foreground max-w-sm">
            {slides[currentSlide].description}
          </p>
        </div>
      </div>

      <div className="p-6 pb-12 mt-auto">
        {/* Indicators */}
        <div className="flex justify-center gap-2 mb-8">
          {slides.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === currentSlide ? "w-8 bg-primary" : "w-2 bg-primary/20"
              }`}
            />
          ))}
        </div>

        {/* Buttons */}
        {currentSlide < slides.length - 1 ? (
          <Button 
            className="w-full h-14 text-lg rounded-xl shadow-lg" 
            onClick={handleNext}
          >
            التالي
          </Button>
        ) : (
          <div className="flex flex-col gap-3 animate-in slide-in-from-bottom-4 duration-500">
            <Button 
              className="w-full h-14 text-lg rounded-xl shadow-lg" 
              onClick={() => navigate('/auth/signup')}
            >
              إنشاء حساب جديد
            </Button>
            <Button 
              variant="outline"
              className="w-full h-14 text-lg rounded-xl border-2" 
              onClick={() => navigate('/login')}
            >
              تسجيل الدخول
            </Button>
            
        )}
      </div>
    </div>
  );
};

export default AppOnboarding;

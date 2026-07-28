import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { useEffect, useState } from "react";

interface Ksar {
  name: string;
  image: string;
  description: string;
}

const GhardaiaSection = () => {
  const [api, setApi] = useState<CarouselApi>();
  const [isAutoplayActive, setIsAutoplayActive] = useState(true);

  useEffect(() => {
    if (!api) return;

    let autoplay: NodeJS.Timeout | null = null;

    // بدء التحرك التلقائي
    const startAutoplay = () => {
      if (isAutoplayActive && !autoplay) {
        autoplay = setInterval(() => {
          api.scrollNext();
        }, 3000);
      }
    };

    // إيقاف التحرك التلقائي
    const stopAutoplay = () => {
      if (autoplay) {
        clearInterval(autoplay);
        autoplay = null;
      }
      setIsAutoplayActive(false);
    };

    // ابدأ التحرك التلقائي
    startAutoplay();

    // إيقاف عند السحب أو النقر
    api.on('pointerDown', stopAutoplay);
    api.on('settle', () => {
      // إذا تم السحب يدوياً، أوقف التحرك التلقائي نهائياً
      if (!isAutoplayActive) {
        stopAutoplay();
      }
    });

    return () => {
      if (autoplay) {
        clearInterval(autoplay);
      }
      api.off('pointerDown', stopAutoplay);
    };
  }, [api, isAutoplayActive]);

  const ksour: Ksar[] = [
    {
      name: "قصر العطف",
      image: "https://pbs.twimg.com/media/FLVq5xuXsAYapXq.jpg",
      description: "من أجمل قصور وادي مزاب التاريخية"
    },
    {
      name: "غرداية تَـغَــرْدَايْتْ ⵜⴰⵖⴻⵔⴷⴰⵢⵜ",
      image: "https://mzabmedia.com/wp-content/uploads/aghlane-taachirf.jpg",
      description: "قلب وادي مزاب النابض"
    },
    {
      name: "قصر بنورة آت بنور ⴰⵜ ⴱⵓⵏⵓⵔ",
      image: "https://www.atmzab.net/images/photo/kosor_7/At_Bounour/agherm_noujenna/Mosqu%C3%A9e_Bounoura__02.jpg",
      description: "من قصور وادي مزاب العريقة"
    },
    {
      name: "قصر بن يزقن آتْ اِيزْجَنْ ⴰⵜ ⵉⵣⵊⴻⵏ",
      image: "https://i.pinimg.com/1200x/c2/92/bc/c292bceceb1daa8810acda9d1fb51eef.jpg",
      description: "تراث معماري أصيل"
    },
    {
      name: "قصر مليكة آت امليشت ⴰⵜ ⵎⵍⵉⵛⴻⵜ",
      image: "https://www.atmzab.net/images/photo/kosor_7/At_mlichet/Tamejjida/_%D9%85%D9%84%D9%8A%D8%B4%D8%AA_%D8%AA%D9%85%D8%AC%D9%8A%D8%AF%D8%A7.jpeg",
      description: "معلم تاريخي فريد"
    },
    {
      name: "قصر القرارة ئـﭭْرارن ⵉⴳⵕⴰⵔⴻⵏ",
      image: "https://tamajida.org/frontend/images/default.jpg",
      description: "من معالم التراث المزابي الأصيل"
    },
    {
      name: "بريان آت إبَرْﭬـان ⴰⵜ ⵉⴱⴻⵔⴳⴰⵏ",
      image: "https://www.atmzab.net/images/photo/kosor_7/Berriane/portre/_38.jpg",
      description: "بوابة الصحراء المزابية"
    }
  ];

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-secondary/10 to-background" dir="rtl">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
            <MapPin className="h-5 w-5 text-primary" />
            <span className="text-primary font-semibold">خدمات النقل من غرداية</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            نقل من جميع قصور ولاية غرداية إلى جميع الولايات
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            خدمة نقل موثوقة ومريحة من القصور التاريخية في وادي مزاب إلى كافة أنحاء الجزائر
          </p>
        </motion.div>

        {/* Carousel */}
        <Carousel
            setApi={setApi}
            opts={{
              align: "center",
              loop: true,
              dragFree: false,
              direction: "rtl",
            }}
            className="w-full max-w-7xl mx-auto"
          >
                  <CarouselContent className="-ml-4">
                    {ksour.map((ksar, index) => (
                      <CarouselItem key={index} className="pl-4 basis-[85%] md:basis-[50%] lg:basis-[33%]">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ 
                    duration: 0.5,
                    delay: index * 0.15
                  }}
                  className="h-full"
                >
                  <Card className="group relative overflow-hidden h-[380px] bg-card border-2 border-border hover:border-primary transition-all duration-300 hover:shadow-2xl">
                  {/* Image */}
                  <div className="relative h-64 overflow-hidden">
                    <motion.img
                      src={ksar.image}
                      alt={ksar.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      whileHover={{ scale: 1.05 }}
                    />
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    
                    {/* Ksar Name on Image */}
                    <div className="absolute bottom-4 right-4 left-4">
                      <h3 className="text-2xl font-bold text-white drop-shadow-lg">
                        {ksar.name}
                      </h3>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 bg-gradient-to-b from-card to-secondary/5">
                    <p className="text-muted-foreground text-center mb-4">
                      {ksar.description}
                    </p>
                    
                    {/* Destinations Badge */}
                    <div className="flex items-center justify-center gap-2 bg-primary/10 px-3 py-2 rounded-lg">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-primary">
                        إلى جميع ولايات الوطن
                      </span>
                    </div>
                  </div>

                  {/* Decorative Corner */}
                  <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-primary/20 group-hover:border-primary transition-colors duration-300" />
                  <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-primary/20 group-hover:border-primary transition-colors duration-300" />
                </Card>
                </motion.div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
};

export default GhardaiaSection;


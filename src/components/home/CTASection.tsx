import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Car, UserCheck, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import BlurText from "@/components/BlurText";

const CTASection = () => {
  const portals = [
    {
      title: "للمسافرين",
      titleEn: "For Riders",
      titleFr: "Pour les Passagers",
      description: "احجز رحلتك بسهولة واسفر بأمان",
      descriptionEn: "Book your trip easily and travel safely",
      descriptionFr: "Réservez votre voyage facilement et voyagez en sécurité",
      icon: Car,
      link: "/auth/signup?role=passenger",
      variant: "hero" as const,
      color: "from-primary to-primary-hover",
    },
    {
      title: "للسائقين",
      titleEn: "For Drivers",
      titleFr: "Pour les Conducteurs",
      description: "انضم إلى شبكة السائقين واكسب دخل إضافي",
      descriptionEn: "Join our driver network and earn extra income",
      descriptionFr: "Rejoignez notre réseau de conducteurs et gagnez un revenu supplémentaire",
      icon: UserCheck,
      link: "/auth/signup?role=driver",
      variant: "secondary" as const,
      color: "from-secondary to-secondary-hover",
    },
    {
      title: "لوحة الإدارة",
      titleEn: "Admin Portal",
      titleFr: "Portail Admin",
      description: "إدارة النظام والعمليات",
      descriptionEn: "Manage system and operations",
      descriptionFr: "Gérer le système et les opérations",
      icon: Settings,
      link: "/admin",
      variant: "outline" as const,
      color: "from-muted to-accent",
    },
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <BlurText 
            text="ابدأ رحلتك معنا" 
            delay={100}
            animateBy="words"
            direction="top"
            className="text-3xl md:text-4xl font-bold text-foreground mb-4"
          />
          <BlurText 
            text="اختر البوابة المناسبة لك واستمتع بتجربة سفر مميزة" 
            delay={50}
            animateBy="words"
            direction="bottom"
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          />
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {portals.map((portal, index) => {
            const IconComponent = portal.icon;
            return (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className={`inline-flex p-4 rounded-full bg-gradient-to-r ${portal.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {portal.title}
                  </h3>
                  
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {portal.description}
                  </p>
                  
                  <Link to={portal.link}>
                    <Button 
                      variant={portal.variant} 
                      className="w-full group-hover:scale-105 transition-transform duration-300"
                    >
                      ابدأ الآن
                      <ArrowLeft className="h-4 w-4 mr-2 rotate-180" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional CTA */}
        <div className="text-center mt-12">
          <Card className="max-w-2xl mx-auto bg-gradient-hero text-white border-0 shadow-xl">
            <CardContent className="p-8">
              <BlurText 
                text="جديد على منصة أبريد؟" 
                delay={100}
                animateBy="words"
                direction="top"
                className="text-2xl font-bold mb-4"
              />
              <p className="text-white/90 mb-6">
                انضم إلى آلاف المسافرين الذين يثقون في خدماتنا عبر الجزائر
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  variant="secondary" 
                  size="lg" 
                  className="min-w-[160px]"
                  onClick={() => window.location.href = '/auth/signup'}
                >
                  إنشاء حساب جديد
                </Button>
                <Link to="/about">
                  <Button variant="outline" size="lg" className="min-w-[160px] border-white text-white hover:bg-white hover:text-primary">
                    تعرف على المزيد
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
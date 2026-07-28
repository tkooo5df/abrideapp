import { Card, CardContent } from "@/components/ui/card";
import { Shield, Clock, MapPin, CreditCard, Users, Headphones } from "lucide-react";
import BlurText from "@/components/BlurText";

const FeaturesSection = () => {
  const features = [
    {
      icon: Shield,
      title: "رحلات آمنة",
      titleEn: "Safe Travels",
      titleFr: "Voyages Sécurisés",
      description: "سائقون موثوقون ومعروفون في المجتمع المحلي مع مركبات آمنة",
      descriptionEn: "Professional licensed drivers with comprehensive vehicle inspection",
      descriptionFr: "Conducteurs professionnels licenciés avec inspection complète des véhicules",
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      icon: Clock,
      title: "مواعيد دقيقة",
      titleEn: "On Time",
      titleFr: "À l'heure",
      description: "التزام بالمواعيد والجدولة المحددة للرحلات",
      descriptionEn: "Commitment to punctuality and scheduled trip timing",
      descriptionFr: "Respect des horaires et de la planification des voyages",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: MapPin,
      title: "تغطية شاملة",
      titleEn: "Complete Coverage",
      titleFr: "Couverture Complète",
      description: "خدمة في جميع الولايات والبلديات الجزائرية",
      descriptionEn: "Service across all Algerian wilayas and communes",
      descriptionFr: "Service dans toutes les wilayas et communes algériennes",
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      icon: Users,
      title: "مجتمع موثوق",
      titleEn: "Trusted Community",
      titleFr: "Communauté Fiable",
      description: "شبكة من السائقين والمسافرين الموثوقين",
      descriptionEn: "Network of trusted drivers and passengers",
      descriptionFr: "Réseau de conducteurs et passagers de confiance",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: Headphones,
      title: "دعم 24/7",
      titleEn: "24/7 Support",
      titleFr: "Support 24/7",
      description: "خدمة العملاء متاحة في أي وقت",
      descriptionEn: "Customer service available anytime",
      descriptionFr: "Service client disponible à tout moment",
      color: "text-success",
      bgColor: "bg-success/10",
    },
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <BlurText 
            text="لماذا تختار abride" 
            delay={100}
            animateBy="words"
            direction="top"
            className="text-3xl md:text-4xl font-bold text-foreground"
          />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${feature.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-2 text-right">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground text-right leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
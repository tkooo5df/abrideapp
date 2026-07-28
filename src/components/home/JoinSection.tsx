import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Car, Users, TrendingUp, Shield, MapPin, Clock, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const JoinSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-secondary/10" dir="rtl">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            انضم إلى عائلة أبري الآن
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            سواء كنت سائقاً تريد كسب المال أو راكباً تبحث عن رحلة مريحة، أبري هو خيارك الأمثل
          </p>
        </motion.div>

        {/* Join Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto"
        >
          {/* Join as Driver Card */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-primary via-primary/95 to-primary/90 border-2 border-primary shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
            <div className="p-8 relative z-10">
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm">
                  <Car className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    انضم كسائق
                  </h3>
                  <p className="text-sm text-white/80">
                    اربح المال من سيارتك
                  </p>
                </div>
              </div>
              
              {/* Features */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-white">
                  <TrendingUp className="h-5 w-5 text-white/90" />
                  <span className="text-sm">أرباح يومية</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <Shield className="h-5 w-5 text-white/90" />
                  <span className="text-sm">بيئة آمنة</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <CheckCircle className="h-5 w-5 text-white/90" />
                  <span className="text-sm">تسجيل سريع</span>
                </div>
              </div>
              
              <Button 
                onClick={() => navigate('/auth/signup?role=driver')}
                className="w-full bg-white hover:bg-white/90 text-primary font-semibold py-6 text-lg shadow-lg hover:scale-105 transition-transform duration-300"
              >
                ابدأ الآن
              </Button>
            </div>
            
            {/* Decorative Background */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24"></div>
            </div>
          </Card>

          {/* Join as Passenger Card */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-secondary via-secondary/95 to-secondary/90 border-2 border-secondary shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
            <div className="p-8 relative z-10">
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 backdrop-blur-sm">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    انضم كراكب
                  </h3>
                  <p className="text-sm text-white/80">
                    رحلات مريحة وآمنة
                  </p>
                </div>
              </div>
              
              {/* Features */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-white">
                  <MapPin className="h-5 w-5 text-white/90" />
                  <span className="text-sm">أكثر من 100 وجهة</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <Clock className="h-5 w-5 text-white/90" />
                  <span className="text-sm">حجوزات فورية</span>
                </div>
                <div className="flex items-center gap-3 text-white">
                  <Shield className="h-5 w-5 text-white/90" />
                  <span className="text-sm">أمان تام</span>
                </div>
              </div>
              
              <Button 
                onClick={() => navigate('/auth/signup?role=passenger')}
                className="w-full bg-white hover:bg-white/90 text-secondary font-semibold py-6 text-lg shadow-lg hover:scale-105 transition-transform duration-300"
              >
                ابدأ الآن
              </Button>
            </div>
            
            {/* Decorative Background */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24"></div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default JoinSection;


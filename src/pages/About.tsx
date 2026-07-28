import React from "react";
import { motion } from "framer-motion";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Car, Users, Shield, Heart, Target, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const About = () => {
  const features = [
    {
      icon: Target,
      title: "رؤيتنا",
      description: "أن نكون المنصة الرائدة في تطوير بنية النقل المحلي بولاية غرداية من خلال ربط السائقين والركاب بطريقة ذكية وآمنة."
    },
    {
      icon: Heart,
      title: "مهمتنا",
      description: "تسهيل التنقل بين قصور غرداية والولايات الأخرى، وتوفير تجربة نقل مريحة وموثوقة للجميع."
    },
    {
      icon: Shield,
      title: "قيمنا",
      description: "الأمان، الموثوقية، الشفافية، والالتزام بخدمة مجتمعنا المحلي بأفضل طريقة ممكنة."
    }
  ];

  const stats = [
    { number: "100+", label: "سائق نشط" },
    { number: "500+", label: "رحلة يومية" },
    { number: "1000+", label: "مستخدم سعيد" },
    { number: "24/7", label: "دعم متواصل" }
  ];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative py-20 px-4 bg-gradient-to-br from-primary/10 via-secondary/5 to-background overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10"></div>
          <div className="container mx-auto max-w-6xl relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6">
                <Car className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-primary mb-6">
                من نحن؟
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                <strong className="text-foreground">abride</strong> هي منصة نقل ذكية تربط السائقين والركاب في ولاية غرداية 
                ضمن مشروع تطوير بنية النقل المحلي. نسعى لتوفير تجربة سفر آمنة ومريحة بين 
                قصور وادي مزاب وجميع الولايات الجزائرية.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Vision, Mission, Values */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="h-full border-2 hover:border-primary transition-colors">
                    <CardContent className="p-6 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                        <feature.icon className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16 px-4 bg-primary text-primary-foreground">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="text-4xl md:text-5xl font-bold mb-2">
                    {stat.number}
                  </div>
                  <div className="text-primary-foreground/80">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Story */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
                قصتنا
              </h2>
              <div className="w-20 h-1 bg-primary mx-auto mb-8"></div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="prose prose-lg max-w-none"
            >
              <Card className="border-2">
                <CardContent className="p-8 space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    بدأت فكرة <strong className="text-foreground">abride</strong> من حاجة حقيقية في ولاية غرداية لتسهيل 
                    التنقل بين قصور وادي مزاب والولايات الأخرى. لاحظنا أن العديد من السائقين 
                    يقومون برحلات يومية بمقاعد فارغة، بينما الركاب يبحثون عن وسيلة نقل آمنة 
                    وموثوقة.
                  </p>
                  <p>
                    من هنا جاءت فكرة إنشاء منصة رقمية تربط بين الطرفين، توفر للسائقين 
                    إمكانية ملء المقاعد الفارغة وتحقيق دخل إضافي، وتمنح الركاب خيارات 
                    متعددة للسفر بأسعار منافسة وراحة تامة.
                  </p>
                  <p>
                    نحن فخورون بأن نكون جزءًا من تطوير بنية النقل في ولاية غرداية، ونسعى 
                    دائمًا لتحسين خدماتنا وتوسيع شبكتنا لخدمة مجتمعنا بشكل أفضل.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
                لماذا تختار abride؟
              </h2>
              <div className="w-20 h-1 bg-primary mx-auto"></div>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Shield, title: "أمان وموثوقية", desc: "التحقق من السائقين بواسطة فريقنا التقني، السائقون المعروفون والموثوقون فقط" },
                { icon: Zap, title: "سهولة الاستخدام", desc: "واجهة بسيطة وسهلة للحجز والبحث عن الرحلات" },
                { icon: Users, title: "مجتمع محلي", desc: "نربط بين أهل غرداية بطريقة آمنة وموثوقة" },
                { icon: Car, title: "رحلات يومية", desc: "مئات الرحلات المتاحة يوميًا لجميع الوجهات" },
                { icon: Heart, title: "خدمة عملاء ممتازة", desc: "فريق دعم متواصل لمساعدتك في أي وقت" },
                { icon: Target, title: "أسعار تنافسية", desc: "أفضل الأسعار مع شفافية كاملة" }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <item.icon className="h-10 w-10 text-primary mb-4" />
                      <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                      <p className="text-muted-foreground text-sm">
                        {item.desc}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;

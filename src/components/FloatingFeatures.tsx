import React from 'react';
import { motion } from 'framer-motion';

const FloatingFeatures = () => {
  const features = [
    {
      title: "رحلات آمنة",
      description: "سائقون محترفون ومرخصون مع فحص شامل للمركبات"
    },
    {
      title: "مواعيد دقيقة",
      description: "التزام بالمواعيد والجدولة المحددة للرحلات"
    },
    {
      title: "تغطية شاملة",
      description: "خدمة في جميع الولايات والبلديات الجزائرية"
    },
    {
      title: "دفع مرن",
      description: "باريدي موب أو الدفع عند الوصول"
    },
    {
      title: "مجتمع موثوق",
      description: "شبكة من السائقين والمسافرين الموثوقين"
    },
    {
      title: "دعم 24/7",
      description: "خدمة العملاء متاحة في أي وقت"
    }
  ];

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-background to-secondary/10" dir="rtl">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            لماذا تختار منصة أبريد؟
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            نوفر لك تجربة سفر مميزة وآمنة عبر الجزائر بأفضل الأسعار والخدمات
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ 
                duration: 0.5,
                delay: index * 0.1
              }}
              whileHover={{ 
                y: -10,
                transition: { duration: 0.3 }
              }}
              className="bg-card rounded-xl p-6 shadow-lg border border-border hover:shadow-xl transition-shadow"
            >
              <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <div className="bg-primary w-3 h-3 rounded-full"></div>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FloatingFeatures;
import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, TrendingUp } from 'lucide-react';

interface Wilaya {
  id: number;
  name: string;
  nameAr: string;
  trips: number;
}

const AlgeriaMap3D = () => {
  const [selectedWilaya, setSelectedWilaya] = useState<Wilaya | null>(null);
  const [hoveredWilaya, setHoveredWilaya] = useState<number | null>(null);

  // بيانات الولايات الشهيرة
  const popularWilayas: Wilaya[] = [
    { id: 16, name: "Alger", nameAr: "الجزائر", trips: 245 },
    { id: 31, name: "Oran", nameAr: "وهران", trips: 198 },
    { id: 9, name: "Blida", nameAr: "البليدة", trips: 156 },
    { id: 6, name: "Bejaia", nameAr: "بجاية", trips: 134 },
    { id: 15, name: "Tizi Ouzou", nameAr: "تيزي وزو", trips: 128 },
    { id: 25, name: "Constantine", nameAr: "قسنطينة", trips: 187 },
    { id: 47, name: "Ghardaia", nameAr: "غرداية", trips: 92 },
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background via-primary/5 to-background overflow-hidden" dir="rtl">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
            <MapPin className="h-5 w-5 text-primary" />
            <span className="text-primary font-semibold">خريطة الجزائر التفاعلية</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-primary via-blue-600 to-primary bg-clip-text text-transparent mb-4">
            اكتشف رحلات عبر الوطن
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            رحلات يومية تربط جميع ولايات الجزائر - اختر وجهتك على الخريطة
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* خريطة الجزائر 3D */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* Container للخريطة */}
            <div className="relative perspective-1000">
              <motion.div
                className="relative"
                style={{
                  transformStyle: "preserve-3d",
                }}
                animate={{
                  rotateY: hoveredWilaya ? 5 : 0,
                  rotateX: hoveredWilaya ? -5 : 0,
                }}
                transition={{ type: "spring", stiffness: 100 }}
              >
                {/* Shadow Layer */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent blur-3xl transform translate-y-12 scale-95" />
                
                {/* خريطة الجزائر SVG المبسطة */}
                <svg
                  viewBox="0 0 800 600"
                  className="w-full h-auto drop-shadow-2xl"
                  style={{ filter: "drop-shadow(0 25px 50px rgba(0, 0, 0, 0.25))" }}
                >
                  <defs>
                    {/* Gradients */}
                    <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                      <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.7" />
                      <stop offset="100%" stopColor="#ec4899" stopOpacity="0.6" />
                    </linearGradient>
                    
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>

                    {/* Pattern للخلفية */}
                    <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                      <circle cx="2" cy="2" r="1" fill="currentColor" className="text-primary/20" />
                    </pattern>
                  </defs>

                  {/* Background */}
                  <rect width="800" height="600" fill="url(#dots)" />

                  {/* خريطة الجزائر المبسطة */}
                  <g id="algeria-map">
                    {/* الشكل العام للجزائر */}
                    <motion.path
                      d="M 150 100 
                         L 250 80 
                         L 350 90 
                         L 450 100 
                         L 550 95 
                         L 650 110 
                         L 700 150 
                         L 720 200 
                         L 710 250 
                         L 690 300 
                         L 650 350 
                         L 600 380 
                         L 550 400 
                         L 500 420 
                         L 450 450 
                         L 400 480 
                         L 350 500 
                         L 300 510 
                         L 250 500 
                         L 200 480 
                         L 150 450 
                         L 120 400 
                         L 100 350 
                         L 90 300 
                         L 85 250 
                         L 90 200 
                         L 110 150 
                         Z"
                      fill="url(#mapGradient)"
                      stroke="white"
                      strokeWidth="3"
                      className="transition-all duration-500"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 2, ease: "easeInOut" }}
                    />

                    {/* نقاط الولايات الرئيسية */}
                    {popularWilayas.map((wilaya, index) => {
                      // مواقع تقريبية للولايات على الخريطة
                      const positions: { [key: number]: { x: number; y: number } } = {
                        16: { x: 250, y: 180 }, // الجزائر
                        31: { x: 150, y: 220 }, // وهران
                        9: { x: 270, y: 200 },  // البليدة
                        6: { x: 380, y: 190 },  // بجاية
                        15: { x: 350, y: 180 }, // تيزي وزو
                        25: { x: 480, y: 210 }, // قسنطينة
                        47: { x: 380, y: 400 }, // غرداية
                      };

                      const pos = positions[wilaya.id] || { x: 400, y: 300 };
                      const isHovered = hoveredWilaya === wilaya.id;
                      const isSelected = selectedWilaya?.id === wilaya.id;

                      return (
                        <g key={wilaya.id}>
                          {/* دائرة النبض */}
                          {isHovered && (
                            <motion.circle
                              cx={pos.x}
                              cy={pos.y}
                              r="20"
                              fill="none"
                              stroke="white"
                              strokeWidth="2"
                              initial={{ r: 10, opacity: 1 }}
                              animate={{ r: 30, opacity: 0 }}
                              transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeOut"
                              }}
                            />
                          )}

                          {/* النقطة الرئيسية */}
                          <motion.circle
                            cx={pos.x}
                            cy={pos.y}
                            r={isHovered ? "12" : isSelected ? "10" : "8"}
                            fill="white"
                            className="cursor-pointer"
                            filter="url(#glow)"
                            onMouseEnter={() => setHoveredWilaya(wilaya.id)}
                            onMouseLeave={() => setHoveredWilaya(null)}
                            onClick={() => setSelectedWilaya(wilaya)}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: index * 0.1 + 1 }}
                            whileHover={{ scale: 1.3 }}
                            whileTap={{ scale: 0.9 }}
                          />

                          {/* Label */}
                          {(isHovered || isSelected) && (
                            <motion.g
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                            >
                              <rect
                                x={pos.x - 40}
                                y={pos.y - 50}
                                width="80"
                                height="30"
                                rx="5"
                                fill="white"
                                className="drop-shadow-lg"
                              />
                              <text
                                x={pos.x}
                                y={pos.y - 32}
                                textAnchor="middle"
                                className="text-xs font-bold fill-primary"
                              >
                                {wilaya.nameAr}
                              </text>
                            </motion.g>
                          )}
                        </g>
                      );
                    })}

                    {/* خطوط الربط المتحركة */}
                    <motion.path
                      d="M 250 180 Q 300 250 380 400"
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                      opacity="0.3"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 2, delay: 1.5, repeat: Infinity }}
                    />
                  </g>
                </svg>
              </motion.div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
          </motion.div>

          {/* قائمة الولايات */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-4"
          >
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-primary" />
              الوجهات الأكثر طلباً
            </h3>

            <div className="space-y-3">
              {popularWilayas.map((wilaya, index) => (
                <motion.div
                  key={wilaya.id}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`
                    group relative p-5 rounded-xl border-2 transition-all duration-300 cursor-pointer
                    ${selectedWilaya?.id === wilaya.id || hoveredWilaya === wilaya.id
                      ? 'border-primary bg-primary/5 shadow-lg scale-105'
                      : 'border-border bg-card hover:border-primary/50 hover:shadow-md'
                    }
                  `}
                  onMouseEnter={() => setHoveredWilaya(wilaya.id)}
                  onMouseLeave={() => setHoveredWilaya(null)}
                  onClick={() => setSelectedWilaya(wilaya)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg
                        transition-colors duration-300
                        ${selectedWilaya?.id === wilaya.id || hoveredWilaya === wilaya.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-primary/10 text-primary'
                        }
                      `}>
                        {wilaya.id}
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">{wilaya.nameAr}</h4>
                        <p className="text-sm text-muted-foreground">{wilaya.name}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{wilaya.trips}</div>
                      <div className="text-xs text-muted-foreground">رحلة متاحة</div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary to-blue-500"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(wilaya.trips / 250) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 + 0.3, duration: 0.8 }}
                    />
                  </div>

                  {/* Hover Effect */}
                  <div className={`
                    absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 to-transparent 
                    opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none
                  `} />
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 }}
              className="mt-8 p-6 bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-xl border-2 border-primary/20"
            >
              <p className="text-center text-lg font-semibold mb-3">
                🚀 ابحث عن رحلتك الآن
              </p>
              <p className="text-center text-sm text-muted-foreground">
                رحلات يومية إلى أكثر من 48 ولاية عبر الوطن
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </section>
  );
};

export default AlgeriaMap3D;


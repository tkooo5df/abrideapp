import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, TrendingUp, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Wilaya {
  id: number;
  name: string;
  nameAr: string;
  trips: number;
}

const AlgeriaMapWithRealData = () => {
  const [selectedWilaya, setSelectedWilaya] = useState<Wilaya | null>(null);
  const [hoveredWilaya, setHoveredWilaya] = useState<number | null>(null);
  const [popularWilayas, setPopularWilayas] = useState<Wilaya[]>([]);
  const [loading, setLoading] = useState(true);

  // قائمة الولايات الجزائرية (ID, الاسم بالعربية والفرنسية)
  const wilayasList: { [key: number]: { name: string; nameAr: string; x: number; y: number } } = {
    1: { name: "Adrar", nameAr: "أدرار", x: 200, y: 450 },
    2: { name: "Chlef", nameAr: "الشلف", x: 180, y: 180 },
    3: { name: "Laghouat", nameAr: "الأغواط", x: 320, y: 350 },
    4: { name: "Oum El Bouaghi", nameAr: "أم البواقي", x: 520, y: 240 },
    5: { name: "Batna", nameAr: "باتنة", x: 550, y: 280 },
    6: { name: "Bejaia", nameAr: "بجاية", x: 380, y: 190 },
    7: { name: "Biskra", nameAr: "بسكرة", x: 530, y: 330 },
    8: { name: "Bechar", nameAr: "بشار", x: 120, y: 380 },
    9: { name: "Blida", nameAr: "البليدة", x: 270, y: 200 },
    10: { name: "Bouira", nameAr: "البويرة", x: 320, y: 210 },
    11: { name: "Tamanrasset", nameAr: "تمنراست", x: 380, y: 550 },
    12: { name: "Tebessa", nameAr: "تبسة", x: 620, y: 270 },
    13: { name: "Tlemcen", nameAr: "تلمسان", x: 110, y: 200 },
    14: { name: "Tiaret", nameAr: "تيارت", x: 220, y: 250 },
    15: { name: "Tizi Ouzou", nameAr: "تيزي وزو", x: 350, y: 180 },
    16: { name: "Alger", nameAr: "الجزائر", x: 250, y: 180 },
    17: { name: "Djelfa", nameAr: "الجلفة", x: 330, y: 310 },
    18: { name: "Jijel", nameAr: "جيجل", x: 430, y: 180 },
    19: { name: "Setif", nameAr: "سطيف", x: 450, y: 220 },
    20: { name: "Saida", nameAr: "سعيدة", x: 160, y: 240 },
    21: { name: "Skikda", nameAr: "سكيكدة", x: 500, y: 190 },
    22: { name: "Sidi Bel Abbes", nameAr: "سيدي بلعباس", x: 140, y: 230 },
    23: { name: "Annaba", nameAr: "عنابة", x: 580, y: 190 },
    24: { name: "Guelma", nameAr: "قالمة", x: 560, y: 210 },
    25: { name: "Constantine", nameAr: "قسنطينة", x: 520, y: 210 },
    26: { name: "Medea", nameAr: "المدية", x: 280, y: 230 },
    27: { name: "Mostaganem", nameAr: "مستغانم", x: 140, y: 200 },
    28: { name: "M'Sila", nameAr: "المسيلة", x: 400, y: 270 },
    29: { name: "Mascara", nameAr: "معسكر", x: 160, y: 220 },
    30: { name: "Ouargla", nameAr: "ورقلة", x: 480, y: 400 },
    31: { name: "Oran", nameAr: "وهران", x: 130, y: 210 },
    32: { name: "El Bayadh", nameAr: "البيض", x: 200, y: 320 },
    33: { name: "Illizi", nameAr: "إليزي", x: 620, y: 500 },
    34: { name: "Bordj Bou Arreridj", nameAr: "برج بوعريريج", x: 430, y: 240 },
    35: { name: "Boumerdes", nameAr: "بومرداس", x: 310, y: 180 },
    36: { name: "El Tarf", nameAr: "الطارف", x: 620, y: 200 },
    37: { name: "Tindouf", nameAr: "تندوف", x: 50, y: 500 },
    38: { name: "Tissemsilt", nameAr: "تيسمسيلت", x: 220, y: 230 },
    39: { name: "El Oued", nameAr: "الوادي", x: 570, y: 360 },
    40: { name: "Khenchela", nameAr: "خنشلة", x: 570, y: 270 },
    41: { name: "Souk Ahras", nameAr: "سوق أهراس", x: 600, y: 220 },
    42: { name: "Tipaza", nameAr: "تيبازة", x: 230, y: 180 },
    43: { name: "Mila", nameAr: "ميلة", x: 500, y: 230 },
    44: { name: "Ain Defla", nameAr: "عين الدفلى", x: 220, y: 210 },
    45: { name: "Naama", nameAr: "النعامة", x: 130, y: 300 },
    46: { name: "Ain Temouchent", nameAr: "عين تموشنت", x: 120, y: 220 },
    47: { name: "Ghardaia", nameAr: "غرداية", x: 380, y: 400 },
    48: { name: "Relizane", nameAr: "غليزان", x: 170, y: 210 },
  };

  useEffect(() => {
    fetchTripData();
  }, []);

  const fetchTripData = async () => {
    try {
      setLoading(true);

      // جلب جميع الرحلات النشطة
      const { data: trips, error } = await supabase
        .from('trips')
        .select('origin, destination, status')
        .eq('status', 'active');

      if (error) throw error;

      // حساب عدد الرحلات لكل ولاية
      const tripCounts: { [key: string]: number } = {};

      trips?.forEach((trip) => {
        // زيادة العداد للمنشأ
        if (trip.origin) {
          tripCounts[trip.origin] = (tripCounts[trip.origin] || 0) + 1;
        }
        // زيادة العداد للوجهة
        if (trip.destination) {
          tripCounts[trip.destination] = (tripCounts[trip.destination] || 0) + 1;
        }
      });

      // تحويل إلى مصفوفة مع معلومات الولايات
      const wilayasWithTrips: Wilaya[] = Object.entries(tripCounts)
        .map(([wilayaName, count]) => {
          // البحث عن الولاية في القائمة
          const wilayaEntry = Object.entries(wilayasList).find(
            ([_, info]) => 
              info.name.toLowerCase() === wilayaName.toLowerCase() || 
              info.nameAr === wilayaName
          );

          if (wilayaEntry) {
            const [id, info] = wilayaEntry;
            return {
              id: parseInt(id),
              name: info.name,
              nameAr: info.nameAr,
              trips: count,
            };
          }
          return null;
        })
        .filter((w): w is Wilaya => w !== null)
        .sort((a, b) => b.trips - a.trips)
        .slice(0, 10); // أخذ أفضل 10 ولايات

      // إذا لم توجد بيانات، استخدم بيانات تجريبية
      if (wilayasWithTrips.length === 0) {
        setPopularWilayas([
          { id: 16, name: "Alger", nameAr: "الجزائر", trips: 0 },
          { id: 31, name: "Oran", nameAr: "وهران", trips: 0 },
          { id: 9, name: "Blida", nameAr: "البليدة", trips: 0 },
          { id: 25, name: "Constantine", nameAr: "قسنطينة", trips: 0 },
          { id: 47, name: "Ghardaia", nameAr: "غرداية", trips: 0 },
        ]);
      } else {
        setPopularWilayas(wilayasWithTrips);
      }
    } catch (error) {
      // استخدام بيانات تجريبية في حالة الخطأ
      setPopularWilayas([
        { id: 16, name: "Alger", nameAr: "الجزائر", trips: 0 },
        { id: 31, name: "Oran", nameAr: "وهران", trips: 0 },
        { id: 9, name: "Blida", nameAr: "البليدة", trips: 0 },
        { id: 25, name: "Constantine", nameAr: "قسنطينة", trips: 0 },
        { id: 47, name: "Ghardaia", nameAr: "غرداية", trips: 0 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-20 px-4 bg-gradient-to-b from-background via-primary/5 to-background" dir="rtl">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-center min-h-[500px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">جاري تحميل خريطة الرحلات...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

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
                
                {/* خريطة الجزائر SVG */}
                <svg
                  viewBox="0 0 800 600"
                  className="w-full h-auto drop-shadow-2xl"
                  style={{ filter: "drop-shadow(0 25px 50px rgba(0, 0, 0, 0.25))" }}
                >
                  <defs>
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

                    <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                      <circle cx="2" cy="2" r="1" fill="currentColor" className="text-primary/20" />
                    </pattern>
                  </defs>

                  {/* Background */}
                  <rect width="800" height="600" fill="url(#dots)" />

                  {/* خريطة الجزائر */}
                  <g id="algeria-map">
                    <motion.path
                      d="M 150 100 L 250 80 L 350 90 L 450 100 L 550 95 L 650 110 L 700 150 L 720 200 L 710 250 L 690 300 L 650 350 L 600 380 L 550 400 L 500 420 L 450 450 L 400 480 L 350 500 L 300 510 L 250 500 L 200 480 L 150 450 L 120 400 L 100 350 L 90 300 L 85 250 L 90 200 L 110 150 Z"
                      fill="url(#mapGradient)"
                      stroke="white"
                      strokeWidth="3"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 2, ease: "easeInOut" }}
                    />

                    {/* نقاط الولايات */}
                    {popularWilayas.map((wilaya, index) => {
                      const pos = wilayasList[wilaya.id] || { x: 400, y: 300 };
                      const isHovered = hoveredWilaya === wilaya.id;
                      const isSelected = selectedWilaya?.id === wilaya.id;

                      return (
                        <g key={wilaya.id}>
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
                  </g>
                </svg>
              </motion.div>
            </div>

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
              {popularWilayas.length > 0 && popularWilayas[0].trips > 0 
                ? 'الوجهات الأكثر طلباً'
                : 'الوجهات المتاحة'
              }
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
                      <div className="text-xs text-muted-foreground">
                        {wilaya.trips === 0 ? 'لا توجد رحلات' : 'رحلة متاحة'}
                      </div>
                    </div>
                  </div>

                  {wilaya.trips > 0 && (
                    <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-primary to-blue-500"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${Math.min((wilaya.trips / Math.max(...popularWilayas.map(w => w.trips))) * 100, 100)}%` }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 + 0.3, duration: 0.8 }}
                      />
                    </div>
                  )}

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

export default AlgeriaMapWithRealData;


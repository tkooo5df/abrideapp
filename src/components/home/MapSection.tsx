import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, Navigation, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';

const MapSection = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const isAdmin = profile?.role === 'admin' || user?.role === 'admin';

  // Hide entire section for non-admin users
  if (!isAdmin) {
    return null;
  }

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-white" dir="rtl">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            🗺️ تتبع رحلاتك على الخريطة
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            استخدم خرائطنا التفاعلية لتتبع رحلاتك في الوقت الفعلي ومشاهدة جميع السائقين المتاحين
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Drivers Map Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="p-6 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
              <div className="flex-1">
                <div className="h-16 w-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <MapPin className="h-8 w-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-center mb-3">
                  خريطة السائقين
                </h3>
                
                <p className="text-gray-600 text-center mb-6">
                  شاهد جميع السائقين المتاحين على الخريطة التفاعلية واختر الأقرب إليك
                </p>

                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    عرض جميع السائقين النشطين
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    معلومات كاملة عن كل سائق
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    بحث وفلترة حسب الموقع
                  </li>
                </ul>
              </div>

              <Button 
                onClick={() => navigate('/drivers-map')}
                className="w-full gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                size="lg"
              >
                <MapPin className="h-5 w-5" />
                استكشف الخريطة
              </Button>
            </Card>
          </motion.div>

          {/* Trip Tracking Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="p-6 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
              <div className="flex-1">
                <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Navigation className="h-8 w-8 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-center mb-3">
                  تتبع الرحلة
                </h3>
                
                <p className="text-gray-600 text-center mb-6">
                  تتبع رحلتك في الوقت الفعلي مع معلومات المسافة والوقت المتبقي
                </p>

                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    تحديثات فورية للموقع
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    حساب المسافة والوقت المتبقي
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    خط المسار على الخريطة
                  </li>
                </ul>
              </div>

              <Button 
                onClick={() => navigate('/user-dashboard?tab=bookings')}
                className="w-full gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                size="lg"
              >
                <Navigation className="h-5 w-5" />
                رحلاتي
              </Button>
            </Card>
          </motion.div>
        </div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
        >
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="text-3xl mb-2">📍</div>
            <div className="font-bold text-lg">موقع دقيق</div>
            <div className="text-sm text-gray-600">GPS عالي الدقة</div>
          </div>
          
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="text-3xl mb-2">⏱️</div>
            <div className="font-bold text-lg">تحديث فوري</div>
            <div className="text-sm text-gray-600">كل 30 ثانية</div>
          </div>
          
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="text-3xl mb-2">📏</div>
            <div className="font-bold text-lg">حساب المسافة</div>
            <div className="text-sm text-gray-600">دقيق وموثوق</div>
          </div>
          
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="text-3xl mb-2">🔔</div>
            <div className="font-bold text-lg">إشعارات</div>
            <div className="text-sm text-gray-600">تحديثات فورية</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MapSection;



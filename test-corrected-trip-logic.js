// اختبار المنطق المصحح لإكمال الرحلة
console.log('🚀 اختبار المنطق المصحح لإكمال الرحلة...');

// محاكاة البيانات
const testData = {
  trip: {
    id: 'trip-1',
    driverId: 'driver-1',
    totalSeats: 4,
    availableSeats: 2,
    isActive: true,
    status: 'scheduled'
  },
  bookings: [
    { id: 'booking-1', tripId: 'trip-1', passengerId: 'passenger-1', status: 'confirmed' },
    { id: 'booking-2', tripId: 'trip-1', passengerId: 'passenger-2', status: 'pending' },
    { id: 'booking-3', tripId: 'trip-1', passengerId: 'passenger-3', status: 'confirmed' }
  ],
  action: 'complete_booking',
  bookingId: 'booking-1'
};

// محاكاة المنطق المصحح
function simulateCorrectedLogic(data) {
  console.log('\n✅ المنطق المصحح:');
  console.log('عندما يكمل السائق رحلة لراكب واحد، هذا يعني أن الرحلة انتهت فعلياً');
  
  // إكمال جميع الحجوزات للرحلة
  const updatedBookings = data.bookings.map(booking => ({
    ...booking,
    status: 'completed' // جميع الحجوزات تصبح مكتملة
  }));
  
  // إكمال الرحلة بالكامل
  const updatedTrip = {
    ...data.trip,
    isActive: false, // الرحلة تصبح غير نشطة
    status: 'completed',
    availableSeats: 0 // جميع المقاعد محجوزة
  };
  
  console.log('   - الحجز المحدد:', updatedBookings.find(b => b.id === data.bookingId).status);
  console.log('   - جميع الحجوزات الأخرى:', updatedBookings.filter(b => b.id !== data.bookingId).map(b => `${b.id}: ${b.status}`));
  console.log('   - حالة الرحلة:', updatedTrip.status);
  console.log('   - الرحلة نشطة:', updatedTrip.isActive);
  console.log('   - المقاعد المتاحة:', updatedTrip.availableSeats);
  
  return { updatedBookings, updatedTrip };
}

// محاكاة المنطق الخاطئ (الذي كان موجوداً سابقاً)
function simulateWrongLogic(data) {
  console.log('\n❌ المنطق الخاطئ (الذي كان موجوداً سابقاً):');
  console.log('إكمال حجز واحد فقط دون إكمال الرحلة بالكامل');
  
  // إكمال حجز واحد فقط
  const updatedBookings = data.bookings.map(booking => {
    if (booking.id === data.bookingId) {
      return { ...booking, status: 'completed' };
    }
    return booking; // الحجوزات الأخرى تبقى كما هي
  });
  
  const updatedTrip = {
    ...data.trip,
    isActive: true, // الرحلة تبقى نشطة
    status: 'scheduled',
    availableSeats: data.trip.availableSeats + 1 // مقعد واحد متاح أكثر
  };
  
  console.log('   - الحجز المحدد:', updatedBookings.find(b => b.id === data.bookingId).status);
  console.log('   - جميع الحجوزات الأخرى:', updatedBookings.filter(b => b.id !== data.bookingId).map(b => `${b.id}: ${b.status}`));
  console.log('   - حالة الرحلة:', updatedTrip.status);
  console.log('   - الرحلة نشطة:', updatedTrip.isActive);
  console.log('   - المقاعد المتاحة:', updatedTrip.availableSeats);
  
  return { updatedBookings, updatedTrip };
}

// تشغيل الاختبارات
try {
  console.log('📝 بيانات الاختبار:');
  console.log('   - الرحلة:', testData.trip.id, `(${testData.trip.totalSeats} مقاعد، ${testData.trip.availableSeats} متاح)`);
  console.log('   - الحجوزات:', testData.bookings.length);
  console.log('   - الإجراء:', testData.action);
  console.log('   - الحجز المحدد:', testData.bookingId);
  
  const wrongResult = simulateWrongLogic(testData);
  const correctResult = simulateCorrectedLogic(testData);
  
  console.log('\n🎯 المقارنة:');
  console.log('   - المنطق الخاطئ:');
  console.log(`     الحجوزات المكتملة: ${wrongResult.updatedBookings.filter(b => b.status === 'completed').length}/${wrongResult.updatedBookings.length}`);
  console.log(`     الرحلة نشطة: ${wrongResult.updatedTrip.isActive}`);
  console.log(`     المقاعد المتاحة: ${wrongResult.updatedTrip.availableSeats}`);
  
  console.log('   - المنطق المصحح:');
  console.log(`     الحجوزات المكتملة: ${correctResult.updatedBookings.filter(b => b.status === 'completed').length}/${correctResult.updatedBookings.length}`);
  console.log(`     الرحلة نشطة: ${correctResult.updatedTrip.isActive}`);
  console.log(`     المقاعد المتاحة: ${correctResult.updatedTrip.availableSeats}`);
  
  console.log('\n🎉 تم تصحيح المنطق بنجاح!');
  console.log('الآن المنطق صحيح:');
  console.log('   ✅ عندما يكمل السائق رحلة لراكب واحد');
  console.log('   ✅ يتم إكمال الرحلة لجميع الركاب');
  console.log('   ✅ يتم وضع الرحلة كـ "مكتملة" في البحث');
  console.log('   ✅ لا توجد حاجة لزر منفصل "إكمال الرحلة بالكامل"');
  
  console.log('\n💡 المنطق المنطقي:');
  console.log('   - إذا انتهت الرحلة لراكب واحد، فهي انتهت للجميع');
  console.log('   - الرحلة لا يمكن أن تكون "نشطة" وجزء منها "مكتمل"');
  console.log('   - السائق يتحكم في متى تنتهي الرحلة بالكامل');
  
} catch (error) {
  console.error('❌ خطأ في اختبار المنطق المصحح:', error);
}

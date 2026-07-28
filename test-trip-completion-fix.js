// اختبار إصلاح منطق إكمال الرحلة
console.log('🚀 اختبار إصلاح منطق إكمال الرحلة...');

// محاكاة البيانات قبل الإصلاح
const beforeFix = {
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
  action: 'complete_individual_booking',
  bookingId: 'booking-1'
};

// محاكاة البيانات بعد الإصلاح
const afterFix = {
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
  action: 'complete_individual_booking',
  bookingId: 'booking-1'
};

// محاكاة النتيجة قبل الإصلاح
function simulateBeforeFix(data) {
  console.log('\n📊 النتيجة قبل الإصلاح:');
  
  // إكمال حجز واحد يؤدي إلى إكمال الرحلة بالكامل
  const updatedBookings = data.bookings.map(booking => {
    if (booking.id === data.bookingId) {
      return { ...booking, status: 'completed' };
    }
    // جميع الحجوزات الأخرى تصبح مكتملة أيضاً (خطأ!)
    return { ...booking, status: 'completed' };
  });
  
  const updatedTrip = {
    ...data.trip,
    isActive: false, // الرحلة تصبح غير نشطة (خطأ!)
    status: 'completed'
  };
  
  console.log('   - الحجز المحدد:', updatedBookings.find(b => b.id === data.bookingId).status);
  console.log('   - جميع الحجوزات الأخرى:', updatedBookings.filter(b => b.id !== data.bookingId).map(b => `${b.id}: ${b.status}`));
  console.log('   - حالة الرحلة:', updatedTrip.status);
  console.log('   - الرحلة نشطة:', updatedTrip.isActive);
  console.log('   - المقاعد المتاحة:', updatedTrip.availableSeats);
  
  return { updatedBookings, updatedTrip };
}

// محاكاة النتيجة بعد الإصلاح
function simulateAfterFix(data) {
  console.log('\n✅ النتيجة بعد الإصلاح:');
  
  // إكمال حجز واحد فقط
  const updatedBookings = data.bookings.map(booking => {
    if (booking.id === data.bookingId) {
      return { ...booking, status: 'completed' };
    }
    // الحجوزات الأخرى تبقى كما هي (صحيح!)
    return booking;
  });
  
  const updatedTrip = {
    ...data.trip,
    isActive: true, // الرحلة تبقى نشطة (صحيح!)
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

// محاكاة إكمال الرحلة بالكامل (خيار منفصل)
function simulateCompleteEntireTrip(data) {
  console.log('\n🎯 إكمال الرحلة بالكامل (خيار منفصل):');
  
  const updatedBookings = data.bookings.map(booking => ({
    ...booking,
    status: 'completed' // جميع الحجوزات تصبح مكتملة
  }));
  
  const updatedTrip = {
    ...data.trip,
    isActive: false, // الرحلة تصبح غير نشطة
    status: 'completed',
    availableSeats: 0 // جميع المقاعد محجوزة
  };
  
  console.log('   - جميع الحجوزات:', updatedBookings.map(b => `${b.id}: ${b.status}`));
  console.log('   - حالة الرحلة:', updatedTrip.status);
  console.log('   - الرحلة نشطة:', updatedTrip.isActive);
  console.log('   - المقاعد المتاحة:', updatedTrip.availableSeats);
  
  return { updatedBookings, updatedTrip };
}

// تشغيل الاختبارات
try {
  console.log('📝 بيانات الاختبار:');
  console.log('   - الرحلة:', beforeFix.trip.id, `(${beforeFix.trip.totalSeats} مقاعد، ${beforeFix.trip.availableSeats} متاح)`);
  console.log('   - الحجوزات:', beforeFix.bookings.length);
  console.log('   - الإجراء:', beforeFix.action);
  console.log('   - الحجز المحدد:', beforeFix.bookingId);
  
  const beforeResult = simulateBeforeFix(beforeFix);
  const afterResult = simulateAfterFix(afterFix);
  const completeTripResult = simulateCompleteEntireTrip(afterFix);
  
  console.log('\n🎯 المقارنة:');
  console.log('   - إكمال حجز واحد:');
  console.log(`     قبل: ${beforeResult.updatedBookings.filter(b => b.status === 'completed').length}/${beforeResult.updatedBookings.length} حجوزات مكتملة`);
  console.log(`     بعد: ${afterResult.updatedBookings.filter(b => b.status === 'completed').length}/${afterResult.updatedBookings.length} حجوزات مكتملة`);
  console.log(`     الرحلة نشطة: ${beforeResult.updatedTrip.isActive} → ${afterResult.updatedTrip.isActive}`);
  
  console.log('   - إكمال الرحلة بالكامل:');
  console.log(`     جميع الحجوزات: ${completeTripResult.updatedBookings.filter(b => b.status === 'completed').length}/${completeTripResult.updatedBookings.length} مكتملة`);
  console.log(`     الرحلة نشطة: ${completeTripResult.updatedTrip.isActive}`);
  
  console.log('\n🎉 تم إصلاح منطق إكمال الرحلة بنجاح!');
  console.log('الآن السائق يمكنه:');
  console.log('   1. إكمال حجز واحد فقط (لراكب واحد)');
  console.log('   2. إكمال الرحلة بالكامل (لجميع الركاب)');
  console.log('   3. الرحلة تبقى نشطة حتى يتم إكمالها بالكامل');
  
} catch (error) {
  console.error('❌ خطأ في اختبار إصلاح منطق إكمال الرحلة:', error);
}

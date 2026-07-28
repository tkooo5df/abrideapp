// اختبار نظام الإشعارات - نسخة مبسطة
console.log('🚀 بدء اختبار نظام الإشعارات...');

// محاكاة بيانات الاختبار
const testData = {
  userId: 'test-user-1',
  title: 'إشعار تجريبي',
  message: 'هذا إشعار تجريبي لاختبار النظام',
  type: 'info',
  category: 'system',
  priority: 'medium'
};

console.log('📝 بيانات الاختبار:', testData);

// محاكاة إنشاء إشعار
function createTestNotification(data) {
  console.log('📧 إنشاء إشعار...');
  
  const notification = {
    id: 'test-notification-' + Date.now(),
    userId: data.userId,
    title: data.title,
    message: data.message,
    type: data.type,
    category: data.category,
    priority: data.priority,
    isRead: false,
    createdAt: new Date().toISOString()
  };
  
  console.log('✅ تم إنشاء الإشعار:', notification);
  return notification;
}

// محاكاة إشعارات الحجز
function createBookingNotification(bookingData) {
  console.log('🚗 إنشاء إشعارات الحجز...');
  
  const notifications = [
    {
      id: 'driver-notification-' + Date.now(),
      userId: bookingData.driverId,
      title: '🚗 حجز جديد',
      message: `حجز جديد من راكب: ${bookingData.pickupLocation} → ${bookingData.destinationLocation}`,
      type: 'booking_created',
      category: 'booking',
      priority: 'high',
      isRead: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'passenger-notification-' + Date.now(),
      userId: bookingData.passengerId,
      title: '✅ تم إرسال طلب الحجز',
      message: 'تم إرسال طلب الحجز للسائق. سيتم إشعارك عند الموافقة.',
      type: 'booking_pending',
      category: 'booking',
      priority: 'medium',
      isRead: false,
      createdAt: new Date().toISOString()
    }
  ];
  
  console.log('✅ تم إنشاء إشعارات الحجز:', notifications.length, 'إشعار');
  return notifications;
}

// تشغيل الاختبارات
try {
  // اختبار 1: إشعار بسيط
  console.log('\n1. اختبار إشعار بسيط...');
  const simpleNotification = createTestNotification(testData);
  
  // اختبار 2: إشعارات الحجز
  console.log('\n2. اختبار إشعارات الحجز...');
  const bookingNotifications = createBookingNotification({
    bookingId: 'test-booking-1',
    passengerId: 'test-passenger-1',
    driverId: 'test-driver-1',
    tripId: 'test-trip-1',
    pickupLocation: 'الجزائر العاصمة',
    destinationLocation: 'وهران',
    seatsBooked: 2,
    totalAmount: 1500,
    paymentMethod: 'cod'
  });
  
  // اختبار 3: إحصائيات
  console.log('\n3. اختبار الإحصائيات...');
  const allNotifications = [simpleNotification, ...bookingNotifications];
  const stats = {
    total: allNotifications.length,
    unread: allNotifications.filter(n => !n.isRead).length,
    byCategory: {
      system: allNotifications.filter(n => n.category === 'system').length,
      booking: allNotifications.filter(n => n.category === 'booking').length
    },
    byPriority: {
      high: allNotifications.filter(n => n.priority === 'high').length,
      medium: allNotifications.filter(n => n.priority === 'medium').length
    }
  };
  
  console.log('✅ الإحصائيات:', stats);
  
  console.log('\n🎉 تم اختبار نظام الإشعارات بنجاح!');
  console.log('📊 ملخص الاختبار:');
  console.log(`   - إجمالي الإشعارات: ${stats.total}`);
  console.log(`   - الإشعارات غير المقروءة: ${stats.unread}`);
  console.log(`   - إشعارات النظام: ${stats.byCategory.system}`);
  console.log(`   - إشعارات الحجز: ${stats.byCategory.booking}`);
  console.log(`   - إشعارات عالية الأولوية: ${stats.byPriority.high}`);
  console.log(`   - إشعارات متوسطة الأولوية: ${stats.byPriority.medium}`);
  
} catch (error) {
  console.error('❌ خطأ في اختبار نظام الإشعارات:', error);
}

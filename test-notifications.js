// اختبار نظام الإشعارات
import { NotificationService } from './src/integrations/database/notificationService';
import { BrowserDatabaseService } from './src/integrations/database/browserServices';

async function testNotificationSystem() {
  console.log('🚀 بدء اختبار نظام الإشعارات...');
  
  try {
    // اختبار إنشاء إشعار بسيط
    console.log('\n1. اختبار إنشاء إشعار بسيط...');
    const simpleNotification = await NotificationService.createNotification({
      userId: 'test-user-1',
      title: 'إشعار تجريبي',
      message: 'هذا إشعار تجريبي لاختبار النظام',
      type: 'info',
      category: 'system',
      priority: 'medium'
    });
    console.log('✅ تم إنشاء الإشعار:', simpleNotification);

    // اختبار إشعارات الحجز
    console.log('\n2. اختبار إشعارات الحجز...');
    const bookingNotifications = await NotificationService.notifyBookingCreated({
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
    console.log('✅ تم إرسال إشعارات الحجز:', bookingNotifications);

    // اختبار جلب الإشعارات
    console.log('\n3. اختبار جلب الإشعارات...');
    const notifications = await NotificationService.getUserNotifications('test-user-1');
    console.log('✅ تم جلب الإشعارات:', notifications.length, 'إشعار');

    // اختبار الإحصائيات
    console.log('\n4. اختبار الإحصائيات...');
    const stats = await NotificationService.getNotificationStats('test-user-1');
    console.log('✅ الإحصائيات:', stats);

    console.log('\n🎉 تم اختبار نظام الإشعارات بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ في اختبار نظام الإشعارات:', error);
  }
}

// تشغيل الاختبار
testNotificationSystem();

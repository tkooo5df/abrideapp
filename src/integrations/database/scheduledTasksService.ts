import { BrowserDatabaseService } from './browserServices';
import { DatabaseService } from './services';

export class ScheduledTasksService {
  private static intervalId: NodeJS.Timeout | null = null;
  private static isRunning = false;

  // Start the scheduled tasks
  static startScheduledTasks() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    // Run every hour to check for expired bookings
    this.intervalId = setInterval(async () => {
      try {
        await this.runScheduledTasks();
      } catch (error) {
      }
    }, 60 * 60 * 1000); // 1 hour

    // Run immediately on start
    this.runScheduledTasks();
  }

  // Stop the scheduled tasks
  static stopScheduledTasks() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  // Run all scheduled tasks
  private static async runScheduledTasks() {
    
    try {
      // Cancel expired pending bookings
      const cancelledCount = await BrowserDatabaseService.cancelExpiredPendingBookings();
      
      if (cancelledCount > 0) {
        
        // Send notifications about cancelled bookings
        await this.notifyAboutCancelledBookings(cancelledCount);
      } else {
      }
    } catch (error) {
    }
  }

  // Notify about cancelled bookings
  private static async notifyAboutCancelledBookings(count: number) {
    try {
      // Create a system notification about cancelled bookings
      await BrowserDatabaseService.createNotification({
        id: `cancelled_bookings_${Date.now()}`,
        userId: 'system',
        title: 'تم إلغاء حجوزات منتهية الصلاحية',
        message: `تم إلغاء ${count} حجز تلقائياً لانتهاء فترة التأكيد (24 ساعة)`,
        type: 'system',
        isRead: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
    }
  }

  // Manual trigger for testing
  static async runTasksNow() {
    await this.runScheduledTasks();
  }

  // Get status of scheduled tasks
  static getStatus() {
    return {
      isRunning: this.isRunning,
      hasInterval: this.intervalId !== null
    };
  }
}

// Auto-start scheduled tasks when the module is imported
if (typeof window !== 'undefined') {
  // Only start in browser environment
  ScheduledTasksService.startScheduledTasks();
}

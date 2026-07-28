import { NotificationService, NotificationType, NotificationPriority, NotificationCategory, NotificationData } from './notificationService';

// Notification delivery status tracking
export enum DeliveryStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled', 
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  RETRYING = 'retrying',
  EXPIRED = 'expired'
}

// Notification queue item interface
export interface NotificationQueueItem {
  id: string;
  notification: NotificationData;
  scheduledFor: Date;
  priority: NotificationPriority;
  attempts: number;
  maxAttempts: number;
  status: DeliveryStatus;
  createdAt: Date;
  lastAttemptAt?: Date;
  deliveredAt?: Date;
  errorMessage?: string;
}

// Advanced notification scheduler with retry mechanism
export class NotificationScheduler {
  private static queue: NotificationQueueItem[] = [];
  private static isProcessing = false;
  private static intervalId: NodeJS.Timeout | null = null;

  // Initialize the scheduler
  static initialize() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    // Process queue every 30 seconds
    this.intervalId = setInterval(() => {
      this.processQueue();
    }, 30000);

  }

  // Stop the scheduler
  static stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Schedule a notification
  static async scheduleNotification(
    notification: NotificationData,
    scheduledFor?: Date,
    maxAttempts: number = 3
  ): Promise<string> {
    try {
      const queueItem: NotificationQueueItem = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        notification,
        scheduledFor: scheduledFor || new Date(),
        priority: notification.priority || NotificationPriority.MEDIUM,
        attempts: 0,
        maxAttempts,
        status: scheduledFor && scheduledFor > new Date() ? DeliveryStatus.SCHEDULED : DeliveryStatus.PENDING,
        createdAt: new Date()
      };

      this.queue.push(queueItem);
      this.sortQueue();


      // If immediate delivery, try to process now
      if (!scheduledFor || scheduledFor <= new Date()) {
        this.processQueue();
      }

      return queueItem.id;
    } catch (error) {
      throw error;
    }
  }

  // Schedule multiple notifications
  static async scheduleBulkNotifications(
    notifications: { notification: NotificationData; scheduledFor?: Date }[],
    maxAttempts: number = 3
  ): Promise<string[]> {
    try {
      const ids = [];
      
      for (const item of notifications) {
        const id = await this.scheduleNotification(item.notification, item.scheduledFor, maxAttempts);
        ids.push(id);
      }

      return ids;
    } catch (error) {
      throw error;
    }
  }

  // Process the notification queue
  static async processQueue() {
    if (this.isProcessing) return;

    this.isProcessing = true;

    try {
      const now = new Date();
      const itemsToProcess = this.queue.filter(item => 
        (item.status === DeliveryStatus.PENDING || item.status === DeliveryStatus.SCHEDULED) &&
        item.scheduledFor <= now &&
        item.attempts < item.maxAttempts
      );

      if (itemsToProcess.length === 0) {
        this.isProcessing = false;
        return;
      }


      // Sort by priority (higher priority first)
      itemsToProcess.sort((a, b) => {
        const priorityOrder = {
          [NotificationPriority.CRITICAL]: 5,
          [NotificationPriority.URGENT]: 4,
          [NotificationPriority.HIGH]: 3,
          [NotificationPriority.MEDIUM]: 2,
          [NotificationPriority.LOW]: 1
        };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      // Process items sequentially to avoid overwhelming the system
      for (const item of itemsToProcess) {
        await this.processNotificationItem(item);
        
        // Small delay between notifications to prevent spam
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Clean up old expired items
      this.cleanupExpiredItems();

    } catch (error) {
    } finally {
      this.isProcessing = false;
    }
  }

  // Process individual notification item
  static async processNotificationItem(item: NotificationQueueItem) {
    try {
      item.attempts++;
      item.lastAttemptAt = new Date();
      item.status = DeliveryStatus.RETRYING;

      // Try to send the notification
      const result = await NotificationService.sendSmartNotification(item.notification);

      if (result) {
        item.status = DeliveryStatus.SENT;
        item.deliveredAt = new Date();
      } else {
        throw new Error('Failed to send notification');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      item.errorMessage = errorMessage;

      if (item.attempts >= item.maxAttempts) {
        item.status = DeliveryStatus.FAILED;
        
        // Log failure for admin attention
        await this.logFailedNotification(item);
      } else {
        item.status = DeliveryStatus.PENDING;
        // Exponential backoff: wait 2^attempts minutes before retry
        const delayMinutes = Math.pow(2, item.attempts);
        item.scheduledFor = new Date(Date.now() + delayMinutes * 60 * 1000);
        
      }
    }
  }

  // Sort queue by priority and scheduled time
  static sortQueue() {
    this.queue.sort((a, b) => {
      // First by priority
      const priorityOrder = {
        [NotificationPriority.CRITICAL]: 5,
        [NotificationPriority.URGENT]: 4,
        [NotificationPriority.HIGH]: 3,
        [NotificationPriority.MEDIUM]: 2,
        [NotificationPriority.LOW]: 1
      };
      
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by scheduled time
      return a.scheduledFor.getTime() - b.scheduledFor.getTime();
    });
  }

  // Clean up expired and completed items
  static cleanupExpiredItems() {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const initialLength = this.queue.length;
    
    this.queue = this.queue.filter(item => {
      // Keep items that are not completed and not too old
      const isCompleted = item.status === DeliveryStatus.SENT || item.status === DeliveryStatus.DELIVERED;
      const isOld = item.createdAt < oneDayAgo;
      const isExpired = item.status === DeliveryStatus.FAILED && item.createdAt < oneDayAgo;
      
      return !isExpired && (!isCompleted || !isOld);
    });
    
    const removedCount = initialLength - this.queue.length;
    if (removedCount > 0) {
    }
  }

  // Log failed notification for admin review
  static async logFailedNotification(item: NotificationQueueItem) {
    try {
      const adminUsers = await NotificationService.getAdminUsers();
      
      for (const admin of adminUsers) {
        await NotificationService.sendSmartNotification({
          userId: admin.id,
          title: '⚠️ فشل في إرسال إشعار',
          message: `فشل في إرسال إشعار للمستخدم ${item.notification.userId}. العنوان: "${item.notification.title}". المحاولات: ${item.attempts}/${item.maxAttempts}`,
          type: NotificationType.SYSTEM_ALERT,
          category: NotificationCategory.SYSTEM,
          priority: NotificationPriority.HIGH,
          metadata: {
            failedNotificationId: item.id,
            originalUserId: item.notification.userId,
            errorMessage: item.errorMessage,
            attempts: item.attempts
          }
        });
      }
    } catch (error) {
    }
  }

  // Get queue statistics
  static getQueueStats() {
    const stats = {
      total: this.queue.length,
      pending: 0,
      scheduled: 0,
      sent: 0,
      failed: 0,
      retrying: 0,
      byPriority: {
        [NotificationPriority.CRITICAL]: 0,
        [NotificationPriority.URGENT]: 0,
        [NotificationPriority.HIGH]: 0,
        [NotificationPriority.MEDIUM]: 0,
        [NotificationPriority.LOW]: 0
      }
    };

    for (const item of this.queue) {
      switch (item.status) {
        case DeliveryStatus.PENDING:
          stats.pending++;
          break;
        case DeliveryStatus.SCHEDULED:
          stats.scheduled++;
          break;
        case DeliveryStatus.SENT:
        case DeliveryStatus.DELIVERED:
          stats.sent++;
          break;
        case DeliveryStatus.FAILED:
          stats.failed++;
          break;
        case DeliveryStatus.RETRYING:
          stats.retrying++;
          break;
      }

      stats.byPriority[item.priority]++;
    }

    return stats;
  }

  // Cancel scheduled notification
  static cancelNotification(notificationId: string): boolean {
    const index = this.queue.findIndex(item => item.id === notificationId);
    
    if (index !== -1) {
      const item = this.queue[index];
      if (item.status === DeliveryStatus.PENDING || item.status === DeliveryStatus.SCHEDULED) {
        this.queue.splice(index, 1);
        return true;
      }
    }
    
    return false;
  }

  // Get notification status
  static getNotificationStatus(notificationId: string): NotificationQueueItem | null {
    return this.queue.find(item => item.id === notificationId) || null;
  }

  // Schedule recurring notifications
  static async scheduleRecurringNotification(
    notification: NotificationData,
    pattern: {
      type: 'daily' | 'weekly' | 'monthly';
      interval: number; // Every X days/weeks/months
      startDate: Date;
      endDate?: Date;
      maxOccurrences?: number;
    }
  ): Promise<string[]> {
    try {
      const scheduledIds: string[] = [];
      let currentDate = new Date(pattern.startDate);
      let occurrenceCount = 0;

      while (
        (!pattern.endDate || currentDate <= pattern.endDate) &&
        (!pattern.maxOccurrences || occurrenceCount < pattern.maxOccurrences)
      ) {
        const id = await this.scheduleNotification(notification, new Date(currentDate));
        scheduledIds.push(id);
        
        // Calculate next occurrence
        switch (pattern.type) {
          case 'daily':
            currentDate.setDate(currentDate.getDate() + pattern.interval);
            break;
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + (pattern.interval * 7));
            break;
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + pattern.interval);
            break;
        }
        
        occurrenceCount++;
      }

      return scheduledIds;
    } catch (error) {
      throw error;
    }
  }
}

// Auto-initialize when imported
if (typeof window !== 'undefined') {
  // Only initialize in browser environment
  NotificationScheduler.initialize();
}

import { BrowserDatabaseService } from './browserServices';
import { getDisplayName } from '@/utils/displayName';
import { TelegramService } from '@/integrations/telegram/telegramService';
import { wilayas } from '@/data/wilayas';
import { generateReceiptPdfBase64 } from '@/utils/pdfGenerator';
import { encodeId } from '@/utils/crypto';

// Comprehensive notification types
export enum NotificationType {
  // Booking-related notifications
  BOOKING_CREATED = 'booking_created',
  BOOKING_CONFIRMED = 'booking_confirmed',
  BOOKING_CANCELLED = 'booking_cancelled',
  BOOKING_PENDING = 'booking_pending',
  BOOKING_REJECTED = 'booking_rejected',
  BOOKING_MODIFIED = 'booking_modified',
  BOOKING_REMINDER = 'booking_reminder',
  BOOKING_COMPLETED = 'booking_completed',
  
  // Trip-related notifications
  TRIP_CREATED = 'trip_created',
  TRIP_UPDATED = 'trip_updated',
  TRIP_CANCELLED = 'trip_cancelled',
  TRIP_FULL = 'trip_full',
  TRIP_STARTING = 'trip_starting',
  TRIP_COMPLETED = 'trip_completed',
  TRIP_DELAYED = 'trip_delayed',
  
  // Payment notifications
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_PENDING = 'payment_pending',
  PAYMENT_FAILED = 'payment_failed',
  PAYMENT_REFUNDED = 'payment_refunded',
  
  // Rating and review notifications
  RATING_RECEIVED = 'rating_received',
  RATING_REQUEST = 'rating_request',
  REVIEW_RECEIVED = 'review_received',
  
  // User account notifications
  ACCOUNT_VERIFIED = 'account_verified',
  ACCOUNT_SUSPENDED = 'account_suspended',
  PROFILE_UPDATED = 'profile_updated',
  PASSWORD_CHANGED = 'password_changed',
  USER_REGISTRATION = 'user_registration',
  
  // Driver-specific notifications
  DRIVER_APPROVED = 'driver_approved',
  DRIVER_REJECTED = 'driver_rejected',
  DOCUMENT_REQUIRED = 'document_required',
  VEHICLE_APPROVED = 'vehicle_approved',
  LICENSE_EXPIRING = 'license_expiring',
  
  // System notifications
  SYSTEM_ALERT = 'system_alert',
  SYSTEM_MAINTENANCE = 'system_maintenance',
  WELCOME = 'welcome',
  SECURITY_ALERT = 'security_alert',
  UPDATE_AVAILABLE = 'update_available',
  
  // Communication notifications
  MESSAGE_RECEIVED = 'message_received',
  CALL_MISSED = 'call_missed',
  EMERGENCY_ALERT = 'emergency_alert'
}

// Enhanced notification priority levels
export enum NotificationPriority {
  LOW = 'low',        // General updates, non-time-sensitive
  MEDIUM = 'medium',  // Important but not urgent
  HIGH = 'high',      // Time-sensitive, requires attention
  URGENT = 'urgent',  // Critical, requires immediate action
  CRITICAL = 'critical' // Emergency situations
}

// Notification delivery status
export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  EXPIRED = 'expired'
}

// Notification categories for better organization
export enum NotificationCategory {
  BOOKING = 'booking',
  TRIP = 'trip', 
  PAYMENT = 'payment',
  ACCOUNT = 'account',
  USER = 'user',
  SYSTEM = 'system',
  COMMUNICATION = 'communication',
  SAFETY = 'safety'
}

// Enhanced notification data interface
export interface NotificationData {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  priority?: NotificationPriority;
  status?: NotificationStatus;
  relatedId?: string;
  relatedType?: string;
  actionUrl?: string;
  imageUrl?: string;
  scheduledFor?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

// Enhanced notification service with smart routing
export class NotificationService {
  private static resolveProfileName(profile: any, fallback: string = 'عضو') {
    return getDisplayName(profile, { fallback });
  }

  // Helper function to get wilaya name by ID
  private static getWilayaNameById(id: number | string): string {
    if (!id) return 'غير محدد';
    
    const code = String(id).padStart(2, '0');
    const wilaya = wilayas.find((w) => w.code === code);
    return wilaya ? wilaya.name : 'غير محدد';
  }

  private static isNotificationsTableMissing(error: any) {
    if (!error) return false;
    const code = typeof error.code === 'string' ? error.code : undefined;
    const message = typeof error.message === 'string' ? error.message.toLowerCase() : '';
    const details = typeof error.details === 'string' ? error.details.toLowerCase() : '';
    const combined = `${message} ${details}`;
    return code === '42P01' || combined.includes('relation "notifications" does not exist');
  }

  private static handleMissingNotificationsTable(error: any) {
    if (!this.isNotificationsTableMissing(error)) {
      throw error;
    }
    return null;
  }

  // Create notification with enhanced features
  static async createNotification(data: NotificationData) {
    try {
      // Remove attachments before saving to DB to avoid huge payloads
      const dbMetadata = data.metadata ? { ...data.metadata } : undefined;
      if (dbMetadata && dbMetadata.attachments) {
        delete dbMetadata.attachments;
      }

      const notification = await BrowserDatabaseService.createNotification({
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: this.mapNotificationTypeToDatabase(data.type),
        category: data.category,
        priority: data.priority,
        status: data.status || 'active',
        relatedId: data.relatedId,
        relatedType: data.relatedType,
        actionUrl: data.actionUrl,
        imageUrl: data.imageUrl,
        scheduledFor: data.scheduledFor ? data.scheduledFor.toISOString() : undefined,
        expiresAt: data.expiresAt ? data.expiresAt.toISOString() : undefined,
        metadata: dbMetadata
      });

      // Check if this is an RLS violation result
      if (notification && typeof notification === 'object' && 'rls_violation' in notification) {
        // For RLS violations, we'll return null instead of throwing an error
        // This allows the application to continue functioning even if some notifications fail
        return null;
      }

      // Enhanced logging with category and priority
      // Send email notification if user has email
      // Skip email for admin users on booking/confirmation notifications (only in-app notifications)
      // But always send email if requireEmail flag is set (for security notifications)
      try {
        const user = await BrowserDatabaseService.getProfile(data.userId);
        const isAdmin = user && (user.role === 'admin' || user.role === 'developer');
        const isBookingNotification = data.type === NotificationType.BOOKING_CREATED || 
                                     data.type === NotificationType.BOOKING_CONFIRMED;
        const skipEmail = data.metadata?.skipEmail === true;
        const requireEmail = data.metadata?.requireEmail === true;
        
        // Always send email if requireEmail flag is set (for security notifications like password change)
        if (requireEmail) {
          await this.sendEmailNotification(data);
        } else if (data.type === NotificationType.BOOKING_CREATED) {
          // EXPLICITLY skip email for BOOKING_CREATED (only send for BOOKING_CONFIRMED)
        } else if (!(isAdmin && isBookingNotification) && !skipEmail) {
          // Don't send email to admin for booking/confirmation notifications or if skipEmail flag is set
          await this.sendEmailNotification(data);
        }
      } catch (emailError) {
        // Don't fail the notification creation if email fails
      }

      // Track notification metrics
      this.trackNotificationMetrics(data);

      return notification;
    } catch (error: any) {
      if (this.isNotificationsTableMissing(error)) {
        return this.handleMissingNotificationsTable(error);
      }
      // Provide more descriptive error messages
      let errorMessage = 'حدث خطأ أثناء إنشاء الإشعار';
      if (error.message) {
        errorMessage = error.message;
      }
      if (error.details) {
        errorMessage += `: ${error.details}`;
      }
      
      throw new Error(errorMessage);
    }
  }

  // Smart notification routing based on user role and preferences
  static async sendSmartNotification(data: NotificationData) {
    try {
      // Get user profile with retry logic (since profile might not be ready yet)
      let user = await BrowserDatabaseService.getProfile(data.userId);
      if (!user) {
        // Try once more after a short delay
        await new Promise(resolve => setTimeout(resolve, 500));
        user = await BrowserDatabaseService.getProfile(data.userId);
      }
      
      if (!user) {
        // Don't throw error - return null to allow graceful handling
        // The caller (notifyWelcomeUser) will handle this appropriately
        return null;
      }
      // Apply role-based notification rules
      const shouldSend = await this.shouldSendNotification(user, data);
      if (!shouldSend) {
        return null;
      }

      // Enhanced notification with role-specific customization
      const customizedData = await this.customizeNotificationForRole(user, data);
      const result = await this.createNotification(customizedData);
      // Handle RLS violations gracefully
      if (result === null) {
        return null;
      }
      
      if (result && typeof result === 'object' && 'rls_violation' in result) {
        return null;
      }
      return result;
    } catch (error: any) {
      if (this.isNotificationsTableMissing(error)) {
        return this.handleMissingNotificationsTable(error);
      }
      // Don't throw error - return null to allow graceful handling
      // The caller (notifyWelcomeUser) will handle this appropriately
      return null;
    }
  }

  // Check if notification should be sent based on user preferences
  static async shouldSendNotification(user: any, data: NotificationData): Promise<boolean> {
    // Check user notification preferences (would be stored in database)
    // For now, return true for all notifications
    // TODO: Implement user notification preferences
    return true;
  }

  // Customize notification content based on user role
  static async customizeNotificationForRole(user: any, data: NotificationData): Promise<NotificationData> {
    const customized = { ...data };
    
    // Role-specific customization
    switch (user.role) {
      case 'driver':
        if (data.type === NotificationType.BOOKING_CREATED) {
          customized.priority = NotificationPriority.HIGH;
          customized.actionUrl = `/driver/dashboard?tab=bookings&booking=${data.relatedId}`;
        }
        break;
      case 'passenger':
        if (data.type === NotificationType.BOOKING_CONFIRMED) {
          customized.priority = NotificationPriority.MEDIUM;
          customized.actionUrl = `/passenger/dashboard?tab=bookings&booking=${data.relatedId}`;
        }
        break;
      case 'admin':
        customized.actionUrl = `/admin?tab=${data.category}&id=${data.relatedId}`;
        break;
    }
    
    return customized;
  }

  // Map notification types to database compatible types
  static mapNotificationTypeToDatabase(type: NotificationType): 'booking' | 'trip' | 'system' | 'payment' | 'info' | 'success' | 'warning' | 'error' {
    const typeMap: Record<NotificationType, 'booking' | 'trip' | 'system' | 'payment' | 'info' | 'success' | 'warning' | 'error'> = {
      [NotificationType.BOOKING_CREATED]: 'booking',
      [NotificationType.BOOKING_CONFIRMED]: 'booking',
      [NotificationType.BOOKING_CANCELLED]: 'booking',
      [NotificationType.BOOKING_PENDING]: 'booking',
      [NotificationType.BOOKING_REJECTED]: 'booking',
      [NotificationType.BOOKING_MODIFIED]: 'booking',
      [NotificationType.BOOKING_REMINDER]: 'booking',
      [NotificationType.BOOKING_COMPLETED]: 'booking',
      [NotificationType.TRIP_CREATED]: 'trip',
      [NotificationType.TRIP_UPDATED]: 'trip',
      [NotificationType.TRIP_CANCELLED]: 'trip',
      [NotificationType.TRIP_FULL]: 'trip',
      [NotificationType.TRIP_STARTING]: 'trip',
      [NotificationType.TRIP_COMPLETED]: 'trip',
      [NotificationType.TRIP_DELAYED]: 'trip',
      [NotificationType.PAYMENT_RECEIVED]: 'payment',
      [NotificationType.PAYMENT_PENDING]: 'payment',
      [NotificationType.PAYMENT_FAILED]: 'payment',
      [NotificationType.PAYMENT_REFUNDED]: 'payment',
      [NotificationType.RATING_RECEIVED]: 'system',
      [NotificationType.RATING_REQUEST]: 'system',
      [NotificationType.REVIEW_RECEIVED]: 'system',
      [NotificationType.ACCOUNT_VERIFIED]: 'system',
      [NotificationType.ACCOUNT_SUSPENDED]: 'system',
      [NotificationType.PROFILE_UPDATED]: 'system',
      [NotificationType.PASSWORD_CHANGED]: 'system',
      [NotificationType.USER_REGISTRATION]: 'system',
      [NotificationType.DRIVER_APPROVED]: 'system',
      [NotificationType.DRIVER_REJECTED]: 'system',
      [NotificationType.DOCUMENT_REQUIRED]: 'system',
      [NotificationType.VEHICLE_APPROVED]: 'system',
      [NotificationType.LICENSE_EXPIRING]: 'system',
      [NotificationType.SYSTEM_ALERT]: 'system',
      [NotificationType.SYSTEM_MAINTENANCE]: 'system',
      [NotificationType.WELCOME]: 'system',
      [NotificationType.SECURITY_ALERT]: 'system',
      [NotificationType.UPDATE_AVAILABLE]: 'system',
      [NotificationType.MESSAGE_RECEIVED]: 'system',
      [NotificationType.CALL_MISSED]: 'system',
      [NotificationType.EMERGENCY_ALERT]: 'system'
    };
    
    // Ensure we always return a valid type that matches database constraints
    const mappedType = typeMap[type];
    if (mappedType === undefined) {
      return 'info';
    }
    
    return mappedType;
  }

  // Track notification metrics for analytics
  static trackNotificationMetrics(data: NotificationData) {
    try {
      // Log metrics for analytics
    } catch (error) {
    }
  }

  // === CORE NOTIFICATION METHODS ===
  
  // Get user notifications with filtering
  static async getUserNotifications(userId: string, filters?: {
    type?: NotificationType;
    category?: NotificationCategory;
    isRead?: boolean;
    limit?: number;
  }) {
    try {
      let notifications = await BrowserDatabaseService.getNotifications(userId);
      
      // Apply filters
      if (filters) {
        if (filters.type) {
          const dbType = this.mapNotificationTypeToDatabase(filters.type);
          notifications = notifications.filter(n => n.type === dbType);
        }
        if (filters.isRead !== undefined) {
          notifications = notifications.filter(n => n.isRead === filters.isRead);
        }
        if (filters.limit) {
          notifications = notifications.slice(0, filters.limit);
        }
      }
      
      return notifications;
    } catch (error) {
      return [];
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId: string) {
    try {
      const result = await BrowserDatabaseService.markNotificationAsRead(notificationId);
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Get notification statistics with enhanced metrics
  static async getNotificationStats(userId: string) {
    try {
      const notifications = await this.getUserNotifications(userId);
      
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const unreadCount = notifications.filter(n => !n.isRead).length;
      const recentCount = notifications.filter(n => {
        const notificationDate = new Date(n.createdAt);
        return notificationDate > oneDayAgo;
      }).length;
      
      const weeklyCount = notifications.filter(n => {
        const notificationDate = new Date(n.createdAt);
        return notificationDate > oneWeekAgo;
      }).length;
      
      return {
        total: notifications.length,
        unread: unreadCount,
        recent: recentCount,
        weekly: weeklyCount
      };
    } catch (error) {
      return { 
        total: 0, 
        unread: 0, 
        recent: 0, 
        weekly: 0
      };
    }
  }

  // Bulk notification sender for admin broadcasts
  static async sendBulkNotification(data: {
    userIds: string[];
    title: string;
    message: string;
    type: NotificationType;
    category: NotificationCategory;
    priority?: NotificationPriority;
    metadata?: Record<string, any>;
  }) {
    try {
      const notifications = [];
      
      for (const userId of data.userIds) {
        const notification = await this.sendSmartNotification({
          userId,
          title: data.title,
          message: data.message,
          type: data.type,
          category: data.category,
          priority: data.priority || NotificationPriority.MEDIUM,
          metadata: data.metadata
        });
        notifications.push(notification);
      }
      return notifications;
    } catch (error) {
      throw error;
    }
  }

  // === BOOKING NOTIFICATIONS ===
  
  // Enhanced booking creation notification - Improved reliability
  static async notifyBookingCreated(bookingData: {
    bookingId: number | string;
    passengerId: string;
    driverId: string;
    tripId: string;
    pickupLocation: string;
    destinationLocation: string;
    seatsBooked: number;
    totalAmount: number;
    paymentMethod: string;
  }) {
    try {
      const [trip, passenger, driver, adminProfiles] = await Promise.all([
        bookingData.tripId ? this.getTripById(bookingData.tripId) : Promise.resolve(null),
        BrowserDatabaseService.getProfile(bookingData.passengerId),
        BrowserDatabaseService.getProfile(bookingData.driverId),
        this.getAdminUsers()
      ]);
      // Check for required data - trip is optional if tripId is not provided
      if (!passenger) {
        throw new Error(`الراكب غير موجود: ${bookingData.passengerId}`);
      }
      
      if (!driver) {
        throw new Error(`السائق غير موجود: ${bookingData.driverId}`);
      }

      // Trip is optional - use booking data if trip not found
      if (!trip && bookingData.tripId) {
      }

      const notifications = [];
      const passengerName = this.resolveProfileName(passenger);
      const driverName = this.resolveProfileName(driver);

      // 1. Notify driver - High priority
      try {
        const driverNotification = await this.sendSmartNotification({
          userId: bookingData.driverId,
          title: '🎉 حجز جديد!',
          message: `تم حجز ${bookingData.seatsBooked} مقعد في رحلتك من ${bookingData.pickupLocation} إلى ${bookingData.destinationLocation}. الراكب: ${passengerName} - المبلغ: ${bookingData.totalAmount} دج`,
          type: NotificationType.BOOKING_CREATED,
          category: NotificationCategory.BOOKING,
          priority: NotificationPriority.HIGH,
          relatedId: bookingData.bookingId.toString(),
          relatedType: 'booking',
          metadata: {
            passengerId: bookingData.passengerId,
            passengerName,
            passengerPhone: passenger.phone,
            seatsBooked: bookingData.seatsBooked,
            totalAmount: bookingData.totalAmount,
            audience: 'driver',
            skipEmail: true
          }
        });
        if (driverNotification) {
          notifications.push(driverNotification);
        } else {
        }
      } catch (driverError) {
      }

      // 3. Notify admins - System monitoring
      if (adminProfiles.length > 0) {
        for (const admin of adminProfiles) {
          // Prevent duplicate notification if the admin is testing as driver or passenger
          if (admin.id === bookingData.driverId || admin.id === bookingData.passengerId) {
            continue;
          }
          
          const isDeveloper = admin.role === 'developer';
          const title = isDeveloper ? '🔧 نشاط جديد بين الركاب والسائقين' : '📊 حجز جديد في النظام';
          const message = isDeveloper
            ? `تنبيه مطور: ${passengerName} حجز ${bookingData.seatsBooked} مقعد مع ${driverName} من ${bookingData.pickupLocation} إلى ${bookingData.destinationLocation}. القيمة: ${bookingData.totalAmount} دج.`
            : `حجز جديد: ${passengerName} حجز ${bookingData.seatsBooked} مقعد في رحلة ${driverName} من ${bookingData.pickupLocation} إلى ${bookingData.destinationLocation}. المبلغ: ${bookingData.totalAmount} دج`;
          try {
            const adminNotification = await this.sendSmartNotification({
              userId: admin.id,
              title,
              message,
              type: NotificationType.BOOKING_CREATED,
              category: NotificationCategory.SYSTEM,
              priority: isDeveloper ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
              relatedId: bookingData.bookingId.toString(),
              relatedType: 'booking',
              metadata: {
                bookingId: bookingData.bookingId,
                revenue: bookingData.totalAmount,
                paymentMethod: bookingData.paymentMethod,
                audience: isDeveloper ? 'developer' : 'admin',
                skipEmail: true // Skip email for admin booking notifications
              }
            });
            if (adminNotification) {
              notifications.push(adminNotification);
            } else {
            }
          } catch (adminNotificationError) {
            // Continue with other admins even if one fails
          }
        }
      } else {
      }

      try {
        const { TelegramService } = await import('@/integrations/telegram/telegramService');
        await TelegramService.notifyNewBooking({
          bookingId: bookingData.bookingId,
          passengerName: passengerName,
          fromWilaya: bookingData.pickupLocation,
          toWilaya: bookingData.destinationLocation,
          amount: bookingData.totalAmount,
          paymentMethod: bookingData.paymentMethod,
          receiptUrl: (bookingData as any).receiptUrl
        });
      } catch (telegramErr) {
        console.error('Error sending telegram booking notification:', telegramErr);
      }

      // 4. Log admin action (only if admins exist)
      if (adminProfiles.length > 0) {
        try {
          const managementActor = adminProfiles.find(profile => profile.role === 'admin') ?? adminProfiles[0];
          await this.logAdminAction({
            adminId: managementActor.id,
            action: 'booking_created',
            targetType: 'booking',
            targetId: bookingData.bookingId.toString(),
            details: {
              passengerId: bookingData.passengerId,
              driverId: bookingData.driverId,
              tripId: bookingData.tripId,
              amount: bookingData.totalAmount,
              seats: bookingData.seatsBooked,
              passengerName,
              driverName,
              timestamp: new Date().toISOString()
            }
          });
        } catch (logError) {
        }
      }
      return notifications;
    } catch (error: any) {
      // Provide more descriptive error messages
      let errorMessage = 'حدث خطأ أثناء إرسال إشعارات الحجز';
      if (error.message) {
        errorMessage = error.message;
      }
      if (error.details) {
        errorMessage += `: ${error.details}`;
      }
      
      // Even if notifications fail, don't prevent the booking from being created
      return [];
    }
  }

  // Booking confirmation by driver - Improved reliability
  static async notifyBookingConfirmed(bookingId: number | string, driverId: string) {
    try {
      const [booking, driver] = await Promise.all([
        this.getBookingById(bookingId),
        BrowserDatabaseService.getProfile(driverId)
      ]);

      if (!booking) {
        throw new Error(`Booking not found: ${bookingId}`);
      }
      
      const trip = await BrowserDatabaseService.getTripById(booking.tripId);
      
      if (!driver) {
        throw new Error(`Driver not found: ${driverId}`);
      }

      const notifications = [];
      const driverName = this.resolveProfileName(driver);
      const [passenger, adminProfiles] = await Promise.all([
        booking.passengerId ? BrowserDatabaseService.getProfile(booking.passengerId) : Promise.resolve(null),
        this.getAdminUsers()
      ]);
      const passengerName = this.resolveProfileName(passenger);

      // CRITICAL: Notify passenger with email - This is the main requirement
      // We MUST send email to passenger when booking is confirmed
      if (!passenger) {
      } else if (!passenger.email) {
      } else {
        // Generate PDF receipt attachment file
        let pdfAttachment: any[] | undefined = undefined;
        try {
          let tripTypeTranslated = 'ذهاب فقط';
          if (booking.tripType === 'round_trip' || booking.tripType === 'return' || booking.tripType === 'ذهاب وإياب') {
            tripTypeTranslated = 'ذهاب وإياب';
          }

          const pdfBase64 = await generateReceiptPdfBase64({
            receiptCode: `ABR-${bookingId}`,
            bookingId: bookingId,
            passengerName: passengerName,
            driverName: driverName,
            driverPhone: driver.phone,
            fromLocation: booking.pickupLocation || trip?.fromWilayaName || 'غير محدد',
            toLocation: booking.destinationLocation || trip?.toWilayaName || 'غير محدد',
            departureDate: `${trip?.departureDate || ''} ${booking.pickupTime || trip?.departureTime || ''}`.trim(),
            seatsBooked: booking.seatsBooked || 1,
            totalAmount: booking.totalAmount || 0,
            tripType: tripTypeTranslated,
            paymentMethod: booking.paymentMethod === 'bpm' ? 'BaridiMob' : 'Cash on Delivery'
          });

          if (pdfBase64) {
            pdfAttachment = [{
              filename: `RECU_ABR-${bookingId}.pdf`,
              content: pdfBase64,
              contentType: 'application/pdf'
            }];
          }
        } catch (pdfErr) {
          console.warn('PDF generation error:', pdfErr);
        }

        // Prepare notification data
        const passengerNotificationData: NotificationData = {
          userId: booking.passengerId!,
          title: '🚗 تم قبول حجزك! وصل الحجز (RECU) مرفق كملف PDF',
          message: `مرحباً ${passengerName}،\n\nتم قبول حجزك بنجاح من طرف السائق ${driverName}. تجدون مرفقاً بهذا البريد الإلكتروني ملف وصل الحجز الرسمي (RECU_ABR-${bookingId}.pdf) بصيغة PDF بالمعلومات وتفاصيل السائق. يمكنك التواصل مع السائق على الهاتـف: ${driver.phone}.`,
          type: NotificationType.BOOKING_CONFIRMED,
          category: NotificationCategory.BOOKING,
          priority: NotificationPriority.HIGH,
          relatedId: bookingId.toString(),
          relatedType: 'booking',
          metadata: {
            driverName,
            driverPhone: driver.phone,
            status: 'confirmed',
            bookingId: bookingId.toString(),
            receiptUrl: `https://abride.online/verify-receipt?code=${encodeId('ABR-'+bookingId)}&id=${encodeId(bookingId)}`,
            attachments: pdfAttachment
          }
        };
        
        // Send in-app notification (which will automatically send email via createNotification)
        // NOTE: We DON'T call sendEmailNotification directly here to avoid duplicate emails
        // sendSmartNotification -> createNotification -> sendEmailNotification (automatic)
        try {
          const passengerNotification = await this.sendSmartNotification(passengerNotificationData);
          
          if (passengerNotification) {
            notifications.push(passengerNotification);
          } else {
            // Fallback: Try to send email directly if sendSmartNotification failed
            // This ensures passenger receives email even if in-app notification fails
            try {
              const emailResult = await this.sendEmailNotification(passengerNotificationData);
              if (emailResult && (emailResult.success !== false)) {
              } else {
              }
            } catch (emailError) {
            }
          }
        } catch (notificationError) {
          // Fallback: Try to send email directly if sendSmartNotification failed
          try {
            const emailResult = await this.sendEmailNotification(passengerNotificationData);
            if (emailResult && (emailResult.success !== false)) {
            } else {
            }
          } catch (emailError) {
          }
        }
      }

      // Notify driver confirmation success
      try {
        const driverNotification = await this.sendSmartNotification({
          userId: driverId,
          title: '✅ تم تأكيد الحجز',
          message: `تم تأكيد حجز #${bookingId}. تأكد من التواصل مع الراكب لتنسيق تفاصيل الرحلة.`,
          type: NotificationType.BOOKING_CONFIRMED,
          category: NotificationCategory.BOOKING,
          priority: NotificationPriority.MEDIUM,
          relatedId: bookingId.toString(),
          relatedType: 'booking',
          metadata: {
            bookingStatus: 'confirmed',
            passengerId: booking.passengerId,
            passengerName,
            passengerPhone: passenger?.phone,
            departureTime: booking.pickupTime,
            skipEmail: true
          }
        });
        if (driverNotification) {
          notifications.push(driverNotification);
        }
      } catch (driverError) {
      }

      // Notify admins and developers
      for (const admin of adminProfiles) {
        const isDeveloper = admin.role === 'developer';
        try {
          const adminNotification = await this.sendSmartNotification({
            userId: admin.id,
            title: isDeveloper ? '🔧 تأكيد حجز - متابعة تقنية' : '✅ تم تأكيد حجز',
            message: isDeveloper
              ? `تحديث مطور: ${driverName} أكد الحجز #${bookingId} للراكب ${passengerName}.`
              : `السائق ${driverName} أكد حجز #${bookingId}`,
            type: NotificationType.BOOKING_CONFIRMED,
            category: NotificationCategory.SYSTEM,
            priority: isDeveloper ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
            relatedId: bookingId.toString(),
            relatedType: 'booking',
            metadata: {
              audience: isDeveloper ? 'developer' : 'admin',
              passengerName,
              driverName,
              skipEmail: true // Skip email for admin confirmation notifications
            }
          });
          if (adminNotification) {
            notifications.push(adminNotification);
          }
        } catch (adminError) {
        }
      }
      return notifications;
    } catch (error) {
      // Even if notifications fail, don't prevent the confirmation from proceeding
      return [];
    }
  }

  // Booking cancellation notification - Improved reliability
  static async notifyBookingCancelled(bookingId: number | string, cancelledBy: string, reason?: string) {
    try {
      const [booking, cancelledByUser] = await Promise.all([
        this.getBookingById(bookingId),
        BrowserDatabaseService.getProfile(cancelledBy)
      ]);

      if (!booking || !cancelledByUser) {
        throw new Error('Booking or user not found');
      }

      const notifications = [];
      const reasonText = reason ? ` السبب: ${reason}` : '';
      const cancelledByName = this.resolveProfileName(cancelledByUser);
      const [passengerProfile, driverProfile, adminProfiles] = await Promise.all([
        booking.passengerId ? BrowserDatabaseService.getProfile(booking.passengerId) : Promise.resolve(null),
        booking.driverId ? BrowserDatabaseService.getProfile(booking.driverId) : Promise.resolve(null),
        this.getAdminUsers()
      ]);
      const passengerName = this.resolveProfileName(passengerProfile);
      const driverName = this.resolveProfileName(driverProfile);

      // Notify passenger (if not the one who cancelled)
      if (booking.passengerId && booking.passengerId !== cancelledBy) {
        try {
          const passengerNotification = await this.sendSmartNotification({
            userId: booking.passengerId,
            title: '❌ تم إلغاء الحجز',
            message: `تم إلغاء حجزك #${bookingId}.${reasonText} سيتم رد المبلغ خلال 3-5 أيام عمل.`,
            type: NotificationType.BOOKING_CANCELLED,
            category: NotificationCategory.BOOKING,
            priority: NotificationPriority.HIGH,
            relatedId: bookingId.toString(),
            relatedType: 'booking',
            metadata: {
              cancelledBy: cancelledByName,
              reason: reason,
              refundStatus: 'pending',
              driverName,
              audience: 'passenger'
            }
          });
          if (passengerNotification) {
            notifications.push(passengerNotification);
          }
        } catch (passengerError) {
        }
      }

      // Notify driver (if not the one who cancelled)
      if (booking.driverId && booking.driverId !== cancelledBy) {
        try {
          const driverNotification = await this.sendSmartNotification({
            userId: booking.driverId,
            title: '❌ تم إلغاء حجز',
            message: `تم إلغاء حجز #${bookingId}.${reasonText} المقاعد متاحة الآن للحجز مرة أخرى.`,
            type: NotificationType.BOOKING_CANCELLED,
            category: NotificationCategory.BOOKING,
            priority: NotificationPriority.MEDIUM,
            relatedId: bookingId.toString(),
            relatedType: 'booking',
            metadata: {
              cancelledBy: cancelledByName,
              reason: reason,
              passengerName,
              audience: 'driver'
            }
          });
          if (driverNotification) {
            notifications.push(driverNotification);
          }
        } catch (driverError) {
        }
      }

      // Notify admins
      for (const admin of adminProfiles) {
        const isDeveloper = admin.role === 'developer';
        try {
          const adminNotification = await this.sendSmartNotification({
            userId: admin.id,
            title: isDeveloper ? '🔧 إلغاء حجز - متابعة تقنية' : '❌ تم إلغاء حجز',
            message: isDeveloper
              ? `تنبيه مطور: ${cancelledByName} ألغى الحجز #${bookingId} بين ${passengerName} و${driverName}.${reasonText}`
              : `تم إلغاء حجز #${bookingId} من قبل ${cancelledByName}.${reasonText}`,
            type: NotificationType.BOOKING_CANCELLED,
            category: NotificationCategory.SYSTEM,
            priority: isDeveloper ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
            relatedId: bookingId.toString(),
            relatedType: 'booking',
            metadata: {
              cancelledBy: cancelledBy,
              reason: reason,
              refundRequired: true,
              passengerName,
              driverName,
              audience: isDeveloper ? 'developer' : 'admin'
            }
          });
          if (adminNotification) {
            notifications.push(adminNotification);
          }
        } catch (adminError) {
        }
      }
      return notifications;
    } catch (error) {
      // Even if notifications fail, don't prevent the cancellation from proceeding
      return [];
    }
  }

  // Booking rejection notification - When driver rejects a booking
  static async notifyBookingRejected(bookingId: number | string, passengerId: string, reason?: string) {
    try {
      const booking = await this.getBookingById(bookingId);

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Get driver from booking
      const driverProfile = booking.driverId ? await BrowserDatabaseService.getProfile(booking.driverId) : null;
      const driverName = this.resolveProfileName(driverProfile);

      const notifications = [];
      const reasonText = reason ? ` السبب: ${reason}` : '';
      
      // Get passenger and admin profiles
      const [passengerProfile, adminProfiles] = await Promise.all([
        passengerId ? BrowserDatabaseService.getProfile(passengerId) : Promise.resolve(null),
        this.getAdminUsers()
      ]);
      const passengerName = this.resolveProfileName(passengerProfile);

      // Notify passenger
      if (passengerId) {
        try {
          const passengerNotification = await this.sendSmartNotification({
            userId: passengerId,
            title: '🚫 تم رفض الحجز',
            message: `نأسف، تم رفض طلب الحجز #${bookingId} من قبل السائق ${driverName}.${reasonText}`,
            type: NotificationType.BOOKING_REJECTED,
            category: NotificationCategory.BOOKING,
            priority: NotificationPriority.HIGH,
            relatedId: bookingId.toString(),
            relatedType: 'booking',
            metadata: {
              driverName,
              reason: reason,
              bookingId: bookingId.toString(),
              audience: 'passenger'
            }
          });
          if (passengerNotification) {
            notifications.push(passengerNotification);
          }
        } catch (passengerError) {
        }
      }

      // Notify admins
      for (const admin of adminProfiles) {
        const isDeveloper = admin.role === 'developer';
        try {
          const adminNotification = await this.sendSmartNotification({
            userId: admin.id,
            title: isDeveloper ? '🔧 رفض حجز - متابعة تقنية' : '🚫 تم رفض حجز',
            message: isDeveloper
              ? `تنبيه مطور: السائق ${driverName} رفض الحجز #${bookingId} للراكب ${passengerName}.${reasonText}`
              : `السائق ${driverName} رفض حجز #${bookingId} للراكب ${passengerName}.${reasonText}`,
            type: NotificationType.BOOKING_REJECTED,
            category: NotificationCategory.SYSTEM,
            priority: isDeveloper ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
            relatedId: bookingId.toString(),
            relatedType: 'booking',
            metadata: {
              driverName,
              passengerName,
              reason: reason,
              audience: isDeveloper ? 'developer' : 'admin'
            }
          });
          if (adminNotification) {
            notifications.push(adminNotification);
          }
        } catch (adminError) {
        }
      }
      return notifications;
    } catch (error) {
      // Even if notifications fail, don't prevent the rejection from proceeding
      return [];
    }
  }

  // Booking reminder notification
  static async notifyBookingReminder(bookingId: number | string, reminderType: 'departure' | 'pickup' = 'departure') {
    try {
      const booking = await this.getBookingById(bookingId);
      if (!booking) throw new Error('Booking not found');

      const [passenger, driver, trip] = await Promise.all([
        BrowserDatabaseService.getProfile(booking.passengerId!),
        BrowserDatabaseService.getProfile(booking.driverId!),
        this.getTripById(booking.tripId!)
      ]);

      if (!passenger || !driver || !trip) {
        throw new Error('Required data not found');
      }

      const notifications = [];
      const passengerName = this.resolveProfileName(passenger);
      const driverName = this.resolveProfileName(driver);
      const reminderMessage = reminderType === 'departure'
        ? `تذكير: رحلتك ستبدأ خلال ساعة واحدة من ${trip.fromWilayaId} إلى ${trip.toWilayaId}`
        : `تذكير: موعد الانطلاق اقترب. تواصل مع السائق ${driverName} على ${driver.phone}`;

      // Notify passenger
      const passengerNotification = await this.sendSmartNotification({
        userId: booking.passengerId!,
        title: '⏰ تذكير برحلتك',
        message: reminderMessage,
        type: NotificationType.BOOKING_REMINDER,
        category: NotificationCategory.BOOKING,
        priority: NotificationPriority.HIGH,
        relatedId: bookingId.toString(),
        relatedType: 'booking',
        metadata: {
          reminderType,
          driverName,
          driverPhone: driver.phone,
          departureTime: trip.departureTime,
          audience: 'passenger'
        }
      });
      notifications.push(passengerNotification);

      // Notify driver
      const driverNotification = await this.sendSmartNotification({
        userId: booking.driverId!,
        title: reminderType === 'pickup' ? '🚗 تذكير بالاستلام' : '⏰ تذكير بالرحلة',
        message: reminderType === 'pickup'
          ? `تذكير: رحلتك ستبدأ قريباً. راكب: ${passengerName} (${passenger.phone})`
          : `تذكير: رحلتك مجدولة لمغادرة ${trip.fromWilayaId} في ${booking.pickupTime}`,
        type: NotificationType.BOOKING_REMINDER,
        category: NotificationCategory.BOOKING,
        priority: reminderType === 'pickup' ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
        relatedId: bookingId.toString(),
        relatedType: 'booking',
        metadata: {
          reminderType,
          passengerName,
          passengerPhone: passenger.phone,
          departureTime: trip.departureTime,
          audience: 'driver'
        }
      });
      notifications.push(driverNotification);

      return notifications;
    } catch (error) {
      throw error;
    }
  }

  // === TRIP NOTIFICATIONS ===
  
  // New trip creation notification
  static async notifyTripCreated(tripId: string, driverId: string) {
    try {
      const [trip, driver] = await Promise.all([
        this.getTripById(tripId),
        BrowserDatabaseService.getProfile(driverId)
      ]);

      if (!trip || !driver) {
        throw new Error('Trip or driver not found');
      }

      const notifications = [];
      const driverName = this.resolveProfileName(driver);

      // Notify driver about successful trip creation
      // Skip email notification for trip creation - in-app only
      const driverNotification = await this.sendSmartNotification({
        userId: driverId,
        title: '✅ تم نشر رحلتك!',
        message: `تم نشر رحلتك بنجاح من ولاية ${trip.fromWilayaId} إلى ولاية ${trip.toWilayaId} بسعر ${trip.pricePerSeat} دج. ستتلقى إشعارات عند وجود حجوزات.`,
        type: NotificationType.TRIP_CREATED,
        category: NotificationCategory.TRIP,
        priority: NotificationPriority.MEDIUM,
        relatedId: tripId,
        relatedType: 'trip',
        metadata: {
          fromWilayaId: trip.fromWilayaId,
          toWilayaId: trip.toWilayaId,
          pricePerSeat: trip.pricePerSeat,
          availableSeats: trip.availableSeats,
          skipEmail: true // Skip email notification for trip creation
        }
      });
      notifications.push(driverNotification);

      // Send Telegram notification for new trip
      try {
        await TelegramService.notifyNewTrip({
          driverName,
          fromWilaya: String(trip.fromWilayaId || trip.fromWilayaName || 'غير محدد'),
          toWilaya: String(trip.toWilayaId || trip.toWilayaName || 'غير محدد'),
          pricePerSeat: trip.pricePerSeat,
          availableSeats: trip.availableSeats,
          tripId: tripId.toString(),
          driverId: driverId.toString()
        });
      } catch (telegramError) {
        // Continue even if Telegram fails
      }

      // Notify admins about new trip (in-app only, no email)
      const adminProfiles = await this.getAdminUsers();
      if (adminProfiles.length > 0) {
        for (const admin of adminProfiles) {
          const isDeveloper = admin.role === 'developer';
          try {
            const adminNotification = await this.sendSmartNotification({
              userId: admin.id,
              title: isDeveloper ? '🔧 رحلة جديدة منشورة (مطور)' : '🚗 رحلة جديدة منشورة',
              message: isDeveloper
                ? `تنبيه مطور: ${driverName} أنشأ رحلة جديدة من ${trip.fromWilayaId} إلى ${trip.toWilayaId} بسعر ${trip.pricePerSeat} دج للمقعد.`
                : `السائق ${driverName} أنشأ رحلة جديدة من ولاية ${trip.fromWilayaId} إلى ولاية ${trip.toWilayaId} بسعر ${trip.pricePerSeat} دج للمقعد.`,
              type: NotificationType.TRIP_CREATED,
              category: NotificationCategory.SYSTEM,
              priority: NotificationPriority.MEDIUM,
              relatedId: tripId,
              relatedType: 'trip',
              metadata: {
                driverId: driverId,
                driverName,
                revenue: trip.pricePerSeat * trip.availableSeats,
                audience: isDeveloper ? 'developer' : 'admin',
                skipEmail: true // Flag to skip email for this notification
              }
            });
            if (adminNotification) {
              notifications.push(adminNotification);
            } else {
            }
          } catch (adminError) {
          }
        }
      } else {
      }

      return notifications;
    } catch (error) {
      throw error;
    }
  }

  // Trip cancellation notification
  static async notifyTripCancelled(tripId: string, driverId: string, reason?: string) {
    try {
      const [trip, driver] = await Promise.all([
        this.getTripById(tripId),
        BrowserDatabaseService.getProfile(driverId)
      ]);

      if (!trip || !driver) {
        throw new Error('Trip or driver not found');
      }

      // Get all bookings for this trip
      const allBookings = await BrowserDatabaseService.getAllBookings();
      const tripBookings = allBookings.filter(b => b.tripId === tripId);

      const notifications = [];
      
      // Get wilaya names and format location strings with ksar if applicable
      const fromWilayaName = trip.fromWilayaName || this.getWilayaNameById(trip.fromWilayaId);
      const toWilayaName = trip.toWilayaName || this.getWilayaNameById(trip.toWilayaId);
      const fromKsar = (trip as any).fromKsar;
      const toKsar = (trip as any).toKsar;
      
      // Format from location: wilaya name + ksar if exists and wilaya is Ghardaïa (47)
      const fromLocation = trip.fromWilayaId === 47 && fromKsar 
        ? `${fromWilayaName} - ${fromKsar}`
        : fromWilayaName;
      
      // Format to location: wilaya name + ksar if exists and wilaya is Ghardaïa (47)
      const toLocation = trip.toWilayaId === 47 && toKsar
        ? `${toWilayaName} - ${toKsar}`
        : toWilayaName;
      
      const driverName = this.resolveProfileName(driver);
      
      // Format reason text
      const reasonText = reason && reason.trim() && reason !== 'لم يتم تحديد سبب' 
        ? `\n\nالسبب: ${reason}` 
        : '';

      // Notify driver about trip cancellation/deletion
      // Skip email notification for trip cancellation - in-app only
      const driverNotification = await this.sendSmartNotification({
        userId: driverId,
        title: '❌ تم إلغاء رحلتك',
        message: `قمت بإلغاء رحلتك من ${fromLocation} باتجاه ${toLocation}.${reasonText}`,
        type: NotificationType.TRIP_CANCELLED,
        category: NotificationCategory.TRIP,
        priority: NotificationPriority.HIGH,
        relatedId: tripId,
        relatedType: 'trip',
        metadata: {
          reason: reason,
          affectedBookings: tripBookings.length,
          audience: 'driver',
          skipEmail: true // Skip email notification for trip cancellation
        }
      });
      notifications.push(driverNotification);

      // Notify all passengers with bookings (only pending or confirmed)
      // Skip email notifications for trip cancellation - in-app only
      for (const booking of tripBookings) {
        // Only notify passengers with pending or confirmed bookings
        if (booking.passengerId && (booking.status === 'pending' || booking.status === 'confirmed')) {
          const passengerNotification = await this.sendSmartNotification({
            userId: booking.passengerId,
            title: '❌ تم إلغاء الرحلة',
            message: `قام ${driverName} بإلغاء رحلته من ${fromLocation} باتجاه ${toLocation}.${reasonText}\n\n💰 سيتم رد المبلغ بالكامل خلال 3-5 أيام عمل.`,
            type: NotificationType.TRIP_CANCELLED,
            category: NotificationCategory.TRIP,
            priority: NotificationPriority.HIGH,
            relatedId: tripId,
            relatedType: 'trip',
            metadata: {
              bookingId: booking.id,
              refundAmount: booking.totalAmount,
              reason: reason,
              driverName,
              audience: 'passenger',
              skipEmail: true // Skip email notification for trip cancellation
            }
          });
          notifications.push(passengerNotification);
        }
      }

      // Notify admins
      // Skip email notification for trip cancellation - in-app only (admins get Telegram notifications)
      const adminProfiles = await this.getAdminUsers();
      for (const admin of adminProfiles) {
        const isDeveloper = admin.role === 'developer';
        const adminNotification = await this.sendSmartNotification({
          userId: admin.id,
          title: isDeveloper ? '🔧 رحلة ملغاة - مراجعة تقنية' : '❌ رحلة ملغاة',
          message: isDeveloper
            ? `تنبيه مطور: قام ${driverName} بإلغاء رحلته من ${fromLocation} باتجاه ${toLocation}. كان بها ${tripBookings.length} حجوزات.${reasonText}`
            : `قام ${driverName} بإلغاء رحلته من ${fromLocation} باتجاه ${toLocation}. كان بها ${tripBookings.length} حجز.${reasonText}`,
          type: NotificationType.TRIP_CANCELLED,
          category: NotificationCategory.SYSTEM,
          priority: NotificationPriority.HIGH,
          relatedId: tripId,
          relatedType: 'trip',
          metadata: {
            affectedBookings: tripBookings.length,
            refundsRequired: tripBookings.length,
            reason: reason,
            driverName,
            audience: isDeveloper ? 'developer' : 'admin',
            skipEmail: true // Skip email notification for trip cancellation (admins get Telegram)
          }
        });
        notifications.push(adminNotification);
      }

      return notifications;
    } catch (error) {
      throw error;
    }
  }

  // Trip starting notification
  static async notifyTripStarting(tripId: string) {
    try {
      const trip = await this.getTripById(tripId);
      if (!trip) throw new Error('Trip not found');

      const [driver, allBookings] = await Promise.all([
        BrowserDatabaseService.getProfile(trip.driverId),
        BrowserDatabaseService.getAllBookings()
      ]);

      const tripBookings = allBookings.filter(b => b.tripId === tripId);
      const notifications = [];
      const driverName = this.resolveProfileName(driver);

      // Notify driver
      const driverNotification = await this.sendSmartNotification({
        userId: trip.driverId,
        title: '🚗 وقت بدء الرحلة!',
        message: `حان وقت بدء رحلتك من ولاية ${trip.fromWilayaId} إلى ولاية ${trip.toWilayaId}. عدد الركاب: ${tripBookings.length}`,
        type: NotificationType.TRIP_STARTING,
        category: NotificationCategory.TRIP,
        priority: NotificationPriority.HIGH,
        relatedId: tripId,
        relatedType: 'trip',
        metadata: {
          passengerCount: tripBookings.length,
          departureTime: trip.departureTime
        }
      });
      notifications.push(driverNotification);

      // Notify all passengers
      for (const booking of tripBookings) {
        if (booking.passengerId) {
          const passengerNotification = await this.sendSmartNotification({
            userId: booking.passengerId,
            title: '🚗 بدأت رحلتك!',
            message: `بدأت رحلتك مع السائق ${driverName}. رقم الهاتف: ${driver?.phone}`,
            type: NotificationType.TRIP_STARTING,
            category: NotificationCategory.TRIP,
            priority: NotificationPriority.HIGH,
            relatedId: tripId,
            relatedType: 'trip',
            metadata: {
              driverName,
              driverPhone: driver?.phone,
              departureTime: trip.departureTime,
              audience: 'passenger'
            }
          });
          notifications.push(passengerNotification);
        }
      }

      return notifications;
    } catch (error) {
      throw error;
    }
  }

  // === PAYMENT NOTIFICATIONS ===
  
  // Notify driver about trip completion and payment received (combined email)
  static async notifyDriverTripCompletedWithPayment(tripId: string, driverId: string, totalAmount: number, paymentMethod: string = 'نقداً') {
    try {
      // Get driver info
      const driver = await BrowserDatabaseService.getProfile(driverId);
      if (!driver || !driver.email) {
        return null;
      }
      
      const driverName = this.resolveProfileName(driver);
      
      // Get trip info
      const trip = await BrowserDatabaseService.getTripById(tripId);
      const tripInfo = trip 
        ? `${trip.fromWilayaName || ''}${trip.fromWilayaId === 47 && (trip as any).fromKsar ? ` - ${(trip as any).fromKsar}` : ''} → ${trip.toWilayaName || ''}${trip.toWilayaId === 47 && (trip as any).toKsar ? ` - ${(trip as any).toKsar}` : ''}` 
        : 'الرحلة';
      
      // Create combined notification message
      const notificationData: NotificationData = {
        userId: driverId,
        title: '✅ تم إكمال رحلتك وتم استلام دفعتك',
        message: `عزيزي السائق، تم إكمال رحلتك وتم استلام دفعتك. يمكنك تقييم كيف كانت رحلتك على المنصة.`,
        type: NotificationType.TRIP_COMPLETED,
        category: NotificationCategory.TRIP,
        priority: NotificationPriority.HIGH,
        relatedId: tripId,
        relatedType: 'trip',
        metadata: {
          tripId,
          tripInfo,
          totalAmount,
          paymentMethod,
          action: 'rate_trip'
        }
      };
      // Send email notification directly (this will send the email)
      const emailResult = await this.sendEmailNotification(notificationData);
      
      // Also send in-app notification
      const inAppNotification = await this.sendSmartNotification(notificationData);
      return {
        emailResult,
        inAppNotification
      };
    } catch (error) {
      throw error;
    }
  }

  // Payment received notification
  static async notifyPaymentReceived(paymentData: {
    bookingId: number | string;
    amount: number;
    paymentMethod: string;
    payerId: string;
    recipientId: string;
  }) {
    try {
      const notifications = [];

      // Notify payer (passenger)
      const payerNotification = await this.sendSmartNotification({
        userId: paymentData.payerId,
        title: '✅ تم استلام الدفعة',
        message: `تم استلام دفعتك بمبلغ ${paymentData.amount} دج بنجاح عبر ${paymentData.paymentMethod}. رقم الحجز: #${paymentData.bookingId}`,
        type: NotificationType.PAYMENT_RECEIVED,
        category: NotificationCategory.PAYMENT,
        priority: NotificationPriority.MEDIUM,
        relatedId: paymentData.bookingId.toString(),
        relatedType: 'booking',
        metadata: {
          amount: paymentData.amount,
          paymentMethod: paymentData.paymentMethod,
          transactionId: `TXN_${Date.now()}`
        }
      });
      notifications.push(payerNotification);

      // Notify recipient (driver) - Keep separate notification for individual payments
      const recipientNotification = await this.sendSmartNotification({
        userId: paymentData.recipientId,
        title: '💰 تم استلام دفعة',
        message: `تم استلام دفعة بمبلغ ${paymentData.amount} دج من راكب في حجز #${paymentData.bookingId}.`,
        type: NotificationType.PAYMENT_RECEIVED,
        category: NotificationCategory.PAYMENT,
        priority: NotificationPriority.MEDIUM,
        relatedId: paymentData.bookingId.toString(),
        relatedType: 'booking',
        metadata: {
          amount: paymentData.amount,
          paymentMethod: paymentData.paymentMethod
        }
      });
      notifications.push(recipientNotification);

      // Notify admins via Telegram only (no email)
      try {
        // Get passenger and driver names for Telegram notification
        const [payerProfile, recipientProfile] = await Promise.all([
          BrowserDatabaseService.getProfile(paymentData.payerId).catch(() => null),
          BrowserDatabaseService.getProfile(paymentData.recipientId).catch(() => null)
        ]);

        const payerName = payerProfile ? getDisplayName(payerProfile) : undefined;
        const driverName = recipientProfile ? getDisplayName(recipientProfile) : undefined;

        // Send Telegram notification to admin
        await TelegramService.notifyPaymentReceived({
          amount: paymentData.amount,
          bookingId: paymentData.bookingId,
          paymentMethod: paymentData.paymentMethod,
          payerName: payerName,
          driverName: driverName
        });
      } catch (error) {
        // Don't throw - Telegram notification failure shouldn't break the flow
      }

      return notifications;
    } catch (error) {
      throw error;
    }
  }

  // Payment failed notification
  static async notifyPaymentFailed(paymentData: {
    bookingId: number | string;
    amount: number;
    paymentMethod: string;
    payerId: string;
    reason: string;
  }) {
    try {
      // Notify payer about failed payment
      const notification = await this.sendSmartNotification({
        userId: paymentData.payerId,
        title: '❌ فشل في الدفع',
        message: `فشلت عملية دفع ${paymentData.amount} دج للحجز #${paymentData.bookingId}. السبب: ${paymentData.reason}. يرجى المحاولة مرة أخرى.`,
        type: NotificationType.PAYMENT_FAILED,
        category: NotificationCategory.PAYMENT,
        priority: NotificationPriority.HIGH,
        relatedId: paymentData.bookingId.toString(),
        relatedType: 'booking',
        metadata: {
          amount: paymentData.amount,
          paymentMethod: paymentData.paymentMethod,
          failureReason: paymentData.reason
        }
      });

      return [notification];
    } catch (error) {
      throw error;
    }
  }

  // === SYSTEM & USER NOTIFICATIONS ===
  
  // Welcome notification for new users
  static async notifyWelcomeUser(userId: string, userRole: string) {
    try {
      // 🔥 FIRST: Atomically check and mark welcome email as being sent
      // This prevents race conditions where multiple calls check the flag before any updates it
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Try to atomically update the flag from false to true (only if it's currently false)
      // This ensures only one call can successfully mark it as "being sent"
      // Using .eq('welcome_email_sent', false) means the update will only succeed if the flag is currently false
      const { data: updateResult, error: updateError } = await supabase
        .from('profiles')
        .update({ welcome_email_sent: true })
        .eq('id', userId)
        .eq('welcome_email_sent', false) // Only update if it's false
        .select('welcome_email_sent');

      // If update failed, no rows were updated (meaning welcome_email_sent was already true), or error occurred
      // This means welcome email was already sent by another call
      if (updateError || !updateResult) {
        return null; // Already sent, skip
      }

      // Verify the update was successful (at least one row was updated)
      if (updateResult.length === 0) {
        return null; // Update didn't work as expected, skip to be safe
      }

      // Wait for profile to be created (with retry logic)
      let user = null;
      let attempts = 0;
      const maxAttempts = 15; // Increase attempts
      const delayMs = 1000; // Increase delay to 1 second
      while (!user && attempts < maxAttempts) {
        try {
          user = await BrowserDatabaseService.getProfile(userId);
          if (!user) {
            attempts++;
            if (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, delayMs));
            }
          } else {
          }
        } catch (profileError: any) {
          // Handle errors from getProfile (like 406 errors)
          attempts++;
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }
          user = null; // Reset user to continue retrying
        }
      }
      
      if (!user) {
        return null; // Don't throw error, just skip notification
      }

      const userName = this.resolveProfileName(user);
      const roleMessages = {
        passenger: 'مرحباً بك في منصة أبريد! يمكنك الآن البحث عن رحلات وحجز مقاعد بسهولة.',
        driver: 'مرحباً بك كسائق في منصة أبريد. شكراً على انضمامك لمجتمع أبريد. سيتم مراجعة ملفك من طرفنا وسنعلمك.',
        admin: 'مرحباً بك في لوحة إدارة منصة أبريد. يمكنك إدارة النظام بالكامل.',
        developer: 'مرحباً بك في لوحة المطور. يمكنك مراقبة التكاملات ومتابعة النظام بدقة.'
      };

      const notification = await this.sendSmartNotification({
        userId,
        title: `مرحباً بك يا ${userName}! 🎉`,
        message: roleMessages[userRole as keyof typeof roleMessages] || roleMessages.passenger,
        type: NotificationType.ACCOUNT_VERIFIED,
        category: NotificationCategory.USER,
        priority: NotificationPriority.MEDIUM,
        metadata: {
          userRole,
          welcomeType: 'new_user',
          registrationDate: new Date().toISOString(),
          displayName: userName
        }
      });

      // Check if notification was created successfully
      if (!notification) {
        // If notification failed, reset the flag so it can be retried
        try {
          await supabase
            .from('profiles')
            .update({ welcome_email_sent: false })
            .eq('id', userId);
        } catch (resetError) {
          // Silent fail
        }
        return null; // Don't throw error, just return null
      }
      
      // Flag was already set atomically at the beginning, so no need to update again
      return notification;
    } catch (error: any) {
      // Log error but don't throw - notifications are not critical
      // Don't throw error - just return null
      // This prevents signup from failing if notifications fail
      return null;
    }
  }

  // New user registration notification for admins
  static async notifyNewUserRegistration(data: {
    userId: string;
    userRole: 'driver' | 'passenger' | 'admin' | 'developer';
    userName: string;
    userEmail: string;
  }) {
    try {
      const notifications = [];

      const roleEmojis = {
        driver: '🚗',
        passenger: '👤',
        admin: '🛡️',
        developer: '🛠️'
      };

      const roleNames = {
        driver: 'سائق',
        passenger: 'راكب',
        admin: 'مدير',
        developer: 'مطور'
      };

      // Send Telegram notification for new user registration FIRST (always, regardless of admin users)
      // This is the primary notification channel for admins
      try {
        const telegramResult = await TelegramService.notifyNewUser({
          userName: data.userName,
          userRole: data.userRole,
          userEmail: data.userEmail,
          userId: data.userId
        });
        
        if (telegramResult) {
        } else {
        }
      } catch (telegramError: any) {
        // Continue even if Telegram fails
      }

      // Get all admin users for in-app notifications
      const adminProfiles = await this.getAdminUsers();
      // Send in-app notifications to admins (without email)
      if (adminProfiles.length > 0) {
      for (const admin of adminProfiles) {
        try {
          const adminNotification = await this.sendSmartNotification({
            userId: admin.id,
            title: `${roleEmojis[data.userRole]} مستخدم جديد`,
            message: `انضم ${data.userName} (ك${roleNames[data.userRole] || data.userRole}) إلى المنصة. البريد: ${data.userEmail}`,
            type: NotificationType.USER_REGISTRATION,
            category: NotificationCategory.SYSTEM,
            priority: NotificationPriority.MEDIUM,
            relatedId: data.userId,
            relatedType: 'user',
            metadata: {
              userRole: data.userRole,
              userName: data.userName,
              userEmail: data.userEmail,
              registrationDate: new Date().toISOString(),
                audience: admin.role === 'developer' ? 'developer' : 'admin',
                skipEmail: true // Skip email for admin new user registration notifications
            }
          });
          
          if (adminNotification) {
            notifications.push(adminNotification);
          } else {
          }
        } catch (adminError) {
          // Continue with other admins even if one fails
        }
        }
      } else {
      }

      return notifications;
    } catch (error) {
      throw error;
    }
  }

  // Account verification notification
  static async notifyAccountVerified(userId: string) {
    try {
      return await this.sendSmartNotification({
        userId: userId,
        title: '✅ تم تأكيد حسابك',
        message: 'تهانينا! تم تأكيد حسابك بنجاح. يمكنك الآن الوصول إلى جميع ميزات المنصة.',
        type: NotificationType.ACCOUNT_VERIFIED,
        category: NotificationCategory.ACCOUNT,
        priority: NotificationPriority.MEDIUM,
        relatedId: userId,
        relatedType: 'user'
      });
    } catch (error) {
      throw error;
    }
  }

  // Password changed notification
  static async notifyPasswordChanged(userId: string, userEmail: string, userRole?: 'driver' | 'passenger' | 'admin' | 'developer') {
    try {
      // Get user profile to get role if not provided
      let role = userRole;
      if (!role) {
        try {
          const profile = await BrowserDatabaseService.getProfile(userId);
          role = profile?.role as 'driver' | 'passenger' | 'admin' | 'developer' | undefined;
        } catch (error) {
        }
      }

      const roleName = role === 'driver' ? 'سائق' : role === 'passenger' ? 'راكب' : 'مستخدم';
      const emoji = role === 'driver' ? '🚗' : role === 'passenger' ? '👤' : '🔐';

      // Send notification with email (important security notification)
      const notification = await this.sendSmartNotification({
        userId: userId,
        title: `${emoji} تم تغيير كلمة المرور`,
        message: `تم تغيير كلمة المرور لحسابك (${roleName}) بنجاح. إذا لم تقم بهذا التغيير، يرجى الاتصال بالدعم فوراً.`,
        type: NotificationType.PASSWORD_CHANGED,
        category: NotificationCategory.ACCOUNT,
        priority: NotificationPriority.HIGH,
        relatedId: userId,
        relatedType: 'user',
        metadata: {
          userEmail,
          userRole: role,
          changedAt: new Date().toISOString(),
          securityAlert: true,
          requireEmail: true // Ensure email is sent for security notifications
        }
      });
      return notification;
    } catch (error) {
      // Don't throw - password change should succeed even if notification fails
      return null;
    }
  }

  // Driver approval notification
  static async notifyDriverApproved(driverId: string) {
    try {
      return await this.sendSmartNotification({
        userId: driverId,
        title: '🎉 تم قبول طلبك للقيادة!',
        message: 'تهانينا! تم قبول طلبك لتصبح سائقاً في منصتنا. يمكنك الآن إنشاء رحلات واستقبال حجوزات.',
        type: NotificationType.DRIVER_APPROVED,
        category: NotificationCategory.ACCOUNT,
        priority: NotificationPriority.HIGH,
        relatedId: driverId,
        relatedType: 'user'
      });
    } catch (error) {
      throw error;
    }
  }

  // System maintenance notification
  static async notifySystemMaintenance(maintenanceData: {
    startTime: string;
    endTime: string;
    description: string;
  }) {
    try {
      const allProfiles = await BrowserDatabaseService.getAllProfiles();
      const notifications = [];

      for (const profile of allProfiles) {
        const notification = await this.sendSmartNotification({
          userId: profile.id,
          title: '🔧 صيانة مجدولة للنظام',
          message: `سيتم إجراء صيانة للنظام من ${maintenanceData.startTime} إلى ${maintenanceData.endTime}. ${maintenanceData.description}`,
          type: NotificationType.SYSTEM_MAINTENANCE,
          category: NotificationCategory.SYSTEM,
          priority: NotificationPriority.HIGH,
          relatedId: 'maintenance',
          relatedType: 'system',
          metadata: {
            startTime: maintenanceData.startTime,
            endTime: maintenanceData.endTime,
            description: maintenanceData.description
          }
        });
        notifications.push(notification);
      }

      return notifications;
    } catch (error) {
      throw error;
    }
  }

  // Security alert notification
  static async notifySecurityAlert(userId: string, alertData: {
    type: string;
    description: string;
    ipAddress?: string;
    location?: string;
  }) {
    try {
      return await this.sendSmartNotification({
        userId: userId,
        title: '⚠️ تنبيه أمني',
        message: `تم رصد نشاط مشبوه في حسابك: ${alertData.description}. إذا لم تكن أنت، يرجى تغيير كلمة المرور فوراً.`,
        type: NotificationType.SECURITY_ALERT,
        category: NotificationCategory.SAFETY,
        priority: NotificationPriority.CRITICAL,
        relatedId: userId,
        relatedType: 'user',
        metadata: {
          alertType: alertData.type,
          ipAddress: alertData.ipAddress,
          location: alertData.location,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      throw error;
    }
  }

  // === VEHICLE NOTIFICATIONS ===
  
  // Vehicle added notification
  static async notifyVehicleAdded(data: {
    driverId: string;
    vehicleId: string;
    vehicleName: string;
    licensePlate: string;
  }) {
    try {
      const notification = await this.sendSmartNotification({
        userId: data.driverId,
        title: '🚗 تم إضافة مركبتك بنجاح!',
        message: `تم إضافة مركبة ${data.vehicleName} (لوحة: ${data.licensePlate}) بنجاح. يمكنك الآن استخدامها في رحلاتك.`,
        type: NotificationType.VEHICLE_APPROVED,
        category: NotificationCategory.ACCOUNT,
        priority: NotificationPriority.MEDIUM,
        relatedId: data.vehicleId,
        relatedType: 'vehicle',
        metadata: {
          vehicleName: data.vehicleName,
          licensePlate: data.licensePlate
        }
      });

      return notification;
    } catch (error) {
      throw error;
    }
  }

  // Admin notification for new vehicle
  static async notifyAdminNewVehicle(data: {
    driverId: string;
    driverName: string;
    vehicleId: string;
    vehicleDetails: string;
  }) {
    try {
      const notifications = [];
      const adminProfiles = await this.getAdminUsers();

      for (const admin of adminProfiles) {
        const adminNotification = await this.sendSmartNotification({
          userId: admin.id,
          title: '🚗 مركبة جديدة',
          message: `أضاف السائق ${data.driverName} مركبة جديدة: ${data.vehicleDetails}. يمكنك مراجعتها في لوحة الإدارة.`,
          type: NotificationType.DOCUMENT_REQUIRED,
          category: NotificationCategory.SYSTEM,
          priority: NotificationPriority.MEDIUM,
          relatedId: data.vehicleId,
          relatedType: 'vehicle',
          metadata: {
            driverId: data.driverId,
            driverName: data.driverName,
            vehicleDetails: data.vehicleDetails
          }
        });
        notifications.push(adminNotification);
      }

      return notifications;
    } catch (error) {
      throw error;
    }
  }

  // Vehicle status update notification
  static async notifyVehicleStatusUpdate(data: {
    driverId: string;
    vehicleId: string;
    vehicleName: string;
    newStatus: 'active' | 'inactive' | 'pending_approval';
    reason?: string;
  }) {
    try {
      const statusMessages = {
        active: '✅ تم تفعيل مركبتك',
        inactive: '🚫 تم إلغاء تفعيل مركبتك',
        pending_approval: '⏳ مركبتك قيد المراجعة'
      };

      const statusDetails = {
        active: 'يمكنك الآن استخدام هذه المركبة في رحلاتك.',
        inactive: 'لن تتمكن من استخدام هذه المركبة في رحلات جديدة.',
        pending_approval: 'نحن نراجع بيانات مركبتك. سنخبرك بالنتيجة قريباً.'
      };

      const notification = await this.sendSmartNotification({
        userId: data.driverId,
        title: statusMessages[data.newStatus],
        message: `مركبة ${data.vehicleName}: ${statusDetails[data.newStatus]}${data.reason ? ` السبب: ${data.reason}` : ''}`,
        type: data.newStatus === 'active' ? NotificationType.VEHICLE_APPROVED : NotificationType.DOCUMENT_REQUIRED,
        category: NotificationCategory.ACCOUNT,
        priority: data.newStatus === 'inactive' ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
        relatedId: data.vehicleId,
        relatedType: 'vehicle',
        metadata: {
          vehicleName: data.vehicleName,
          newStatus: data.newStatus,
          reason: data.reason
        }
      });

      return notification;
    } catch (error) {
      throw error;
    }
  }

  // === HELPER METHODS ===
  
  // Get trip by ID - Fixed to use direct query
  static async getTripById(tripId: string) {
    try {
      if (!tripId) {
        return null;
      }
      const trip = await BrowserDatabaseService.getTripById(tripId);
      return trip;
    } catch (error) {
      return null;
    }
  }

  // Get booking by ID - Fixed to use direct query
  static async getBookingById(bookingId: number | string) {
    try {
      if (!bookingId) {
        return null;
      }
      const booking = await BrowserDatabaseService.getBookingById(bookingId);
      return booking;
    } catch (error) {
      return null;
    }
  }

  // Get all admin users - Simplified and more reliable approach
  static async getAdminUsers() {
    try {
      // استخدام Supabase مباشرة بدلاً من BrowserDatabaseService
      const { supabase } = await import('@/integrations/supabase/client');
      
      // First, try to get admin/developer users
      const { data: adminProfiles, error } = await supabase
        .from('profiles')
        .select('id, role, full_name, first_name, last_name, email, phone')
        .in('role', ['admin', 'developer']);

      if (error) {
        // Fallback to BrowserDatabaseService if Supabase fails
        const allProfiles = await BrowserDatabaseService.getAllProfiles();
        const adminUsers = allProfiles.filter(profile => 
          profile.role === 'admin' || 
          profile.role === 'developer' ||
          profile.email?.includes('admin') ||
          profile.email?.includes('manager') ||
          profile.email?.includes('support')
        );
        return adminUsers;
      }
      // If no admin users found, try to get all users and check for admin-like emails
      if (!adminProfiles || adminProfiles.length === 0) {
        // Get all profiles to check for admin-like emails
        const { data: allProfiles, error: allError } = await supabase
          .from('profiles')
          .select('id, role, full_name, first_name, last_name, email, phone')
          .limit(100); // Limit to avoid too many results
        
        if (!allError && allProfiles) {
          // Filter for admin-like emails (case-insensitive)
          const adminLikeUsers = allProfiles.filter(profile => {
            const email = (profile.email || '').toLowerCase();
            return email.includes('admin') || 
                   email.includes('manager') || 
                   email.includes('support') ||
                   email.includes('aminekerkarr') ||
                   email.includes('abride');
          });
          
          if (adminLikeUsers.length > 0) {
            // Map to expected format
            const result = adminLikeUsers.map(profile => ({
              id: profile.id,
              role: profile.role || 'admin', // Default to admin if no role
              fullName: profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'مدير',
              firstName: profile.first_name,
              lastName: profile.last_name,
              email: profile.email,
              phone: profile.phone
            }));
            return result;
          }
        }
        return [];
      }

      // Map to expected format
      const result = adminProfiles.map(profile => ({
        id: profile.id,
        role: profile.role,
        fullName: profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'مدير',
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: profile.email,
        phone: profile.phone
      }));
      return result;
    } catch (error) {
      // Fallback to BrowserDatabaseService
      try {
        const allProfiles = await BrowserDatabaseService.getAllProfiles();
        const adminUsers = allProfiles.filter(profile => 
          profile.role === 'admin' || 
          profile.role === 'developer' ||
          profile.email?.toLowerCase().includes('admin') ||
          profile.email?.toLowerCase().includes('manager') ||
          profile.email?.toLowerCase().includes('support') ||
          profile.email?.toLowerCase().includes('aminekerkarr') ||
          profile.email?.toLowerCase().includes('abride')
        );
        return adminUsers;
      } catch (fallbackError) {
        return [];
      }
    }
  }

  // Log admin action
  static async logAdminAction(data: {
    adminId: string;
    action: string;
    targetType?: string;
    targetId?: string;
    details?: any;
  }) {
    try {
      // Enhanced admin logging with more details
      const logEntry = {
        adminId: data.adminId,
        action: data.action,
        targetType: data.targetType,
        targetId: data.targetId,
        details: data.details,
        timestamp: new Date().toISOString(),
        severity: this.getActionSeverity(data.action)
      };
      // TODO: Store in actual admin logs table when available
      return logEntry;
    } catch (error) {
    }
  }

  // Get action severity for logging
  static getActionSeverity(action: string): 'low' | 'medium' | 'high' | 'critical' {
    const severityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      'booking_created': 'low',
      'booking_confirmed': 'low',
      'booking_cancelled': 'medium',
      'trip_created': 'low',
      'trip_cancelled': 'high',
      'payment_received': 'medium',
      'payment_failed': 'high',
      'user_suspended': 'critical',
      'security_alert': 'critical'
    };
    
    return severityMap[action] || 'low';
  }

  // === ADMIN NOTIFICATIONS ===
  
  // Enhanced admin notification for system monitoring
  static async notifyAdminSystemAlert(data: {
    alertType: 'high_activity' | 'system_error' | 'security_breach' | 'performance_issue';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    details?: any;
  }) {
    try {
      const adminUsers = await this.getAdminUsers();
      
      if (adminUsers.length === 0) {
        return [];
      }

      const notifications = [];
      
      for (const admin of adminUsers) {
        const alertEmojis = {
          high_activity: '📈',
          system_error: '⚠️',
          security_breach: '🔒',
          performance_issue: '🐌'
        };
        
        const severityColors = {
          low: '🟢',
          medium: '🟡',
          high: '🟠',
          critical: '🔴'
        };
        
        const notification = await this.sendSmartNotification({
          userId: admin.id,
          title: `${alertEmojis[data.alertType]} تنبيه إداري`,
          message: `${severityColors[data.severity]} ${data.message}`,
          type: NotificationType.SYSTEM_ALERT,
          category: NotificationCategory.SYSTEM,
          priority: data.severity === 'critical' ? NotificationPriority.CRITICAL : 
                   data.severity === 'high' ? NotificationPriority.HIGH : 
                   data.severity === 'medium' ? NotificationPriority.MEDIUM : 
                   NotificationPriority.LOW,
          metadata: {
            alertType: data.alertType,
            severity: data.severity,
            details: data.details,
            audience: 'admin'
          }
        });
        
        notifications.push(notification);
      }
      
      return notifications;
    } catch (error) {
      throw error;
    }
  }

  // Notify admin about new user registration
  static async notifyAdminNewUser(data: {
    userId: string;
    userRole: string;
    userName: string;
    userEmail: string;
  }) {
    try {
      const adminUsers = await this.getAdminUsers();
      if (adminUsers.length === 0) {
        return [];
      }

      const notifications = [];
      
      const roleEmojis = {
        driver: '🚗',
        passenger: '👤',
        admin: '👨‍💼',
        developer: '🛠️'
      };

      const roleNames = {
        driver: 'سائق',
        passenger: 'راكب',
        admin: 'مدير',
        developer: 'مطور'
      };
      
      // Send Telegram notification for new user registration
      try {
        const telegramResult = await TelegramService.notifyNewUser({
          userName: data.userName,
          userRole: data.userRole as 'driver' | 'passenger' | 'admin' | 'developer',
          userEmail: data.userEmail,
          userId: data.userId
        });
        
        if (telegramResult) {
        } else {
        }
      } catch (telegramError: any) {
        // Continue even if Telegram fails
      }

      // Send in-app notifications to admins (without email)
      for (const admin of adminUsers) {
        try {
          const notification = await this.sendSmartNotification({
            userId: admin.id,
            title: `${roleEmojis[data.userRole as keyof typeof roleEmojis] || '👤'} مستخدم جديد`,
            message: `تم تسجيل مستخدم جديد: ${data.userName} (${roleNames[data.userRole as keyof typeof roleNames] || data.userRole}) - ${data.userEmail}`,
            type: NotificationType.USER_REGISTRATION,
            category: NotificationCategory.SYSTEM,
            priority: NotificationPriority.MEDIUM,
            relatedId: data.userId,
            relatedType: 'user',
            metadata: {
              newUserId: data.userId,
              newUserRole: data.userRole,
              newUserName: data.userName,
              newUserEmail: data.userEmail,
              audience: 'admin',
              skipEmail: true // Skip email for admin new user registration notifications
            }
          });
          
          if (notification) {
            notifications.push(notification);
          } else {
          }
        } catch (adminError) {
          // Continue with other admins even if one fails
        }
      }
      return notifications;
    } catch (error) {
      throw error;
    }
  }

  // Notify admin about trip status changes
  static async notifyAdminTripStatusChange(data: {
    tripId: string;
    driverId: string;
    driverName: string;
    fromLocation: string;
    toLocation: string;
    oldStatus: string;
    newStatus: string;
    reason?: string;
  }) {
    try {
      const adminUsers = await this.getAdminUsers();
      
      if (adminUsers.length === 0) return [];

      const notifications = [];
      
      for (const admin of adminUsers) {
        const statusEmojis = {
          scheduled: '📅',
          in_progress: '🚗',
          completed: '✅',
          cancelled: '❌',
          delayed: '⏰'
        };
        
        const notification = await this.sendSmartNotification({
          userId: admin.id,
          title: `${statusEmojis[data.newStatus as keyof typeof statusEmojis] || '📋'} تغيير حالة الرحلة`,
          message: `رحلة ${data.driverName}: ${data.fromLocation} → ${data.toLocation} تغيرت من ${data.oldStatus} إلى ${data.newStatus}${data.reason ? `. السبب: ${data.reason}` : ''}`,
          type: NotificationType.TRIP_UPDATED,
          category: NotificationCategory.SYSTEM,
          priority: data.newStatus === 'cancelled' ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
          relatedId: data.tripId,
          relatedType: 'trip',
          metadata: {
            tripId: data.tripId,
            driverId: data.driverId,
            driverName: data.driverName,
            fromLocation: data.fromLocation,
            toLocation: data.toLocation,
            oldStatus: data.oldStatus,
            newStatus: data.newStatus,
            reason: data.reason,
            audience: 'admin'
          }
        });
        
        notifications.push(notification);
      }
      
      return notifications;
    } catch (error) {
      throw error;
    }
  }

  // Delete notification
  static async deleteNotification(notificationId: string) {
    try {
      await BrowserDatabaseService.deleteNotification(notificationId);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Get unread notifications count
  static async getUnreadNotificationsCount(userId: string) {
    try {
      const count = await BrowserDatabaseService.getUnreadNotificationsCount(userId);
      return count;
    } catch (error) {
      throw error;
    }
  }

  // Send email notification
  private static async sendEmailNotification(data: NotificationData) {
    try {
      // Get user profile to get email
      const user = await BrowserDatabaseService.getProfile(data.userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      if (!user.email) {
        return { success: false, error: 'User has no email address' };
      }
      // Get Supabase URL and anon key from environment
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kobsavfggcnfemdzsnpj.supabase.co';
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvYnNhdmZnZ2NuZmVtZHpzbnBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3OTk3ODEsImV4cCI6MjA3NDM3NTc4MX0._TfXDauroKe8EAv_Fv4PQAZfOqk-rHbXAlF8bOU3-Qk';

      if (!supabaseUrl || !supabaseAnonKey) {
        return { success: false, error: 'Supabase credentials not found' };
      }

      // Create HTML email template
      const htmlEmail = this.createEmailTemplate(data);
      // Call Edge Function to send email
      const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          to: user.email,
          subject: data.title,
          html: htmlEmail,
          text: data.message, // Plain text version
          attachments: data.metadata?.attachments || undefined,
        }),
      });
      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = 'Could not read error response';
        }
        // Log detailed error for debugging
        if (response.status === 404) {
        } else if (response.status === 401 || response.status === 403) {
        } else if (response.status >= 500) {
        }

        // Return error result so caller knows email failed
        return { 
          success: false, 
          error: errorText,
          status: response.status,
          statusText: response.statusText
        };
      }

      let result;
      try {
        result = await response.json();
        return result;
      } catch (jsonError) {
        return { success: true, provider: 'unknown' };
      }
    } catch (error) {
      // Log more details if available
      if (error instanceof TypeError && error.message.includes('fetch')) {
      }
      
      // Return error result so caller knows email failed
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  // Create HTML email template following Abride Official Brand System
  private static createEmailTemplate(data: NotificationData): string {
    const isReceipt = data.type === NotificationType.BOOKING_CONFIRMED || (data.metadata && data.metadata.receiptUrl);
    
    const isTripNotification = (data.category === NotificationCategory.BOOKING || 
                              data.type?.startsWith('booking_') || 
                              data.type?.startsWith('trip_')) && !isReceipt;
    
    const bookingId = data.relatedId || (data.metadata && data.metadata.bookingId) || '';
    const receiptCode = bookingId ? `ABR-${bookingId}` : 'ABRIDE';
    const actionUrl = data.actionUrl || (data.metadata && data.metadata.receiptUrl) || (bookingId ? `https://abride.online/verify-receipt?code=${encodeId(receiptCode)}&id=${encodeId(bookingId)}` : '');

    const totalAmount = data.metadata?.totalAmount;
    const paymentMethod = data.metadata?.paymentMethod || 'نقداً عند الانطلاق';
    const driverName = data.metadata?.driverName;
    const driverPhone = data.metadata?.driverPhone;
    const fromLoc = data.metadata?.fromLocation || data.metadata?.pickupLocation;
    const toLoc = data.metadata?.toLocation || data.metadata?.destinationLocation;

    // Route Strip Motif: ● ⋯⋯⋯⋯ 🚗 ⋯⋯⋯⋯ 📍 (RTL: Dep right, Arr left)
    const routeStripHtml = isTripNotification ? `
      <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 16px auto 0 auto;">
        <tr>
          <td style="color: #ffffff; font-size: 14px;">●</td>
          <td style="color: rgba(255,255,255,0.4); font-size: 12px; letter-spacing: 4px; padding: 0 8px;">⋯⋯⋯⋯</td>
          <td style="font-size: 18px; padding: 0 4px;">🚗</td>
          <td style="color: rgba(255,255,255,0.4); font-size: 12px; letter-spacing: 4px; padding: 0 8px;">⋯⋯⋯⋯</td>
          <td style="color: #ffffff; font-size: 16px;">📍</td>
        </tr>
      </table>
    ` : '';

    // Receipt Ticket Card HTML
    const receiptCardHtml = (isReceipt || totalAmount) ? `
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
        <tr>
          <td style="background: linear-gradient(180deg, #f0fdf4 0%, #ecfdf5 100%); border: 1.5px solid #bbf7d0; border-radius: 18px; padding: 22px;">
            
            <!-- Header Row with Perforation -->
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-bottom: 2px dashed #86efac; padding-bottom: 14px; margin-bottom: 14px;">
              <tr>
                <td align="right" style="direction: rtl;">
                  <span style="background-color: #dcfce7; color: #15803d; border-radius: 9999px; font-size: 12px; font-weight: 700; padding: 4px 14px; display: inline-block;">
                    ✓ وصل حجز مؤكد (RECU)
                  </span>
                </td>
                <td align="left" style="font-family: 'Cairo', 'Segoe UI', sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 2px; color: #047857;">
                  ${receiptCode}
                </td>
              </tr>
            </table>

            <!-- Amount Climax -->
            ${totalAmount ? `
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 12px 0;">
                <tr>
                  <td align="center">
                    <div style="font-size: 11px; font-weight: 600; letter-spacing: 2px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px;">المبلغ الإجمالي</div>
                    <div style="font-size: 38px; font-weight: 800; color: #065f46; line-height: 1.1;">
                      ${typeof totalAmount === 'number' ? totalAmount.toFixed(0) : totalAmount}
                      <span style="font-size: 20px; font-weight: 600; color: #047857; margin-right: 6px;">دج</span>
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- Dashed Perforation 2 -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-bottom: 2px dashed #86efac; margin: 14px 0;">
                <tr><td></td></tr>
              </table>
            ` : ''}

            <!-- Details List -->
            <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="direction: rtl; text-align: right; font-size: 14px;">
              ${fromLoc && toLoc ? `
                <tr>
                  <td style="padding: 6px 0; color: #6b7280; width: 35%;">مسار الرحلة:</td>
                  <td style="padding: 6px 0; color: #111827; font-weight: 700;">من ${fromLoc} إلى ${toLoc}</td>
                </tr>
              ` : ''}
              ${driverName ? `
                <tr>
                  <td style="padding: 6px 0; color: #6b7280;">السائق المسؤول:</td>
                  <td style="padding: 6px 0; color: #111827; font-weight: 700;">${driverName} ${driverPhone ? `(${driverPhone})` : ''}</td>
                </tr>
              ` : ''}
              <tr>
                <td style="padding: 6px 0; color: #6b7280;">طريقة الدفع:</td>
                <td style="padding: 6px 0; color: #111827; font-weight: 600;">${paymentMethod}</td>
              </tr>
              ${paymentMethod.includes('BaridiMob') || paymentMethod.includes('بريدي موب') ? `
              <tr>
                <td style="padding: 6px 0; color: #6b7280; vertical-align: top;">رقم الحساب (RIP):</td>
                <td style="padding: 6px 0; color: #15803d; font-weight: 700; direction: ltr; text-align: right;">
                  00799999004064855725<br>
                  <span style="font-size: 11px; font-weight: 500; color: #6b7280; direction: rtl; display: block;">يرجى تحويل المبلغ الإجمالي إلى هذا الحساب</span>
                </td>
              </tr>
              ` : ''}
            </table>

          </td>
        </tr>
      </table>
    ` : '';

    // Info / Attachment Chip
    const attachmentChipHtml = isReceipt ? `
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 18px 0;">
        <tr>
          <td style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 14px 18px; color: #92400e; font-size: 13px; font-weight: 600; direction: rtl; text-align: right;">
            📎 <strong style="color: #78350f;">ملاحظة هامة:</strong> تجدون مرفقاً بهذا البريد الإلكتروني ملف وصل الحجز الرسمي (RECU) بصيغة PDF جاهز للتحميل والطباعة.
          </td>
        </tr>
      </table>
    ` : '';

    // Action Button
    const actionButtonHtml = actionUrl ? `
      <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0 12px 0;">
        <tr>
          <td align="center">
            <a href="${actionUrl}" target="_blank" style="background-color: #047857; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 15px; padding: 14px 32px; display: inline-block; box-shadow: 0 4px 12px rgba(4, 120, 87, 0.25);">
              عرض الوصل والـ QR Code الموثق ←
            </a>
          </td>
        </tr>
      </table>
    ` : '';

    return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
</head>
<body style="font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #111827; margin: 0; padding: 0; background-color: #f8fafc; direction: rtl; text-align: right;">
  
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 24px 12px;">
    <tr>
      <td align="center">
        
        <!-- Main Email Card Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
          
          <!-- Header Block -->
          <tr>
            <td style="background-color: #047857; padding: 36px 24px 28px 24px; text-align: center;">
              
              <!-- Large Logo without Circle Badge -->
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto 12px auto;">
                <tr>
                  <td align="center">
                    <img src="https://www.abride.online/logo.svg" alt="Abride Logo" width="72" height="72" style="display: block; margin: 0 auto; filter: brightness(0) invert(1);" />
                  </td>
                </tr>
              </table>

              <!-- Brand Wordmark & Eyebrow -->
              <div style="color: #ffffff; font-size: 28px; font-weight: 800; margin-bottom: 4px; direction: ltr;">
                <span style="letter-spacing: 0px; font-family: 'Cairo', sans-serif;">أبريد</span>
                <span style="letter-spacing: 1.5px;">ABRIDE</span>
              </div>
              <div style="color: #dcfce7; font-size: 11px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase;">ABRIDE PLATFORM • RECU SYSTEM</div>

            </td>
          </tr>

          <!-- Body Content Area -->
          <tr>
            <td style="padding: 30px 24px;">
              
              <h1 style="color: #111827; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 14px; direction: rtl; text-align: right;">
                ${data.title}
              </h1>

              <div style="background-color: #f8fafc; border-radius: 12px; padding: 18px; margin-bottom: 20px; border-right: 4px solid #047857; direction: rtl; text-align: right;">
                <p style="margin: 0; font-size: 15px; color: #4b5563; line-height: 1.8;">
                  ${data.message}
                </p>
              </div>

              <!-- Receipt Ticket Card -->
              ${receiptCardHtml}

              <!-- Attachment Info Chip -->
              ${attachmentChipHtml}

              <!-- Action Button -->
              ${actionButtonHtml}

            </td>
          </tr>

          <!-- Footer Block -->
          <tr>
            <td style="border-top: 1px solid #e5e7eb; padding: 24px; text-align: center; color: #9ca3af; font-size: 12px; background-color: #f8fafc;">
              <p style="margin: 0 0 6px 0; color: #6b7280; font-weight: 600;">منصة أبريد - الرحلات والتنقل بين الولايات الجزائرية</p>
              <p style="margin: 0; color: #9ca3af;">جميع الحقوق محفوظة © ${new Date().getFullYear()} abride.online</p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
    `.trim();
  }
}

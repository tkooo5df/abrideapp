import { NotificationType, NotificationCategory, NotificationPriority } from './notificationService';

// User notification preferences interface
export interface NotificationPreferences {
  userId: string;
  
  // Global notification settings
  enableNotifications: boolean;
  enablePushNotifications: boolean;
  enableEmailNotifications: boolean;
  enableSMSNotifications: boolean;
  
  // Quiet hours
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:mm format
  quietHoursEnd: string;   // HH:mm format
  
  // Category preferences
  categorySettings: {
    [K in NotificationCategory]: {
      enabled: boolean;
      priority: NotificationPriority;
      pushEnabled: boolean;
      emailEnabled: boolean;
      smsEnabled: boolean;
    }
  };
  
  // Type-specific preferences
  typeSettings: {
    [K in NotificationType]?: {
      enabled: boolean;
      priority: NotificationPriority;
      pushEnabled: boolean;
      emailEnabled: boolean;
      smsEnabled: boolean;
    }
  };
  
  // Language and localization
  language: 'ar' | 'en' | 'fr';
  timezone: string;
  
  // Frequency limits
  maxNotificationsPerHour: number;
  maxNotificationsPerDay: number;
  
  // Sound and vibration
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  customSounds: {
    [key: string]: string;
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Default notification preferences
export const DEFAULT_PREFERENCES: Omit<NotificationPreferences, 'userId' | 'createdAt' | 'updatedAt'> = {
  enableNotifications: true,
  enablePushNotifications: true,
  enableEmailNotifications: true,
  enableSMSNotifications: false,
  
  quietHoursEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  
  categorySettings: {
    [NotificationCategory.BOOKING]: {
      enabled: true,
      priority: NotificationPriority.HIGH,
      pushEnabled: true,
      emailEnabled: true,
      smsEnabled: true
    },
    [NotificationCategory.TRIP]: {
      enabled: true,
      priority: NotificationPriority.MEDIUM,
      pushEnabled: true,
      emailEnabled: true,
      smsEnabled: false
    },
    [NotificationCategory.PAYMENT]: {
      enabled: true,
      priority: NotificationPriority.HIGH,
      pushEnabled: true,
      emailEnabled: true,
      smsEnabled: true
    },
    [NotificationCategory.ACCOUNT]: {
      enabled: true,
      priority: NotificationPriority.MEDIUM,
      pushEnabled: true,
      emailEnabled: true,
      smsEnabled: false
    },
    [NotificationCategory.SYSTEM]: {
      enabled: true,
      priority: NotificationPriority.MEDIUM,
      pushEnabled: true,
      emailEnabled: false,
      smsEnabled: false
    },
    [NotificationCategory.COMMUNICATION]: {
      enabled: true,
      priority: NotificationPriority.MEDIUM,
      pushEnabled: true,
      emailEnabled: false,
      smsEnabled: false
    },
    [NotificationCategory.SAFETY]: {
      enabled: true,
      priority: NotificationPriority.CRITICAL,
      pushEnabled: true,
      emailEnabled: true,
      smsEnabled: true
    }
  },
  
  typeSettings: {},
  
  language: 'ar',
  timezone: 'Africa/Algiers',
  
  maxNotificationsPerHour: 10,
  maxNotificationsPerDay: 50,
  
  soundEnabled: true,
  vibrationEnabled: true,
  customSounds: {}
};

// Notification preferences manager
export class NotificationPreferencesManager {
  private static preferences: Map<string, NotificationPreferences> = new Map();

  // Initialize user preferences
  static async initializeUserPreferences(userId: string, role?: string): Promise<NotificationPreferences> {
    try {
      let prefs = this.preferences.get(userId);
      
      if (!prefs) {
        // Create default preferences based on user role
        prefs = {
          ...DEFAULT_PREFERENCES,
          userId,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // Customize defaults based on role
        if (role === 'driver') {
          prefs.categorySettings[NotificationCategory.BOOKING].priority = NotificationPriority.URGENT;
          prefs.categorySettings[NotificationCategory.TRIP].priority = NotificationPriority.HIGH;
          prefs.maxNotificationsPerHour = 15;
        } else if (role === 'admin') {
          prefs.categorySettings[NotificationCategory.SYSTEM].priority = NotificationPriority.HIGH;
          prefs.maxNotificationsPerHour = 25;
          prefs.maxNotificationsPerDay = 100;
        }

        this.preferences.set(userId, prefs);
      }

      return prefs;
    } catch (error) {
      throw error;
    }
  }

  // Get user preferences
  static async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    let prefs = this.preferences.get(userId);
    
    if (!prefs) {
      prefs = await this.initializeUserPreferences(userId);
    }
    
    return prefs;
  }

  // Update user preferences
  static async updateUserPreferences(
    userId: string, 
    updates: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    try {
      const currentPrefs = await this.getUserPreferences(userId);
      
      const updatedPrefs: NotificationPreferences = {
        ...currentPrefs,
        ...updates,
        userId, // Ensure userId is not overwritten
        updatedAt: new Date()
      };

      this.preferences.set(userId, updatedPrefs);
      
      return updatedPrefs;
    } catch (error) {
      throw error;
    }
  }

  // Check if notification should be sent based on preferences
  static async shouldSendNotification(
    userId: string,
    type: NotificationType,
    category: NotificationCategory,
    priority: NotificationPriority
  ): Promise<{
    shouldSend: boolean;
    reason?: string;
    allowedChannels: {
      push: boolean;
      email: boolean;
      sms: boolean;
    }
  }> {
    try {
      const prefs = await this.getUserPreferences(userId);

      // Check if notifications are globally disabled
      if (!prefs.enableNotifications) {
        return {
          shouldSend: false,
          reason: 'Notifications globally disabled',
          allowedChannels: { push: false, email: false, sms: false }
        };
      }

      // Check quiet hours
      if (this.isInQuietHours(prefs)) {
        // Only allow critical notifications during quiet hours
        if (priority !== NotificationPriority.CRITICAL) {
          return {
            shouldSend: false,
            reason: 'In quiet hours',
            allowedChannels: { push: false, email: false, sms: false }
          };
        }
      }

      // Check category settings
      const categorySettings = prefs.categorySettings[category];
      if (!categorySettings.enabled) {
        return {
          shouldSend: false,
          reason: 'Category disabled',
          allowedChannels: { push: false, email: false, sms: false }
        };
      }

      // Check type-specific settings
      const typeSettings = prefs.typeSettings[type];
      if (typeSettings && !typeSettings.enabled) {
        return {
          shouldSend: false,
          reason: 'Type disabled',
          allowedChannels: { push: false, email: false, sms: false }
        };
      }

      // Check rate limits
      const rateLimitCheck = await this.checkRateLimit(userId, prefs);
      if (!rateLimitCheck.allowed) {
        return {
          shouldSend: false,
          reason: rateLimitCheck.reason,
          allowedChannels: { push: false, email: false, sms: false }
        };
      }

      // Determine allowed channels
      const allowedChannels = {
        push: prefs.enablePushNotifications && 
              (typeSettings?.pushEnabled ?? categorySettings.pushEnabled),
        email: prefs.enableEmailNotifications && 
               (typeSettings?.emailEnabled ?? categorySettings.emailEnabled),
        sms: prefs.enableSMSNotifications && 
             (typeSettings?.smsEnabled ?? categorySettings.smsEnabled)
      };

      return {
        shouldSend: true,
        allowedChannels
      };
    } catch (error) {
      // Default to allowing the notification if there's an error
      return {
        shouldSend: true,
        allowedChannels: { push: true, email: false, sms: false }
      };
    }
  }

  // Check if current time is in quiet hours
  static isInQuietHours(prefs: NotificationPreferences): boolean {
    if (!prefs.quietHoursEnabled) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const startTime = prefs.quietHoursStart;
    const endTime = prefs.quietHoursEnd;

    // Handle overnight quiet hours (e.g., 22:00 to 07:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    } else {
      return currentTime >= startTime && currentTime <= endTime;
    }
  }

  // Check rate limiting
  static async checkRateLimit(
    userId: string, 
    prefs: NotificationPreferences
  ): Promise<{ allowed: boolean; reason?: string }> {
    // This is a simplified implementation
    // In a real system, you'd track notification counts in a database
    
    // For now, we'll use a simple in-memory counter
    const key = `notifications_${userId}`;
    const now = new Date();
    const hourKey = `${key}_${now.getFullYear()}_${now.getMonth()}_${now.getDate()}_${now.getHours()}`;
    const dayKey = `${key}_${now.getFullYear()}_${now.getMonth()}_${now.getDate()}`;

    // This would be replaced with actual database queries
    const hourlyCount = this.getNotificationCount(hourKey);
    const dailyCount = this.getNotificationCount(dayKey);

    if (hourlyCount >= prefs.maxNotificationsPerHour) {
      return {
        allowed: false,
        reason: 'Hourly rate limit exceeded'
      };
    }

    if (dailyCount >= prefs.maxNotificationsPerDay) {
      return {
        allowed: false,
        reason: 'Daily rate limit exceeded'
      };
    }

    // Increment counters
    this.incrementNotificationCount(hourKey);
    this.incrementNotificationCount(dayKey);

    return { allowed: true };
  }

  // Simple in-memory counter (would be replaced with database in production)
  private static notificationCounts: Map<string, number> = new Map();

  private static getNotificationCount(key: string): number {
    return this.notificationCounts.get(key) || 0;
  }

  private static incrementNotificationCount(key: string): void {
    const current = this.getNotificationCount(key);
    this.notificationCounts.set(key, current + 1);
  }

  // Get notification template based on user preferences
  static async getLocalizedTemplate(
    userId: string,
    type: NotificationType,
    templateData: Record<string, any>
  ): Promise<{ title: string; message: string }> {
    try {
      const prefs = await this.getUserPreferences(userId);
      
      // This would be expanded with proper internationalization
      const templates = this.getTemplatesForLanguage(prefs.language);
      const template = templates[type];

      if (!template) {
        // Fallback to Arabic
        const arabicTemplates = this.getTemplatesForLanguage('ar');
        return arabicTemplates[type] || { title: 'إشعار', message: 'لديك إشعار جديد' };
      }

      // Replace template variables
      const title = this.replaceTemplateVariables(template.title, templateData);
      const message = this.replaceTemplateVariables(template.message, templateData);

      return { title, message };
    } catch (error) {
      return { title: 'إشعار', message: 'لديك إشعار جديد' };
    }
  }

  // Get templates for specific language
  private static getTemplatesForLanguage(language: string): Partial<Record<NotificationType, { title: string; message: string }>> {
    // This would be loaded from proper i18n files
    const templates: Record<string, Partial<Record<NotificationType, { title: string; message: string }>>> = {
      ar: {
        [NotificationType.BOOKING_CREATED]: {
          title: '🎉 حجز جديد!',
          message: 'تم حجز {{seats}} مقعد في رحلتك من {{from}} إلى {{to}}'
        },
        [NotificationType.BOOKING_CONFIRMED]: {
          title: '✅ تم تأكيد حجزك',
          message: 'تم تأكيد حجزك مع السائق {{driverName}}'
        },
        [NotificationType.BOOKING_CANCELLED]: {
          title: '❌ تم إلغاء الحجز',
          message: 'تم إلغاء حجز #{{bookingId}}'
        },
        [NotificationType.WELCOME]: {
          title: '🎉 مرحباً بك!',
          message: 'مرحباً بك في منصتنا!'
        }
        // Add more templates as needed
      },
      en: {
        [NotificationType.BOOKING_CREATED]: {
          title: '🎉 New Booking!',
          message: '{{seats}} seat(s) booked for your trip from {{from}} to {{to}}'
        },
        [NotificationType.BOOKING_CONFIRMED]: {
          title: '✅ Booking Confirmed',
          message: 'Your booking with driver {{driverName}} has been confirmed'
        },
        [NotificationType.BOOKING_CANCELLED]: {
          title: '❌ Booking Cancelled',
          message: 'Booking #{{bookingId}} has been cancelled'
        },
        [NotificationType.WELCOME]: {
          title: '🎉 Welcome!',
          message: 'Welcome to our platform!'
        }
        // Add more templates as needed
      }
    };

    return templates[language] || templates.ar;
  }

  // Replace template variables
  private static replaceTemplateVariables(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  // Export user preferences
  static async exportUserPreferences(userId: string): Promise<NotificationPreferences> {
    return await this.getUserPreferences(userId);
  }

  // Import user preferences
  static async importUserPreferences(prefs: NotificationPreferences): Promise<void> {
    prefs.updatedAt = new Date();
    this.preferences.set(prefs.userId, prefs);
  }

  // Reset user preferences to defaults
  static async resetUserPreferences(userId: string, role?: string): Promise<NotificationPreferences> {
    this.preferences.delete(userId);
    return await this.initializeUserPreferences(userId, role);
  }
}

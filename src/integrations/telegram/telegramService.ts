// Telegram notification service for admin notifications
export class TelegramService {
  private static readonly BOT_TOKEN = '8551754184:AAHMA2tAc8_n9gHLGJrcgl9h_9jVr1SXSI4';
  private static readonly ADMIN_CHAT_ID = '7506216384';
  private static readonly API_URL = `https://api.telegram.org/bot${TelegramService.BOT_TOKEN}`;

  // Send message to admin via Telegram
  static async sendMessage(message: string): Promise<boolean> {
    try {
      const requestBody = {
        chat_id: TelegramService.ADMIN_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      };
      const response = await fetch(`${TelegramService.API_URL}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      const result = await response.json();
      if (result.ok) {
        return true;
      } else {
        return false;
      }
    } catch (error: any) {
      return false;
    }
  }

  // Send formatted notification about new user registration
  static async notifyNewUser(data: {
    userName: string;
    userRole: 'driver' | 'passenger' | 'admin' | 'developer';
    userEmail: string;
    userId: string;
  }): Promise<boolean> {
    try {
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

      const emoji = roleEmojis[data.userRole] || '👤';
      const roleName = roleNames[data.userRole] || data.userRole;

      const message = `
${emoji} <b>مستخدم جديد</b>

👤 الاسم: ${data.userName}
📧 البريد: ${data.userEmail}
🔑 الدور: ${roleName}
🆔 المعرف: ${data.userId}

⏰ الوقت: ${new Date().toLocaleString('ar-DZ', { timeZone: 'Africa/Algiers' })}
      `.trim();
      const result = await this.sendMessage(message);
      
      if (result) {
      } else {
      }
      
      return result;
    } catch (error: any) {
      return false;
    }
  }

  // Send formatted notification about new trip
  static async notifyNewTrip(data: {
    driverName: string;
    fromWilaya: string;
    toWilaya: string;
    pricePerSeat: number;
    availableSeats: number;
    tripId: string;
    driverId: string;
  }): Promise<boolean> {
    try {
      const message = `
🚗 <b>رحلة جديدة</b>

👤 السائق: ${data.driverName}
📍 من: ${data.fromWilaya}
📍 إلى: ${data.toWilaya}
💰 السعر للمقعد: ${data.pricePerSeat} دج
💺 المقاعد المتاحة: ${data.availableSeats}
🆔 معرف الرحلة: ${data.tripId}

⏰ الوقت: ${new Date().toLocaleString('ar-DZ', { timeZone: 'Africa/Algiers' })}
      `.trim();

      return await this.sendMessage(message);
    } catch (error) {
      return false;
    }
  }

  // Send formatted notification about account suspension
  static async notifyAccountSuspended(data: {
    userName: string;
    userRole: 'driver' | 'passenger';
    userEmail: string;
    userId: string;
    reason?: string;
    suspendedBy?: string;
  }): Promise<boolean> {
    try {
      const roleNames = {
        driver: 'سائق',
        passenger: 'راكب'
      };

      const roleName = roleNames[data.userRole] || data.userRole;

      let message = `
⚠️ <b>تم إيقاف حساب</b>

👤 الاسم: ${data.userName}
📧 البريد: ${data.userEmail}
🔑 الدور: ${roleName}
🆔 المعرف: ${data.userId}
      `;

      if (data.reason) {
        message += `\n📝 السبب: ${data.reason}`;
      }

      if (data.suspendedBy) {
        message += `\n👮 تم الإيقاف بواسطة: ${data.suspendedBy}`;
      }

      message += `\n\n⏰ الوقت: ${new Date().toLocaleString('ar-DZ', { timeZone: 'Africa/Algiers' })}`;

      return await this.sendMessage(message.trim());
    } catch (error) {
      return false;
    }
  }

  // Send formatted notification about payment received
  static async notifyPaymentReceived(data: {
    amount: number;
    bookingId: number | string;
    paymentMethod: string;
    payerName?: string;
    driverName?: string;
  }): Promise<boolean> {
    try {
      const message = `
💰 <b>دفعة جديدة</b>

💵 المبلغ: ${data.amount} دج
📋 رقم الحجز: #${data.bookingId}
💳 طريقة الدفع: ${data.paymentMethod}
${data.payerName ? `👤 الراكب: ${data.payerName}` : ''}
${data.driverName ? `🚗 السائق: ${data.driverName}` : ''}

⏰ الوقت: ${new Date().toLocaleString('ar-DZ', { timeZone: 'Africa/Algiers' })}
      `.trim();

      return await this.sendMessage(message);
    } catch (error) {
      return false;
    }
  }

  // Send formatted notification about contact form submission
  static async notifyContactForm(data: {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
  }): Promise<boolean> {
    try {
      const message = `
📧 <b>رسالة جديدة من نموذج الاتصال</b>

👤 الاسم: ${data.name}
📧 البريد الإلكتروني: ${data.email}
📱 رقم الهاتف: ${data.phone}
📌 الموضوع: ${data.subject}

💬 الرسالة:
${data.message}

⏰ الوقت: ${new Date().toLocaleString('ar-DZ', { timeZone: 'Africa/Algiers' })}
      `.trim();

      return await this.sendMessage(message);
    } catch (error) {
      return false;
    }
  }
}


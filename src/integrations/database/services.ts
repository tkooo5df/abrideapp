import { prisma } from './client';
import { wilayas } from '@/data/wilayas';

// Database service class for local SQLite operations
export class DatabaseService {
  // Profile operations
  static async createProfile(data: {
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    phone?: string;
    role?: string;
    wilaya?: string;
    commune?: string;
    address?: string;
    isVerified?: boolean;
  }) {
    return await prisma.profile.create({
      data: {
        id: data.id,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        fullName: data.fullName,
        phone: data.phone,
        role: data.role || 'passenger',
        wilaya: data.wilaya,
        commune: data.commune,
        address: data.address,
        isVerified: data.isVerified !== undefined ? data.isVerified : data.role === 'admin',
      },
    });
  }

  static async getProfile(id: string) {
    return await prisma.profile.findUnique({
      where: { id },
    });
  }

  static async updateProfile(id: string, data: any) {
    return await prisma.profile.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  // Trip operations
  static async createTrip(data: {
    driverId: string;
    vehicleId?: string;
    fromWilayaId: number;
    toWilayaId: number;
    departureDate: string;
    departureTime: string;
    pricePerSeat: number;
    totalSeats: number;
    description?: string;
  }) {
    return await prisma.trip.create({
      data: {
        driverId: data.driverId,
        vehicleId: data.vehicleId,
        fromWilayaId: data.fromWilayaId,
        toWilayaId: data.toWilayaId,
        departureDate: data.departureDate,
        departureTime: data.departureTime,
        pricePerSeat: data.pricePerSeat,
        totalSeats: data.totalSeats,
        availableSeats: data.totalSeats,
        description: data.description,
      },
    });
  }

  static async getTrips(driverId?: string) {
    return await prisma.trip.findMany({
      where: driverId ? { driverId } : {},
      include: {
        driver: true,
        vehicle: true,
        bookings: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getTripById(id: string) {
    return await prisma.trip.findUnique({
      where: { id },
      include: {
        driver: true,
        vehicle: true,
        bookings: true,
      },
    });
  }

  static async updateTrip(id: string, data: any) {
    return await prisma.trip.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  // Vehicle operations
  static async createVehicle(data: {
    driverId: string;
    make: string;
    model: string;
    year: number;
    color: string;
    licensePlate: string;
    seats: number;
  }) {
    return await prisma.vehicle.create({
      data: {
        driverId: data.driverId,
        make: data.make,
        model: data.model,
        year: data.year,
        color: data.color,
        licensePlate: data.licensePlate,
        seats: data.seats,
      },
    });
  }

  static async getVehicles(driverId?: string) {
    return await prisma.vehicle.findMany({
      where: driverId ? { driverId } : {},
      include: {
        driver: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getVehicleById(id: string) {
    return await prisma.vehicle.findUnique({
      where: { id },
      include: {
        driver: true,
      },
    });
  }

  static async updateVehicle(id: string, data: any) {
    return await prisma.vehicle.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  // Booking operations
  static async createBooking(data: {
    pickupLocation: string;
    destinationLocation: string;
    passengerId?: string;
    driverId?: string;
    tripId?: string;
    seatsBooked?: number;
    totalAmount?: number;
    paymentMethod?: string;
    notes?: string;
    pickupTime?: string;
    specialRequests?: string;
  }) {
    // Validate seat availability before creating booking
    const seatsRequested = data.seatsBooked || 1;
    const tripId = data.tripId;

    if (tripId) {
      // Get current trip details
      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
        select: {
          totalSeats: true,
          availableSeats: true,
          status: true
        }
      });

      if (!trip) {
        throw new Error('الرحلة غير موجودة');
      }

      // Check if trip is still available for booking
      if (trip.status === 'completed' || trip.status === 'cancelled') {
        throw new Error('لا يمكن الحجز على هذه الرحلة - الرحلة مكتملة أو ملغية');
      }

      // Get current bookings to calculate real availability
      const bookings = await prisma.booking.findMany({
        where: {
          tripId: tripId,
          status: {
            in: ['pending', 'confirmed', 'in_progress', 'completed']
          }
        },
        select: {
          seatsBooked: true
        }
      });

      // Calculate actual seats available
      const seatsBooked = bookings.reduce((sum, booking) => sum + booking.seatsBooked, 0);
      const seatsAvailable = Math.max(trip.totalSeats - seatsBooked, 0);

      // Validate seat availability
      if (seatsRequested > seatsAvailable) {
        throw new Error(`المقاعد المتاحة فقط ${seatsAvailable} مقعد، طلبت ${seatsRequested} مقاعد`);
      }
    }

    const booking = await prisma.booking.create({
      data: {
        pickupLocation: data.pickupLocation,
        destinationLocation: data.destinationLocation,
        passengerId: data.passengerId,
        driverId: data.driverId,
        tripId: data.tripId,
        seatsBooked: data.seatsBooked || 1,
        totalAmount: data.totalAmount,
        paymentMethod: data.paymentMethod || 'cod',
        notes: data.notes,
        pickupTime: data.pickupTime,
        specialRequests: data.specialRequests,
      },
    });

    // Reserve seats immediately even for pending bookings
    if (booking.tripId) {
      await this.updateTripAvailability(booking.tripId);
    }

    return booking;
  }

  static async getBookings(passengerId?: string, driverId?: string) {
    return await prisma.booking.findMany({
      where: {
        OR: [
          passengerId ? { passengerId } : {},
          driverId ? { driverId } : {},
        ].filter(Boolean),
      },
      include: {
        passenger: true,
        driver: true,
        trip: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getBookingById(id: number) {
    return await prisma.booking.findUnique({
      where: { id },
      include: {
        passenger: true,
        driver: true,
        trip: true,
      },
    });
  }

  static async updateBooking(id: number, data: any) {
    return await prisma.booking.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  static async deleteBooking(id: number) {
    return await prisma.booking.delete({
      where: { id },
    });
  }

  static async getAllBookings() {
    return await prisma.booking.findMany({
      include: {
        passenger: true,
        driver: true,
        trip: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async completeTripForAllPassengers(tripId: string) {
    // Get all bookings for this trip
    const tripBookings = await prisma.booking.findMany({
      where: {
        tripId: tripId,
        status: {
          in: ['pending', 'confirmed']
        }
      },
      include: {
        passenger: true,
        driver: true,
        trip: true,
      },
    });

    // Update all bookings to completed status
    const updatePromises = tripBookings.map(booking =>
      prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: 'completed',
          updatedAt: new Date(),
        },
      })
    );

    await Promise.all(updatePromises);

    // Update trip status to completed
    await prisma.trip.update({
      where: { id: tripId },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    return {
      completedBookings: tripBookings.length,
      tripId: tripId,
    };
  }

  // Updated method to get driver statistics with new trip completion logic
  static async getDriverStats(driverId: string) {
    try {
      // Count completed trips using the new logic
      const completedTripsCount = await this.getDriverCompletedTripsCount(driverId);

      // Count completed bookings
      const completedBookingsCount = await prisma.booking.count({
        where: {
          driverId: driverId,
          status: 'completed'
        }
      });

      // For average rating, we'll return 0 for now since we don't have access to the ratings table
      const averageRating = 0;

      return {
        completedTrips: completedTripsCount,
        averageRating: parseFloat(averageRating.toFixed(1)),
        totalEarnings: 0 // We'll implement earnings calculation later if needed
      };
    } catch (error) {
      throw error;
    }
  }

  static async getDriverCompletedTripsCount(driverId: string) {
    // Count unique trips that have been completed
    const completedTrips = await prisma.trip.findMany({
      where: {
        driverId: driverId,
        isActive: false,
        bookings: {
          some: {
            status: 'completed'
          }
        }
      },
      select: {
        id: true,
      },
    });

    return completedTrips.length;
  }

  // Notification operations
  static async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type?: string;
    relatedId?: string;
    priority?: string;
    actionUrl?: string;
  }) {
    return await prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type || 'info',
        relatedId: data.relatedId,
      },
    });
  }

  static async getNotifications(userId: string) {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async markNotificationAsRead(id: string) {
    return await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  // System settings operations
  static async getSystemSettings() {
    return await prisma.systemSetting.findMany();
  }

  static async getSystemSetting(key: string) {
    return await prisma.systemSetting.findUnique({
      where: { key },
    });
  }

  static async updateSystemSetting(key: string, value: string, updatedBy?: string) {
    return await prisma.systemSetting.upsert({
      where: { key },
      update: {
        value,
        updatedBy,
        updatedAt: new Date(),
      },
      create: {
        key,
        value,
        updatedBy,
      },
    });
  }

  // Admin logs operations
  static async createAdminLog(data: {
    adminId: string;
    action: string;
    targetType?: string;
    targetId?: string;
    details?: any;
  }) {
    return await prisma.adminLog.create({
      data: {
        adminId: data.adminId,
        action: data.action,
        targetType: data.targetType,
        targetId: data.targetId,
        details: data.details ? JSON.stringify(data.details) : null,
      },
    });
  }

  static async getAdminLogs(adminId?: string) {
    return await prisma.adminLog.findMany({
      where: adminId ? { adminId } : {},
      include: {
        admin: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Wilayas operations
  static async getWilayas() {
    return wilayas;
  }

  static async getWilayaById(id: number) {
    return wilayas.find(w => w.code === id.toString());
  }

  // Initialize default data
  static async initializeDefaultData() {
    // Create default system settings
    const defaultSettings = [
      { key: 'site_name', value: '"منصة أبريد"', description: 'اسم الموقع' },
      { key: 'site_description', value: '"أفضل خدمة نقل في الجزائر"', description: 'وصف الموقع' },
      { key: 'support_phone', value: '"+213 555 123 456"', description: 'رقم الدعم' },
      { key: 'support_email', value: '"support@abride.online"', description: 'بريد الدعم' },
      { key: 'default_language', value: '"ar"', description: 'اللغة الافتراضية' },
      { key: 'enable_notifications', value: 'true', description: 'تفعيل الإشعارات' },
      { key: 'enable_sms', value: 'true', description: 'تفعيل رسائل SMS' },
      { key: 'enable_email', value: 'true', description: 'تفعيل رسائل البريد' },
      { key: 'maintenance_mode', value: 'false', description: 'وضع الصيانة' },
      { key: 'registration_enabled', value: 'true', description: 'تفعيل التسجيل' },
      { key: 'driver_approval_required', value: 'true', description: 'مراجعة طلبات السائقين' },
      { key: 'min_booking_price', value: '500', description: 'الحد الأدنى للسعر' },
      { key: 'max_booking_price', value: '10000', description: 'الحد الأقصى للسعر' },
      { key: 'cancellation_fee', value: '200', description: 'رسوم الإلغاء' },
    ];

    for (const setting of defaultSettings) {
      await this.updateSystemSetting(setting.key, setting.value);
    }
  }

  // Update trip availability based on all bookings including pending ones
  static async updateTripAvailability(tripId: string) {
    try {
      // Get all bookings for this trip including pending ones to reserve seats immediately
      const bookings = await prisma.booking.findMany({
        where: {
          tripId: tripId,
          status: {
            in: ['pending', 'confirmed', 'in_progress', 'completed']
          }
        },
        select: {
          seatsBooked: true,
          status: true
        }
      });

      // Calculate total seats booked including pending reservations to prevent overbooking
      const seatsBooked = bookings.reduce((sum, booking) => sum + booking.seatsBooked, 0);

      // Get trip details
      const trip = await prisma.trip.findUnique({
        where: { id: tripId },
        select: {
          totalSeats: true,
          availableSeats: true,
          status: true
        }
      });

      if (!trip) {
        return;
      }

      if (trip.status === 'completed') {
        if (trip.availableSeats !== 0) {
          await prisma.trip.update({
            where: { id: tripId },
            data: {
              availableSeats: 0,
              updatedAt: new Date()
            }
          });
        }
        return { availableSeats: 0, status: 'completed' };
      }

      if (trip.status === 'cancelled') {
        return { availableSeats: trip.availableSeats, status: 'cancelled' };
      }

      const availableSeats = Math.max(trip.totalSeats - seatsBooked, 0);
      
      // Update trip status based on availability
      let newStatus = trip.status;
      if (availableSeats === 0 && trip.status === 'scheduled') {
        newStatus = 'fully_booked';
      } else if (availableSeats > 0 && trip.status === 'fully_booked') {
        newStatus = 'scheduled';
      }

      // Update trip with new availability and status
      await prisma.trip.update({
        where: { id: tripId },
        data: {
          availableSeats: availableSeats,
          status: newStatus,
          updatedAt: new Date()
        }
      });
      return { availableSeats, status: newStatus };
    } catch (error) {
      throw error;
    }
  }

  // Cancel expired pending bookings (older than 24 hours)
  static async cancelExpiredPendingBookings() {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Find pending bookings older than 24 hours
      const expiredBookings = await prisma.booking.findMany({
        where: {
          status: 'pending',
          createdAt: {
            lt: twentyFourHoursAgo
          }
        },
        include: {
          trip: true
        }
      });
      // Cancel each expired booking
      for (const booking of expiredBookings) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: 'cancelled',
            updatedAt: new Date()
          }
        });

        // Update trip availability after cancelling booking
        if (booking.tripId) {
          await this.updateTripAvailability(booking.tripId);
        }
      }

      return expiredBookings.length;
    } catch (error) {
      throw error;
    }
  }

  // Cancel booking and update trip availability
  static async cancelBooking(bookingId: number, reason?: string) {
    try {
      // Get booking details
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          trip: true
        }
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Update booking status to cancelled
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'cancelled',
          updatedAt: new Date()
        }
      });

      // Update trip availability
      if (booking.tripId) {
        await this.updateTripAvailability(booking.tripId);
      }
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Create notification
  static async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: string;
    category?: string;
    priority?: string;
    status?: string;
    relatedId?: string;
    relatedType?: string;
    actionUrl?: string;
    imageUrl?: string;
    scheduledFor?: Date;
    expiresAt?: Date;
    metadata?: any;
  }) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type || 'info',
          category: data.category || 'system',
          priority: data.priority || 'medium',
          status: data.status || 'pending',
          relatedId: data.relatedId,
          relatedType: data.relatedType,
          actionUrl: data.actionUrl,
          imageUrl: data.imageUrl,
          scheduledFor: data.scheduledFor,
          expiresAt: data.expiresAt,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
          isRead: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      return notification;
    } catch (error) {
      throw error;
    }
  }

  // Get notifications for user
  static async getNotifications(userId: string, limit: number = 50, offset: number = 0) {
    try {
      const notifications = await prisma.notification.findMany({
        where: {
          userId: userId
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: offset,
        take: limit
      });

      return notifications;
    } catch (error) {
      throw error;
    }
  }

  // Mark notification as read
  static async markNotificationAsRead(notificationId: string) {
    try {
      await prisma.notification.update({
        where: {
          id: notificationId
        },
        data: {
          isRead: true,
          updatedAt: new Date()
        }
      });
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Mark all notifications as read for user
  static async markAllNotificationsAsRead(userId: string) {
    try {
      await prisma.notification.updateMany({
        where: {
          userId: userId,
          isRead: false
        },
        data: {
          isRead: true,
          updatedAt: new Date()
        }
      });
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Delete notification
  static async deleteNotification(notificationId: string) {
    try {
      await prisma.notification.delete({
        where: {
          id: notificationId
        }
      });
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Get unread notifications count
  static async getUnreadNotificationsCount(userId: string) {
    try {
      const count = await prisma.notification.count({
        where: {
          userId: userId,
          isRead: false
        }
      });

      return count;
    } catch (error) {
      throw error;
    }
  }
}

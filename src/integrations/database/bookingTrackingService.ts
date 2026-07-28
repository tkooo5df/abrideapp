import { BrowserDatabaseService } from './browserServices';
import { NotificationService, NotificationType, NotificationCategory, NotificationPriority } from './notificationService';

// Booking status definitions
export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected'
}

// Booking events for tracking
export enum BookingEvent {
  CREATED = 'created',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
  STARTED = 'started',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  PASSENGER_ARRIVED = 'passenger_arrived',
  DRIVER_ARRIVED = 'driver_arrived',
  PAYMENT_RECEIVED = 'payment_received'
}

// Booking history entry interface
interface BookingHistoryEntry {
  id: string;
  bookingId: string;
  event: BookingEvent;
  status: BookingStatus;
  timestamp: string;
  notes?: string;
  actor: 'passenger' | 'driver' | 'system';
  actorId: string;
}

export class BookingTrackingService {
  
  // Track booking status change with trip completion logic
  static async trackStatusChange(
    bookingId: string,
    newStatus: BookingStatus,
    actor: 'passenger' | 'driver' | 'system',
    actorId: string,
    notes?: string
  ) {
    try {
      // Update booking status
      await BrowserDatabaseService.updateBooking(bookingId, { 
        status: newStatus as string,
        updated_at: new Date().toISOString()
      });
      // CRITICAL: Send notifications IMMEDIATELY after updateBooking
      // This is the most important step - send email to passenger
      try {
        const notificationResult = await this.sendStatusChangeNotifications(bookingId, newStatus, actor, actorId);
      } catch (notificationError: any) {
        // Don't throw - notifications are important but shouldn't break the status change
        // But log the error clearly so we can fix it
      }

      // Add to booking history (non-blocking)
      try {
        await this.addBookingHistoryEntry(bookingId, {
          event: this.getEventFromStatus(newStatus),
          status: newStatus,
          actor,
          actorId,
          notes
        });
      } catch (historyError) {
        // Don't throw - history is not critical
      }

      // If completing a booking, complete the entire trip for all passengers
      if (newStatus === BookingStatus.COMPLETED && actor === 'driver') {
        try {
          const booking = await this.getBookingById(bookingId);
          if (booking && booking.tripId) {
            const result = await BrowserDatabaseService.completeTripForAllPassengers(booking.tripId);
            // Send notifications to all passengers about trip completion
            await this.notifyAllPassengersOfTripCompletion(booking.tripId, actorId);
          }
        } catch (tripError) {
          // Don't throw error here to avoid breaking the booking completion
        }
      }

      // Update trip availability if needed
      if (newStatus === BookingStatus.CONFIRMED || newStatus === BookingStatus.CANCELLED || newStatus === BookingStatus.COMPLETED) {
        try {
          const booking = await this.getBookingById(bookingId);
          if (booking && booking.tripId) {
            await BrowserDatabaseService.updateTripAvailability(booking.tripId);
          } else {
          }
        } catch (tripAvailabilityError) {
          // Don't throw - trip availability is not critical
        }
      }
      return true;
    } catch (error: any) {
      throw error;
    }
  }

  // Get booking with full tracking history
  static async getBookingWithHistory(bookingId: string) {
    try {
      const booking = await this.getBookingById(bookingId);
      if (!booking) return null;

      const history = await this.getBookingHistory(bookingId);
      
      return {
        ...booking,
        history,
        currentStatus: booking.status,
        canCancel: this.canCancelBooking(booking.status),
        canConfirm: this.canConfirmBooking(booking.status),
        canComplete: this.canCompleteBooking(booking.status)
      };
    } catch (error) {
      throw error;
    }
  }

  // Add booking history entry
  private static async addBookingHistoryEntry(
    bookingId: string,
    entry: {
      event: BookingEvent;
      status: BookingStatus;
      actor: 'passenger' | 'driver' | 'system';
      actorId: string;
      notes?: string;
    }
  ) {
    try {
      const historyEntry: BookingHistoryEntry = {
        id: `hist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        bookingId,
        event: entry.event,
        status: entry.status,
        timestamp: new Date().toISOString(),
        notes: entry.notes,
        actor: entry.actor,
        actorId: entry.actorId
      };
      // Store in localStorage (in real app, this would be in database)
      const data = JSON.parse(localStorage.getItem('dz_taxi_database') || '{}');
      if (!data.bookingHistory) data.bookingHistory = [];
      data.bookingHistory.push(historyEntry);
      localStorage.setItem('dz_taxi_database', JSON.stringify(data));
      return historyEntry;
    } catch (error) {
      throw error;
    }
  }

  // Get booking history
  static async getBookingHistory(bookingId: string): Promise<BookingHistoryEntry[]> {
    const data = JSON.parse(localStorage.getItem('dz_taxi_database') || '{}');
    const history = data.bookingHistory || [];
    
    return history
      .filter((entry: BookingHistoryEntry) => entry.bookingId === bookingId)
      .sort((a: BookingHistoryEntry, b: BookingHistoryEntry) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
  }

  // Get booking by ID - Try Supabase first, then localStorage
  private static async getBookingById(bookingId: string) {
    try {
      // First, try to get from Supabase (most reliable)
      const supabaseBooking = await BrowserDatabaseService.getBookingById(bookingId);
      if (supabaseBooking) {
        return supabaseBooking;
      }
      
      // Fallback to localStorage
      const data = JSON.parse(localStorage.getItem('dz_taxi_database') || '{}');
      const bookings = data.bookings || [];
      const localBooking = bookings.find((booking: any) => booking.id === bookingId);
      
      if (localBooking) {
        return localBooking;
      }
      return null;
    } catch (error) {
      // Fallback to localStorage on error
      try {
        const data = JSON.parse(localStorage.getItem('dz_taxi_database') || '{}');
        const bookings = data.bookings || [];
        return bookings.find((booking: any) => booking.id === bookingId) || null;
      } catch (localError) {
        return null;
      }
    }
  }

  // Notify all passengers of trip completion
  static async notifyAllPassengersOfTripCompletion(tripId: string, driverId: string) {
    try {
      // Get all passengers for this trip with booking details
      // First, try to get completed bookings
      let { data: tripBookings, error } = await supabase
        .from('bookings')
        .select('id, passenger_id, trip_id, status')
        .eq('trip_id', tripId)
        .eq('status', 'completed');
      
      // If no completed bookings found, try to get all bookings for this trip
      if (!tripBookings || tripBookings.length === 0) {
        const allBookingsResult = await supabase
          .from('bookings')
          .select('id, passenger_id, trip_id, status')
          .eq('trip_id', tripId);
        
        if (allBookingsResult.error) {
          error = allBookingsResult.error;
          tripBookings = null;
        } else {
          tripBookings = allBookingsResult.data;
        }
      }

      if (error) {
        return;
      }

      if (!tripBookings || tripBookings.length === 0) {
        const allBookingsResult = await supabase
          .from('bookings')
          .select('id, passenger_id, trip_id, status')
          .eq('trip_id', tripId);
        
        if (allBookingsResult.error) {
          error = allBookingsResult.error;
        } else {
          tripBookings = allBookingsResult.data;
        }
      }

      if (error) {
        return;
      }

      if (!tripBookings || tripBookings.length === 0) {
        return;
      }
      // Get driver info for the notification
      const driver = await BrowserDatabaseService.getProfile(driverId);
      const driverName = driver ? (driver.fullName || driver.full_name || driver.firstName || 'السائق') : 'السائق';

      // Get trip info
      const trip = await BrowserDatabaseService.getTripById(tripId);
      const tripInfo = trip 
        ? `${trip.fromWilayaName || ''}${trip.fromWilayaId === 47 && (trip as any).fromKsar ? ` - ${(trip as any).fromKsar}` : ''} → ${trip.toWilayaName || ''}${trip.toWilayaId === 47 && (trip as any).toKsar ? ` - ${(trip as any).toKsar}` : ''}` 
        : 'الرحلة';

      // Send notification to each passenger with rating request
      const notificationPromises = tripBookings.map(async (booking) => {
        try {
          // Send completion notification
          await NotificationService.sendSmartNotification({
            userId: booking.passenger_id,
            title: '✅ تم إكمال الرحلة',
            message: `تم إكمال رحلتك بنجاح! نتمنى أن تكون الرحلة كانت ممتازة.`,
            type: NotificationType.BOOKING_COMPLETED,
            category: NotificationCategory.BOOKING,
            priority: NotificationPriority.MEDIUM,
            relatedId: booking.id.toString(),
            relatedType: 'booking',
            metadata: {
              tripId,
              driverId,
              driverName,
              tripInfo
            }
          });

          // Send rating request notification
          await NotificationService.sendSmartNotification({
            userId: booking.passenger_id,
            title: '⭐ كيف كانت رحلتك؟',
            message: `تم إكمال رحلتك مع ${driverName}. نرجو تقييم الرحلة لتساعدنا في تحسين الخدمة.`,
            type: NotificationType.RATING_REQUEST,
            category: NotificationCategory.BOOKING,
            priority: NotificationPriority.HIGH,
            relatedId: booking.id.toString(),
            relatedType: 'booking',
            metadata: {
              tripId,
              driverId,
              driverName,
              tripInfo,
              bookingId: booking.id.toString(),
              action: 'rate_trip'
            }
          });
        } catch (error) {
        }
      });

      await Promise.all(notificationPromises);
      // Calculate total amount from all completed bookings
      let totalAmount = 0;
      let paymentMethod = 'نقداً'; // Default payment method
      
      try {
        // Get all booking details to calculate total amount
        const bookingDetails = await Promise.all(
          tripBookings.map(async (booking: any) => {
            const bookingFull = await this.getBookingById(booking.id.toString());
            return bookingFull;
          })
        );
        
        // Calculate total amount
        totalAmount = bookingDetails.reduce((sum: number, booking: any) => {
          if (booking && booking.totalAmount) {
            return sum + (typeof booking.totalAmount === 'number' ? booking.totalAmount : parseFloat(booking.totalAmount) || 0);
          }
          return sum;
        }, 0);
        
        // Get payment method from first booking (assuming all bookings have same payment method)
        if (bookingDetails.length > 0 && bookingDetails[0]?.paymentMethod) {
          paymentMethod = bookingDetails[0].paymentMethod === 'cod' ? 'نقداً' : bookingDetails[0].paymentMethod;
        }
      } catch (amountError) {
        // Continue with default values
      }
      
      // Send combined notification to driver (trip completion + payment received)
      if (totalAmount > 0) {
        try {
          await NotificationService.notifyDriverTripCompletedWithPayment(
            tripId,
            driverId,
            totalAmount,
            paymentMethod
          );
        } catch (driverNotificationError) {
          // Don't fail the entire process if driver notification fails
        }
      } else {
      }
    } catch (error) {
    }
  }

  // Complete entire trip for all passengers (separate from individual booking completion)
  static async completeEntireTrip(tripId: string, driverId: string, notes?: string) {
    try {
      // Complete trip for all passengers using the database service
      const result = await BrowserDatabaseService.completeTripForAllPassengers(tripId);
      // Send notifications to all passengers about trip completion
      await this.notifyAllPassengersOfTripCompletion(tripId, driverId);
      
      // Add trip completion to booking history for all affected bookings
      const tripBookings = await this.getTripBookings(tripId);
      for (const booking of tripBookings) {
        await this.addBookingHistoryEntry(booking.id, {
          event: 'trip_completed',
          status: BookingStatus.COMPLETED,
          actor: 'driver',
          actorId: driverId,
          notes: notes || 'تم إكمال الرحلة بالكامل لجميع الركاب'
        });
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Get all bookings for a trip
  private static async getTripBookings(tripId: string) {
    try {
      const bookings = await BrowserDatabaseService.getBookingsWithDetails(undefined, undefined, tripId);
      return bookings || [];
    } catch (error) {
      return [];
    }
  }

  // Send notifications based on status change
  private static async sendStatusChangeNotifications(
    bookingId: string,
    newStatus: BookingStatus,
    actor: 'passenger' | 'driver' | 'system',
    actorId: string
  ) {
    try {
      // Get booking - getBookingById now tries Supabase first
      let booking = await this.getBookingById(bookingId);
      if (!booking) {
        // Try one more time after a short delay (in case of timing issues)
        await new Promise(resolve => setTimeout(resolve, 1000));
        booking = await this.getBookingById(bookingId);
        if (!booking) {
          return;
        }
      }
      switch (newStatus) {
        case BookingStatus.CONFIRMED:
          if (actor === 'driver') {
            try {
              // Import NotificationService if not already imported
              const { NotificationService } = await import('./notificationService');
              const result = await NotificationService.notifyBookingConfirmed(bookingId, actorId);
              if (!result || result.length === 0) {
              } else {
              }
            } catch (notificationError: any) {
              // Don't throw - log error but continue
            }
          } else {
          }
          break;
        
        case BookingStatus.CANCELLED:
          try {
            await NotificationService.notifyBookingCancelled(bookingId, actorId, 'تم إلغاء الحجز');
          } catch (error) {
          }
          break;
        
        case BookingStatus.COMPLETED:
          // Notify both parties about completion
          try {
            await NotificationService.sendSmartNotification({
              userId: booking.passengerId,
              title: 'تم إكمال الرحلة',
              message: 'تم إكمال رحلتك بنجاح. يمكنك الآن تقييم السائق.',
              type: NotificationType.BOOKING_COMPLETED,
              category: NotificationCategory.BOOKING,
              priority: NotificationPriority.MEDIUM,
              relatedId: bookingId,
              relatedType: 'booking'
            });
          } catch (error) {
          }
          
          // Simulate payment completion for cash on delivery
          if (booking.paymentMethod === 'cod') {
            try {
              await NotificationService.notifyPaymentReceived({
                bookingId: bookingId,
                amount: booking.totalAmount,
                paymentMethod: 'نقداً',
                payerId: booking.passengerId,
                recipientId: booking.driverId
              });
            } catch (paymentError) {
            }
          }
          break;
        
        case BookingStatus.REJECTED:
          try {
            await NotificationService.sendSmartNotification({
              userId: booking.passengerId,
              title: 'تم رفض الحجز',
              message: 'نأسف، تم رفض طلب الحجز من قبل السائق.',
              type: NotificationType.BOOKING_REJECTED,
              category: NotificationCategory.BOOKING,
              priority: NotificationPriority.HIGH,
              relatedId: bookingId,
              relatedType: 'booking'
            });
          } catch (error) {
          }
          break;
      }
    } catch (error) {
      // Don't throw - log error but don't break the booking status change
    }
  }

  // Helper method to get event from status
  private static getEventFromStatus(status: BookingStatus): BookingEvent {
    const statusToEvent = {
      [BookingStatus.PENDING]: BookingEvent.CREATED,
      [BookingStatus.CONFIRMED]: BookingEvent.CONFIRMED,
      [BookingStatus.REJECTED]: BookingEvent.REJECTED,
      [BookingStatus.IN_PROGRESS]: BookingEvent.STARTED,
      [BookingStatus.COMPLETED]: BookingEvent.COMPLETED,
      [BookingStatus.CANCELLED]: BookingEvent.CANCELLED
    };
    
    return statusToEvent[status] || BookingEvent.CREATED;
  }

  // Check if booking can be cancelled
  static canCancelBooking(status: string): boolean {
    return [BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(status as BookingStatus);
  }

  // Check if booking can be confirmed
  static canConfirmBooking(status: string): boolean {
    return status === BookingStatus.PENDING;
  }

  // Check if booking can be completed
  static canCompleteBooking(status: string): boolean {
    return [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS].includes(status as BookingStatus);
  }

  // Get status display info
  static getStatusInfo(status: string) {
    const statusInfo = {
      [BookingStatus.PENDING]: {
        label: 'في الانتظار',
        color: 'bg-yellow-100 text-yellow-800',
        variant: 'secondary' as const,
        icon: '⏳',
        description: 'في انتظار موافقة السائق'
      },
      [BookingStatus.CONFIRMED]: {
        label: 'مؤكد',
        color: 'bg-green-100 text-green-800',
        variant: 'default' as const,
        icon: '✅',
        description: 'تم تأكيد الحجز من قبل السائق'
      },
      [BookingStatus.IN_PROGRESS]: {
        label: 'قيد التنفيذ',
        color: 'bg-blue-100 text-blue-800',
        variant: 'default' as const,
        icon: '🚗',
        description: 'الرحلة جارية حالياً'
      },
      [BookingStatus.COMPLETED]: {
        label: 'مكتمل',
        color: 'bg-gray-100 text-gray-800',
        variant: 'outline' as const,
        icon: '🏁',
        description: 'تم إكمال الرحلة بنجاح'
      },
      [BookingStatus.CANCELLED]: {
        label: 'ملغي',
        color: 'bg-red-100 text-red-800',
        variant: 'destructive' as const,
        icon: '❌',
        description: 'تم إلغاء الحجز'
      },
      [BookingStatus.REJECTED]: {
        label: 'مرفوض',
        color: 'bg-red-100 text-red-800',
        variant: 'destructive' as const,
        icon: '🚫',
        description: 'تم رفض الحجز من قبل السائق'
      }
    };

    return statusInfo[status as BookingStatus] || statusInfo[BookingStatus.PENDING];
  }

  // Get all possible status transitions for a booking
  static getAvailableActions(currentStatus: string, userRole: 'driver' | 'passenger' | 'admin' | 'developer') {
    const actions: Array<{
      action: string;
      label: string;
      newStatus: BookingStatus;
      icon: string;
      variant: 'default' | 'destructive' | 'outline';
    }> = [];

    if (userRole === 'driver') {
      if (currentStatus === BookingStatus.PENDING) {
        actions.push(
          {
            action: 'confirm',
            label: 'قبول الحجز',
            newStatus: BookingStatus.CONFIRMED,
            icon: '✅',
            variant: 'default'
          },
          {
            action: 'reject',
            label: 'رفض الحجز',
            newStatus: BookingStatus.REJECTED,
            icon: '🚫',
            variant: 'destructive'
          }
        );
      }
      
      if (currentStatus === BookingStatus.CONFIRMED) {
        actions.push(
          {
            action: 'start',
            label: 'بدء الرحلة',
            newStatus: BookingStatus.IN_PROGRESS,
            icon: '🚗',
            variant: 'default'
          },
          {
            action: 'cancel',
            label: 'إلغاء الحجز',
            newStatus: BookingStatus.CANCELLED,
            icon: '❌',
            variant: 'destructive'
          }
        );
      }
      
      if (currentStatus === BookingStatus.IN_PROGRESS) {
        actions.push({
          action: 'complete',
          label: 'إكمال الرحلة',
          newStatus: BookingStatus.COMPLETED,
          icon: '🏁',
          variant: 'default'
        });
      }
    }

    if (userRole === 'passenger') {
      if ([BookingStatus.PENDING, BookingStatus.CONFIRMED].includes(currentStatus as BookingStatus)) {
        actions.push({
          action: 'cancel',
          label: 'إلغاء الحجز',
          newStatus: BookingStatus.CANCELLED,
          icon: '❌',
          variant: 'destructive'
        });
      }
    }

    return actions;
  }
}
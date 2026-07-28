import { DatabaseService } from './services';

// Seed data for local database
export const seedDatabase = async () => {
  // Skip seeding in browser environment
  if (typeof window !== 'undefined') {
    return;
  }
  
  try {
    // Create admin profile
    const adminProfile = await DatabaseService.createProfile({
      id: 'admin-1',
      email: 'admin@dztaxi.dz',
      firstName: 'محمد',
      lastName: 'بوعلي',
      fullName: 'محمد بوعلي',
      phone: '+213 555 123 456',
      role: 'admin',
      wilaya: 'الجزائر',
      commune: 'الجزائر الوسطى',
      address: 'شارع ديدوش مراد، الجزائر الوسطى',
      isVerified: true,
    });

    // Create multiple drivers
    const drivers = [
      {
        id: 'driver-1',
        email: 'ahmed.benali@dztaxi.dz',
        firstName: 'أحمد',
        lastName: 'بن علي',
        fullName: 'أحمد بن علي',
        phone: '+213 555 789 012',
        wilaya: 'الجزائر',
        commune: 'الجزائر الوسطى',
        address: 'حي القصبة، الجزائر',
      },
      {
        id: 'driver-2',
        email: 'omar.chaoui@dztaxi.dz',
        firstName: 'عمر',
        lastName: 'شاوي',
        fullName: 'عمر شاوي',
        phone: '+213 555 234 567',
        wilaya: 'وهران',
        commune: 'وهران الوسطى',
        address: 'شارع الأمير عبد القادر، وهران',
      },
      {
        id: 'driver-3',
        email: 'youssef.mansouri@dztaxi.dz',
        firstName: 'يوسف',
        lastName: 'منصوري',
        fullName: 'يوسف منصوري',
        phone: '+213 555 345 678',
        wilaya: 'قسنطينة',
        commune: 'قسنطينة الوسطى',
        address: 'حي الجامعة، قسنطينة',
      },
      {
        id: 'driver-4',
        email: 'karim.boumediene@dztaxi.dz',
        firstName: 'كريم',
        lastName: 'بومدين',
        fullName: 'كريم بومدين',
        phone: '+213 555 456 789',
        wilaya: 'عنابة',
        commune: 'عنابة الوسطى',
        address: 'حي الميناء، عنابة',
      }
    ];

    const driverProfiles = [];
    for (const driver of drivers) {
      const profile = await DatabaseService.createProfile({
        ...driver,
        role: 'driver',
        isVerified: true,
      });
      driverProfiles.push(profile);
    }

    // Create multiple passengers
    const passengers = [
      {
        id: 'passenger-1',
        email: 'fatima.zohra@dztaxi.dz',
        firstName: 'فاطمة',
        lastName: 'الزهراء',
        fullName: 'فاطمة الزهراء',
        phone: '+213 555 567 890',
        wilaya: 'الجزائر',
        commune: 'الجزائر الوسطى',
        address: 'حي باب الزوار، الجزائر',
      },
      {
        id: 'passenger-2',
        email: 'nour.benmoussa@dztaxi.dz',
        firstName: 'نور',
        lastName: 'بن موسى',
        fullName: 'نور بن موسى',
        phone: '+213 555 678 901',
        wilaya: 'وهران',
        commune: 'وهران الوسطى',
        address: 'حي سيدي الهواري، وهران',
      },
      {
        id: 'passenger-3',
        email: 'sara.touati@dztaxi.dz',
        firstName: 'سارة',
        lastName: 'تواتي',
        fullName: 'سارة تواتي',
        phone: '+213 555 789 012',
        wilaya: 'قسنطينة',
        commune: 'قسنطينة الوسطى',
        address: 'حي الأمير عبد القادر، قسنطينة',
      },
      {
        id: 'passenger-4',
        email: 'amina.belkacem@dztaxi.dz',
        firstName: 'أمينة',
        lastName: 'بلقاسم',
        fullName: 'أمينة بلقاسم',
        phone: '+213 555 890 123',
        wilaya: 'عنابة',
        commune: 'عنابة الوسطى',
        address: 'حي الجامعة، عنابة',
      },
      {
        id: 'passenger-5',
        email: 'hassan.bouali@dztaxi.dz',
        firstName: 'حسان',
        lastName: 'بوعلي',
        fullName: 'حسان بوعلي',
        phone: '+213 555 901 234',
        wilaya: 'الجزائر',
        commune: 'الجزائر الوسطى',
        address: 'حي القبة، الجزائر',
      }
    ];

    const passengerProfiles = [];
    for (const passenger of passengers) {
      const profile = await DatabaseService.createProfile({
        ...passenger,
        role: 'passenger',
        isVerified: true,
      });
      passengerProfiles.push(profile);
    }

    // Create multiple vehicles for each driver
    const vehicles = [];
    const vehicleData = [
      { make: 'Renault', model: 'Symbol', year: 2020, color: 'أبيض', licensePlate: '12345-أ-16', seats: 4 },
      { make: 'Peugeot', model: '206', year: 2019, color: 'أزرق', licensePlate: '67890-و-31', seats: 4 },
      { make: 'Hyundai', model: 'i10', year: 2021, color: 'أحمر', licensePlate: '11111-ق-25', seats: 4 },
      { make: 'Dacia', model: 'Logan', year: 2018, color: 'فضي', licensePlate: '22222-ع-23', seats: 4 },
    ];

    for (let i = 0; i < driverProfiles.length; i++) {
      const vehicle = await DatabaseService.createVehicle({
        driverId: driverProfiles[i].id,
        ...vehicleData[i],
      });
      vehicles.push(vehicle);
    }

    // Create realistic trips
    const trips = [];
    const tripData = [
      {
        driverId: driverProfiles[0].id,
        vehicleId: vehicles[0].id,
        fromWilayaId: 16, // الجزائر
        toWilayaId: 31, // وهران
        departureDate: '2024-12-15',
        departureTime: '08:00',
        pricePerSeat: 1500,
        totalSeats: 4,
        description: 'رحلة مريحة من الجزائر إلى وهران - مكيف هواء',
      },
      {
        driverId: driverProfiles[0].id,
        vehicleId: vehicles[0].id,
        fromWilayaId: 31, // وهران
        toWilayaId: 16, // الجزائر
        departureDate: '2024-12-16',
        departureTime: '14:00',
        pricePerSeat: 1500,
        totalSeats: 4,
        description: 'رحلة عودة من وهران إلى الجزائر',
      },
      {
        driverId: driverProfiles[1].id,
        vehicleId: vehicles[1].id,
        fromWilayaId: 31, // وهران
        toWilayaId: 25, // قسنطينة
        departureDate: '2024-12-17',
        departureTime: '09:30',
        pricePerSeat: 1200,
        totalSeats: 4,
        description: 'رحلة من وهران إلى قسنطينة - توقف في المدية',
      },
      {
        driverId: driverProfiles[2].id,
        vehicleId: vehicles[2].id,
        fromWilayaId: 25, // قسنطينة
        toWilayaId: 23, // عنابة
        departureDate: '2024-12-18',
        departureTime: '07:00',
        pricePerSeat: 1000,
        totalSeats: 4,
        description: 'رحلة صباحية من قسنطينة إلى عنابة',
      },
      {
        driverId: driverProfiles[3].id,
        vehicleId: vehicles[3].id,
        fromWilayaId: 23, // عنابة
        toWilayaId: 16, // الجزائر
        departureDate: '2024-12-19',
        departureTime: '16:00',
        pricePerSeat: 1800,
        totalSeats: 4,
        description: 'رحلة مسائية من عنابة إلى الجزائر',
      },
      {
        driverId: driverProfiles[0].id,
        vehicleId: vehicles[0].id,
        fromWilayaId: 16, // الجزائر
        toWilayaId: 25, // قسنطينة
        departureDate: '2024-12-20',
        departureTime: '10:00',
        pricePerSeat: 1300,
        totalSeats: 4,
        description: 'رحلة من الجزائر إلى قسنطينة - توقف في البويرة',
      },
      {
        driverId: driverProfiles[1].id,
        vehicleId: vehicles[1].id,
        fromWilayaId: 31, // وهران
        toWilayaId: 16, // الجزائر
        departureDate: '2024-12-21',
        departureTime: '11:30',
        pricePerSeat: 1500,
        totalSeats: 4,
        description: 'رحلة من وهران إلى الجزائر - مكيف هواء',
      },
      {
        driverId: driverProfiles[2].id,
        vehicleId: vehicles[2].id,
        fromWilayaId: 25, // قسنطينة
        toWilayaId: 31, // وهران
        departureDate: '2024-12-22',
        departureTime: '13:00',
        pricePerSeat: 1200,
        totalSeats: 4,
        description: 'رحلة من قسنطينة إلى وهران',
      }
    ];

    for (const trip of tripData) {
      const createdTrip = await DatabaseService.createTrip(trip);
      trips.push(createdTrip);
    }

    // Create realistic bookings
    const bookings = [];
    const bookingData = [
      {
        pickupLocation: 'الجزائر الوسطى - شارع ديدوش مراد',
        destinationLocation: 'وهران الوسطى - شارع الأمير عبد القادر',
        passengerId: passengerProfiles[0].id,
        driverId: driverProfiles[0].id,
        tripId: trips[0].id,
        seatsBooked: 2,
        totalAmount: 3000,
        paymentMethod: 'cod',
        notes: 'مقعدين بجانب بعض - لا تدخين',
        pickupTime: '08:00',
        specialRequests: 'مقعدين في الخلف',
      },
      {
        pickupLocation: 'وهران الوسطى - حي سيدي الهواري',
        destinationLocation: 'قسنطينة الوسطى - حي الجامعة',
        passengerId: passengerProfiles[1].id,
        driverId: driverProfiles[1].id,
        tripId: trips[2].id,
        seatsBooked: 1,
        totalAmount: 1200,
        paymentMethod: 'baridimob',
        notes: 'دفع عبر بريدي موب',
        pickupTime: '09:30',
        specialRequests: 'مقعد في الأمام',
      },
      {
        pickupLocation: 'قسنطينة الوسطى - حي الأمير عبد القادر',
        destinationLocation: 'عنابة الوسطى - حي الميناء',
        passengerId: passengerProfiles[2].id,
        driverId: driverProfiles[2].id,
        tripId: trips[3].id,
        seatsBooked: 1,
        totalAmount: 1000,
        paymentMethod: 'cod',
        notes: 'رحلة صباحية',
        pickupTime: '07:00',
        specialRequests: 'مقعد في الخلف',
      },
      {
        pickupLocation: 'عنابة الوسطى - حي الجامعة',
        destinationLocation: 'الجزائر الوسطى - حي القبة',
        passengerId: passengerProfiles[3].id,
        driverId: driverProfiles[3].id,
        tripId: trips[4].id,
        seatsBooked: 3,
        totalAmount: 5400,
        paymentMethod: 'baridimob',
        notes: 'عائلة من 3 أشخاص',
        pickupTime: '16:00',
        specialRequests: 'مقاعد في الخلف',
      },
      {
        pickupLocation: 'الجزائر الوسطى - حي باب الزوار',
        destinationLocation: 'قسنطينة الوسطى - حي الجامعة',
        passengerId: passengerProfiles[4].id,
        driverId: driverProfiles[0].id,
        tripId: trips[5].id,
        seatsBooked: 1,
        totalAmount: 1300,
        paymentMethod: 'cod',
        notes: 'رحلة عمل',
        pickupTime: '10:00',
        specialRequests: 'مقعد في الأمام',
      }
    ];

    for (const booking of bookingData) {
      const createdBooking = await DatabaseService.createBooking(booking);
      bookings.push(createdBooking);
    }

    // Create realistic notifications
    const notifications = [
      {
        userId: adminProfile.id,
        title: 'مرحباً بك في منصة أبريد',
        message: 'تم إعداد النظام بنجاح. يمكنك الآن إدارة التطبيق.',
        type: 'success',
      },
      {
        userId: driverProfiles[0].id,
        title: 'حجز جديد',
        message: 'تم حجز مقعدين في رحلتك إلى وهران',
        type: 'info',
        relatedId: bookings[0].id.toString(),
      },
      {
        userId: passengerProfiles[0].id,
        title: 'تأكيد الحجز',
        message: 'تم تأكيد حجزك بنجاح. سنتواصل معك قريباً.',
        type: 'success',
        relatedId: bookings[0].id.toString(),
      },
      {
        userId: driverProfiles[1].id,
        title: 'رحلة جديدة',
        message: 'تم إنشاء رحلة جديدة من وهران إلى قسنطينة',
        type: 'info',
        relatedId: trips[2].id,
      },
      {
        userId: passengerProfiles[1].id,
        title: 'تذكير بالرحلة',
        message: 'رحلة إلى قسنطينة غداً في الساعة 9:30',
        type: 'info',
        relatedId: bookings[1].id.toString(),
      },
      {
        userId: adminProfile.id,
        title: 'تقرير يومي',
        message: 'تم إنشاء 8 رحلات جديدة و 5 حجوزات اليوم',
        type: 'info',
      },
      {
        userId: driverProfiles[2].id,
        title: 'تقييم جديد',
        message: 'حصلت على تقييم 5 نجوم من راكب',
        type: 'success',
      },
      {
        userId: passengerProfiles[2].id,
        title: 'رحلة مكتملة',
        message: 'شكراً لك على استخدام منصة أبريد. نتمنى لك رحلة سعيدة!',
        type: 'success',
        relatedId: bookings[2].id.toString(),
      }
    ];

    for (const notification of notifications) {
      await DatabaseService.createNotification(notification);
    }

    // Initialize system settings
    await DatabaseService.initializeDefaultData();
  } catch (error) {
  }
};

// Auto-seed if in development
if (process.env.NODE_ENV === 'development') {
  // Only seed if database is empty
  DatabaseService.getSystemSettings().then(settings => {
    if (settings.length === 0) {
      seedDatabase();
    }
  }).catch(() => {
    // If error, try to seed anyway
    seedDatabase();
  });
}

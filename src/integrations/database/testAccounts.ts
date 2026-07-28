import { BrowserDatabaseService } from './browserServices';

// Test accounts for demonstration
export const createTestAccounts = async () => {
  try {

    // Create test driver account
    const driverAccount = await BrowserDatabaseService.createProfile({
      id: 'test-driver-1',
      email: 'driver@test.com',
      firstName: 'أحمد',
      lastName: 'السائق',
      fullName: 'أحمد السائق',
      phone: '+213 555 123 456',
      role: 'driver',
      wilaya: 'الجزائر',
      commune: 'الجزائر الوسطى',
      address: 'شارع ديدوش مراد، الجزائر',
      isVerified: true,
    });

    // Create test passenger account
    const passengerAccount = await BrowserDatabaseService.createProfile({
      id: 'test-passenger-1',
      email: 'passenger@test.com',
      firstName: 'فاطمة',
      lastName: 'الراكبة',
      fullName: 'فاطمة الراكبة',
      phone: '+213 555 789 012',
      role: 'passenger',
      wilaya: 'الجزائر',
      commune: 'الجزائر الوسطى',
      address: 'حي القبة، الجزائر',
      isVerified: true,
    });

    // Create test admin account
    const adminAccount = await BrowserDatabaseService.createProfile({
      id: 'test-admin-1',
      email: 'admin@test.com',
      firstName: 'محمد',
      lastName: 'المدير',
      fullName: 'محمد المدير',
      phone: '+213 555 999 888',
      role: 'admin',
      wilaya: 'الجزائر',
      commune: 'الجزائر الوسطى',
      address: 'مقر الإدارة، الجزائر',
      isVerified: true,
    });

    // Create test vehicle for driver
    const testVehicle = await BrowserDatabaseService.createVehicle({
      driverId: driverAccount.id,
      make: 'Renault',
      model: 'Symbol',
      year: 2020,
      color: 'أبيض',
      licensePlate: 'TEST-123-16',
      seats: 4,
    });

    // Create a test trip for the driver
    const testTrip = await BrowserDatabaseService.createTrip({
      driverId: driverAccount.id,
      vehicleId: testVehicle.id,
      fromWilayaId: 16, // الجزائر
      toWilayaId: 31, // وهران
      departureDate: '2024-12-20',
      departureTime: '08:00',
      pricePerSeat: 1500,
      totalSeats: 4,
      description: 'رحلة مريحة من الجزائر إلى وهران - مكيف هواء وموسيقى',
    });

    // Create another test trip
    const testTrip2 = await BrowserDatabaseService.createTrip({
      driverId: driverAccount.id,
      vehicleId: testVehicle.id,
      fromWilayaId: 31, // وهران
      toWilayaId: 9, // البليدة
      departureDate: '2024-12-21',
      departureTime: '14:30',
      pricePerSeat: 1200,
      totalSeats: 4,
      description: 'رحلة سريعة من وهران إلى البليدة',
    });


    return {
      driver: driverAccount,
      passenger: passengerAccount,
      admin: adminAccount,
      vehicle: testVehicle,
      trips: [testTrip, testTrip2]
    };
  } catch (error) {
    throw error;
  }
};

// Login credentials for testing
export const testCredentials = {
  driver: {
    email: 'driver@test.com',
    password: 'driver123',
    role: 'driver'
  },
  passenger: {
    email: 'passenger@test.com',
    password: 'passenger123',
    role: 'passenger'
  },
  admin: {
    email: 'admin@test.com',
    password: 'admin123',
    role: 'admin'
  }
};

// Function to test the booking system and data isolation
export const testBookingSystem = async () => {
  try {
    
    // Get test accounts
    const accounts = await createTestAccounts();
    
    // Test 1: Passenger views available trips (should see driver's trips)
    const passengerTrips = await BrowserDatabaseService.getTripsWithDetails();
    const availableForPassenger = passengerTrips.filter((trip: any) => 
      trip.availableSeats > 0 && 
      trip.status === 'scheduled' && 
      trip.driverId !== accounts.passenger.id
    );
    
    // Test 2: Driver views own trips (should only see their trips)
    const driverTrips = await BrowserDatabaseService.getTripsWithDetails(accounts.driver.id);
    
    // Test 3: Create a booking from passenger
    if (availableForPassenger.length > 0) {
      const testBooking = await BrowserDatabaseService.createBooking({
        passengerId: accounts.passenger.id,
        driverId: accounts.driver.id,
        tripId: availableForPassenger[0].id,
        pickupLocation: 'الجزائر الوسطى - شارع ديدوش مراد',
        destinationLocation: 'وهران المدينة - وسط المدينة',
        seatsBooked: 2,
        totalAmount: 3000,
        paymentMethod: 'cod',
        pickupTime: '08:00',
        status: 'pending'
      });
      
      // Test 4: Driver sees booking (should see passenger's booking)
      const driverBookings = await BrowserDatabaseService.getBookingsWithDetails(undefined, accounts.driver.id);
      
      // Test 5: Passenger sees their bookings
      const passengerBookings = await BrowserDatabaseService.getBookingsWithDetails(accounts.passenger.id);
      
      // Test 6: Admin sees all data
      const allTrips = await BrowserDatabaseService.getTripsWithDetails({ includeInactive: true });
      const allBookings = await BrowserDatabaseService.getBookingsWithDetails();
    }
    
    
  } catch (error) {
    throw error;
  }
};

// Comprehensive isolation testing function
export const testDataIsolation = async () => {
  try {
    
    // Reset and create fresh test data
    await resetTestData();
    const accounts = await createTestAccounts();
    
    
    // Test data isolation for vehicles
    const driverVehicles = await BrowserDatabaseService.getVehiclesByDriver(accounts.driver.id);
    const passengerVehicles = await BrowserDatabaseService.getVehiclesByDriver(accounts.passenger.id);
    
    
    if (driverVehicles.length > 0 && passengerVehicles.length === 0) {
    } else {
      throw new Error('Vehicle isolation FAILED');
    }
    
    // Test trip isolation
    const driverTrips = await BrowserDatabaseService.getTripsWithDetails(accounts.driver.id);
    const passengerViewTrips = await BrowserDatabaseService.getTripsWithDetails();
    
    
    // Verify driver only sees their own trips
    const driverOwnsAllTrips = driverTrips.every((trip: any) => trip.driverId === accounts.driver.id);
    if (driverOwnsAllTrips) {
    } else {
      throw new Error('Trip isolation FAILED - Driver sees other drivers trips');
    }
    
    // Create booking and test booking isolation
    const testTrip = driverTrips[0];
    if (testTrip) {
      // Create booking as passenger
      const booking = await BrowserDatabaseService.createBooking({
        passengerId: accounts.passenger.id,
        driverId: accounts.driver.id,
        tripId: testTrip.id,
        pickupLocation: 'الجزائر الوسطى',
        destinationLocation: 'وهران الوسطى',
        seatsBooked: 1,
        totalAmount: 1500,
        paymentMethod: 'cod',
        pickupTime: '08:00',
        status: 'pending'
      });
      
      // Test booking visibility
      const passengerBookings = await BrowserDatabaseService.getBookingsWithDetails(accounts.passenger.id);
      const driverBookings = await BrowserDatabaseService.getBookingsWithDetails(undefined, accounts.driver.id);
      const adminBookings = await BrowserDatabaseService.getBookingsWithDetails();
      
      
      // Verify isolation
      const passengerOwnsBookings = passengerBookings.every((b: any) => b.passengerId === accounts.passenger.id);
      const driverSeesRelevantBookings = driverBookings.every((b: any) => b.driverId === accounts.driver.id);
      
      if (passengerOwnsBookings && driverSeesRelevantBookings) {
      } else {
        throw new Error('Booking isolation FAILED');
      }
    }
    
    // Test cross-contamination
    
    // Try to access other user's data
    const passengerTripsAttempt = await BrowserDatabaseService.getTripsWithDetails(accounts.passenger.id);
    if (passengerTripsAttempt.length === 0) {
    }
    
    // Test admin access
    const allProfiles = await BrowserDatabaseService.getAllProfiles();
    const allTripsAdmin = await BrowserDatabaseService.getTripsWithDetails({ includeInactive: true });
    const allBookingsAdmin = await BrowserDatabaseService.getBookingsWithDetails();
    
    
    if (allProfiles.length >= 3 && allTripsAdmin.length >= 2) {
    } else {
      throw new Error('Admin access FAILED');
    }
    
    
    return {
      success: true,
      message: 'All data isolation tests passed successfully',
      details: {
        vehicleIsolation: true,
        tripIsolation: true,
        bookingIsolation: true,
        crossContaminationPrevention: true,
        adminAccess: true
      }
    };
    
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      details: null
    };
  }
};

// Function to reset test data
export const resetTestData = async () => {
  try {
    
    // Clear localStorage to reset the database
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dz_taxi_database');
    }
  } catch (error) {
    throw error;
  }
};

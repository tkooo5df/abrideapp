import React, { useState, useEffect } from 'react';
import { BrowserDatabaseService } from '@/integrations/database/browserServices';

const DatabaseTestPage = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);

  const runTest = async () => {
    try {
      setTestResult('Running database test...');
      
      // Clear existing data first
      await BrowserDatabaseService.clearAllData();
      
      // Create a test profile
      const testProfile = await BrowserDatabaseService.createProfile({
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        fullName: 'Test User',
        phone: '+213 555 123 456',
        role: 'passenger',
        wilaya: 'الجزائر',
        commune: 'الجزائر الوسطى',
        address: 'Test Address',
        isVerified: true,
      } as any); // Using 'as any' to bypass TypeScript error for testing
      
      setTestResult(`Created profile: ${testProfile.id}`);
      
      // Create a test vehicle
      const testVehicle = await BrowserDatabaseService.createVehicle({
        driverId: testProfile.id,
        make: 'Test',
        model: 'Vehicle',
        year: 2020,
        color: 'أبيض',
        licensePlate: 'TEST-123',
        seats: 4,
      });
      
      setTestResult(`Created vehicle: ${testVehicle.id}`);
      
      // Create a test trip
      const testTrip = await BrowserDatabaseService.createTrip({
        driverId: testProfile.id,
        vehicleId: testVehicle.id,
        fromWilayaId: 16,
        toWilayaId: 31,
        departureDate: '2024-12-20',
        departureTime: '08:00',
        pricePerSeat: 1500,
        totalSeats: 4,
        description: 'Test trip',
      });
      
      setTestResult(`Created trip: ${testTrip.id}`);
      
      // Create a test booking
      const testBooking = await BrowserDatabaseService.createBooking({
        passengerId: testProfile.id,
        driverId: testProfile.id,
        tripId: testTrip.id,
        pickupLocation: 'Test Pickup',
        destinationLocation: 'Test Destination',
        seatsBooked: 2,
        totalAmount: 3000,
        paymentMethod: 'cod',
        pickupTime: '08:00',
      });
      
      setTestResult(`Created booking: ${testBooking.id}`);
      
      // Retrieve all data
      const allProfiles = await BrowserDatabaseService.getAllProfiles();
      const allVehicles = await BrowserDatabaseService.getAllVehicles();
      const allTrips = await BrowserDatabaseService.getTrips({ includeInactive: true });
      const allBookings = await BrowserDatabaseService.getAllBookings();
      
      setProfiles(allProfiles);
      setVehicles(allVehicles);
      setTrips(allTrips);
      setBookings(allBookings);
      
      setTestResult(`Test completed successfully! Profiles: ${allProfiles.length}, Vehicles: ${allVehicles.length}, Trips: ${allTrips.length}, Bookings: ${allBookings.length}`);
    } catch (error) {
      setTestResult(`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const clearData = async () => {
    try {
      await BrowserDatabaseService.clearAllData();
      setTestResult('Data cleared successfully');
      setProfiles([]);
      setVehicles([]);
      setTrips([]);
      setBookings([]);
    } catch (error) {
      setTestResult(`Clear failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const loadData = async () => {
    try {
      const allProfiles = await BrowserDatabaseService.getAllProfiles();
      const allVehicles = await BrowserDatabaseService.getAllVehicles();
      const allTrips = await BrowserDatabaseService.getTrips({ includeInactive: true });
      const allBookings = await BrowserDatabaseService.getAllBookings();
      
      setProfiles(allProfiles);
      setVehicles(allVehicles);
      setTrips(allTrips);
      setBookings(allBookings);
      
      setTestResult(`Data loaded! Profiles: ${allProfiles.length}, Vehicles: ${allVehicles.length}, Trips: ${allTrips.length}, Bookings: ${allBookings.length}`);
    } catch (error) {
      setTestResult(`Load failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Database Test Page</h1>
      <div className="mb-4">
        <button 
          onClick={runTest}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
        >
          Run Test
        </button>
        <button 
          onClick={clearData}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mr-2"
        >
          Clear Data
        </button>
        <button 
          onClick={loadData}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Load Data
        </button>
      </div>
      <div className="mb-4">
        <p className="font-semibold">Test Result:</p>
        <p className="p-2 bg-gray-100 rounded">{testResult}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-2">Profiles ({profiles.length})</h2>
          <div className="bg-gray-100 p-2 rounded max-h-60 overflow-y-auto">
            {profiles.length > 0 ? (
              <pre className="text-xs">{JSON.stringify(profiles, null, 2)}</pre>
            ) : (
              <p>No profiles found</p>
            )}
          </div>
        </div>
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-2">Vehicles ({vehicles.length})</h2>
          <div className="bg-gray-100 p-2 rounded max-h-60 overflow-y-auto">
            {vehicles.length > 0 ? (
              <pre className="text-xs">{JSON.stringify(vehicles, null, 2)}</pre>
            ) : (
              <p>No vehicles found</p>
            )}
          </div>
        </div>
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-2">Trips ({trips.length})</h2>
          <div className="bg-gray-100 p-2 rounded max-h-60 overflow-y-auto">
            {trips.length > 0 ? (
              <pre className="text-xs">{JSON.stringify(trips, null, 2)}</pre>
            ) : (
              <p>No trips found</p>
            )}
          </div>
        </div>
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-2">Bookings ({bookings.length})</h2>
          <div className="bg-gray-100 p-2 rounded max-h-60 overflow-y-auto">
            {bookings.length > 0 ? (
              <pre className="text-xs">{JSON.stringify(bookings, null, 2)}</pre>
            ) : (
              <p>No bookings found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseTestPage;
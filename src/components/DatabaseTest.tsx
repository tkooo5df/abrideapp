import React, { useState } from 'react';
import { BrowserDatabaseService } from '@/integrations/database/browserServices';

const DatabaseTest = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);

  const runTest = async () => {
    try {
      setTestResult('Running database test...');
      
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
      
      // Retrieve all data
      const allProfiles = await BrowserDatabaseService.getAllProfiles();
      const allVehicles = await BrowserDatabaseService.getAllVehicles();
      const allTrips = await BrowserDatabaseService.getTrips({ includeInactive: true });
      
      setProfiles(allProfiles);
      setVehicles(allVehicles);
      setTrips(allTrips);
      
      setTestResult(`Test completed successfully! Profiles: ${allProfiles.length}, Vehicles: ${allVehicles.length}, Trips: ${allTrips.length}`);
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
    } catch (error) {
      setTestResult(`Clear failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Database Test</h2>
      <div className="mb-4">
        <button 
          onClick={runTest}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
        >
          Run Test
        </button>
        <button 
          onClick={clearData}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Clear Data
        </button>
      </div>
      <div className="mb-4">
        <p className="font-semibold">Test Result:</p>
        <p>{testResult}</p>
      </div>
      <div className="mb-4">
        <p className="font-semibold">Profiles ({profiles.length}):</p>
        <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(profiles, null, 2)}</pre>
      </div>
      <div className="mb-4">
        <p className="font-semibold">Vehicles ({vehicles.length}):</p>
        <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(vehicles, null, 2)}</pre>
      </div>
      <div className="mb-4">
        <p className="font-semibold">Trips ({trips.length}):</p>
        <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(trips, null, 2)}</pre>
      </div>
    </div>
  );
};

export default DatabaseTest;
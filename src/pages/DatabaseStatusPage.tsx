import React, { useState, useEffect } from 'react';
import { getDatabaseStatus } from '@/integrations/database/databaseInitializer';

const DatabaseStatusPage = () => {
  const [status, setStatus] = useState<any>(null);
  const [localStorageData, setLocalStorageData] = useState<string>('');

  const loadStatus = () => {
    try {
      const dbStatus = getDatabaseStatus();
      setStatus(dbStatus);
      
      // Also get raw localStorage data
      const rawData = localStorage.getItem('dz_taxi_database');
      setLocalStorageData(rawData || 'No data found');
    } catch (error) {
      setStatus({
        status: 'error',
        message: 'Error loading status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Database Status</h1>
      <div className="mb-4">
        <button 
          onClick={loadStatus}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Refresh Status
        </button>
      </div>
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">Database Status</h2>
        <div className="bg-gray-100 p-4 rounded">
          {status ? (
            <div>
              <p><strong>Status:</strong> {status.status}</p>
              <p><strong>Message:</strong> {status.message}</p>
              {status.data && (
                <div className="mt-2">
                  <p><strong>Data Counts:</strong></p>
                  <ul className="list-disc list-inside">
                    <li>Profiles: {status.data.profiles}</li>
                    <li>Vehicles: {status.data.vehicles}</li>
                    <li>Trips: {status.data.trips}</li>
                    <li>Bookings: {status.data.bookings}</li>
                    <li>Notifications: {status.data.notifications}</li>
                    <li>System Settings: {status.data.systemSettings}</li>
                  </ul>
                </div>
              )}
              {status.error && (
                <p className="text-red-500 mt-2"><strong>Error:</strong> {status.error}</p>
              )}
            </div>
          ) : (
            <p>Loading...</p>
          )}
        </div>
      </div>
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">Raw LocalStorage Data</h2>
        <div className="bg-gray-100 p-4 rounded max-h-96 overflow-y-auto">
          <pre className="text-xs whitespace-pre-wrap">{localStorageData}</pre>
        </div>
      </div>
    </div>
  );
};

export default DatabaseStatusPage;
import React, { useState } from 'react';
import { fixDatabase, clearDatabase, getDatabaseData, checkLocalStorage } from '@/integrations/database/databaseFix';

const DatabaseFixPage = () => {
  const [result, setResult] = useState<string>('');
  const [databaseData, setDatabaseData] = useState<any>(null);

  const runFix = async () => {
    try {
      setResult('Running database fix...');
      const success = await fixDatabase();
      
      if (success) {
        setResult('Database fix completed successfully!');
      } else {
        setResult('Database fix failed!');
      }
    } catch (error) {
      setResult(`Fix failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const clearDb = async () => {
    try {
      setResult('Clearing database...');
      const success = clearDatabase();
      
      if (success) {
        setResult('Database cleared successfully!');
        setDatabaseData(null);
      } else {
        setResult('Failed to clear database!');
      }
    } catch (error) {
      setResult(`Clear failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const checkStorage = () => {
    try {
      setResult('Checking localStorage...');
      const working = checkLocalStorage();
      
      if (working) {
        setResult('LocalStorage is working properly!');
      } else {
        setResult('LocalStorage is NOT working properly!');
      }
    } catch (error) {
      setResult(`Check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const loadData = () => {
    try {
      setResult('Loading database data...');
      const data = getDatabaseData();
      
      if (data) {
        setDatabaseData(data);
        setResult(`Data loaded! Profiles: ${data.profiles.length}, Vehicles: ${data.vehicles.length}, Trips: ${data.trips.length}, Bookings: ${data.bookings.length}`);
      } else {
        setDatabaseData(null);
        setResult('No data found in database');
      }
    } catch (error) {
      setResult(`Load failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Database Fix Page</h1>
      <div className="mb-4">
        <button 
          onClick={checkStorage}
          className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded mr-2"
        >
          Check LocalStorage
        </button>
        <button 
          onClick={runFix}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
        >
          Fix Database
        </button>
        <button 
          onClick={clearDb}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mr-2"
        >
          Clear Database
        </button>
        <button 
          onClick={loadData}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Load Data
        </button>
      </div>
      <div className="mb-4">
        <p className="font-semibold">Result:</p>
        <p className="p-2 bg-gray-100 rounded">{result}</p>
      </div>
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-2">Database Data</h2>
        <div className="bg-gray-100 p-2 rounded max-h-96 overflow-y-auto">
          {databaseData ? (
            <pre className="text-xs">{JSON.stringify(databaseData, null, 2)}</pre>
          ) : (
            <p>No data loaded</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatabaseFixPage;
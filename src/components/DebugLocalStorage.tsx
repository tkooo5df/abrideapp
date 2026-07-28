import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const DebugLocalStorage = () => {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const checkData = () => {
    try {
      const storageKey = 'dz_taxi_database';
      const rawData = localStorage.getItem(storageKey);
      if (rawData) {
        const parsed = JSON.parse(rawData);
        setData(parsed);
        setError(null);
      } else {
        setData(null);
        setError('No data found in localStorage');
      }
    } catch (err) {
      setError(`Error reading localStorage: ${err.message}`);
      setData(null);
    }
  };

  const clearData = () => {
    try {
      const storageKey = 'dz_taxi_database';
      localStorage.removeItem(storageKey);
      checkData(); // Refresh the display
    } catch (err) {
      setError(`Error clearing data: ${err.message}`);
    }
  };

  useEffect(() => {
    checkData();
  }, []);

  return (
    <Card className="m-4">
      <CardHeader>
        <CardTitle>Debug LocalStorage Data</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={checkData}>Refresh Data</Button>
            <Button variant="destructive" onClick={clearData}>Clear Data</Button>
          </div>
          
          {error && (
            <div className="p-4 bg-red-100 text-red-800 rounded">
              {error}
            </div>
          )}
          
          {data && (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold">Profiles Count: {data.profiles?.length || 0}</h3>
              </div>
              
              <div>
                <h4 className="font-bold">Profiles:</h4>
                <pre className="bg-gray-100 p-2 rounded max-h-96 overflow-auto text-xs">
                  {JSON.stringify(data.profiles, null, 2)}
                </pre>
              </div>
              
              <div>
                <h4 className="font-bold">System Settings:</h4>
                <pre className="bg-gray-100 p-2 rounded max-h-96 overflow-auto text-xs">
                  {JSON.stringify(data.systemSettings, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DebugLocalStorage;
// Utility functions to fix database issues

/**
 * Check if localStorage is working properly
 */
export const checkLocalStorage = () => {
  try {
    const testKey = 'dz_taxi_test';
    const testValue = 'test_value';
    
    // Try to set an item
    localStorage.setItem(testKey, testValue);
    
    // Try to get the item
    const retrievedValue = localStorage.getItem(testKey);
    
    // Clean up
    localStorage.removeItem(testKey);
    
    return retrievedValue === testValue;
  } catch (error) {
    return false;
  }
};

/**
 * Fix database by ensuring proper initialization
 */
export const fixDatabase = async () => {
  try {
    const localStorageWorking = checkLocalStorage();
    
    if (!localStorageWorking) {
      return false;
    }
    
    const storageKey = 'dz_taxi_database';
    const rawData = localStorage.getItem(storageKey);
    
    if (!rawData) {
      // Initialize with empty data structure
      const initialData = {
        profiles: [],
        vehicles: [],
        trips: [],
        bookings: [],
        notifications: [],
        systemSettings: []
      };
      
      localStorage.setItem(storageKey, JSON.stringify(initialData));
    } else {
      try {
        const data = JSON.parse(rawData);
        
        // Ensure all required arrays exist
        const requiredKeys = ['profiles', 'vehicles', 'trips', 'bookings', 'notifications', 'systemSettings'];
        let fixed = false;
        
        for (const key of requiredKeys) {
          if (!data.hasOwnProperty(key)) {
            data[key] = [];
            fixed = true;
          }
        }
        
        if (fixed) {
          localStorage.setItem(storageKey, JSON.stringify(data));
        } else {
        }
      } catch (parseError) {
        // Initialize with empty data structure
        const initialData = {
          profiles: [],
          vehicles: [],
          trips: [],
          bookings: [],
          notifications: [],
          systemSettings: []
        };
        
        localStorage.setItem(storageKey, JSON.stringify(initialData));
      }
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Clear all database data
 */
export const clearDatabase = () => {
  try {
    const storageKey = 'dz_taxi_database';
    localStorage.removeItem(storageKey);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get all database data for debugging
 */
export const getDatabaseData = () => {
  try {
    const storageKey = 'dz_taxi_database';
    const rawData = localStorage.getItem(storageKey);
    
    if (!rawData) {
      return null;
    }
    
    return JSON.parse(rawData);
  } catch (error) {
    return null;
  }
};

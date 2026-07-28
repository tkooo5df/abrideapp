// Database initializer to ensure proper setup on app startup

/**
 * Ensure database is properly initialized
 */
export const initializeDatabase = () => {
  try {
    const storageKey = 'dz_taxi_database';
    
    // Check if data already exists
    const existingData = localStorage.getItem(storageKey);
    
    if (!existingData) {
      // Initialize with default structure
      const defaultData = {
        profiles: [],
        vehicles: [],
        trips: [],
        bookings: [],
        notifications: [],
        systemSettings: [
          {
            id: 'setting_1',
            key: 'app_name',
            value: 'منصة أبريد',
            description: 'اسم التطبيق',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'setting_2',
            key: 'app_version',
            value: '1.0.0',
            description: 'إصدار التطبيق',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'setting_3',
            key: 'maintenance_mode',
            value: 'false',
            description: 'وضع الصيانة',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 'setting_4',
            key: 'seed_demo_data',
            value: 'false',
            description: 'تفعيل إنشاء بيانات تجريبية تلقائياً',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      };
      
      localStorage.setItem(storageKey, JSON.stringify(defaultData));
      return true;
    } else {
      // Validate existing data structure
      try {
        const data = JSON.parse(existingData);
        
        // Ensure all required arrays exist
        const requiredKeys = ['profiles', 'vehicles', 'trips', 'bookings', 'notifications', 'systemSettings'];
        let needsUpdate = false;
        
        for (const key of requiredKeys) {
          if (!data.hasOwnProperty(key)) {
            data[key] = [];
            needsUpdate = true;
          }
        }
        
        // Ensure system settings exist
        if (!data.systemSettings || data.systemSettings.length === 0) {
          data.systemSettings = [
            {
              id: 'setting_1',
              key: 'app_name',
              value: 'منصة أبريد',
              description: 'اسم التطبيق',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'setting_2',
              key: 'app_version',
              value: '1.0.0',
              description: 'إصدار التطبيق',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'setting_3',
              key: 'maintenance_mode',
              value: 'false',
              description: 'وضع الصيانة',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'setting_4',
              key: 'seed_demo_data',
              value: 'false',
              description: 'تفعيل إنشاء بيانات تجريبية تلقائياً',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ];
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          localStorage.setItem(storageKey, JSON.stringify(data));
        } else {
        }
        
        return true;
      } catch (parseError) {
        // Reinitialize with default structure
        const defaultData = {
          profiles: [],
          vehicles: [],
          trips: [],
          bookings: [],
          notifications: [],
          systemSettings: [
            {
              id: 'setting_1',
              key: 'app_name',
              value: 'منصة أبريد',
              description: 'اسم التطبيق',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'setting_2',
              key: 'app_version',
              value: '1.0.0',
              description: 'إصدار التطبيق',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'setting_3',
              key: 'maintenance_mode',
              value: 'false',
              description: 'وضع الصيانة',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'setting_4',
              key: 'seed_demo_data',
              value: 'false',
              description: 'تفعيل إنشاء datos تجريبية تلقائياً',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ]
        };
        
        localStorage.setItem(storageKey, JSON.stringify(defaultData));
        return true;
      }
    }
  } catch (error) {
    return false;
  }
};

/**
 * Get current database status
 */
export const getDatabaseStatus = () => {
  try {
    const storageKey = 'dz_taxi_database';
    const rawData = localStorage.getItem(storageKey);
    
    if (!rawData) {
      return {
        status: 'empty',
        message: 'Database is empty',
        data: null
      };
    }
    
    const data = JSON.parse(rawData);
    return {
      status: 'initialized',
      message: 'Database is initialized',
      data: {
        profiles: data.profiles?.length || 0,
        vehicles: data.vehicles?.length || 0,
        trips: data.trips?.length || 0,
        bookings: data.bookings?.length || 0,
        notifications: data.notifications?.length || 0,
        systemSettings: data.systemSettings?.length || 0
      }
    };
  } catch (error) {
    return {
      status: 'error',
      message: 'Error reading database',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
// Utility functions for debugging

export const debugLocalStorage = () => {
  const storageKey = 'dz_taxi_database';
  try {
    const rawData = localStorage.getItem(storageKey);
    if (rawData) {
      const data = JSON.parse(rawData);
      
      // Count real vs demo accounts
      const realAccounts = data.profiles?.filter((p: any) => !p.isDemo) || [];
      const demoAccounts = data.profiles?.filter((p: any) => p.isDemo) || [];
      
      
      return data;
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
};

export const clearLocalStorage = () => {
  const storageKey = 'dz_taxi_database';
  localStorage.removeItem(storageKey);
};

export const resetToDefaultData = async () => {
  const { browserDatabase } = await import('@/integrations/database/browserDatabase');
  await browserDatabase.resetToDefaultData();
};

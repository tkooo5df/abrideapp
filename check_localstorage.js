// Script to check localStorage data
const storageKey = 'dz_taxi_database';

try {
  const data = localStorage.getItem(storageKey);
  if (data) {
    const parsed = JSON.parse(data);
    console.log('=== LOCALSTORAGE DATA ===');
    console.log('Profiles count:', parsed.profiles?.length || 0);
    console.log('Profiles:', JSON.stringify(parsed.profiles, null, 2));
    console.log('System settings:', JSON.stringify(parsed.systemSettings, null, 2));
  } else {
    console.log('No data found in localStorage');
  }
} catch (error) {
  console.error('Error reading localStorage:', error);
}
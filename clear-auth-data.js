// Clear Supabase auth data from localStorage
// This will help resolve "Invalid Refresh Token" errors
function clearSupabaseAuthData() {
  try {
    // Clear all Supabase-related data from localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('supabase')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log('Cleared Supabase auth data from localStorage');
    return true;
  } catch (error) {
    console.error('Error clearing Supabase auth data:', error);
    return false;
  }
}

// Call the function to clear auth data
clearSupabaseAuthData();

// Also clear sessionStorage
try {
  sessionStorage.clear();
  console.log('Cleared sessionStorage');
} catch (error) {
  console.error('Error clearing sessionStorage:', error);
}

import { supabase } from '@/integrations/supabase/client';

// Utility function to clear Supabase auth data
// This can be called when there are auth errors
export const clearSupabaseAuthData = async () => {
  try {
    // Sign out from Supabase first
    await supabase.auth.signOut();
    
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
    
    // Also clear sessionStorage
    sessionStorage.clear();
    
    return true;
  } catch (error) {
    return false;
  }
};

const AUTH_ERROR_PATTERNS = [
  'Invalid Refresh Token',
  'Refresh Token Not Found',
];

const shouldClearAuthData = (message?: string) => {
  if (!message) {
    return false;
  }

  return AUTH_ERROR_PATTERNS.some(pattern => message.includes(pattern));
};

const handlePotentialAuthError = (message?: string) => {
  if (shouldClearAuthData(message)) {
    clearSupabaseAuthData();
  }
};

let listenersRegistered = false;

// Auto-clear auth data on page load if there are errors
if (typeof window !== 'undefined' && !listenersRegistered) {
  window.addEventListener('error', (event: ErrorEvent) => {
    handlePotentialAuthError(event.message);
  });

  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const message =
      reason instanceof Error
        ? reason.message
        : typeof reason === 'string'
          ? reason
          : '';

    handlePotentialAuthError(message);
  });

  listenersRegistered = true;
}

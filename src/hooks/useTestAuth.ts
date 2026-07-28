import { useState } from 'react';
import { useAuth } from './useAuth';

// Simple test authentication hook
export const useTestAuth = () => {
  const { signIn, signOut, user } = useAuth();
  const [loading, setLoading] = useState(false);

  const testCredentials = {
    driver: {
      email: 'driver@test.com',
      password: 'driver123',
      role: 'driver'
    },
    passenger: {
      email: 'passenger@test.com',
      password: 'passenger123',
      role: 'passenger'
    }
  };

  const loginAsDriver = async () => {
    setLoading(true);
    try {
      await signIn(testCredentials.driver.email, testCredentials.driver.password);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const loginAsPassenger = async () => {
    setLoading(true);
    try {
      await signIn(testCredentials.passenger.email, testCredentials.passenger.password);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut();
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    loginAsDriver,
    loginAsPassenger,
    logout,
    testCredentials
  };
};

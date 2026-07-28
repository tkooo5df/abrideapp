import { Capacitor } from '@capacitor/core';
import { useState, useEffect } from 'react';

export const useIsNativeApp = () => {
  const [isNative, setIsNative] = useState<boolean>(false);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  return isNative;
};

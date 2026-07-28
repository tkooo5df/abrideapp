import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { PushNotifications } from '@capacitor/push-notifications';

export const AppPermissionsInitializer = () => {
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          // Request Geolocation Permission
          try {
            const geoStatus = await Geolocation.checkPermissions();
            if (geoStatus.location !== 'granted') {
              await Geolocation.requestPermissions();
            }
          } catch (geoError) {
            console.error('Error requesting geolocation permission:', geoError);
          }

          // Request Push Notifications Permission
          try {
            const pushStatus = await PushNotifications.checkPermissions();
            if (pushStatus.receive !== 'granted') {
              await PushNotifications.requestPermissions();
            }
          } catch (pushError) {
            console.error('Error requesting push notification permission:', pushError);
          }
        } else {
          // Web Fallback for Notifications
          if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
          }
          // Web Geolocation is usually requested when needed, but we can do a dummy check
          if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(() => {}, () => {});
          }
        }
      } catch (error) {
        console.error('Permission initialization error:', error);
      }
    };

    requestPermissions();
  }, []);

  return null;
};

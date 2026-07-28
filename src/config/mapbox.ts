// Mapbox Configuration
export const MAPBOX_CONFIG = {
  accessToken: import.meta.env.VITE_MAPBOX_TOKEN || '',
  // Use streets-v11 which has better Arabic support
  style: 'mapbox://styles/mapbox/streets-v11',
  language: 'en',
  region: 'DZ', // Algeria
};

// Default map center (Algeria center)
export const DEFAULT_MAP_CENTER = {
  lat: 28.0339, // Center of Algeria
  lng: 1.6596,
};

// Ghardaia coordinates
export const GHARDAIA_CENTER = {
  lat: 32.4913,
  lng: 3.6745,
};

// Default zoom levels
export const MAP_ZOOM = {
  country: 6,
  city: 12,
  street: 15,
  building: 18,
};

// Map options
export const DEFAULT_MAP_OPTIONS = {
  zoomControl: true,
  styleControl: false,
  scaleControl: true,
  rotateControl: false,
  fullscreenControl: true,
};

// Marker icons
export const MARKER_ICONS = {
  driver: {
    color: '#f97316', // orange-500
    size: 'medium',
  },
  passenger: {
    color: '#10b981', // green-500
    size: 'medium',
  },
  pickup: {
    color: '#f59e0b', // amber-500
    size: 'small',
  },
  destination: {
    color: '#ef4444', // red-500
    size: 'small',
  },
};

// Route colors
export const ROUTE_COLORS = {
  active: '#10b981', // green-500
  completed: '#8b5cf6', // violet-500
  cancelled: '#ef4444', // red-500
};
// Google Maps Configuration
export const GOOGLE_MAPS_CONFIG = {
  apiKey: 'AIzaSyBvyaGOeUWJqjBnR2mHR0Ye9hbPJia3G5M',
  libraries: ['places', 'geometry', 'directions'] as const,
  language: 'en',
  region: 'DZ', // Keep Algeria region while using English labels
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

// Map styles for better Arabic support
export const MAP_STYLES = [
  {
    featureType: 'all',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#333333' }],
  },
];

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
  mapTypeControl: false,
  scaleControl: true,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: true,
  styles: MAP_STYLES,
};

// Marker icons
export const MARKER_ICONS = {
  driver: {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
      <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="#10b981" stroke="white" stroke-width="3"/>
        <text x="20" y="27" font-size="20" text-anchor="middle" fill="white">🚗</text>
      </svg>
    `),
    scaledSize: { width: 40, height: 40 },
  },
  passenger: {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
      <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="#3b82f6" stroke="white" stroke-width="3"/>
        <text x="20" y="27" font-size="20" text-anchor="middle" fill="white">👤</text>
      </svg>
    `),
    scaledSize: { width: 40, height: 40 },
  },
  pickup: {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
      <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="#f59e0b" stroke="white" stroke-width="3"/>
        <text x="20" y="27" font-size="20" text-anchor="middle" fill="white">📍</text>
      </svg>
    `),
    scaledSize: { width: 40, height: 40 },
  },
  destination: {
    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
      <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="#ef4444" stroke="white" stroke-width="3"/>
        <text x="20" y="27" font-size="20" text-anchor="middle" fill="white">🎯</text>
      </svg>
    `),
    scaledSize: { width: 40, height: 40 },
  },
};

// Route colors
export const ROUTE_COLORS = {
  active: '#10b981',
  completed: '#6b7280',
  cancelled: '#ef4444',
};


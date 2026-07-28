import { MAPBOX_CONFIG } from '@/config/mapbox';

export interface GeocodeResult {
  text: string;
  place_name: string;
  coordinates: { lng: number; lat: number };
}

class GeocodingService {
  private baseUrl = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

  async forward(address: string, options?: { country?: string; language?: string; limit?: number }): Promise<GeocodeResult | null> {
    try {
      const url = new URL(`${this.baseUrl}/${encodeURIComponent(address)}.json`);
      url.searchParams.set('access_token', MAPBOX_CONFIG.accessToken);
      url.searchParams.set('limit', String(options?.limit ?? 1));
      if (options?.country) url.searchParams.set('country', options.country);
      if (options?.language || MAPBOX_CONFIG.language) url.searchParams.set('language', options?.language ?? MAPBOX_CONFIG.language);

      const res = await fetch(url.toString());
      if (!res.ok) return null;
      const data = await res.json();
      const feature = data?.features?.[0];
      if (!feature) return null;
      const [lng, lat] = feature.center;
      return {
        text: feature.text,
        place_name: feature.place_name,
        coordinates: { lng, lat },
      };
    } catch (err) {
      return null;
    }
  }
}

export const geocodingService = new GeocodingService();



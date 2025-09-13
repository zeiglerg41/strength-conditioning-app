// Geocoding service types - provider agnostic

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface AddressSuggestion {
  id: string;
  text: string;
  place_name: string;
  address?: {
    street_number?: string;
    street_name?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  center: Coordinates;
  relevance?: number;
}

export interface GeocodingOptions {
  query: string;
  limit?: number;
  types?: string[];
  bbox?: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  proximity?: Coordinates;
  country?: string[];
}

export interface RouteOptions {
  start: Coordinates;
  end: Coordinates;
  profile: 'walking' | 'cycling' | 'driving';
  alternatives?: boolean;
  steps?: boolean;
  waypoints?: Coordinates[];
}

export interface Route {
  distance: number; // meters
  duration: number; // seconds
  geometry: {
    type: string;
    coordinates: number[][];
  };
  elevation?: {
    gain: number;
    loss: number;
    profile: number[];
  };
}

export interface GeocodingProvider {
  name: string;
  searchAddress(options: GeocodingOptions): Promise<AddressSuggestion[]>;
  reverseGeocode(coordinates: Coordinates): Promise<AddressSuggestion | null>;
  getRoute?(options: RouteOptions): Promise<Route>;
}
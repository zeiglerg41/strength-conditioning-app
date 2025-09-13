// Geocoding configuration
// Set MAPBOX_API_KEY in your .env file

const MAPBOX_API_KEY = process.env.EXPO_PUBLIC_MAPBOX_API_KEY || '';

// Provider selection based on API key availability and user count
export const getGeocodingConfig = () => {
  // If we have a Mapbox key, use it (supports up to 100k requests/month free)
  if (MAPBOX_API_KEY) {
    return {
      provider: 'mapbox' as const,
      config: {
        apiKey: MAPBOX_API_KEY,
      },
    };
  }

  // Fallback to OpenStreetMap (unlimited but rate limited)
  console.warn(
    'No Mapbox API key found. Using OpenStreetMap with rate limits. ' +
    'For production, add EXPO_PUBLIC_MAPBOX_API_KEY to your .env file.'
  );
  
  return {
    provider: 'openstreetmap' as const,
    config: {
      // Could specify custom Nominatim server here if self-hosting
      nominatimUrl: undefined, // Uses public server
    },
  };
};

// Initialize geocoding service
import { geocodingService } from '../services/geocoding';

export const initializeGeocoding = () => {
  const { provider, config } = getGeocodingConfig();
  geocodingService.initialize(provider, config);
  
  console.log(`Geocoding initialized with ${provider} provider`);
};
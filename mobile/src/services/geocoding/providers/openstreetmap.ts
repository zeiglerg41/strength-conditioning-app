// OpenStreetMap/Nominatim geocoding provider implementation
// Ready for future migration when user base grows

import { 
  GeocodingProvider, 
  GeocodingOptions, 
  AddressSuggestion, 
  Coordinates,
  RouteOptions,
  Route 
} from '../types';

export class OpenStreetMapProvider implements GeocodingProvider {
  name = 'openstreetmap';
  private baseUrl: string;
  private routeUrl: string;

  constructor(config?: { nominatimUrl?: string; openRouteServiceKey?: string }) {
    // Can use public Nominatim or self-hosted instance
    this.baseUrl = config?.nominatimUrl || 'https://nominatim.openstreetmap.org';
    // OpenRouteService for routing (optional)
    this.routeUrl = 'https://api.openrouteservice.org';
  }

  async searchAddress(options: GeocodingOptions): Promise<AddressSuggestion[]> {
    try {
      const { query, limit = 5, country } = options;
      
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        limit: limit.toString(),
        addressdetails: '1',
        extratags: '1',
      });

      if (country && country.length > 0) {
        params.append('countrycodes', country.join(','));
      }

      // Add User-Agent header as required by Nominatim
      const headers = {
        'User-Agent': 'StrengthConditioningApp/1.0',
      };

      const url = `${this.baseUrl}/search?${params}`;
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status}`);
      }

      const data = await response.json();
      
      return data.map((place: any) => ({
        id: place.osm_id?.toString() || place.place_id?.toString(),
        text: place.display_name.split(',')[0],
        place_name: place.display_name,
        address: {
          street_number: place.address?.house_number,
          street_name: place.address?.road,
          city: place.address?.city || place.address?.town || place.address?.village,
          state: place.address?.state,
          postal_code: place.address?.postcode,
          country: place.address?.country,
        },
        center: {
          latitude: parseFloat(place.lat),
          longitude: parseFloat(place.lon),
        },
        relevance: place.importance,
      }));
    } catch (error) {
      console.error('OpenStreetMap search error:', error);
      return [];
    }
  }

  async reverseGeocode(coordinates: Coordinates): Promise<AddressSuggestion | null> {
    try {
      const params = new URLSearchParams({
        lat: coordinates.latitude.toString(),
        lon: coordinates.longitude.toString(),
        format: 'json',
        addressdetails: '1',
      });

      const headers = {
        'User-Agent': 'StrengthConditioningApp/1.0',
      };

      const url = `${this.baseUrl}/reverse?${params}`;
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status}`);
      }

      const place = await response.json();
      
      if (!place || place.error) {
        return null;
      }

      return {
        id: place.osm_id?.toString() || place.place_id?.toString(),
        text: place.display_name.split(',')[0],
        place_name: place.display_name,
        address: {
          street_number: place.address?.house_number,
          street_name: place.address?.road,
          city: place.address?.city || place.address?.town || place.address?.village,
          state: place.address?.state,
          postal_code: place.address?.postcode,
          country: place.address?.country,
        },
        center: {
          latitude: parseFloat(place.lat),
          longitude: parseFloat(place.lon),
        },
      };
    } catch (error) {
      console.error('OpenStreetMap reverse geocode error:', error);
      return null;
    }
  }

  async getRoute?(options: RouteOptions): Promise<Route> {
    // This would require OpenRouteService API key or OSRM instance
    // Placeholder for future implementation
    throw new Error('Routing not implemented for OpenStreetMap provider. Consider using OpenRouteService or OSRM.');
  }
}
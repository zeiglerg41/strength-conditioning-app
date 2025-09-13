// Mapbox geocoding provider implementation

import { 
  GeocodingProvider, 
  GeocodingOptions, 
  AddressSuggestion, 
  Coordinates,
  RouteOptions,
  Route 
} from '../types';

export class MapboxProvider implements GeocodingProvider {
  name = 'mapbox';
  private apiKey: string;
  private baseUrl = 'https://api.mapbox.com';
  private searchBoxUrl = 'https://api.mapbox.com/search/searchbox/v1';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Mapbox API key is required');
    }
    this.apiKey = apiKey;
  }

  async searchAddress(options: GeocodingOptions): Promise<AddressSuggestion[]> {
    try {
      const { query, limit = 5, types, proximity, country } = options;
      
      const params = new URLSearchParams({
        access_token: this.apiKey,
        limit: limit.toString(),
        autocomplete: 'true',
      });
      
      if (types && types.length > 0) {
        params.append('types', types.join(','));
      }
      
      if (proximity) {
        params.append('proximity', `${proximity.longitude},${proximity.latitude}`);
      }
      
      if (country && country.length > 0) {
        params.append('country', country.join(','));
      }

      const url = `${this.baseUrl}/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Return full suggestion objects with all required fields
      return data.features.map((feature: any) => ({
        id: feature.id,
        text: feature.text,
        place_name: feature.place_name,
        address: this.parseAddress(feature),
        center: {
          latitude: feature.center[1],
          longitude: feature.center[0],
        },
        relevance: feature.relevance,
      }));
    } catch (error) {
      console.error('Mapbox search error:', error);
      return [];
    }
  }

  async reverseGeocode(coordinates: Coordinates): Promise<AddressSuggestion | null> {
    try {
      const params = new URLSearchParams({
        access_token: this.apiKey,
        types: 'address',
        limit: '1',
      });

      const url = `${this.baseUrl}/geocoding/v5/mapbox.places/${coordinates.longitude},${coordinates.latitude}.json?${params}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.features.length === 0) {
        return null;
      }

      const feature = data.features[0];
      return {
        id: feature.id,
        text: feature.text,
        place_name: feature.place_name,
        address: this.parseAddress(feature),
        center: {
          latitude: feature.center[1],
          longitude: feature.center[0],
        },
      };
    } catch (error) {
      console.error('Mapbox reverse geocode error:', error);
      return null;
    }
  }

  async getRoute(options: RouteOptions): Promise<Route> {
    try {
      const { start, end, profile, alternatives = false, steps = false, waypoints = [] } = options;
      
      // Convert profile to Mapbox format
      const mapboxProfile = profile === 'cycling' ? 'cycling' : profile === 'walking' ? 'walking' : 'driving';
      
      // Build coordinates string
      const coords = [
        `${start.longitude},${start.latitude}`,
        ...waypoints.map(w => `${w.longitude},${w.latitude}`),
        `${end.longitude},${end.latitude}`,
      ].join(';');

      const params = new URLSearchParams({
        access_token: this.apiKey,
        alternatives: alternatives.toString(),
        steps: steps.toString(),
        geometries: 'geojson',
        overview: 'full',
      });

      const url = `${this.baseUrl}/directions/v5/mapbox/${mapboxProfile}/${coords}?${params}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Mapbox Directions API error: ${response.status}`);
      }

      const data = await response.json();
      const route = data.routes[0];
      
      return {
        distance: route.distance,
        duration: route.duration,
        geometry: route.geometry,
        elevation: undefined, // Would need separate API call for elevation
      };
    } catch (error) {
      console.error('Mapbox route error:', error);
      throw error;
    }
  }

  private async fallbackSearch(query: string, limit: number, proximity?: Coordinates, country?: string[]): Promise<AddressSuggestion[]> {
    // Fallback to regular geocoding API
    const params = new URLSearchParams({
      access_token: this.apiKey,
      limit: limit.toString(),
      autocomplete: 'true',
    });
    
    if (proximity) {
      params.append('proximity', `${proximity.longitude},${proximity.latitude}`);
    }
    
    if (country && country.length > 0) {
      params.append('country', country.join(','));
    }
    
    const url = `${this.baseUrl}/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    return data.features.map((feature: any) => ({
      id: feature.id,
      text: feature.text,
      place_name: feature.place_name,
      address: this.parseAddress(feature),
      center: {
        latitude: feature.center[1],
        longitude: feature.center[0],
      },
      relevance: feature.relevance,
    }));
  }

  private parseAddress(feature: any): any {
    const address: any = {};
    
    // Mapbox provides context array with place hierarchy
    if (feature.context) {
      feature.context.forEach((context: any) => {
        if (context.id.startsWith('postcode')) {
          address.postal_code = context.text;
        } else if (context.id.startsWith('place')) {
          address.city = context.text;
        } else if (context.id.startsWith('region')) {
          address.state = context.text;
        } else if (context.id.startsWith('country')) {
          address.country = context.text;
        }
      });
    }

    // Parse street number and name from main text
    if (feature.properties && feature.properties.address) {
      address.street_number = feature.properties.address;
    }
    
    if (feature.text) {
      address.street_name = feature.text;
    }

    return address;
  }
}
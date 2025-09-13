// Main geocoding service - handles provider switching

import { GeocodingProvider, GeocodingOptions, AddressSuggestion, Coordinates, RouteOptions, Route } from './types';
import { MapboxProvider } from './providers/mapbox';
import { OpenStreetMapProvider } from './providers/openstreetmap';
import AsyncStorage from '@react-native-async-storage/async-storage';

export * from './types';

class GeocodingService {
  private provider: GeocodingProvider | null = null;
  private recentAddresses: AddressSuggestion[] = [];
  private readonly STORAGE_KEY = 'recent_addresses';
  private readonly MAX_RECENT = 10;

  constructor() {
    this.loadRecentAddresses();
  }

  initialize(providerName: 'mapbox' | 'openstreetmap' = 'mapbox', config?: any) {
    switch (providerName) {
      case 'mapbox':
        if (!config?.apiKey) {
          console.warn('Mapbox API key not provided, falling back to OpenStreetMap');
          this.provider = new OpenStreetMapProvider();
        } else {
          this.provider = new MapboxProvider(config.apiKey);
        }
        break;
      case 'openstreetmap':
        this.provider = new OpenStreetMapProvider(config);
        break;
      default:
        this.provider = new OpenStreetMapProvider();
    }
  }

  async searchAddress(options: GeocodingOptions): Promise<AddressSuggestion[]> {
    if (!this.provider) {
      this.initialize();
    }

    try {
      // Search in recent addresses first
      const recentMatches = this.searchRecentAddresses(options.query);
      
      // Get results from provider
      const providerResults = await this.provider!.searchAddress(options);
      
      // Combine and deduplicate
      const combined = [...recentMatches, ...providerResults];
      const unique = combined.filter((item, index, self) =>
        index === self.findIndex((i) => i.place_name === item.place_name)
      );
      
      return unique.slice(0, options.limit || 5);
    } catch (error) {
      console.error('Geocoding search error:', error);
      // Fallback to recent addresses only
      return this.searchRecentAddresses(options.query).slice(0, options.limit || 5);
    }
  }

  async reverseGeocode(coordinates: Coordinates): Promise<AddressSuggestion | null> {
    if (!this.provider) {
      this.initialize();
    }

    try {
      return await this.provider!.reverseGeocode(coordinates);
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }

  async getRoute(options: RouteOptions): Promise<Route | null> {
    if (!this.provider) {
      this.initialize();
    }

    if (!this.provider!.getRoute) {
      console.warn('Current provider does not support routing');
      return null;
    }

    try {
      return await this.provider!.getRoute(options);
    } catch (error) {
      console.error('Routing error:', error);
      return null;
    }
  }

  async saveRecentAddress(address: AddressSuggestion) {
    // Check if already exists
    const existingIndex = this.recentAddresses.findIndex(
      a => a.place_name === address.place_name
    );

    if (existingIndex !== -1) {
      // Move to front
      this.recentAddresses.splice(existingIndex, 1);
    }

    // Add to front
    this.recentAddresses.unshift(address);

    // Limit size
    if (this.recentAddresses.length > this.MAX_RECENT) {
      this.recentAddresses = this.recentAddresses.slice(0, this.MAX_RECENT);
    }

    // Save to storage
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(this.recentAddresses)
      );
    } catch (error) {
      console.error('Failed to save recent addresses:', error);
    }
  }

  private async loadRecentAddresses() {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.recentAddresses = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load recent addresses:', error);
    }
  }

  private searchRecentAddresses(query: string): AddressSuggestion[] {
    const lowerQuery = query.toLowerCase();
    return this.recentAddresses.filter(address =>
      address.place_name.toLowerCase().includes(lowerQuery)
    );
  }

  getProviderName(): string {
    return this.provider?.name || 'none';
  }

  switchProvider(providerName: 'mapbox' | 'openstreetmap', config?: any) {
    this.initialize(providerName, config);
  }
}

// Export singleton instance
export const geocodingService = new GeocodingService();

// Export for testing
export { MapboxProvider, OpenStreetMapProvider };
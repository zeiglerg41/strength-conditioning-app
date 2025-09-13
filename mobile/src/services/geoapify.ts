// Geoapify Places API Service
// Free tier: 3000 requests/day (90k/month)
// Better fuzzy search and park/recreation center support than Nominatim

interface GeoapifyPlace {
  properties: {
    name?: string;
    formatted: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
    place_id: string;
    lat: number;
    lon: number;
    categories?: string[];
  };
  geometry: {
    coordinates: [number, number]; // [lon, lat]
  };
}

interface GeoapifyResponse {
  features: GeoapifyPlace[];
}

class GeoapifyService {
  private apiKey: string;
  private baseUrl = 'https://api.geoapify.com/v1';
  
  constructor(apiKey?: string) {
    // You'll need to get a free API key from https://www.geoapify.com/
    // and add it to your .env file as EXPO_PUBLIC_GEOAPIFY_API_KEY
    this.apiKey = apiKey || process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('Geoapify API key not configured. Get a free key at https://www.geoapify.com/');
    }
  }
  
  // Search for any place - gyms, parks, recreation centers, etc.
  async searchPlaces(
    query: string,
    userLocation?: { lat: number; lon: number },
    categories?: string[]
  ): Promise<Array<{ name: string; address: string; id: string }>> {
    if (!this.apiKey) {
      console.error('Geoapify API key not configured');
      return [];
    }
    
    try {
      let url = `${this.baseUrl}/geocode/autocomplete?text=${encodeURIComponent(query)}&apiKey=${this.apiKey}&limit=10`;
      
      // Add location bias if available (improves local results)
      if (userLocation) {
        url += `&bias=proximity:${userLocation.lon},${userLocation.lat}`;
      }
      
      // Add category filter if specified
      // Common categories: commercial.fitness_center, leisure.park, leisure.sports_centre
      if (categories && categories.length > 0) {
        url += `&filter=category:${categories.join(',')}`;
      }
      
      console.log('Geoapify search URL:', url);
      
      const response = await fetch(url);
      const data: GeoapifyResponse = await response.json();
      
      if (!response.ok) {
        console.error('Geoapify API error:', data);
        return [];
      }
      
      return data.features.map(place => ({
        name: place.properties.name || place.properties.address_line1 || place.properties.formatted.split(',')[0],
        address: place.properties.formatted,
        id: place.properties.place_id,
      }));
    } catch (error) {
      console.error('Geoapify search error:', error);
      return [];
    }
  }
  
  // Specific search for gyms and fitness centers
  async searchGyms(
    query: string,
    userLocation?: { lat: number; lon: number }
  ): Promise<Array<{ name: string; address: string; id: string }>> {
    // Use fitness-related categories
    return this.searchPlaces(query, userLocation, [
      'commercial.fitness_center',
      'leisure.sports_centre',
      'commercial.sport'
    ]);
  }
  
  // Specific search for parks and outdoor spaces
  async searchParks(
    query: string,
    userLocation?: { lat: number; lon: number }
  ): Promise<Array<{ name: string; address: string; id: string }>> {
    // Use park and outdoor categories
    return this.searchPlaces(query, userLocation, [
      'leisure.park',
      'leisure.recreation_ground',
      'leisure.nature_reserve',
      'leisure.playground'
    ]);
  }
  
  // Search for addresses (streets, buildings, etc.)
  async searchAddresses(
    query: string,
    userLocation?: { lat: number; lon: number }
  ): Promise<Array<{ name: string; address: string; id: string }>> {
    if (!this.apiKey) {
      console.error('Geoapify API key not configured');
      return [];
    }
    
    try {
      let url = `${this.baseUrl}/geocode/autocomplete?text=${encodeURIComponent(query)}&apiKey=${this.apiKey}&limit=10&type=street,amenity,building`;
      
      // Add location bias if available
      if (userLocation) {
        url += `&bias=proximity:${userLocation.lon},${userLocation.lat}`;
      }
      
      const response = await fetch(url);
      const data: GeoapifyResponse = await response.json();
      
      if (!response.ok) {
        console.error('Geoapify API error:', data);
        return [];
      }
      
      return data.features.map(place => ({
        name: place.properties.formatted.split(',')[0],
        address: place.properties.formatted,
        id: place.properties.place_id,
      }));
    } catch (error) {
      console.error('Geoapify address search error:', error);
      return [];
    }
  }
}

// Export singleton instance
export const geoapifyService = new GeoapifyService();

// Export class for testing or multiple instances
export { GeoapifyService };
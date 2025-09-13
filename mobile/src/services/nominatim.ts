// Nominatim (OpenStreetMap) service for searching businesses/POIs
// Free to use with reasonable rate limits (1 request/second)

interface NominatimResult {
  place_id: string;
  display_name: string;
  name?: string;
  lat: string;
  lon: string;
  type?: string;
  class?: string;
}

export class NominatimService {
  private baseUrl = 'https://nominatim.openstreetmap.org';
  private lastRequestTime = 0;
  private minRequestInterval = 1000; // 1 second between requests

  private async enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise(resolve => 
        setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
      );
    }
    this.lastRequestTime = Date.now();
  }

  async searchBusinesses(query: string, options?: {
    lat?: number;
    lon?: number;
    limit?: number;
  }): Promise<Array<{ name: string; address: string; id: string }>> {
    try {
      console.log('Nominatim searchBusinesses called with:', query);
      await this.enforceRateLimit();

      const params = new URLSearchParams({
        q: query,
        format: 'json',
        limit: (options?.limit || 5).toString(),
        addressdetails: '1',
        namedetails: '1',
        extratags: '1',
      });

      // Add location bias if provided
      if (options?.lat && options?.lon) {
        // Viewbox format: left,top,right,bottom (min_lon,min_lat,max_lon,max_lat)
        const boxSize = 0.5; // About 50km radius
        params.append('viewbox', `${options.lon - boxSize},${options.lat - boxSize},${options.lon + boxSize},${options.lat + boxSize}`);
        params.append('bounded', '0'); // Don't restrict to viewbox, just prioritize
        console.log('Added viewbox for location:', options.lat, options.lon);
      } else {
        console.log('No location provided for search');
      }
      
      // Restrict to USA by default
      params.append('countrycodes', 'us');

      const url = `${this.baseUrl}/search?${params}`;
      console.log('Nominatim URL:', url);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'StrengthConditioningApp/1.0',
        },
      });

      if (!response.ok) {
        console.error('Nominatim response not OK:', response.status);
        throw new Error(`Nominatim error: ${response.status}`);
      }

      const data: NominatimResult[] = await response.json();
      console.log('Nominatim raw results:', data.length, 'items');
      console.log('First result:', data[0]);
      
      const results = data.map(item => ({
        name: item.name || item.display_name.split(',')[0],
        address: item.display_name,
        id: item.place_id,
      }));
      
      console.log('Nominatim mapped results:', results);
      return results;
    } catch (error) {
      console.error('Nominatim search error:', error);
      return [];
    }
  }

  async searchGyms(query: string, options?: {
    lat?: number;
    lon?: number;
  }): Promise<Array<{ name: string; address: string; id: string }>> {
    console.log('searchGyms called with:', query);
    // Just search for the query as-is
    return this.searchBusinesses(query, options);
  }

  async searchPlaces(
    query: string, 
    userLocation?: { lat: number; lon: number },
    tags?: string[]
  ): Promise<Array<{ name: string; address: string; id: string }>> {
    try {
      console.log('Nominatim searchPlaces called with:', query, 'tags:', tags);
      await this.enforceRateLimit();

      const params = new URLSearchParams({
        q: query,
        format: 'json',
        limit: '10',
        addressdetails: '1',
        namedetails: '1',
        extratags: '1',
      });

      // Add tag filters if provided (e.g., leisure=park)
      if (tags && tags.length > 0) {
        tags.forEach(tag => {
          const [key, value] = tag.split('=');
          if (key && value) {
            params.append(key, value);
          }
        });
      }

      // Add location bias if provided
      if (userLocation) {
        const boxSize = 0.5;
        params.append('viewbox', `${userLocation.lon - boxSize},${userLocation.lat - boxSize},${userLocation.lon + boxSize},${userLocation.lat + boxSize}`);
        params.append('bounded', '0');
      }

      params.append('countrycodes', 'us');

      const url = `${this.baseUrl}/search?${params}`;
      console.log('Nominatim places URL:', url);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'StrengthConditioningApp/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`Nominatim error: ${response.status}`);
      }

      const data: NominatimResult[] = await response.json();
      
      return data.map(item => ({
        name: item.name || item.display_name.split(',')[0],
        address: item.display_name,
        id: item.place_id,
      }));
    } catch (error) {
      console.error('Nominatim searchPlaces error:', error);
      return [];
    }
  }
}

export const nominatimService = new NominatimService();
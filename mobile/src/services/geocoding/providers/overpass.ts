// Overpass API provider for POI search (gyms, fitness centers)
// 100% free, no API key required

import { Coordinates } from '../types';

export interface GymResult {
  id: string;
  name: string;
  lat: number;
  lon: number;
  tags: {
    name?: string;
    'addr:street'?: string;
    'addr:housenumber'?: string;
    'addr:city'?: string;
    'addr:state'?: string;
    'addr:postcode'?: string;
    website?: string;
    phone?: string;
    opening_hours?: string;
    [key: string]: any;
  };
  distance?: number;
}

export class OverpassProvider {
  private baseUrl = 'https://overpass-api.de/api/interpreter';
  
  // Fuzzy string matching helper
  private normalizeString(str: string): string {
    return str.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special chars
      .replace(/\s+/g, ' ')     // Normalize spaces
      .trim();
  }

  private fuzzyMatch(searchTerm: string, target: string): boolean {
    const normalizedSearch = this.normalizeString(searchTerm);
    const normalizedTarget = this.normalizeString(target);
    
    // Exact match
    if (normalizedTarget.includes(normalizedSearch)) {
      return true;
    }
    
    // Split search into words and check if all are present
    const searchWords = normalizedSearch.split(' ');
    const targetWords = normalizedTarget.split(' ');
    
    // Check if all search words exist in target (any order)
    const allWordsFound = searchWords.every(searchWord => 
      targetWords.some(targetWord => 
        targetWord.includes(searchWord) || 
        this.isAbbreviation(searchWord, targetWord)
      )
    );
    
    if (allWordsFound) {
      return true;
    }
    
    // Check if search is abbreviation of target
    const searchInitials = searchWords.map(w => w[0]).join('');
    const targetInitials = targetWords.map(w => w[0]).join('');
    if (targetInitials.includes(searchInitials)) {
      return true;
    }
    
    return false;
  }
  
  private isAbbreviation(abbr: string, word: string): boolean {
    // Common gym/rec center abbreviations
    const abbreviations: Record<string, string[]> = {
      'rec': ['recreation', 'recreational'],
      'ctr': ['center', 'centre'],
      'pk': ['park'],
      'wash': ['washington'],
      'gym': ['gymnasium'],
      'fit': ['fitness'],
      'la': ['los angeles'],
      'sf': ['san francisco'],
      'nyc': ['new york'],
    };
    
    // Check known abbreviations
    if (abbreviations[abbr]) {
      return abbreviations[abbr].some(full => word.includes(full));
    }
    
    // Check if abbr is start of word
    return word.startsWith(abbr);
  }
  
  private calculateRelevance(searchTerm: string, gym: GymResult): number {
    const normalizedSearch = this.normalizeString(searchTerm);
    const normalizedName = this.normalizeString(gym.name);
    
    let score = 0;
    
    // Exact match gets highest score
    if (normalizedName === normalizedSearch) {
      score += 100;
    }
    
    // Contains full search term
    if (normalizedName.includes(normalizedSearch)) {
      score += 50;
    }
    
    // Each matching word
    const searchWords = normalizedSearch.split(' ');
    searchWords.forEach(word => {
      if (normalizedName.includes(word)) {
        score += 10;
      }
    });
    
    // Penalty for distance
    if (gym.distance) {
      score -= gym.distance * 2;
    }
    
    return score;
  }

  async searchGyms(
    center: Coordinates,
    radiusKm: number = 5,
    searchTerm?: string
  ): Promise<GymResult[]> {
    try {
      // Build Overpass QL query - expanded to include climbing gyms and more tags
      const query = `
        [out:json][timeout:25];
        (
          node["leisure"="fitness_centre"](around:${radiusKm * 1000},${center.latitude},${center.longitude});
          node["leisure"="sports_centre"](around:${radiusKm * 1000},${center.latitude},${center.longitude});
          node["amenity"="gym"](around:${radiusKm * 1000},${center.latitude},${center.longitude});
          node["sport"="climbing"](around:${radiusKm * 1000},${center.latitude},${center.longitude});
          node["climbing"="boulder"](around:${radiusKm * 1000},${center.latitude},${center.longitude});
          node["shop"="sports"]["sport"~"climbing|fitness"](around:${radiusKm * 1000},${center.latitude},${center.longitude});
          way["leisure"="fitness_centre"](around:${radiusKm * 1000},${center.latitude},${center.longitude});
          way["leisure"="sports_centre"](around:${radiusKm * 1000},${center.latitude},${center.longitude});
          way["amenity"="gym"](around:${radiusKm * 1000},${center.latitude},${center.longitude});
          way["sport"="climbing"](around:${radiusKm * 1000},${center.latitude},${center.longitude});
          way["climbing"="boulder"](around:${radiusKm * 1000},${center.latitude},${center.longitude});
        );
        out body;
        >;
        out skel qt;
      `;

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status}`);
      }

      const data = await response.json();
      const gyms: GymResult[] = [];

      // Process results
      data.elements.forEach((element: any) => {
        // Accept gyms with name OR brand tag
        const gymName = element.tags?.name || 
                       element.tags?.brand || 
                       element.tags?.operator ||
                       element.tags?.['brand:en'];
                       
        if (element.tags && gymName) {
          const gym: GymResult = {
            id: element.id.toString(),
            name: gymName,
            lat: element.lat || element.center?.lat,
            lon: element.lon || element.center?.lon,
            tags: element.tags,
          };

          // Calculate distance
          if (gym.lat && gym.lon) {
            gym.distance = this.calculateDistance(
              center.latitude,
              center.longitude,
              gym.lat,
              gym.lon
            );
          }

          // Filter by search term using fuzzy matching
          if (!searchTerm || this.fuzzyMatch(searchTerm, gym.name)) {
            gyms.push(gym);
          }
        }
      });

      // Sort by relevance if search term provided, otherwise by distance
      if (searchTerm) {
        gyms.sort((a, b) => {
          const scoreA = this.calculateRelevance(searchTerm, a);
          const scoreB = this.calculateRelevance(searchTerm, b);
          return scoreB - scoreA; // Higher score first
        });
      } else {
        gyms.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      }

      return gyms;
    } catch (error) {
      console.error('Overpass API error:', error);
      return [];
    }
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  formatGymAddress(gym: GymResult): string {
    const parts = [];
    
    if (gym.tags['addr:housenumber'] && gym.tags['addr:street']) {
      parts.push(`${gym.tags['addr:housenumber']} ${gym.tags['addr:street']}`);
    } else if (gym.tags['addr:street']) {
      parts.push(gym.tags['addr:street']);
    }
    
    if (gym.tags['addr:city']) {
      parts.push(gym.tags['addr:city']);
    }
    
    if (gym.tags['addr:state']) {
      parts.push(gym.tags['addr:state']);
    }
    
    if (gym.tags['addr:postcode']) {
      parts.push(gym.tags['addr:postcode']);
    }
    
    return parts.join(', ') || 'Address not available';
  }
}
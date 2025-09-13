import React, { useState, useCallback, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { geoapifyService } from '../services/geoapify';
import { nominatimService } from '../services/nominatim';
import { debounce } from 'lodash';
import * as Location from 'expo-location';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onSelectPlace?: (place: { name: string; address: string }) => void;
  placeholder?: string;
  searchType?: 'gym' | 'park' | 'address' | 'any';
  icon?: string;
}

export default function UniversalSearchInput({ 
  value, 
  onChangeText, 
  onSelectPlace, 
  placeholder = "Search...",
  searchType = 'any',
  icon = 'search'
}: Props) {
  const [suggestions, setSuggestions] = useState<Array<{ name: string; address: string; id: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [internalValue, setInternalValue] = useState(value || '');
  const [hasGeoapifyKey, setHasGeoapifyKey] = useState(false);

  // Check if Geoapify API key is configured
  useEffect(() => {
    const hasKey = !!process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY && 
                   process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY !== 'your_geoapify_api_key_here';
    setHasGeoapifyKey(hasKey);
    if (!hasKey) {
      console.log('Geoapify API key not configured, will use OpenStreetMap/Nominatim as fallback');
    }
  }, []);

  // Get user location on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          lat: location.coords.latitude,
          lon: location.coords.longitude,
        });
      }
    })();
  }, []);

  const searchPlaces = useCallback(
    debounce(async (query: string) => {
      console.log('UniversalSearchInput searching for:', query, 'Type:', searchType);
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        let results: Array<{ name: string; address: string; id: string }> = [];
        
        if (hasGeoapifyKey) {
          // Use Geoapify for better fuzzy search
          console.log('Using Geoapify for search');
          switch (searchType) {
            case 'gym':
              results = await geoapifyService.searchGyms(query, userLocation || undefined);
              break;
            case 'park':
              results = await geoapifyService.searchParks(query, userLocation || undefined);
              break;
            case 'address':
              results = await geoapifyService.searchAddresses(query, userLocation || undefined);
              break;
            default:
              results = await geoapifyService.searchPlaces(query, userLocation || undefined);
          }
        } else {
          // Fall back to Nominatim
          console.log('Using Nominatim (fallback) for search');
          switch (searchType) {
            case 'gym':
              results = await nominatimService.searchGyms(query, userLocation || undefined);
              break;
            case 'park':
              // Search specifically for parks and recreation areas
              results = await nominatimService.searchPlaces(query, userLocation || undefined, [
                'leisure=park',
                'leisure=recreation_ground',
                'leisure=nature_reserve'
              ]);
              break;
            default:
              results = await nominatimService.searchPlaces(query, userLocation || undefined);
          }
        }
        
        console.log('Search results:', results);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (error) {
        console.error('Place search error:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, hasGeoapifyKey ? 500 : 1100), // Faster for Geoapify, respect Nominatim rate limit
    [userLocation, searchType, hasGeoapifyKey]
  );

  // Only search when internal value changes (user typing)
  useEffect(() => {
    if (internalValue && internalValue.length >= 2) {
      searchPlaces(internalValue);
    } else {
      searchPlaces.cancel();
      setSuggestions([]);
      setShowSuggestions(false);
    }
    
    return () => {
      searchPlaces.cancel();
    };
  }, [internalValue]);

  // Sync external value changes to internal value
  useEffect(() => {
    if (value !== internalValue) {
      setInternalValue(value || '');
      if (!value || value === '') {
        setSuggestions([]);
        setShowSuggestions(false);
        searchPlaces.cancel();
      }
    }
  }, [value]);

  const handleSelect = (place: { name: string; address: string }) => {
    console.log('Place selected:', place);
    setShowSuggestions(false);
    setInternalValue(place.name);
    onChangeText(place.name);
    onSelectPlace?.(place);
  };

  const handleTextChange = (text: string) => {
    setInternalValue(text);
    onChangeText(text);
    
    if (!text || text === '') {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  // Get appropriate icon based on search type
  const getIcon = () => {
    if (icon !== 'search') return icon;
    switch (searchType) {
      case 'gym': return 'barbell';
      case 'park': return 'leaf';
      case 'address': return 'location';
      default: return 'search';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <Ionicons name={getIcon() as any} size={20} color={theme.colors.primary[400]} style={styles.icon} />
        <TextInput
          style={styles.input}
          value={internalValue}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.placeholder}
        />
        {isLoading && (
          <ActivityIndicator size="small" color={theme.colors.primary[400]} />
        )}
      </View>

      {showSuggestions && (
        <ScrollView style={styles.suggestionsContainer}>
          {suggestions.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.suggestion}
              onPress={() => handleSelect(item)}
            >
              <Text style={styles.suggestionName}>{item.name}</Text>
              <Text style={styles.suggestionAddress} numberOfLines={1}>
                {item.address}
              </Text>
            </TouchableOpacity>
          ))}
          {suggestions.length === 0 && !isLoading && internalValue.length >= 2 && (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>No results found</Text>
              <Text style={styles.noResultsHint}>
                {hasGeoapifyKey 
                  ? "Try a different search term or check spelling"
                  : "For better search, add Geoapify API key (see .env.example)"}
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    height: 48,
  },
  icon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    ...theme.typography.body.medium,
    color: theme.colors.text,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    maxHeight: 200,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 999,
  },
  suggestion: {
    padding: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  suggestionName: {
    ...theme.typography.body.medium,
    color: theme.colors.text,
    fontWeight: '600',
  },
  suggestionAddress: {
    ...theme.typography.body.small,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  noResults: {
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  noResultsText: {
    ...theme.typography.body.medium,
    color: theme.colors.textSecondary,
  },
  noResultsHint: {
    ...theme.typography.body.small,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
});
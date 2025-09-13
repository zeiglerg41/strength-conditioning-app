import React, { useState, useCallback, useEffect } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { nominatimService } from '../services/nominatim';
import { debounce } from 'lodash';
import * as Location from 'expo-location';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onSelectGym?: (gym: { name: string; address: string }) => void;
  placeholder?: string;
}

export default function GymSearchInput({ value, onChangeText, onSelectGym, placeholder = "Search for gym..." }: Props) {
  const [suggestions, setSuggestions] = useState<Array<{ name: string; address: string; id: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [internalValue, setInternalValue] = useState(value || '');

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
        console.log('User location set:', location.coords);
      }
    })();
  }, []);

  const searchGyms = useCallback(
    debounce(async (query: string) => {
      console.log('GymSearchInput searchGyms called with:', query);
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        console.log('Passing userLocation to search:', userLocation);
        const results = await nominatimService.searchGyms(query, userLocation || undefined);
        console.log('GymSearchInput got results:', results);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (error) {
        console.error('Gym search error:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 1100), // Slightly more than 1 second to respect rate limit
    [userLocation]
  );

  // Only search when internal value changes (user typing)
  useEffect(() => {
    console.log('Internal value changed:', internalValue);
    
    if (internalValue && internalValue.length >= 2) {
      searchGyms(internalValue);
    } else {
      searchGyms.cancel(); // Cancel any pending search
      setSuggestions([]);
      setShowSuggestions(false);
    }
    
    // Cleanup: cancel search on unmount
    return () => {
      searchGyms.cancel();
    };
  }, [internalValue]);

  // Sync external value changes to internal value
  useEffect(() => {
    console.log('External value changed to:', value, 'Internal was:', internalValue);
    if (value !== internalValue) {
      setInternalValue(value || '');
      if (!value || value === '') {
        // Clear suggestions when value is cleared or empty
        setSuggestions([]);
        setShowSuggestions(false);
        // Cancel any pending search
        searchGyms.cancel();
      }
    }
  }, [value]);

  const handleSelect = (gym: { name: string; address: string }) => {
    console.log('=== GYM SELECTED FROM DROPDOWN ===');
    console.log('Selected gym:', gym);
    
    setShowSuggestions(false);
    setInternalValue(gym.name); // Set internal value directly
    onChangeText(gym.name); // Notify parent
    onSelectGym?.(gym);
    
    console.log('=== GYM SELECTION COMPLETE ===');
  };

  const handleTextChange = (text: string) => {
    setInternalValue(text);
    onChangeText(text);
    
    // If text is being cleared, immediately hide suggestions
    if (!text || text === '') {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <Ionicons name="barbell" size={20} color={theme.colors.primary[400]} style={styles.icon} />
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
});
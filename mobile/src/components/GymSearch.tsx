import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet,
  ActivityIndicator,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { OverpassProvider, GymResult } from '../services/geocoding/providers/overpass';
import { Coordinates } from '../services/geocoding';
import { debounce } from 'lodash';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onSelectGym?: (gym: GymResult) => void;
  placeholder?: string;
  userLocation?: Coordinates;
}

export default function GymSearch({
  value,
  onChangeText,
  onSelectGym,
  placeholder = "Search for your gym...",
  userLocation
}: Props) {
  const [suggestions, setSuggestions] = useState<GymResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedGym, setSelectedGym] = useState<GymResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  const overpassProvider = new OverpassProvider();

  // Search gyms near user
  const searchGyms = useCallback(
    debounce(async (query: string) => {
      if (!userLocation) {
        console.log('No user location available for gym search');
        return;
      }

      setIsLoading(true);
      setHasSearched(true);
      
      try {
        // Search within 10km radius
        const results = await overpassProvider.searchGyms(
          userLocation,
          10,
          query.length > 0 ? query : undefined
        );
        
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Gym search error:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 800),
    [userLocation]
  );

  // Trigger search when user types or when location becomes available
  useEffect(() => {
    if (userLocation && !hasSearched) {
      // Initial load - show all nearby gyms
      searchGyms('');
    }
  }, [userLocation, hasSearched]);

  useEffect(() => {
    if (value && !selectedGym) {
      searchGyms(value);
    } else if (!value) {
      setSelectedGym(null);
      if (userLocation) {
        searchGyms(''); // Show all nearby gyms
      }
    }
  }, [value]);

  const handleSelectGym = (gym: GymResult) => {
    setSelectedGym(gym);
    setShowSuggestions(false);
    onChangeText(gym.name);
    
    if (onSelectGym) {
      onSelectGym(gym);
    }
    
    Keyboard.dismiss();
  };

  const handleTextChange = (text: string) => {
    onChangeText(text);
    setSelectedGym(null);
  };

  const renderGym = (gym: GymResult) => {
    const address = overpassProvider.formatGymAddress(gym);
    const distance = gym.distance ? `${gym.distance.toFixed(1)} km` : '';
    
    return (
      <TouchableOpacity 
        key={gym.id}
        style={styles.suggestionItem}
        onPress={() => handleSelectGym(gym)}
        activeOpacity={0.7}
      >
        <Ionicons 
          name="barbell-outline" 
          size={20} 
          color={theme.colors.textSecondary} 
          style={styles.suggestionIcon}
        />
        <View style={styles.suggestionText}>
          <Text style={styles.suggestionTitle} numberOfLines={1}>
            {gym.name}
          </Text>
          <Text style={styles.suggestionSubtitle} numberOfLines={1}>
            {address} {distance && `• ${distance}`}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <Ionicons 
          name="barbell" 
          size={20} 
          color={theme.colors.primary[400]} 
          style={styles.icon}
        />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.placeholder}
          autoCapitalize="words"
          autoCorrect={false}
          onFocus={() => setShowSuggestions(true)}
        />
        {isLoading && (
          <ActivityIndicator 
            size="small" 
            color={theme.colors.primary[400]} 
            style={styles.loadingIndicator}
          />
        )}
        {selectedGym && (
          <Ionicons 
            name="checkmark-circle" 
            size={20} 
            color={theme.colors.success[500]}
            style={styles.validatedIcon}
          />
        )}
      </View>

      {!userLocation && (
        <Text style={styles.warningText}>
          Enable location access to find gyms near you
        </Text>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <ScrollView 
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
          >
            <Text style={styles.suggestionsHeader}>
              {value ? 'Matching Gyms' : 'Nearby Gyms'}
            </Text>
            {suggestions.slice(0, 10).map(gym => (
              <React.Fragment key={gym.id}>
                {renderGym(gym)}
              </React.Fragment>
            ))}
          </ScrollView>
        </View>
      )}

      {showSuggestions && suggestions.length === 0 && !isLoading && hasSearched && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.noResults}>
            No gyms found nearby. Try searching by name.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
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
    height: '100%',
  },
  loadingIndicator: {
    marginLeft: theme.spacing.sm,
  },
  validatedIcon: {
    marginLeft: theme.spacing.sm,
  },
  warningText: {
    ...theme.typography.body.small,
    color: theme.colors.warning[500],
    marginTop: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
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
    maxHeight: 250,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  suggestionsList: {
    padding: theme.spacing.xs,
  },
  suggestionsHeader: {
    ...theme.typography.body.small,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  suggestionIcon: {
    marginRight: theme.spacing.sm,
  },
  suggestionText: {
    flex: 1,
  },
  suggestionTitle: {
    ...theme.typography.body.medium,
    color: theme.colors.text,
    fontWeight: '500',
  },
  suggestionSubtitle: {
    ...theme.typography.body.small,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  noResults: {
    ...theme.typography.body.medium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    padding: theme.spacing.md,
  },
});
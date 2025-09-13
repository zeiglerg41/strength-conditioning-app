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
import { geocodingService, AddressSuggestion, Coordinates } from '../services/geocoding';
import { debounce } from 'lodash';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onSelectAddress?: (address: AddressSuggestion) => void;
  placeholder?: string;
  proximity?: Coordinates;
  country?: string[];
  types?: string[];
  icon?: React.ReactNode;
}

export default function AddressAutocomplete({
  value,
  onChangeText,
  onSelectAddress,
  placeholder = "Enter address",
  proximity,
  country = ['us'],
  types = ['address', 'poi'],
  icon
}: Props) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<AddressSuggestion | null>(null);

  // Debounced search function
  const searchAddresses = useCallback(
    debounce(async (query: string) => {
      if (query.length < 3) {
        setSuggestions([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const results = await geocodingService.searchAddress({
          query,
          limit: 5,
          types,
          proximity,
          country,
        });
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Address search error:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 500),
    [proximity, country, types]
  );

  useEffect(() => {
    if (value && !selectedAddress) {
      searchAddresses(value);
    } else if (!value) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedAddress(null);
    }
  }, [value]);

  const handleSelectSuggestion = async (suggestion: AddressSuggestion) => {
    setSelectedAddress(suggestion);
    setShowSuggestions(false);
    onChangeText(suggestion.place_name);
    
    if (onSelectAddress) {
      onSelectAddress(suggestion);
    }
    
    // Save to recent addresses
    await geocodingService.saveRecentAddress(suggestion);
    
    Keyboard.dismiss();
  };

  const handleTextChange = (text: string) => {
    onChangeText(text);
    setSelectedAddress(null);
  };

  const renderSuggestion = ({ item }: { item: AddressSuggestion }) => (
    <TouchableOpacity 
      style={styles.suggestionItem}
      onPress={() => handleSelectSuggestion(item)}
      activeOpacity={0.7}
    >
      <Ionicons 
        name="location-outline" 
        size={20} 
        color={theme.colors.textSecondary} 
        style={styles.suggestionIcon}
      />
      <View style={styles.suggestionText}>
        <Text style={styles.suggestionTitle} numberOfLines={1}>
          {item.text}
        </Text>
        <Text style={styles.suggestionSubtitle} numberOfLines={1}>
          {item.place_name}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <TextInput
          style={[styles.input, icon && styles.inputWithIcon]}
          value={value}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.placeholder}
          autoCapitalize="words"
          autoCorrect={false}
          onFocus={() => value && setShowSuggestions(true)}
        />
        {isLoading && (
          <ActivityIndicator 
            size="small" 
            color={theme.colors.primary[400]} 
            style={styles.loadingIndicator}
          />
        )}
        {selectedAddress && (
          <Ionicons 
            name="checkmark-circle" 
            size={20} 
            color={theme.colors.success[500]}
            style={styles.validatedIcon}
          />
        )}
      </View>

      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <ScrollView 
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
          >
            {suggestions.map((item, index) => (
              <View key={item.id || index.toString()}>
                {renderSuggestion({ item })}
                {index < suggestions.length - 1 && <View style={styles.separator} />}
              </View>
            ))}
          </ScrollView>
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
  iconContainer: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    ...theme.typography.body.medium,
    color: theme.colors.text,
    height: '100%',
  },
  inputWithIcon: {
    marginLeft: 0,
  },
  loadingIndicator: {
    marginLeft: theme.spacing.sm,
  },
  validatedIcon: {
    marginLeft: theme.spacing.sm,
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
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.xs,
  },
});
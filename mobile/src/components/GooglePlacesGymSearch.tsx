import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { theme } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  onAddGym: (gymName: string) => void;
  gyms?: string[];
}

export default function GooglePlacesGymSearch({ onAddGym, gyms }: Props) {
  const ref = useRef<any>(null);
  const safeGyms = gyms || [];

  const handleAddGym = (gymName: string) => {
    if (gymName && !safeGyms.includes(gymName)) {
      onAddGym(gymName);
      // Clear the input after adding
      setTimeout(() => {
        ref.current?.clear();
        ref.current?.blur();
      }, 100);
    }
  };

  // Check if API key is configured
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;

  if (!apiKey || apiKey === 'your_google_places_api_key_here') {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Google Places API key not configured</Text>
          <Text style={styles.errorHint}>Add EXPO_PUBLIC_GOOGLE_API_KEY to your .env file</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GooglePlacesAutocomplete
        ref={ref}
        placeholder="Search gym (Movement, LA Fitness, etc)"
        onPress={(data, details = null) => {
          const gymName = data.structured_formatting?.main_text || data.description.split(',')[0];
          handleAddGym(gymName);
        }}
        query={{
          key: apiKey,
          language: 'en',
          types: 'establishment',
          components: 'country:us',
        }}
        predefinedPlaces={[]}  // REQUIRED to fix filter error in v2.5.7
        minLength={1}          // REQUIRED for proper functionality
        styles={{
          container: styles.autocompleteContainer,
          textInput: styles.input,
          textInputContainer: styles.textInputContainer,
          listView: styles.listView,
          row: styles.row,
          description: styles.description,
          predefinedPlacesDescription: styles.predefinedPlacesDescription,
          separator: styles.separator,
          loader: styles.loader,
          poweredContainer: styles.poweredContainer,
          powered: {},
        }}
        textInputProps={{
          clearButtonMode: 'never', // Disable iOS clear button
        }}
        fetchDetails={false}
        enablePoweredByContainer={false}
        debounce={300}
        keepResultsAfterBlur={false}
        listViewDisplayed="auto"
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
        disableScroll={true}
        renderRightButton={() => (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              const currentText = ref.current?.getAddressText && ref.current.getAddressText();
              if (currentText) {
                handleAddGym(currentText);
              }
            }}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        )}
      />

      {/* Display added gyms */}
      {safeGyms.length > 0 && (
        <View style={styles.gymsList}>
          {safeGyms.map((gym, index) => (
            <View key={index} style={styles.gymItem}>
              <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary[400]} />
              <Text style={styles.gymName}>{gym}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 1,
  },
  autocompleteContainer: {
    flex: 0,
    zIndex: 1,
  },
  input: {
    ...theme.typography.body.medium,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingRight: 70, // Space for add button
    height: 48,
    color: theme.colors.text,
  },
  listView: {
    backgroundColor: theme.colors.surface, // Dark surface color
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 5,
    maxHeight: 200,
  },
  row: {
    backgroundColor: theme.colors.surface, // Dark row background
    padding: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  description: {
    ...theme.typography.body.small,
    color: theme.colors.text, // White text on dark background
  },
  textInputContainer: {
    backgroundColor: 'transparent',
  },
  predefinedPlacesDescription: {
    color: theme.colors.text,
  },
  separator: {
    height: 0.5,
    backgroundColor: theme.colors.border,
  },
  loader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    height: 20,
  },
  poweredContainer: {
    display: 'none',
  },
  addButton: {
    position: 'absolute',
    right: 5,
    top: 5,
    backgroundColor: theme.colors.primary[400],
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
  },
  addButtonText: {
    color: '#fff',
    marginLeft: 4,
    fontWeight: '600',
  },
  gymsList: {
    marginTop: theme.spacing.md,
  },
  gymItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  gymName: {
    ...theme.typography.body.medium,
    color: theme.colors.text,
    marginLeft: theme.spacing.xs,
  },
  errorContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  errorText: {
    ...theme.typography.body.medium,
    color: theme.colors.error[500],
    textAlign: 'center',
  },
  errorHint: {
    ...theme.typography.body.small,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
});
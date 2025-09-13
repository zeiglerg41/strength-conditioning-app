import React from 'react';
import { View, StyleSheet } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { theme } from '../constants/theme';

interface Props {
  placeholder?: string;
  onSelectPlace: (data: any, details: any) => void;
  value?: string;
}

// Note: You'll need to add GOOGLE_PLACES_API_KEY to your .env file
const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';

export default function GooglePlacesInput({ 
  placeholder = "Search places...", 
  onSelectPlace,
  value 
}: Props) {
  
  if (!GOOGLE_API_KEY) {
    console.warn('Google Places API key not found. Add EXPO_PUBLIC_GOOGLE_PLACES_API_KEY to your .env file');
  }
  
  return (
    <View style={styles.container}>
      <GooglePlacesAutocomplete
        placeholder={placeholder}
        onPress={(data, details = null) => {
          onSelectPlace(data, details);
        }}
        query={{
          key: GOOGLE_API_KEY,
          language: 'en',
        }}
        styles={{
          textInputContainer: styles.textInputContainer,
          textInput: styles.textInput,
          listView: styles.listView,
          row: styles.row,
          description: styles.description,
          powered: { display: 'none' },
        }}
        enablePoweredByContainer={false}
        fetchDetails={true}
        debounce={300}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: 1,
  },
  textInputContainer: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
  },
  textInput: {
    marginLeft: 0,
    marginRight: 0,
    height: 48,
    color: theme.colors.text,
    ...theme.typography.body.medium,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
  },
  listView: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: theme.spacing.xs,
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
  },
  row: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.sm,
  },
  description: {
    color: theme.colors.text,
    ...theme.typography.body.medium,
  },
});
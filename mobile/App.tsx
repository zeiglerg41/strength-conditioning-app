import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '@rneui/themed';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AppNavigator from './src/navigation/AppNavigator';
import { queryClient } from './src/services/queryClient';
import { theme } from './src/constants/theme';

// Convert our theme to RNE theme format
const rneTheme = {
  lightColors: {
    primary: theme.colors.primary[500],
    secondary: theme.colors.secondary[500],
    success: theme.colors.success[500],
    warning: theme.colors.warning[500],
    error: theme.colors.error[500],
    text: theme.colors.text,
    background: theme.colors.background,
    surface: theme.colors.surface,
  },
  darkColors: {
    // We can add dark theme later
    primary: theme.colors.primary[400],
    secondary: theme.colors.secondary[400],
    success: theme.colors.success[400],
    warning: theme.colors.warning[400],
    error: theme.colors.error[400],
    text: '#ffffff',
    background: '#111827',
    surface: '#1f2937',
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={rneTheme}>
          <StatusBar style="auto" />
          <AppNavigator />
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

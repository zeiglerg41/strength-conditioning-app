import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

export default function AnalyticsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Analytics</Text>
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Performance analytics coming soon!</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  title: {
    ...theme.typography.heading.h1,
    marginBottom: theme.spacing.lg,
    color: theme.colors.text,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    ...theme.typography.body.large,
    color: theme.colors.textSecondary,
  },
});

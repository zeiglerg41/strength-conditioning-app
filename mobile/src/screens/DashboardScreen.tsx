import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '@rneui/themed';
import { useAuthStore } from '../store/authStore';
import { theme } from '../constants/theme';

export default function DashboardScreen() {
  const { user, signOut } = useAuthStore();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>Welcome back, {user?.email}</Text>
      
      <View style={styles.placeholderContainer}>
        <Text style={styles.placeholderText}>
          Your training dashboard will show:
        </Text>
        <Text style={styles.listItem}>• Today's workout</Text>
        <Text style={styles.listItem}>• Progress summary</Text>
        <Text style={styles.listItem}>• Upcoming training</Text>
        <Text style={styles.listItem}>• Performance metrics</Text>
      </View>

      <Button
        title="Sign Out"
        onPress={signOut}
        buttonStyle={styles.signOutButton}
        type="outline"
      />
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
    marginBottom: theme.spacing.xs,
    color: theme.colors.text,
  },
  subtitle: {
    ...theme.typography.body.large,
    marginBottom: theme.spacing.xl,
    color: theme.colors.textSecondary,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  placeholderText: {
    ...theme.typography.body.large,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
    color: theme.colors.text,
    textAlign: 'center',
  },
  listItem: {
    ...theme.typography.body.medium,
    marginBottom: theme.spacing.xs,
    color: theme.colors.textSecondary,
  },
  signOutButton: {
    borderColor: theme.colors.error[500],
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
  },
});
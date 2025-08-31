import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '@rneui/themed';
import { StackScreenProps } from '@react-navigation/stack';

import { AuthStackParamList } from '../../types';
import { theme } from '../../constants/theme';

type Props = StackScreenProps<AuthStackParamList, 'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Strength & Conditioning</Text>
      <Text style={styles.subtitle}>AI-Powered Performance Training</Text>
      
      <View style={styles.buttonContainer}>
        <Button
          title="Get Started"
          onPress={() => navigation.navigate('Signup')}
          buttonStyle={styles.primaryButton}
        />
        
        <Button
          title="I have an account"
          onPress={() => navigation.navigate('Login')}
          type="outline"
          buttonStyle={styles.secondaryButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  title: {
    ...theme.typography.heading.h1,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
    color: theme.colors.text,
  },
  subtitle: {
    ...theme.typography.body.large,
    textAlign: 'center',
    marginBottom: theme.spacing.xxxl,
    color: theme.colors.textSecondary,
  },
  buttonContainer: {
    width: '100%',
    gap: theme.spacing.md,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary[400], // Supabase neon green
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    ...theme.shadows.neon.primary, // Neon glow effect
  },
  secondaryButton: {
    borderColor: theme.colors.primary[400],
    borderWidth: 2,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
  },
});
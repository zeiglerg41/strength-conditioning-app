import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Button, Input } from '@rneui/themed';
import { StackScreenProps } from '@react-navigation/stack';

import { AuthStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { theme } from '../../constants/theme';

type Props = StackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const { resetPassword, loading } = useAuthStore();

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    try {
      await resetPassword(email);
      Alert.alert(
        'Reset Email Sent',
        'Check your email for password reset instructions',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to send reset email. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>Enter your email to receive reset instructions</Text>

      <View style={styles.form}>
        <Input
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          leftIcon={{ type: 'ionicon', name: 'mail-outline', color: theme.colors.textSecondary }}
          inputContainerStyle={styles.inputContainer}
          inputStyle={styles.inputText}
          placeholderTextColor={theme.colors.textMuted}
        />

        <Button
          title="Send Reset Email"
          onPress={handleResetPassword}
          loading={loading}
          buttonStyle={styles.resetButton}
          loadingProps={{
            color: theme.colors.neutral[900], // Dark spinner on neon button
            size: 'small',
          }}
        />
      </View>

      <Button
        title="Back to Login"
        type="clear"
        onPress={() => navigation.goBack()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
  },
  title: {
    ...theme.typography.heading.h2,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
    color: theme.colors.text,
  },
  subtitle: {
    ...theme.typography.body.medium,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    color: theme.colors.textSecondary,
  },
  form: {
    marginBottom: theme.spacing.xl,
  },
  inputContainer: {
    backgroundColor: theme.colors.surface,
    borderBottomColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
  },
  inputText: {
    color: theme.colors.text,
    ...theme.typography.body.medium,
  },
  resetButton: {
    backgroundColor: theme.colors.primary[400], // Neon green
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.md,
    ...theme.shadows.neon.primary, // Neon glow effect
  },
});
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Button, Input } from '@rneui/themed';
import { StackScreenProps } from '@react-navigation/stack';

import { AuthStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { theme } from '../../constants/theme';

type Props = StackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, loading, error } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await signIn(email, password);
      // Navigation will happen automatically due to auth state change
    } catch (err) {
      Alert.alert('Login Failed', error || 'An error occurred during login');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>

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

        <Input
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          leftIcon={{ type: 'ionicon', name: 'lock-closed-outline', color: theme.colors.textSecondary }}
          inputContainerStyle={styles.inputContainer}
          inputStyle={styles.inputText}
          placeholderTextColor={theme.colors.textMuted}
        />

        <Button
          title="Sign In"
          onPress={handleLogin}
          loading={loading}
          buttonStyle={styles.signInButton}
          loadingProps={{
            color: theme.colors.neutral[900], // Dark spinner on neon button
            size: 'small',
          }}
        />

        <Button
          title="Forgot Password?"
          type="clear"
          onPress={() => navigation.navigate('ForgotPassword')}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account? </Text>
        <Button
          title="Sign Up"
          type="clear"
          titleStyle={styles.linkText}
          onPress={() => navigation.navigate('Signup')}
        />
      </View>
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
  signInButton: {
    backgroundColor: theme.colors.primary[400], // Neon green
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.md,
    ...theme.shadows.neon.primary, // Neon glow
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: theme.colors.textSecondary,
    ...theme.typography.body.medium,
  },
  linkText: {
    color: theme.colors.primary[400],
    fontWeight: '600',
  },
});
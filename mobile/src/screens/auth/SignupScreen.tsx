import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Button, Input } from '@rneui/themed';
import { StackScreenProps } from '@react-navigation/stack';

import { AuthStackParamList } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { theme } from '../../constants/theme';

type Props = StackScreenProps<AuthStackParamList, 'Signup'>;

export default function SignupScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { signUp, loading, error } = useAuthStore();

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      await signUp(email, password);
      Alert.alert('Success', 'Account created successfully! You can now sign in.');
    } catch (err) {
      Alert.alert('Signup Failed', error || 'An error occurred during signup');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Get started with your training</Text>

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

        <Input
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          leftIcon={{ type: 'ionicon', name: 'lock-closed-outline', color: theme.colors.textSecondary }}
          inputContainerStyle={styles.inputContainer}
          inputStyle={styles.inputText}
          placeholderTextColor={theme.colors.textMuted}
        />

        <Button
          title="Create Account"
          onPress={handleSignup}
          loading={loading}
          buttonStyle={styles.signUpButton}
          loadingProps={{
            color: theme.colors.neutral[900], // Dark spinner on neon button  
            size: 'small',
          }}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? </Text>
        <Button
          title="Sign In"
          type="clear"
          titleStyle={styles.linkText}
          onPress={() => navigation.navigate('Login')}
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
  signUpButton: {
    backgroundColor: theme.colors.primary[400], // Neon green
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.md,
    ...theme.shadows.neon.primary, // Neon glow effect
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
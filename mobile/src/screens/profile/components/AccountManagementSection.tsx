import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../constants/theme';
import { useAuthStore } from '../../../store/authStore';

export default function AccountManagementSection() {
  const { user, changeEmail, changePassword, loading } = useAuthStore();

  // Email change state
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleEmailChange = async () => {
    try {
      const result = await changeEmail(newEmail);
      Alert.alert('Success', result.message);
      setShowEmailForm(false);
      setNewEmail('');
    } catch (error) {
      // Error already set in store and shown in Alert via store
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    try {
      const result = await changePassword(currentPassword, newPassword);
      Alert.alert('Success', result.message);
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      // Error already set in store
    }
  };

  const getPasswordStrength = (password: string): { text: string; color: string } => {
    if (password.length === 0) return { text: '', color: '' };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength < 3) return { text: 'Weak', color: theme.colors.error };
    if (strength < 5) return { text: 'Medium', color: theme.colors.warning };
    return { text: 'Strong', color: theme.colors.success };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Account Management</Text>

      {/* Change Email */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="mail" size={24} color={theme.colors.primary[400]} />
            <Text style={styles.cardTitle}>Email Address</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowEmailForm(!showEmailForm)}
            style={styles.actionButton}
          >
            <Text style={styles.actionButtonText}>
              {showEmailForm ? 'Cancel' : 'Change'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.currentValue}>{user?.email}</Text>

        {showEmailForm && (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="New email address"
              placeholderTextColor={theme.colors.neutral[400]}
              value={newEmail}
              onChangeText={setNewEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={[styles.submitButton, (!newEmail || loading) && styles.submitButtonDisabled]}
              onPress={handleEmailChange}
              disabled={!newEmail || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Update Email</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.helperText}>
              Confirmation emails will be sent to both your current and new email addresses
            </Text>
          </View>
        )}
      </View>

      {/* Change Password */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Ionicons name="lock-closed" size={24} color={theme.colors.primary[400]} />
            <Text style={styles.cardTitle}>Password</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowPasswordForm(!showPasswordForm)}
            style={styles.actionButton}
          >
            <Text style={styles.actionButtonText}>
              {showPasswordForm ? 'Cancel' : 'Change'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.currentValue}>••••••••</Text>

        {showPasswordForm && (
          <View style={styles.form}>
            {/* Current Password */}
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Current password"
                placeholderTextColor={theme.colors.neutral[400]}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrentPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showCurrentPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={theme.colors.neutral[400]}
                />
              </TouchableOpacity>
            </View>

            {/* New Password */}
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="New password"
                placeholderTextColor={theme.colors.neutral[400]}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showNewPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={theme.colors.neutral[400]}
                />
              </TouchableOpacity>
            </View>

            {/* Password Strength Indicator */}
            {newPassword.length > 0 && (
              <View style={styles.strengthContainer}>
                <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                  {passwordStrength.text}
                </Text>
              </View>
            )}

            {/* Confirm Password */}
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm new password"
                placeholderTextColor={theme.colors.neutral[400]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={theme.colors.neutral[400]}
                />
              </TouchableOpacity>
            </View>

            {/* Password Requirements */}
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsTitle}>Password must contain:</Text>
              <View style={styles.requirement}>
                <Ionicons
                  name={newPassword.length >= 8 ? 'checkmark-circle' : 'close-circle'}
                  size={16}
                  color={newPassword.length >= 8 ? theme.colors.success : theme.colors.neutral[400]}
                />
                <Text style={styles.requirementText}>At least 8 characters</Text>
              </View>
              <View style={styles.requirement}>
                <Ionicons
                  name={/[a-z]/.test(newPassword) ? 'checkmark-circle' : 'close-circle'}
                  size={16}
                  color={/[a-z]/.test(newPassword) ? theme.colors.success : theme.colors.neutral[400]}
                />
                <Text style={styles.requirementText}>One lowercase letter</Text>
              </View>
              <View style={styles.requirement}>
                <Ionicons
                  name={/[A-Z]/.test(newPassword) ? 'checkmark-circle' : 'close-circle'}
                  size={16}
                  color={/[A-Z]/.test(newPassword) ? theme.colors.success : theme.colors.neutral[400]}
                />
                <Text style={styles.requirementText}>One uppercase letter</Text>
              </View>
              <View style={styles.requirement}>
                <Ionicons
                  name={/[0-9]/.test(newPassword) ? 'checkmark-circle' : 'close-circle'}
                  size={16}
                  color={/[0-9]/.test(newPassword) ? theme.colors.success : theme.colors.neutral[400]}
                />
                <Text style={styles.requirementText}>One number</Text>
              </View>
              <View style={styles.requirement}>
                <Ionicons
                  name={/[^a-zA-Z0-9]/.test(newPassword) ? 'checkmark-circle' : 'close-circle'}
                  size={16}
                  color={/[^a-zA-Z0-9]/.test(newPassword) ? theme.colors.success : theme.colors.neutral[400]}
                />
                <Text style={styles.requirementText}>One special character</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                (!currentPassword || !newPassword || !confirmPassword || loading) &&
                  styles.submitButtonDisabled,
              ]}
              onPress={handlePasswordChange}
              disabled={!currentPassword || !newPassword || !confirmPassword || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Update Password</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  currentValue: {
    fontSize: 14,
    color: theme.colors.neutral[400],
    marginBottom: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.primary[500],
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  form: {
    marginTop: 16,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
  },
  passwordInputContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  passwordInput: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: 12,
    paddingRight: 48,
    fontSize: 16,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  strengthContainer: {
    marginBottom: 12,
  },
  strengthText: {
    fontSize: 14,
    fontWeight: '600',
  },
  requirementsContainer: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  requirementsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.neutral[400],
    marginBottom: 8,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 12,
    color: theme.colors.neutral[400],
  },
  submitButton: {
    backgroundColor: theme.colors.primary[500],
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  helperText: {
    fontSize: 12,
    color: theme.colors.neutral[400],
    marginTop: 8,
    lineHeight: 16,
  },
});

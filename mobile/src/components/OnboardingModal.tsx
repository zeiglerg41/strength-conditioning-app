import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { Button } from '@rneui/themed';
import { theme } from '../constants/theme';

interface OnboardingModalProps {
  visible: boolean;
  onStartOnboarding: () => void;
  onDismiss: () => void;
}

export default function OnboardingModal({ 
  visible, 
  onStartOnboarding, 
  onDismiss 
}: OnboardingModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Complete Your Profile</Text>
          
          <Text style={styles.message}>
            To get the most out of your training experience, we need to learn a bit about you first.
          </Text>
          
          <Text style={styles.subMessage}>
            This will only take a few minutes and helps us create personalized training programs just for you.
          </Text>
          
          <View style={styles.buttonContainer}>
            <Button
              title="Start Now"
              onPress={onStartOnboarding}
              buttonStyle={styles.primaryButton}
              titleStyle={styles.primaryButtonText}
            />
            
            <Button
              title="Maybe Later"
              onPress={onDismiss}
              type="clear"
              titleStyle={styles.secondaryButtonText}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    marginHorizontal: theme.spacing.lg,
    maxWidth: 400,
    width: '90%',
    borderWidth: 1,
    borderColor: theme.colors.primary[400],
    ...theme.shadows.neon.primary,
  },
  title: {
    ...theme.typography.heading.h2,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  message: {
    ...theme.typography.body.large,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subMessage: {
    ...theme.typography.body.medium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  buttonContainer: {
    gap: theme.spacing.sm,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary[400],
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
  },
  primaryButtonText: {
    ...theme.typography.button.large,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: theme.colors.textSecondary,
    ...theme.typography.button.medium,
  },
});
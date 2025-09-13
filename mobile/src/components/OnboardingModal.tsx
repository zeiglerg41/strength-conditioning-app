import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import { Button } from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

interface OnboardingModalProps {
  visible: boolean;
  onStartOnboarding: () => void;
  onDismiss: () => void;
  currentStep?: number;
  isReturning?: boolean;
}

export default function OnboardingModal({ 
  visible, 
  onStartOnboarding, 
  onDismiss,
  currentStep = 1,
  isReturning = false
}: OnboardingModalProps) {
  const stepNames = [
    'Basic Information',
    'Location & Privacy',
    'Training Locations',
    'Training Background',
    'Schedule & Lifestyle',
    'Review'
  ];
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.warningIcon}>
            <Ionicons 
              name="warning" 
              size={64} 
              color={theme.colors.warning[400]} 
            />
          </View>
          
          <Text style={styles.title}>
            {isReturning ? 'Profile Incomplete' : 'Complete Your Profile'}
          </Text>
          
          <Text style={styles.message}>
            {isReturning 
              ? `You're on step ${currentStep} of 6 (${stepNames[currentStep - 1]}). The app requires a complete profile to generate your personalized training programs.`
              : 'To get the most out of your training experience, we need to learn a bit about you first.'}
          </Text>
          
          <Text style={styles.subMessage}>
            {isReturning
              ? 'You can dismiss this reminder, but most features will be unavailable until your profile is complete.'
              : 'This will only take a few minutes and helps us create personalized training programs just for you.'}
          </Text>
          
          {isReturning && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressLabel}>Progress</Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${((currentStep - 1) / 6) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round(((currentStep - 1) / 6) * 100)}% Complete
              </Text>
            </View>
          )}
          
          <View style={styles.buttonContainer}>
            <Button
              title={isReturning ? 'Continue Onboarding' : 'Start Now'}
              onPress={onStartOnboarding}
              buttonStyle={styles.primaryButton}
              titleStyle={styles.primaryButtonText}
            />
            
            <Button
              title={isReturning ? 'Dismiss (Limited Access)' : 'Maybe Later'}
              onPress={onDismiss}
              type="clear"
              titleStyle={[
                styles.secondaryButtonText,
                isReturning && styles.warningText
              ]}
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
    borderColor: theme.colors.warning[400],
    ...theme.shadows.neon.warning,
  },
  warningIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
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
    marginBottom: theme.spacing.xl,  // Increased space after "You're on step X of 6"
  },
  subMessage: {
    ...theme.typography.body.medium,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  progressContainer: {
    marginBottom: theme.spacing.md,  // Reduced space before buttons
  },
  progressLabel: {
    ...theme.typography.body.small,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  progressBar: {
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    marginBottom: theme.spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.warning[400],
    borderRadius: 3,
  },
  progressText: {
    ...theme.typography.body.small,
    color: theme.colors.warning[400],
    textAlign: 'right',
  },
  buttonContainer: {
    gap: theme.spacing.sm,
  },
  warningText: {
    color: theme.colors.warning[600],
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
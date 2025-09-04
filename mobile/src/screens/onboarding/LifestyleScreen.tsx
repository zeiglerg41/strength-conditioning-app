import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Button, Slider } from '@rneui/themed';
import { StackScreenProps } from '@react-navigation/stack';
import { OnboardingStackParamList } from '../../types';
import { theme } from '../../constants/theme';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../types';

type Props = StackScreenProps<OnboardingStackParamList, 'Lifestyle'>;

export default function LifestyleScreen({ navigation }: Props) {
  const { data, updateLifestyle, setCurrentStep, submitOnboarding } = useOnboardingStore();
  const rootNavigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  
  const [sessionsPerWeek, setSessionsPerWeek] = useState(data.lifestyle.sessions_per_week || 3);
  
  const handleSkipRest = async () => {
    // Save current lifestyle data
    updateLifestyle({
      sessions_per_week: sessionsPerWeek,
    });
    
    // For now, submit what we have and complete onboarding
    try {
      await submitOnboarding();
      // Navigate back to main app
      rootNavigation.navigate('Main');
    } catch (error) {
      console.error('Onboarding submission failed:', error);
    }
  };
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Lifestyle</Text>
        <Text style={styles.subtitle}>Help us understand your training availability</Text>
      </View>
      
      <View style={styles.form}>
        <View style={styles.sliderSection}>
          <Text style={styles.label}>Training Sessions Per Week</Text>
          <Text style={styles.value}>{sessionsPerWeek} sessions</Text>
          <Slider
            value={sessionsPerWeek}
            onValueChange={setSessionsPerWeek}
            minimumValue={1}
            maximumValue={7}
            step={1}
            thumbStyle={styles.sliderThumb}
            trackStyle={styles.sliderTrack}
            minimumTrackTintColor={theme.colors.primary[400]}
          />
        </View>
        
        <Text style={styles.placeholder}>
          Additional lifestyle questions would go here:
          - Stress level
          - Work schedule
          - Sleep quality
          - Recovery time
        </Text>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.progress}>Step 2 of 6</Text>
        <Button
          title="Complete Setup (Skip Rest)"
          onPress={handleSkipRest}
          buttonStyle={styles.continueButton}
          titleStyle={styles.continueButtonText}
        />
        <Text style={styles.note}>
          You can complete the full profile later from Settings
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing.lg,
  },
  header: {
    marginBottom: theme.spacing.xl,
    marginTop: theme.spacing.lg,
  },
  title: {
    ...theme.typography.heading.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.body.large,
    color: theme.colors.textSecondary,
  },
  form: {
    flex: 1,
  },
  sliderSection: {
    marginBottom: theme.spacing.xl,
  },
  label: {
    ...theme.typography.body.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  value: {
    ...theme.typography.heading.h3,
    color: theme.colors.primary[400],
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  sliderThumb: {
    width: 20,
    height: 20,
    backgroundColor: theme.colors.primary[400],
  },
  sliderTrack: {
    height: 5,
    borderRadius: 2,
  },
  placeholder: {
    ...theme.typography.body.medium,
    color: theme.colors.textSecondary,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  footer: {
    marginTop: theme.spacing.xl,
  },
  progress: {
    ...theme.typography.body.small,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  continueButton: {
    backgroundColor: theme.colors.primary[400],
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  continueButtonText: {
    ...theme.typography.button.large,
    fontWeight: '600',
  },
  note: {
    ...theme.typography.body.small,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
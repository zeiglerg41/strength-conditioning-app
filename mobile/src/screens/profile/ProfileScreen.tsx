import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { theme } from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useProfileSettingsStore } from '../../store/profileSettingsStore';
import { RootStackParamList } from '../../types';
import ProfileHeader from './components/ProfileHeader';
import ProfileInfoSection from './components/ProfileInfoSection';
import SettingsSection from './components/SettingsSection';
import AccountManagementSection from './components/AccountManagementSection';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function ProfileScreen({ route }: any) {
  const navigation = useNavigation<NavigationProp>();
  const { user, userProfile, signOut } = useAuthStore();
  const { data: onboardingData, checkProfileCompletion } = useOnboardingStore();
  const { appSettings, updateAppSetting } = useProfileSettingsStore();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Use database completion percentage if available, otherwise calculate from steps
  const completionPercentage = userProfile?.profile_completion_percentage ??
    Math.round((checkProfileCompletion() / 6) * 100);

  // Handle returning from edit mode with expanded section
  useEffect(() => {
    if (route?.params?.expandedSection) {
      const newExpanded = new Set<string>();
      newExpanded.add(route.params.expandedSection);
      setExpandedSections(newExpanded);
    }
  }, [route?.params?.expandedSection]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set<string>();
    // Accordion behavior: if clicking on an already open section, close it
    // Otherwise, open only the clicked section (closing all others)
    if (!expandedSections.has(section)) {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleEditSection = (screen: any, expandedSection: string) => {
    // Navigate to the appropriate onboarding screen in edit mode
    navigation.navigate('Onboarding' as any, {
      screen,
      initial: false,
      params: {
        editMode: true,
        returnTo: 'Profile',
        expandedSection: expandedSection
      },
    });
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Auth' }],
            });
          },
        },
      ],
    );
  };

  const formatHeight = () => {
    if (!onboardingData.profile.height) return 'Not set';
    const height = onboardingData.profile.height;

    if (appSettings.units === 'imperial') {
      const totalInches = height / 2.54;
      const feet = Math.floor(totalInches / 12);
      const inches = Math.round(totalInches % 12);
      return `${feet}'${inches}"`;
    } else {
      return `${Math.round(height)} cm`;
    }
  };

  const formatWeight = () => {
    if (!onboardingData.profile.weight) return 'Not set';
    const weight = onboardingData.profile.weight;

    if (appSettings.units === 'imperial') {
      return `${Math.round(weight * 2.205)} lbs`;
    } else {
      return `${Math.round(weight)} kg`;
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ProfileHeader
        name={onboardingData.profile.name || 'User'}
        email={user?.email || ''}
        completionPercentage={completionPercentage}
      />

      {/* Personal Information */}
      <ProfileInfoSection
        title="Personal Information"
        icon="person-outline"
        expanded={expandedSections.has('personal')}
        onToggle={() => toggleSection('personal')}
        onEdit={() => handleEditSection('BasicInfo', 'personal')}
      >
        <View style={styles.infoContent}>
          <InfoRow label="Name" value={onboardingData.profile.name || 'Not set'} />
          <InfoRow label="Birthday" value={onboardingData.profile.birthday || 'Not set'} />
          <InfoRow label="Gender" value={onboardingData.profile.gender || 'Not set'} />
          <InfoRow label="Height" value={formatHeight()} />
          <InfoRow label="Weight" value={formatWeight()} />
        </View>
      </ProfileInfoSection>

      {/* Location & Privacy */}
      <ProfileInfoSection
        title="Location & Privacy"
        icon="location-outline"
        expanded={expandedSections.has('location')}
        onToggle={() => toggleSection('location')}
        onEdit={() => handleEditSection('LocationPrivacy', 'location')}
      >
        <View style={styles.infoContent}>
          <InfoRow
            label="Home Location"
            value={onboardingData.location_privacy?.home_location || 'Not set'}
          />
          <InfoRow
            label="Work Location"
            value={onboardingData.location_privacy?.work_location || 'Not set'}
          />
          <InfoRow
            label="Commute Option"
            value={onboardingData.location_privacy?.would_consider_commute || 'Not set'}
          />
        </View>
      </ProfileInfoSection>

      {/* Training Setup */}
      <ProfileInfoSection
        title="Training Setup"
        icon="barbell-outline"
        expanded={expandedSections.has('training')}
        onToggle={() => toggleSection('training')}
        onEdit={() => handleEditSection('TrainingLocations', 'training')}
      >
        <View style={styles.infoContent}>
          <InfoRow
            label="Primary Location"
            value={onboardingData.training_locations?.primary_location?.replace('_', ' ') || 'Not set'}
          />
          <InfoRow
            label="Gym Memberships"
            value={onboardingData.training_locations?.gym_names?.length > 0
              ? onboardingData.training_locations.gym_names
              : 'None'}
          />
          {onboardingData.training_locations?.secondary_locations?.length > 0 && (
            <InfoRow
              label="Secondary Locations"
              value={onboardingData.training_locations.secondary_locations}
            />
          )}
        </View>
      </ProfileInfoSection>

      {/* Training Background */}
      <ProfileInfoSection
        title="Training Background"
        icon="fitness-outline"
        expanded={expandedSections.has('background')}
        onToggle={() => toggleSection('background')}
        onEdit={() => handleEditSection('TrainingBackground', 'background')}
      >
        <View style={styles.infoContent}>
          <InfoRow
            label="Cardio Experience"
            value={`${onboardingData.training_background.cardio_training_months || 0} months`}
          />
          <InfoRow
            label="Strength Experience"
            value={`${onboardingData.training_background.strength_training_months || 0} months`}
          />
          <InfoRow
            label="Injuries"
            value={
              onboardingData.training_background.injury_history?.length
                ? `${onboardingData.training_background.injury_history.length} reported`
                : 'None'
            }
          />
        </View>
      </ProfileInfoSection>

      {/* Schedule & Lifestyle */}
      <ProfileInfoSection
        title="Schedule & Lifestyle"
        icon="calendar-outline"
        expanded={expandedSections.has('schedule')}
        onToggle={() => toggleSection('schedule')}
        onEdit={() => handleEditSection('ScheduleLifestyle', 'schedule')}
      >
        <View style={styles.infoContent}>
          <InfoRow
            label="Sessions/Week"
            value={onboardingData.schedule_lifestyle?.sessions_per_week?.toString() || 'Not set'}
          />
          {onboardingData.schedule_lifestyle?.preferred_time && (
            <InfoRow
              label="Preferred Times"
              value={onboardingData.schedule_lifestyle.preferred_time.split(',').map(t => t.trim())}
            />
          )}
          <InfoRow
            label="Work Schedule"
            value={onboardingData.schedule_lifestyle?.work_schedule?.replace('_', ' ') || 'Not set'}
          />
          <InfoRow
            label="Sleep Quality"
            value={onboardingData.schedule_lifestyle?.sleep_quality || 'Not set'}
          />
          {onboardingData.schedule_lifestyle?.other_activities?.length > 0 && (
            <InfoRow
              label="Other Activities"
              value={onboardingData.schedule_lifestyle.other_activities}
            />
          )}
        </View>
      </ProfileInfoSection>

      {/* App Settings */}
      <SettingsSection
        title="App Settings"
        icon="settings-outline"
        expanded={expandedSections.has('settings')}
        onToggle={() => toggleSection('settings')}
      />

      {/* Account Management */}
      <AccountManagementSection />

      {/* Account Actions */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="download-outline" size={20} color={theme.colors.text} />
          <Text style={styles.actionText}>Export My Data</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.dangerButton]}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={20} color={theme.colors.error[400]} />
          <Text style={[styles.actionText, styles.dangerText]}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Help & Support */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Help & Support</Text>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="help-circle-outline" size={20} color={theme.colors.text} />
          <Text style={styles.actionText}>FAQs</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="document-text-outline" size={20} color={theme.colors.text} />
          <Text style={styles.actionText}>Terms of Service</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.text} />
          <Text style={styles.actionText}>Privacy Policy</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>Version 1.0.0 (Build 1)</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const InfoRow = ({ label, value }: { label: string; value: string | string[] }) => {
  const isArray = Array.isArray(value);

  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={styles.infoValueContainer}>
        {isArray ? (
          value.map((item, index) => (
            <View key={index}>
              {index > 0 && <View style={styles.valueDivider} />}
              <Text style={[styles.infoValue, index > 0 && styles.infoValueSpaced]}>
                {item}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.infoValue}>{value}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  section: {
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.body.large,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  infoContent: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    alignItems: 'flex-start',
  },
  infoLabel: {
    ...theme.typography.body.medium,
    color: theme.colors.textSecondary,
    minWidth: 120,
    flex: 0,
    marginRight: theme.spacing.md,
  },
  infoValue: {
    ...theme.typography.body.medium,
    color: theme.colors.text,
    fontWeight: '500',
    textAlign: 'right',
  },
  infoValueContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  infoValueSpaced: {
    marginTop: 4,
  },
  valueDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    opacity: 0.3,
    marginVertical: 4,
    width: '100%',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionText: {
    ...theme.typography.body.medium,
    color: theme.colors.text,
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  dangerButton: {
    marginTop: theme.spacing.md,
  },
  dangerText: {
    color: theme.colors.error[400],
  },
  versionInfo: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  versionText: {
    ...theme.typography.body.small,
    color: theme.colors.textSecondary,
  },
});
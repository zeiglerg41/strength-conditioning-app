import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../constants/theme';
import { useProfileSettingsStore } from '../../../store/profileSettingsStore';

interface SettingsSectionProps {
  title: string;
  icon: string;
  expanded: boolean;
  onToggle: () => void;
}

export default function SettingsSection({
  title,
  icon,
  expanded,
  onToggle,
}: SettingsSectionProps) {
  const {
    appSettings,
    updateAppSetting,
    updateNotificationSetting,
    updatePrivacySetting,
  } = useProfileSettingsStore();

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={onToggle} activeOpacity={0.7}>
        <View style={styles.titleContainer}>
          <Ionicons name={icon as any} size={20} color={theme.colors.primary[400]} />
          <Text style={styles.title}>{title}</Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={theme.colors.textSecondary}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.content}>
          {/* Units Setting */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Units</Text>
            <View style={styles.segmentedControl}>
              <TouchableOpacity
                style={[
                  styles.segment,
                  appSettings.units === 'metric' && styles.segmentActive,
                ]}
                onPress={() => updateAppSetting('units', 'metric')}
              >
                <Text
                  style={[
                    styles.segmentText,
                    appSettings.units === 'metric' && styles.segmentTextActive,
                  ]}
                >
                  Metric
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.segment,
                  appSettings.units === 'imperial' && styles.segmentActive,
                ]}
                onPress={() => updateAppSetting('units', 'imperial')}
              >
                <Text
                  style={[
                    styles.segmentText,
                    appSettings.units === 'imperial' && styles.segmentTextActive,
                  ]}
                >
                  Imperial
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Notifications Section */}
          <View style={styles.sectionDivider}>
            <Text style={styles.sectionTitle}>Notifications</Text>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Workout Reminders</Text>
            <Switch
              value={appSettings.notifications.workoutReminders}
              onValueChange={(value) => updateNotificationSetting('workoutReminders', value)}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary[400] }}
              thumbColor={theme.colors.background}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Program Updates</Text>
            <Switch
              value={appSettings.notifications.programUpdates}
              onValueChange={(value) => updateNotificationSetting('programUpdates', value)}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary[400] }}
              thumbColor={theme.colors.background}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Achievements</Text>
            <Switch
              value={appSettings.notifications.achievements}
              onValueChange={(value) => updateNotificationSetting('achievements', value)}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary[400] }}
              thumbColor={theme.colors.background}
            />
          </View>

          {/* Privacy Section */}
          <View style={styles.sectionDivider}>
            <Text style={styles.sectionTitle}>Privacy</Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Share Location</Text>
              <Text style={styles.settingHint}>For gym and event recommendations</Text>
            </View>
            <Switch
              value={appSettings.privacy.shareLocation}
              onValueChange={(value) => updatePrivacySetting('shareLocation', value)}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary[400] }}
              thumbColor={theme.colors.background}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Anonymous Analytics</Text>
              <Text style={styles.settingHint}>Help us improve the app</Text>
            </View>
            <Switch
              value={appSettings.privacy.anonymousAnalytics}
              onValueChange={(value) => updatePrivacySetting('anonymousAnalytics', value)}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary[400] }}
              thumbColor={theme.colors.background}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    ...theme.typography.body.large,
    color: theme.colors.text,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
  content: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    padding: theme.spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
  },
  settingInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  settingLabel: {
    ...theme.typography.body.medium,
    color: theme.colors.text,
  },
  settingHint: {
    ...theme.typography.body.small,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    padding: 2,
  },
  segment: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm - 2,
  },
  segmentActive: {
    backgroundColor: theme.colors.primary[400],
  },
  segmentText: {
    ...theme.typography.body.small,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  segmentTextActive: {
    color: theme.colors.background,
  },
  sectionDivider: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  sectionTitle: {
    ...theme.typography.body.small,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
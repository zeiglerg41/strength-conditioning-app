import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../constants/theme';

interface ProfileHeaderProps {
  name: string;
  email: string;
  completionPercentage: number;
  profilePhoto?: string | null;
  onPhotoPress?: () => void;
}

export default function ProfileHeader({
  name,
  email,
  completionPercentage,
  profilePhoto,
  onPhotoPress,
}: ProfileHeaderProps) {
  const isComplete = completionPercentage === 100;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.photoContainer}
        onPress={onPhotoPress}
        activeOpacity={0.7}
      >
        {profilePhoto ? (
          <Image source={{ uri: profilePhoto }} style={styles.photo} />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="person" size={40} color={theme.colors.textSecondary} />
          </View>
        )}
        <View style={styles.photoEditIcon}>
          <Ionicons name="camera" size={16} color={theme.colors.background} />
        </View>
      </TouchableOpacity>

      <Text style={styles.name}>{name}</Text>
      <Text style={styles.email}>{email}</Text>

      {!isComplete && (
        <View style={styles.completionContainer}>
          <View style={styles.completionBar}>
            <View
              style={[
                styles.completionFill,
                { width: `${completionPercentage}%` },
              ]}
            />
          </View>
          <Text style={styles.completionText}>
            Profile {completionPercentage}% Complete
          </Text>
        </View>
      )}

      {isComplete && (
        <View style={styles.completeBadge}>
          <Ionicons name="checkmark-circle" size={20} color={theme.colors.success[400]} />
          <Text style={styles.completeText}>Profile Complete</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: theme.spacing.md,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: theme.colors.primary[400],
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: theme.colors.border,
  },
  photoEditIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary[400],
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: theme.colors.surface,
  },
  name: {
    ...theme.typography.heading.h2,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  email: {
    ...theme.typography.body.medium,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  completionContainer: {
    width: '100%',
    maxWidth: 250,
  },
  completionBar: {
    height: 6,
    backgroundColor: theme.colors.border,
    borderRadius: 3,
    marginBottom: theme.spacing.xs,
    overflow: 'hidden',
  },
  completionFill: {
    height: '100%',
    backgroundColor: theme.colors.warning[400],
    borderRadius: 3,
  },
  completionText: {
    ...theme.typography.body.small,
    color: theme.colors.warning[400],
    textAlign: 'center',
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.success[400]}15`,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  completeText: {
    ...theme.typography.body.small,
    color: theme.colors.success[400],
    marginLeft: theme.spacing.xs,
    fontWeight: '600',
  },
});
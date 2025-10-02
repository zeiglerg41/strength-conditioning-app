import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../../constants/theme';

interface ProfileInfoSectionProps {
  title: string;
  icon: string;
  expanded: boolean;
  onToggle: () => void;
  onEdit?: () => void;
  children: React.ReactNode;
}

export default function ProfileInfoSection({
  title,
  icon,
  expanded,
  onToggle,
  onEdit,
  children,
}: ProfileInfoSectionProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={onToggle} activeOpacity={0.7}>
        <View style={styles.titleContainer}>
          <Ionicons name={icon as any} size={20} color={theme.colors.primary[400]} />
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.controls}>
          {onEdit && expanded && (
            <TouchableOpacity onPress={onEdit} style={styles.editButton}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          )}
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={theme.colors.textSecondary}
          />
        </View>
      </TouchableOpacity>

      {expanded && <View style={styles.content}>{children}</View>}
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
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editButton: {
    marginRight: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.primary[400],
    borderRadius: theme.borderRadius.sm,
  },
  editText: {
    ...theme.typography.body.small,
    color: theme.colors.background,
    fontWeight: '600',
  },
  content: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
});
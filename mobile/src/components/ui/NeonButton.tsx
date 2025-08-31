import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { theme } from '../../constants/theme';

interface NeonButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent';
  style?: ViewStyle;
  disabled?: boolean;
}

export const NeonButton: React.FC<NeonButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  style,
  disabled = false,
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button, style];
    
    if (disabled) {
      return [...baseStyle, styles.disabled];
    }

    switch (variant) {
      case 'primary':
        return [...baseStyle, styles.primary, theme.shadows.neon.primary];
      case 'secondary':
        return [...baseStyle, styles.secondary, theme.shadows.neon.secondary];
      case 'accent':
        return [...baseStyle, styles.accent, theme.shadows.neon.accent];
      default:
        return [...baseStyle, styles.primary];
    }
  };

  const getTextColor = () => {
    if (disabled) return theme.colors.textMuted;
    return theme.colors.neutral[900]; // Dark text for neon backgrounds
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={[styles.text, { color: getTextColor() }]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primary: {
    backgroundColor: theme.colors.primary[400], // Neon green
  },
  secondary: {
    backgroundColor: theme.colors.secondary[500], // Neon purple
  },
  accent: {
    backgroundColor: theme.colors.accent[500], // Neon blue
  },
  disabled: {
    backgroundColor: theme.colors.neutral[700],
    opacity: 0.5,
  },
  text: {
    ...theme.typography.body.medium,
    fontWeight: '600',
    textAlign: 'center',
  },
});
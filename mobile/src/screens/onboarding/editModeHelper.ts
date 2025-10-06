// Edit mode helper for onboarding screens
import { BackHandler } from 'react-native';
import { useEffect } from 'react';

export const useEditMode = (
  isEditMode: boolean,
  navigation: any,
  expandedSection?: string,
  returnTo?: string
) => {
  const handleClose = () => {
    // If returnTo is specified, navigate back to that screen
    if (returnTo) {
      navigation.reset({
        index: 0,
        routes: [
          {
            name: 'Main' as any,
            params: {
              screen: returnTo,
              params: { expandedSection }
            }
          }
        ],
      });
    } else {
      // Default to going back
      navigation.goBack();
    }
  };

  // Handle back button in edit mode
  useEffect(() => {
    if (isEditMode) {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        handleClose();
        return true;
      });
      return () => backHandler.remove();
    }
  }, [isEditMode]);

  return { handleClose };
};

export const getEditModeStyles = (theme: any) => ({
  editHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },
  editTitle: {
    ...theme.typography.heading.h3,
    color: theme.colors.text,
    flex: 1,
    textAlign: 'center' as const,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
});
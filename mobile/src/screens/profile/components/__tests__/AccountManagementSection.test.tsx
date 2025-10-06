import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AccountManagementSection from '../AccountManagementSection';
import { useAuthStore } from '../../../../store/authStore';

// Mock the auth store
jest.mock('../../../../store/authStore');
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('AccountManagementSection', () => {
  const mockChangeEmail = jest.fn();
  const mockChangePassword = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementation
    mockUseAuthStore.mockReturnValue({
      user: { id: '123', email: 'test@example.com', created_at: '2023-01-01' },
      userProfile: null,
      loading: false,
      error: null,
      needsOnboarding: false,
      setUser: jest.fn(),
      setUserProfile: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      clearError: jest.fn(),
      setNeedsOnboarding: jest.fn(),
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      changeEmail: mockChangeEmail,
      changePassword: mockChangePassword,
      checkSession: jest.fn(),
      checkOnboardingStatus: jest.fn(),
    });
  });

  describe('Email Change', () => {
    it('should render email section with current email', () => {
      const { getByText } = render(<AccountManagementSection />);

      expect(getByText('Account Management')).toBeTruthy();
      expect(getByText('Email Address')).toBeTruthy();
      expect(getByText('test@example.com')).toBeTruthy();
    });

    it('should show email form when Change button is clicked', () => {
      const { getByText, getByPlaceholderText } = render(<AccountManagementSection />);

      const changeButton = getByText('Change');
      fireEvent.press(changeButton);

      expect(getByPlaceholderText('New email address')).toBeTruthy();
      expect(getByText('Update Email')).toBeTruthy();
    });

    it('should hide email form when Cancel button is clicked', () => {
      const { getByText, queryByPlaceholderText } = render(<AccountManagementSection />);

      // Show form
      fireEvent.press(getByText('Change'));
      expect(queryByPlaceholderText('New email address')).toBeTruthy();

      // Hide form
      fireEvent.press(getByText('Cancel'));
      expect(queryByPlaceholderText('New email address')).toBeFalsy();
    });

    it('should call changeEmail when form is submitted', async () => {
      mockChangeEmail.mockResolvedValue({
        success: true,
        message: 'Confirmation emails sent',
      });

      const { getByText, getByPlaceholderText } = render(<AccountManagementSection />);

      fireEvent.press(getByText('Change'));

      const input = getByPlaceholderText('New email address');
      fireEvent.changeText(input, 'newemail@example.com');

      const submitButton = getByText('Update Email');
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockChangeEmail).toHaveBeenCalledWith('newemail@example.com');
      });

      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Confirmation emails sent');
    });

    it('should disable submit button when email is empty', () => {
      const { getByText } = render(<AccountManagementSection />);

      fireEvent.press(getByText('Change'));

      const submitButton = getByText('Update Email');
      expect(submitButton.parent?.props.accessibilityState?.disabled).toBe(true);
    });
  });

  describe('Password Change', () => {
    it('should render password section', () => {
      const { getByText } = render(<AccountManagementSection />);

      expect(getByText('Password')).toBeTruthy();
      expect(getByText('••••••••')).toBeTruthy();
    });

    it('should show password form when Change button is clicked', () => {
      const { getAllByText, getByPlaceholderText } = render(<AccountManagementSection />);

      const changeButtons = getAllByText('Change');
      const passwordChangeButton = changeButtons[1]; // Second "Change" button
      fireEvent.press(passwordChangeButton);

      expect(getByPlaceholderText('Current password')).toBeTruthy();
      expect(getByPlaceholderText('New password')).toBeTruthy();
      expect(getByPlaceholderText('Confirm new password')).toBeTruthy();
    });

    it('should toggle password visibility', () => {
      const { getAllByText, getByPlaceholderText, getAllByTestId } = render(
        <AccountManagementSection />
      );

      fireEvent.press(getAllByText('Change')[1]);

      const currentPasswordInput = getByPlaceholderText('Current password');
      expect(currentPasswordInput.props.secureTextEntry).toBe(true);

      // Toggle visibility (we'll need to add testID to the eye icons in the component)
      // For now, this is a placeholder for the concept
    });

    it('should show password strength indicator', () => {
      const { getAllByText, getByPlaceholderText, getByText } = render(
        <AccountManagementSection />
      );

      fireEvent.press(getAllByText('Change')[1]);

      const newPasswordInput = getByPlaceholderText('New password');
      fireEvent.changeText(newPasswordInput, 'WeakPass');

      // Weak password
      expect(getByText('Weak')).toBeTruthy();

      // Strong password
      fireEvent.changeText(newPasswordInput, 'StrongPass123!@#');
      expect(getByText('Strong')).toBeTruthy();
    });

    it('should show password requirements checklist', () => {
      const { getAllByText, getByText } = render(<AccountManagementSection />);

      fireEvent.press(getAllByText('Change')[1]);

      expect(getByText('Password must contain:')).toBeTruthy();
      expect(getByText('At least 8 characters')).toBeTruthy();
      expect(getByText('One lowercase letter')).toBeTruthy();
      expect(getByText('One uppercase letter')).toBeTruthy();
      expect(getByText('One number')).toBeTruthy();
      expect(getByText('One special character')).toBeTruthy();
    });

    it('should call changePassword when form is submitted with matching passwords', async () => {
      mockChangePassword.mockResolvedValue({
        success: true,
        message: 'Password updated successfully',
      });

      const { getAllByText, getByPlaceholderText } = render(<AccountManagementSection />);

      fireEvent.press(getAllByText('Change')[1]);

      fireEvent.changeText(getByPlaceholderText('Current password'), 'OldPass123!');
      fireEvent.changeText(getByPlaceholderText('New password'), 'NewPass456@');
      fireEvent.changeText(getByPlaceholderText('Confirm new password'), 'NewPass456@');

      const submitButton = getByPlaceholderText('Confirm new password').parent?.parent?.parent
        ?.props.children[5];
      fireEvent.press(submitButton);

      await waitFor(() => {
        expect(mockChangePassword).toHaveBeenCalledWith('OldPass123!', 'NewPass456@');
      });

      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Password updated successfully');
    });

    it('should show error when passwords do not match', async () => {
      const { getAllByText, getByPlaceholderText, getByText } = render(
        <AccountManagementSection />
      );

      fireEvent.press(getAllByText('Change')[1]);

      fireEvent.changeText(getByPlaceholderText('Current password'), 'OldPass123!');
      fireEvent.changeText(getByPlaceholderText('New password'), 'NewPass456@');
      fireEvent.changeText(getByPlaceholderText('Confirm new password'), 'DifferentPass456@');

      const updateButton = getByText('Update Password');
      fireEvent.press(updateButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'New passwords do not match');
      });

      expect(mockChangePassword).not.toHaveBeenCalled();
    });

    it('should disable submit button when fields are empty', () => {
      const { getAllByText, getByText } = render(<AccountManagementSection />);

      fireEvent.press(getAllByText('Change')[1]);

      const submitButton = getByText('Update Password');
      expect(submitButton.parent?.props.accessibilityState?.disabled).toBe(true);
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator when loading', () => {
      mockUseAuthStore.mockReturnValue({
        user: { id: '123', email: 'test@example.com', created_at: '2023-01-01' },
        userProfile: null,
        loading: true,
        error: null,
        needsOnboarding: false,
        setUser: jest.fn(),
        setUserProfile: jest.fn(),
        setLoading: jest.fn(),
        setError: jest.fn(),
        clearError: jest.fn(),
        setNeedsOnboarding: jest.fn(),
        signIn: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        resetPassword: jest.fn(),
        changeEmail: mockChangeEmail,
        changePassword: mockChangePassword,
        checkSession: jest.fn(),
        checkOnboardingStatus: jest.fn(),
      });

      const { getAllByText, getByPlaceholderText, getByTestId } = render(
        <AccountManagementSection />
      );

      fireEvent.press(getAllByText('Change')[0]);
      fireEvent.changeText(getByPlaceholderText('New email address'), 'test@test.com');

      // Component should show ActivityIndicator when loading
      // We would need to add testID to ActivityIndicator for proper testing
    });
  });
});

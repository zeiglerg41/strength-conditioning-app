/**
 * Simplified component tests for AccountManagementSection
 * Focus: User interactions and UI behavior
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AccountManagementSection from '../AccountManagementSection';

// Mock Expo vector icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock the auth store with simple implementation
const mockChangeEmail = jest.fn();
const mockChangePassword = jest.fn();

jest.mock('../../../../store/authStore', () => ({
  useAuthStore: jest.fn(() => ({
    user: { id: '123', email: 'test@example.com', created_at: '2023-01-01' },
    changeEmail: mockChangeEmail,
    changePassword: mockChangePassword,
    loading: false,
  })),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('AccountManagementSection - Simplified Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Email Change UI', () => {
    it('renders current email address', () => {
      const { getByText } = render(<AccountManagementSection />);

      expect(getByText('test@example.com')).toBeTruthy();
      expect(getByText('Email Address')).toBeTruthy();
    });

    it('shows form when Change button clicked', () => {
      const { getAllByText, getByPlaceholderText } = render(<AccountManagementSection />);

      const changeButton = getAllByText('Change')[0]; // First "Change" button is for email
      fireEvent.press(changeButton);

      expect(getByPlaceholderText('New email address')).toBeTruthy();
    });

    it('hides form when Cancel button clicked', () => {
      const { getAllByText, queryByPlaceholderText } = render(<AccountManagementSection />);

      // Show form
      fireEvent.press(getAllByText('Change')[0]);
      expect(queryByPlaceholderText('New email address')).toBeTruthy();

      // Hide form
      fireEvent.press(getAllByText('Cancel')[0]);
      expect(queryByPlaceholderText('New email address')).toBeFalsy();
    });

    it('calls changeEmail when submitted', async () => {
      mockChangeEmail.mockResolvedValueOnce({
        success: true,
        message: 'Emails sent',
      });

      const { getAllByText, getByPlaceholderText } = render(<AccountManagementSection />);

      // Open form
      fireEvent.press(getAllByText('Change')[0]);

      // Enter email
      const input = getByPlaceholderText('New email address');
      fireEvent.changeText(input, 'new@example.com');

      // Submit
      fireEvent.press(getAllByText('Update Email')[0]);

      await waitFor(() => {
        expect(mockChangeEmail).toHaveBeenCalledWith('new@example.com');
      });
    });
  });

  describe('Password Change UI', () => {
    it('shows password fields when Change clicked', () => {
      const { getAllByText, getByPlaceholderText } = render(<AccountManagementSection />);

      const passwordChangeButton = getAllByText('Change')[1]; // Second "Change" button
      fireEvent.press(passwordChangeButton);

      expect(getByPlaceholderText('Current password')).toBeTruthy();
      expect(getByPlaceholderText('New password')).toBeTruthy();
      expect(getByPlaceholderText('Confirm new password')).toBeTruthy();
    });

    it('displays password requirements checklist', () => {
      const { getAllByText, getByText } = render(<AccountManagementSection />);

      fireEvent.press(getAllByText('Change')[1]);

      expect(getByText('Password must contain:')).toBeTruthy();
      expect(getByText('At least 8 characters')).toBeTruthy();
      expect(getByText('One lowercase letter')).toBeTruthy();
      expect(getByText('One uppercase letter')).toBeTruthy();
      expect(getByText('One number')).toBeTruthy();
      expect(getByText('One special character')).toBeTruthy();
    });

    it('shows password strength indicator', () => {
      const { getAllByText, getByPlaceholderText, getByText } = render(
        <AccountManagementSection />
      );

      fireEvent.press(getAllByText('Change')[1]);

      const newPasswordInput = getByPlaceholderText('New password');

      // Type weak password
      fireEvent.changeText(newPasswordInput, 'weak');
      expect(getByText('Weak')).toBeTruthy();

      // Type strong password
      fireEvent.changeText(newPasswordInput, 'StrongPass123!');
      expect(getByText('Strong')).toBeTruthy();
    });

    it('shows error when passwords do not match', async () => {
      const { getAllByText, getByPlaceholderText } = render(<AccountManagementSection />);

      fireEvent.press(getAllByText('Change')[1]);

      fireEvent.changeText(getByPlaceholderText('Current password'), 'Current123!');
      fireEvent.changeText(getByPlaceholderText('New password'), 'NewPass123!');
      fireEvent.changeText(getByPlaceholderText('Confirm new password'), 'Different123!');

      fireEvent.press(getAllByText('Update Password')[0]);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'New passwords do not match');
      });

      expect(mockChangePassword).not.toHaveBeenCalled();
    });

    it('calls changePassword with matching passwords', async () => {
      mockChangePassword.mockResolvedValueOnce({
        success: true,
        message: 'Password updated',
      });

      const { getAllByText, getByPlaceholderText } = render(<AccountManagementSection />);

      fireEvent.press(getAllByText('Change')[1]);

      fireEvent.changeText(getByPlaceholderText('Current password'), 'Current123!');
      fireEvent.changeText(getByPlaceholderText('New password'), 'NewPass123!');
      fireEvent.changeText(getByPlaceholderText('Confirm new password'), 'NewPass123!');

      fireEvent.press(getAllByText('Update Password')[0]);

      await waitFor(() => {
        expect(mockChangePassword).toHaveBeenCalledWith('Current123!', 'NewPass123!');
      });
    });
  });
});

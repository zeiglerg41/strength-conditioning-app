/**
 * Focused tests for account management features (email & password change)
 */
import { renderHook, act } from '@testing-library/react-native';
import { useAuthStore } from '../authStore';

// Simple mock for Supabase - only what we need
jest.mock('../../services/supabase', () => ({
  supabase: {
    auth: {
      updateUser: jest.fn(),
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      // Add other methods as empty stubs to prevent errors
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      getSession: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      insert: jest.fn(),
    })),
  },
}));

// Get the mocked functions after mock setup
const { supabase } = require('../../services/supabase');
const mockUpdateUser = supabase.auth.updateUser;
const mockGetUser = supabase.auth.getUser;
const mockSignInWithPassword = supabase.auth.signInWithPassword;

describe('Account Management - Change Email & Password', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Reset store to clean state
    useAuthStore.setState({
      user: null,
      userProfile: null,
      loading: false,
      error: null,
    });
  });

  describe('changeEmail', () => {
    it('should successfully change email with valid input', async () => {
      const newEmail = 'newemail@example.com';
      const updatedUser = { id: '123', email: newEmail };

      // Mock successful email update
      mockUpdateUser.mockResolvedValueOnce({
        data: { user: updatedUser },
        error: null,
      });

      const { result } = renderHook(() => useAuthStore());

      let response;
      await act(async () => {
        response = await result.current.changeEmail(newEmail);
      });

      // Verify the API was called correctly
      expect(mockUpdateUser).toHaveBeenCalledTimes(1);
      expect(mockUpdateUser).toHaveBeenCalledWith({ email: newEmail });

      // Verify the response
      expect(response).toMatchObject({
        success: true,
        message: expect.stringContaining('Confirmation emails sent'),
      });

      // Verify store state updated
      expect(result.current.user).toEqual(updatedUser);
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('should reject invalid email format', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.changeEmail('not-an-email');
        } catch (error) {
          expect(error.message).toBe('Please enter a valid email address');
        }
      });

      // Should not call API with invalid email
      expect(mockUpdateUser).not.toHaveBeenCalled();
      expect(result.current.error).toBe('Please enter a valid email address');
    });

    it('should handle Supabase error gracefully', async () => {
      const errorMessage = 'Email already in use';

      mockUpdateUser.mockResolvedValueOnce({
        data: null,
        error: new Error(errorMessage),
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.changeEmail('taken@example.com');
        } catch (error) {
          expect(error.message).toBe(errorMessage);
        }
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('changePassword', () => {
    const mockUser = { id: '123', email: 'user@example.com' };

    beforeEach(() => {
      // Setup default user for password tests
      mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it('should successfully change password with valid inputs', async () => {
      const currentPassword = 'Current123!';
      const newPassword = 'NewSecure456@';

      // Mock successful reauthentication
      mockSignInWithPassword.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      // Mock successful password update
      mockUpdateUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      const { result } = renderHook(() => useAuthStore());

      let response;
      await act(async () => {
        response = await result.current.changePassword(currentPassword, newPassword);
      });

      // Verify reauthentication happened
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: mockUser.email,
        password: currentPassword,
      });

      // Verify password update called
      expect(mockUpdateUser).toHaveBeenCalledWith({
        password: newPassword,
      });

      // Verify response
      expect(response).toMatchObject({
        success: true,
        message: 'Password updated successfully',
      });

      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('should validate password has minimum 8 characters', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.changePassword('Current123!', 'Short1!');
        } catch (error) {
          expect(error.message).toBe('Password must be at least 8 characters long');
        }
      });

      expect(mockUpdateUser).not.toHaveBeenCalled();
      expect(result.current.error).toBe('Password must be at least 8 characters long');
    });

    it('should validate password has lowercase letter', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.changePassword('Current123!', 'UPPER123!');
        } catch (error) {
          expect(error.message).toBe('Password must contain at least one lowercase letter');
        }
      });

      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it('should validate password has uppercase letter', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.changePassword('Current123!', 'lower123!');
        } catch (error) {
          expect(error.message).toBe('Password must contain at least one uppercase letter');
        }
      });

      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it('should validate password has number', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.changePassword('Current123!', 'NoNumbers!');
        } catch (error) {
          expect(error.message).toBe('Password must contain at least one number');
        }
      });

      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it('should validate password has special character', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.changePassword('Current123!', 'NoSpecial123');
        } catch (error) {
          expect(error.message).toBe('Password must contain at least one special character');
        }
      });

      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it('should reject incorrect current password', async () => {
      // Mock failed reauthentication
      mockSignInWithPassword.mockResolvedValueOnce({
        data: null,
        error: new Error('Invalid credentials'),
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.changePassword('WrongPassword!', 'NewPassword123!');
        } catch (error) {
          expect(error.message).toBe('Current password is incorrect');
        }
      });

      // Should not attempt to update password
      expect(mockUpdateUser).not.toHaveBeenCalled();
      expect(result.current.error).toBe('Current password is incorrect');
    });

    it('should handle not authenticated state', async () => {
      // Mock no user
      mockGetUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.changePassword('Current123!', 'New123!');
        } catch (error) {
          expect(error.message).toBe('Not authenticated');
        }
      });

      expect(mockSignInWithPassword).not.toHaveBeenCalled();
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it('should handle password update failure from Supabase', async () => {
      const errorMessage = 'Password too similar to email';

      // Mock successful reauthentication
      mockSignInWithPassword.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      // Mock failed password update
      mockUpdateUser.mockResolvedValueOnce({
        data: null,
        error: new Error(errorMessage),
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.changePassword('Current123!', 'New123!@#');
        } catch (error) {
          expect(error.message).toBe(errorMessage);
        }
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.loading).toBe(false);
    });
  });
});
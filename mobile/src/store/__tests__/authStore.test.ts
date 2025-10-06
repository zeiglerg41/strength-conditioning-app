import { renderHook, act } from '@testing-library/react-native';

// Create mock functions
const mockSignInWithPassword = jest.fn();
const mockSignUp = jest.fn();
const mockSignOut = jest.fn();
const mockResetPasswordForEmail = jest.fn();
const mockUpdateUser = jest.fn();
const mockGetUser = jest.fn();
const mockGetSession = jest.fn();
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();
const mockInsert = jest.fn();

// Mock Supabase module
jest.mock('../../services/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      signOut: mockSignOut,
      resetPasswordForEmail: mockResetPasswordForEmail,
      updateUser: mockUpdateUser,
      getUser: mockGetUser,
      getSession: mockGetSession,
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(),
      })),
    })),
  },
}));

// Import AFTER the mock is set up
import { useAuthStore } from '../authStore';

// Get the mocked module for accessing the mocks in tests
const { supabase: mockSupabase } = require('../../services/supabase');

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset the store state before each test
    useAuthStore.setState({
      user: null,
      userProfile: null,
      loading: true,
      error: null,
    });
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useAuthStore());
      
      expect(result.current.user).toBeNull();
      expect(result.current.userProfile).toBeNull();
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
    });
  });

  describe('State Setters', () => {
    it('should set user correctly', () => {
      const { result } = renderHook(() => useAuthStore());
      const testUser = { id: '123', email: 'test@example.com', created_at: '2023-01-01' };
      
      act(() => {
        result.current.setUser(testUser);
      });
      
      expect(result.current.user).toEqual(testUser);
    });

    it('should set loading state correctly', () => {
      const { result } = renderHook(() => useAuthStore());
      
      act(() => {
        result.current.setLoading(false);
      });
      
      expect(result.current.loading).toBe(false);
    });

    it('should set error correctly', () => {
      const { result } = renderHook(() => useAuthStore());
      const error = 'Test error';
      
      act(() => {
        result.current.setError(error);
      });
      
      expect(result.current.error).toBe(error);
    });

    it('should clear error correctly', () => {
      const { result } = renderHook(() => useAuthStore());
      
      // Set an error first
      act(() => {
        result.current.setError('Test error');
      });
      
      expect(result.current.error).toBe('Test error');
      
      // Clear the error
      act(() => {
        result.current.clearError();
      });
      
      expect(result.current.error).toBeNull();
    });
  });

  describe('signIn', () => {
    it('should sign in successfully', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      const mockProfile = { id: 'profile-123', user_id: '123', email: 'test@example.com' };

      mockSignInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockSingleFn = jest.fn().mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      mockSupabase.from = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: mockSingleFn,
          })),
        })),
      }));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.signIn('test@example.com', 'password');
      });

      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.userProfile).toEqual(mockProfile);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle sign in error', async () => {
      const error = new Error('Invalid credentials');
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null },
        error,
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.signIn('test@example.com', 'wrongpassword');
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Invalid credentials');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('signUp', () => {
    it('should sign up successfully', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      
      const { result } = renderHook(() => useAuthStore());
      
      await act(async () => {
        await result.current.signUp('test@example.com', 'password');
      });
      
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.loading).toBe(false);
    });

    it('should handle sign up error', async () => {
      const error = new Error('User already exists');
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error,
      });
      
      const { result } = renderHook(() => useAuthStore());
      
      await act(async () => {
        try {
          await result.current.signUp('test@example.com', 'password');
        } catch (e) {
          // Expected to throw
        }
      });
      
      expect(result.current.error).toBe('User already exists');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: null,
      });
      
      const { result } = renderHook(() => useAuthStore());
      
      // Set initial user state
      act(() => {
        result.current.setUser({ id: '123', email: 'test@example.com', created_at: '2023-01-01' });
      });
      
      await act(async () => {
        await result.current.signOut();
      });
      
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.userProfile).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('should handle sign out error', async () => {
      const error = new Error('Sign out failed');
      mockSupabase.auth.signOut.mockResolvedValue({
        error,
      });
      
      const { result } = renderHook(() => useAuthStore());
      
      await act(async () => {
        try {
          await result.current.signOut();
        } catch (e) {
          // Expected to throw
        }
      });
      
      expect(result.current.error).toBe('Sign out failed');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        error: null,
      });
      
      const { result } = renderHook(() => useAuthStore());
      
      await act(async () => {
        await result.current.resetPassword('test@example.com');
      });
      
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@example.com');
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle reset password error', async () => {
      const error = new Error('Email not found');
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        error,
      });
      
      const { result } = renderHook(() => useAuthStore());
      
      await act(async () => {
        try {
          await result.current.resetPassword('invalid@example.com');
        } catch (e) {
          // Expected to throw
        }
      });
      
      expect(result.current.error).toBe('Email not found');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('checkSession', () => {
    it('should check session successfully with user', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      const mockSession = { user: mockUser };
      const mockProfile = { id: 'profile-123', user_id: '123', email: 'test@example.com' };
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockProfile,
        error: null,
      });
      
      const { result } = renderHook(() => useAuthStore());
      
      await act(async () => {
        await result.current.checkSession();
      });
      
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.userProfile).toEqual(mockProfile);
      expect(result.current.loading).toBe(false);
    });

    it('should handle no session', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });
      
      const { result } = renderHook(() => useAuthStore());
      
      await act(async () => {
        await result.current.checkSession();
      });
      
      expect(result.current.user).toBeNull();
      expect(result.current.userProfile).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it('should handle session check error', async () => {
      const error = new Error('Session check failed');
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error,
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.checkSession();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.userProfile).toBeNull();
      expect(result.current.loading).toBe(false);
    });
  });

  describe('changeEmail', () => {
    it('should change email successfully', async () => {
      const newEmail = 'newemail@example.com';
      const mockUser = { id: '123', email: newEmail };

      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const { result } = renderHook(() => useAuthStore());

      let response;
      await act(async () => {
        response = await result.current.changeEmail(newEmail);
      });

      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        email: newEmail,
      });
      expect(response).toEqual({
        success: true,
        message: expect.stringContaining('Confirmation emails sent'),
      });
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should reject invalid email format', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.changeEmail('invalid-email');
        } catch (e) {
          // Expected to throw
        }
      });

      expect(mockSupabase.auth.updateUser).not.toHaveBeenCalled();
      expect(result.current.error).toBe('Please enter a valid email address');
      expect(result.current.loading).toBe(false);
    });

    it('should handle email change error from Supabase', async () => {
      const error = new Error('Email already exists');
      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: null },
        error,
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.changeEmail('existing@example.com');
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Email already exists');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('changePassword', () => {
    const mockUser = { id: '123', email: 'test@example.com' };

    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it('should change password successfully', async () => {
      const currentPassword = 'OldPass123!';
      const newPassword = 'NewPass456@';

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const { result } = renderHook(() => useAuthStore());

      let response;
      await act(async () => {
        response = await result.current.changePassword(currentPassword, newPassword);
      });

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: mockUser.email,
        password: currentPassword,
      });
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: newPassword,
      });
      expect(response).toEqual({
        success: true,
        message: 'Password updated successfully',
      });
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should reject password less than 8 characters', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.changePassword('OldPass123!', 'Short1!');
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Password must be at least 8 characters long');
      expect(mockSupabase.auth.updateUser).not.toHaveBeenCalled();
    });

    it('should reject password without lowercase letter', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.changePassword('OldPass123!', 'NEWPASS123!');
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Password must contain at least one lowercase letter');
      expect(mockSupabase.auth.updateUser).not.toHaveBeenCalled();
    });

    it('should reject password without uppercase letter', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.changePassword('OldPass123!', 'newpass123!');
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Password must contain at least one uppercase letter');
      expect(mockSupabase.auth.updateUser).not.toHaveBeenCalled();
    });

    it('should reject password without number', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.changePassword('OldPass123!', 'NewPassword!');
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Password must contain at least one number');
      expect(mockSupabase.auth.updateUser).not.toHaveBeenCalled();
    });

    it('should reject password without special character', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.changePassword('OldPass123!', 'NewPass123');
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Password must contain at least one special character');
      expect(mockSupabase.auth.updateUser).not.toHaveBeenCalled();
    });

    it('should reject incorrect current password', async () => {
      const error = new Error('Invalid credentials');
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error,
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.changePassword('WrongPass123!', 'NewPass456@');
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Current password is incorrect');
      expect(mockSupabase.auth.updateUser).not.toHaveBeenCalled();
      expect(result.current.loading).toBe(false);
    });

    it('should handle not authenticated error', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.changePassword('OldPass123!', 'NewPass456@');
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Not authenticated');
      expect(mockSupabase.auth.updateUser).not.toHaveBeenCalled();
    });

    it('should handle password update error from Supabase', async () => {
      const error = new Error('Password update failed');

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: null },
        error,
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.changePassword('OldPass123!', 'NewPass456@');
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Password update failed');
      expect(result.current.loading).toBe(false);
    });
  });
});
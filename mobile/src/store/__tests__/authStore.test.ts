import { renderHook, act } from '@testing-library/react-native';
import { useAuthStore } from '../authStore';

// Mock Supabase
const mockSupabase = {
  auth: {
    signInWithPassword: jest.fn(),
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
  })),
};

jest.mock('../../services/supabase', () => ({
  supabase: mockSupabase,
}));

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
      
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockProfile,
        error: null,
      });
      
      const { result } = renderHook(() => useAuthStore());
      
      await act(async () => {
        await result.current.signIn('test@example.com', 'password');
      });
      
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
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
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
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
});
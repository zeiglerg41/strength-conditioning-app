import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import LoginScreen from '../LoginScreen';
import { useAuthStore } from '../../../store/authStore';

// Mock the auth store
jest.mock('../../../store/authStore');

// Mock React Navigation
const mockNavigation = {
  navigate: jest.fn(),
};

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('LoginScreen', () => {
  const mockSignIn = jest.fn();
  const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockReturnValue({
      signIn: mockSignIn,
      loading: false,
      error: null,
      user: null,
      userProfile: null,
      setUser: jest.fn(),
      setUserProfile: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      clearError: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      checkSession: jest.fn(),
    });
  });

  it('should render correctly', () => {
    render(<LoginScreen navigation={mockNavigation as any} route={{} as any} />);
    
    expect(screen.getByText('Welcome Back')).toBeTruthy();
    expect(screen.getByText('Sign in to continue')).toBeTruthy();
    expect(screen.getByPlaceholderText('Email')).toBeTruthy();
    expect(screen.getByPlaceholderText('Password')).toBeTruthy();
    expect(screen.getByText('Sign In')).toBeTruthy();
  });

  it('should handle email input', () => {
    render(<LoginScreen navigation={mockNavigation as any} route={{} as any} />);
    
    const emailInput = screen.getByPlaceholderText('Email');
    fireEvent.changeText(emailInput, 'test@example.com');
    
    expect(emailInput.props.value).toBe('test@example.com');
  });

  it('should handle password input', () => {
    render(<LoginScreen navigation={mockNavigation as any} route={{} as any} />);
    
    const passwordInput = screen.getByPlaceholderText('Password');
    fireEvent.changeText(passwordInput, 'password123');
    
    expect(passwordInput.props.value).toBe('password123');
  });

  it('should show error when fields are empty', async () => {
    render(<LoginScreen navigation={mockNavigation as any} route={{} as any} />);
    
    const signInButton = screen.getByText('Sign In');
    fireEvent.press(signInButton);
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please fill in all fields');
    });
  });

  it('should call signIn when form is valid', async () => {
    mockSignIn.mockResolvedValue(undefined);
    
    render(<LoginScreen navigation={mockNavigation as any} route={{} as any} />);
    
    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const signInButton = screen.getByText('Sign In');
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(signInButton);
    
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('should show error alert when signIn fails', async () => {
    const errorMessage = 'Invalid credentials';
    mockSignIn.mockRejectedValue(new Error(errorMessage));
    mockUseAuthStore.mockReturnValue({
      signIn: mockSignIn,
      loading: false,
      error: errorMessage,
      user: null,
      userProfile: null,
      setUser: jest.fn(),
      setUserProfile: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      clearError: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      checkSession: jest.fn(),
    });
    
    render(<LoginScreen navigation={mockNavigation as any} route={{} as any} />);
    
    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const signInButton = screen.getByText('Sign In');
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'wrongpassword');
    fireEvent.press(signInButton);
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Login Failed', errorMessage);
    });
  });

  it('should show loading state', () => {
    mockUseAuthStore.mockReturnValue({
      signIn: mockSignIn,
      loading: true,
      error: null,
      user: null,
      userProfile: null,
      setUser: jest.fn(),
      setUserProfile: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      clearError: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPassword: jest.fn(),
      checkSession: jest.fn(),
    });
    
    render(<LoginScreen navigation={mockNavigation as any} route={{} as any} />);
    
    const signInButton = screen.getByTestId('button');
    expect(signInButton.props.loading).toBe(true);
  });

  it('should navigate to signup screen', () => {
    render(<LoginScreen navigation={mockNavigation as any} route={{} as any} />);
    
    const signUpButton = screen.getByText('Sign Up');
    fireEvent.press(signUpButton);
    
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Signup');
  });

  it('should navigate to forgot password screen', () => {
    render(<LoginScreen navigation={mockNavigation as any} route={{} as any} />);
    
    const forgotPasswordButton = screen.getByText('Forgot Password?');
    fireEvent.press(forgotPasswordButton);
    
    expect(mockNavigation.navigate).toHaveBeenCalledWith('ForgotPassword');
  });
});
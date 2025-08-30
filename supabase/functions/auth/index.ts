// Authentication Edge Function
// Handles user registration, login, logout, and password management

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { 
  createErrorResponse, 
  createSuccessResponse,
  ValidationError,
  AuthenticationError 
} from '../_shared/utils/errors.ts';
import { 
  validateEmail, 
  validatePassword,
  ValidationError as ValidError
} from '../_shared/utils/validation.ts';

interface SignupRequest {
  email: string;
  password: string;
  profile?: {
    name: string;
    date_of_birth?: string;
    gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  };
}

interface LoginRequest {
  email: string;
  password: string;
}

interface ForgotPasswordRequest {
  email: string;
}

interface ResetPasswordRequest {
  token: string;
  password: string;
}

function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
}

async function handleSignup(request: Request) {
  const body: SignupRequest = await request.json();
  
  // Validate input
  if (!validateEmail(body.email)) {
    throw new ValidationError('Invalid email format');
  }
  
  const passwordValidation = validatePassword(body.password);
  if (!passwordValidation.valid) {
    throw new ValidationError(passwordValidation.errors.join(', '));
  }
  
  const supabase = createSupabaseClient();
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        data: body.profile || {}
      }
    });
    
    if (error) {
      throw new AuthenticationError(error.message);
    }
    
    return createSuccessResponse({
      user: data.user,
      session: data.session,
      message: 'Account created successfully. Please check your email to verify your account.'
    }, 201);
  } catch (error) {
    if (error instanceof AuthenticationError) throw error;
    throw new AuthenticationError('Failed to create account');
  }
}

async function handleLogin(request: Request) {
  const body: LoginRequest = await request.json();
  
  if (!validateEmail(body.email)) {
    throw new ValidationError('Invalid email format');
  }
  
  if (!body.password) {
    throw new ValidationError('Password is required');
  }
  
  const supabase = createSupabaseClient();
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password
    });
    
    if (error) {
      throw new AuthenticationError('Invalid email or password');
    }
    
    return createSuccessResponse({
      user: data.user,
      session: data.session,
      message: 'Login successful'
    });
  } catch (error) {
    if (error instanceof AuthenticationError) throw error;
    throw new AuthenticationError('Login failed');
  }
}

async function handleLogout(request: Request) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader) {
    throw new AuthenticationError('Authorization header required');
  }
  
  const token = authHeader.replace('Bearer ', '');
  const supabase = createSupabaseClient();
  
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw new AuthenticationError('Logout failed');
    }
    
    return createSuccessResponse({
      message: 'Logout successful'
    });
  } catch (error) {
    if (error instanceof AuthenticationError) throw error;
    throw new AuthenticationError('Logout failed');
  }
}

async function handleRefreshToken(request: Request) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader) {
    throw new AuthenticationError('Authorization header required');
  }
  
  const refreshToken = authHeader.replace('Bearer ', '');
  const supabase = createSupabaseClient();
  
  try {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });
    
    if (error) {
      throw new AuthenticationError('Token refresh failed');
    }
    
    return createSuccessResponse({
      session: data.session,
      user: data.user,
      message: 'Token refreshed successfully'
    });
  } catch (error) {
    if (error instanceof AuthenticationError) throw error;
    throw new AuthenticationError('Token refresh failed');
  }
}

async function handleForgotPassword(request: Request) {
  const body: ForgotPasswordRequest = await request.json();
  
  if (!validateEmail(body.email)) {
    throw new ValidationError('Invalid email format');
  }
  
  const supabase = createSupabaseClient();
  
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(body.email, {
      redirectTo: `${Deno.env.get('FRONTEND_URL') || 'http://localhost:3000'}/reset-password`
    });
    
    if (error) {
      throw new AuthenticationError('Password reset request failed');
    }
    
    return createSuccessResponse({
      message: 'Password reset email sent. Please check your inbox.'
    });
  } catch (error) {
    if (error instanceof AuthenticationError) throw error;
    throw new AuthenticationError('Password reset request failed');
  }
}

async function handleResetPassword(request: Request) {
  const body: ResetPasswordRequest = await request.json();
  
  const passwordValidation = validatePassword(body.password);
  if (!passwordValidation.valid) {
    throw new ValidationError(passwordValidation.errors.join(', '));
  }
  
  const supabase = createSupabaseClient();
  
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: body.password
    });
    
    if (error) {
      throw new AuthenticationError('Password reset failed');
    }
    
    return createSuccessResponse({
      user: data.user,
      message: 'Password reset successful'
    });
  } catch (error) {
    if (error instanceof AuthenticationError) throw error;
    throw new AuthenticationError('Password reset failed');
  }
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;
    
    // Route handling based on path and method
    if (path === '/auth/signup' && method === 'POST') {
      return await handleSignup(req);
    }
    
    if (path === '/auth/login' && method === 'POST') {
      return await handleLogin(req);
    }
    
    if (path === '/auth/logout' && method === 'POST') {
      return await handleLogout(req);
    }
    
    if (path === '/auth/refresh' && method === 'POST') {
      return await handleRefreshToken(req);
    }
    
    if (path === '/auth/forgot-password' && method === 'POST') {
      return await handleForgotPassword(req);
    }
    
    if (path === '/auth/reset-password' && method === 'POST') {
      return await handleResetPassword(req);
    }
    
    // Handle preflight OPTIONS requests
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    }
    
    // Route not found
    throw new ValidationError(`Route ${method} ${path} not found`);
    
  } catch (error) {
    console.error('Auth function error:', error);
    return createErrorResponse(error, requestId);
  }
});
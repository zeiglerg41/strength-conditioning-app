// Authentication utilities for Edge Functions
// Provides helper functions for user authentication and authorization

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { AuthenticationError, AuthorizationError } from './errors.ts';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role?: string;
}

export function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function authenticateUser(request: Request): Promise<AuthenticatedUser> {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader) {
    throw new AuthenticationError('Authorization header missing');
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  if (!token) {
    throw new AuthenticationError('Bearer token missing');
  }
  
  const supabase = createSupabaseClient();
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      throw new AuthenticationError('Invalid or expired token');
    }
    
    return {
      id: user.id,
      email: user.email || '',
      role: user.user_metadata?.role
    };
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    throw new AuthenticationError('Token validation failed');
  }
}

export async function requireAuthentication(request: Request): Promise<AuthenticatedUser> {
  return await authenticateUser(request);
}

export function requireRole(user: AuthenticatedUser, requiredRole: string): void {
  if (user.role !== requiredRole) {
    throw new AuthorizationError(`Role '${requiredRole}' required`);
  }
}

export function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.replace('Bearer ', '');
}

export async function validateRequestMethod(request: Request, allowedMethods: string[]): Promise<void> {
  if (!allowedMethods.includes(request.method)) {
    throw new AuthorizationError(
      `Method ${request.method} not allowed. Allowed methods: ${allowedMethods.join(', ')}`
    );
  }
}

export async function parseRequestBody<T>(request: Request): Promise<T> {
  try {
    const body = await request.json();
    return body as T;
  } catch (error) {
    throw new ValidationError('Invalid JSON in request body');
  }
}
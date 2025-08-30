// Input validation utilities for Edge Functions
// Provides type-safe validation for API requests

import { UserProfile, TargetEvent, Workout } from '../types/api.ts';

export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return { valid: errors.length === 0, errors };
}

export function validateUserProfile(profile: Partial<UserProfile>): void {
  if (!profile.email || !validateEmail(profile.email)) {
    throw new ValidationError('Valid email is required', 'email', 'INVALID_EMAIL');
  }
  
  if (!profile.profile?.name?.trim()) {
    throw new ValidationError('Name is required', 'profile.name', 'REQUIRED_FIELD');
  }
  
  if (profile.profile?.height && (profile.profile.height < 100 || profile.profile.height > 250)) {
    throw new ValidationError('Height must be between 100-250 cm', 'profile.height', 'INVALID_RANGE');
  }
  
  if (profile.profile?.weight && (profile.profile.weight < 30 || profile.profile.weight > 300)) {
    throw new ValidationError('Weight must be between 30-300 kg', 'profile.weight', 'INVALID_RANGE');
  }
}

export function validateTargetEvent(event: TargetEvent): void {
  if (!event.name?.trim()) {
    throw new ValidationError('Event name is required', 'name', 'REQUIRED_FIELD');
  }
  
  if (!event.date) {
    throw new ValidationError('Event date is required', 'date', 'REQUIRED_FIELD');
  }
  
  const eventDate = new Date(event.date);
  const today = new Date();
  
  if (isNaN(eventDate.getTime())) {
    throw new ValidationError('Invalid event date format', 'date', 'INVALID_DATE');
  }
  
  if (eventDate <= today) {
    throw new ValidationError('Event date must be in the future', 'date', 'INVALID_DATE');
  }
  
  const maxDaysOut = 365 * 2; // 2 years max
  const daysDifference = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDifference > maxDaysOut) {
    throw new ValidationError('Event date cannot be more than 2 years in the future', 'date', 'INVALID_RANGE');
  }
}

export function validateWorkoutContext(context: any): void {
  const validLocationTypes = ['home', 'commercial_gym', 'hotel', 'outdoor', 'bodyweight'];
  
  if (context.location_type && !validLocationTypes.includes(context.location_type)) {
    throw new ValidationError(
      `Invalid location type. Must be one of: ${validLocationTypes.join(', ')}`,
      'location_type',
      'INVALID_ENUM'
    );
  }
  
  if (context.time_available_minutes && (context.time_available_minutes < 5 || context.time_available_minutes > 240)) {
    throw new ValidationError(
      'Time available must be between 5-240 minutes',
      'time_available_minutes',
      'INVALID_RANGE'
    );
  }
}

export function validateDeloadReason(reason: string): boolean {
  const validReasons = ['poor_sleep', 'high_stress', 'fatigue', 'overreaching'];
  return validReasons.includes(reason);
}

export function sanitizeString(input: string, maxLength: number = 255): string {
  return input.trim().substring(0, maxLength);
}

export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export function validatePaginationParams(page?: number, limit?: number): { page: number; limit: number } {
  const validatedPage = Math.max(1, Math.floor(page || 1));
  const validatedLimit = Math.min(100, Math.max(1, Math.floor(limit || 20)));
  
  return { page: validatedPage, limit: validatedLimit };
}
import { validateEmail, validatePassword, validateName, sanitizeInput, formatWorkoutDuration } from '../validation';

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true);
      expect(validateEmail('x@y.z')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('test.domain.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const result = validatePassword('StrongPass123');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject passwords that are too short', () => {
      const result = validatePassword('Short1');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject passwords without uppercase letters', () => {
      const result = validatePassword('lowercase123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject passwords without lowercase letters', () => {
      const result = validatePassword('UPPERCASE123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject passwords without numbers', () => {
      const result = validatePassword('NoNumbers');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should return multiple errors for weak passwords', () => {
      const result = validatePassword('weak');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3); // lowercase already present, missing: length, uppercase, number
    });
  });

  describe('validateName', () => {
    it('should validate names with sufficient length', () => {
      expect(validateName('John')).toBe(true);
      expect(validateName('Jo')).toBe(true);
      expect(validateName('  John  ')).toBe(true); // Should trim whitespace
    });

    it('should reject names that are too short', () => {
      expect(validateName('J')).toBe(false);
      expect(validateName('')).toBe(false);
      expect(validateName('   ')).toBe(false); // Only whitespace
    });
  });

  describe('sanitizeInput', () => {
    it('should remove dangerous characters', () => {
      expect(sanitizeInput('Hello<script>alert("xss")</script>')).toBe('Helloscriptalert(xss)/script');
      expect(sanitizeInput('Safe input')).toBe('Safe input');
      expect(sanitizeInput('Input with "quotes" and \'apostrophes\'')).toBe('Input with quotes and apostrophes');
    });

    it('should trim whitespace', () => {
      expect(sanitizeInput('  trimmed  ')).toBe('trimmed');
      expect(sanitizeInput('\t\ntext\t\n')).toBe('text');
    });

    it('should handle empty strings', () => {
      expect(sanitizeInput('')).toBe('');
      expect(sanitizeInput('   ')).toBe('');
    });
  });

  describe('formatWorkoutDuration', () => {
    it('should format minutes under 60', () => {
      expect(formatWorkoutDuration(30)).toBe('30m');
      expect(formatWorkoutDuration(45)).toBe('45m');
      expect(formatWorkoutDuration(1)).toBe('1m');
    });

    it('should format exact hours', () => {
      expect(formatWorkoutDuration(60)).toBe('1h');
      expect(formatWorkoutDuration(120)).toBe('2h');
      expect(formatWorkoutDuration(180)).toBe('3h');
    });

    it('should format hours with remaining minutes', () => {
      expect(formatWorkoutDuration(75)).toBe('1h 15m');
      expect(formatWorkoutDuration(90)).toBe('1h 30m');
      expect(formatWorkoutDuration(125)).toBe('2h 5m');
    });

    it('should handle edge cases', () => {
      expect(formatWorkoutDuration(0)).toBe('0m');
      expect(formatWorkoutDuration(59)).toBe('59m');
      expect(formatWorkoutDuration(61)).toBe('1h 1m');
    });
  });
});
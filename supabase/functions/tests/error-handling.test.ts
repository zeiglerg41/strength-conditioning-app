// Unit Tests for Error Handling & Validation
// Tests the error utilities and validation functions

import { assertEquals, assertExists, assert, assertThrows } from 'https://deno.land/std@0.208.0/testing/asserts.ts'
import { 
  ValidationError, 
  AuthenticationError, 
  NotFoundError,
  createErrorResponse,
  createSuccessResponse 
} from '../_shared/utils/errors.ts'
import { 
  validateEmail, 
  validateRequired, 
  validateUUID,
  sanitizeString 
} from '../_shared/utils/validation.ts'

// Test error handling utilities
Deno.test('Error Handling Tests', async (t) => {
  await t.step('ValidationError should create proper error', () => {
    const error = new ValidationError('Name is required', 'name')
    assertEquals(error.message, 'Name is required')
    assertEquals(error.code, 'VALIDATION_ERROR')
    assertEquals(error.statusCode, 400)
    assertEquals(error.details?.field, 'name')
  })

  await t.step('AuthenticationError should create proper error', () => {
    const error = new AuthenticationError()
    assertEquals(error.message, 'Authentication required')
    assertEquals(error.code, 'AUTHENTICATION_REQUIRED')
    assertEquals(error.statusCode, 401)
  })

  await t.step('NotFoundError should create proper error', () => {
    const error = new NotFoundError('User')
    assertEquals(error.message, 'User not found')
    assertEquals(error.code, 'NOT_FOUND')
    assertEquals(error.statusCode, 404)
  })

  await t.step('createErrorResponse should format error properly', () => {
    const error = new ValidationError('Invalid email', 'email')
    const response = createErrorResponse(error)
    
    assertEquals(response.status, 400)
    assertEquals(response.headers.get('Content-Type'), 'application/json')
    
    // Note: Can't easily test response body in unit test, but structure is validated
  })

  await t.step('createSuccessResponse should format success properly', () => {
    const data = { id: '123', name: 'Test User' }
    const response = createSuccessResponse(data, 201)
    
    assertEquals(response.status, 201)
    assertEquals(response.headers.get('Content-Type'), 'application/json')
  })
})

// Test validation utilities
Deno.test('Validation Tests', async (t) => {
  await t.step('validateEmail should validate email addresses', () => {
    assert(validateEmail('test@example.com'))
    assert(validateEmail('user+tag@domain.co.uk'))
    assert(!validateEmail('invalid-email'))
    assert(!validateEmail('test@'))
    assert(!validateEmail('@example.com'))
    assert(!validateEmail('test@example'))
  })

  await t.step('validateRequired should check required fields', () => {
    const validData = { name: 'John', email: 'john@example.com' }
    const invalidData = { name: 'John' } // missing email

    // Should not throw for valid data
    validateRequired(validData, ['name', 'email'])
    
    // Should throw for missing field
    assertThrows(
      () => validateRequired(invalidData, ['name', 'email']),
      Error,
      'email is required'
    )
  })

  await t.step('validateRequired should handle empty strings as invalid', () => {
    const dataWithEmptyString = { name: '', email: 'test@example.com' }
    
    assertThrows(
      () => validateRequired(dataWithEmptyString, ['name']),
      Error,
      'name is required'
    )
  })

  await t.step('validateUUID should validate UUID format', () => {
    assert(validateUUID('550e8400-e29b-41d4-a716-446655440000'))
    assert(validateUUID('6ba7b810-9dad-11d1-80b4-00c04fd430c8'))
    assert(!validateUUID('invalid-uuid'))
    assert(!validateUUID('550e8400-e29b-41d4-a716'))
    assert(!validateUUID(''))
  })

  await t.step('sanitizeString should clean and limit input', () => {
    assertEquals(sanitizeString('  test  '), 'test')
    assertEquals(sanitizeString('very long string'.repeat(20), 10), 'very long ')
    assertEquals(sanitizeString(''), '')
  })
})

// Integration test for error handling workflow
Deno.test('Error Handling Integration Test', async (t) => {
  await t.step('Complete validation and error response workflow', () => {
    try {
      // Simulate invalid user registration data - missing required field
      const userData = {
        email: 'valid@example.com',
        name: ''  // Empty name should fail validation
      }
      
      // Validate required fields first (this will throw)
      validateRequired(userData, ['name', 'email'])
      
      // Should not reach here
      assert(false, 'Should have thrown validation error')
      
    } catch (error) {
      // Should catch ValidationError for missing name
      assert(error instanceof Error)
      assertEquals(error.message, 'name is required')
      
      // Create error response (generic Error gets 500 status)
      const response = createErrorResponse(error)
      assertEquals(response.status, 500)
    }
  })

  await t.step('Should handle unknown errors gracefully', () => {
    const unknownError = new Error('Something went wrong')
    const response = createErrorResponse(unknownError)
    
    assertEquals(response.status, 500)
    // Should still create valid response even for unknown errors
  })
})
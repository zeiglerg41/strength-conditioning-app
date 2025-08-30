// Unit tests for validation utilities
import { assertEquals, assertThrows } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { 
  validateEmail,
  validatePassword,
  validateUserProfile,
  validateTargetEvent,
  validateWorkoutContext,
  validateDeloadReason,
  validateUUID,
  ValidationError
} from "../_shared/utils/validation.ts";
import { UserProfile, TargetEvent } from "../_shared/types/api.ts";

Deno.test("validateEmail - valid emails", () => {
  assertEquals(validateEmail("user@example.com"), true);
  assertEquals(validateEmail("test.user+tag@domain.co.uk"), true);
  assertEquals(validateEmail("user123@test-domain.org"), true);
});

Deno.test("validateEmail - invalid emails", () => {
  assertEquals(validateEmail("invalid"), false);
  assertEquals(validateEmail("@domain.com"), false);
  assertEquals(validateEmail("user@"), false);
  assertEquals(validateEmail("user@domain"), false);
  assertEquals(validateEmail(""), false);
});

Deno.test("validatePassword - valid passwords", () => {
  const result1 = validatePassword("MySecure123!");
  assertEquals(result1.valid, true);
  assertEquals(result1.errors.length, 0);
  
  const result2 = validatePassword("AnotherGood1");
  assertEquals(result2.valid, true);
});

Deno.test("validatePassword - invalid passwords", () => {
  const result1 = validatePassword("short");
  assertEquals(result1.valid, false);
  assertEquals(result1.errors.length, 3); // length, uppercase, number (no lowercase requirement failed)
  
  const result2 = validatePassword("nouppercase123");
  assertEquals(result2.valid, false);
  assertEquals(result2.errors.some(err => err.includes("uppercase")), true);
  
  const result3 = validatePassword("NOLOWERCASE123");
  assertEquals(result3.valid, false);
  assertEquals(result3.errors.some(err => err.includes("lowercase")), true);
  
  const result4 = validatePassword("NoNumbers");
  assertEquals(result4.valid, false);
  assertEquals(result4.errors.some(err => err.includes("number")), true);
});

Deno.test("validateUserProfile - valid profile", () => {
  const validProfile: Partial<UserProfile> = {
    email: "test@example.com",
    profile: {
      name: "John Doe",
      date_of_birth: "1990-01-01",
      gender: "male",
      height: 180,
      weight: 80,
      address: {
        city: "Test City",
        state: "Test State",
        country: "Test Country",
        timezone: "UTC"
      }
    }
  };
  
  // Should not throw
  validateUserProfile(validProfile);
});

Deno.test("validateUserProfile - invalid email", () => {
  const invalidProfile: Partial<UserProfile> = {
    email: "invalid-email",
    profile: {
      name: "John Doe",
      date_of_birth: "1990-01-01",
      gender: "male",
      height: 180,
      weight: 80,
      address: {
        city: "Test City",
        state: "Test State",
        country: "Test Country",
        timezone: "UTC"
      }
    }
  };
  
  assertThrows(
    () => validateUserProfile(invalidProfile),
    ValidationError,
    "Valid email is required"
  );
});

Deno.test("validateUserProfile - missing name", () => {
  const invalidProfile: Partial<UserProfile> = {
    email: "test@example.com",
    profile: {
      name: "",
      date_of_birth: "1990-01-01",
      gender: "male",
      height: 180,
      weight: 80,
      address: {
        city: "Test City",
        state: "Test State",
        country: "Test Country",
        timezone: "UTC"
      }
    }
  };
  
  assertThrows(
    () => validateUserProfile(invalidProfile),
    ValidationError,
    "Name is required"
  );
});

Deno.test("validateUserProfile - invalid height and weight", () => {
  const invalidProfile: Partial<UserProfile> = {
    email: "test@example.com",
    profile: {
      name: "John Doe",
      date_of_birth: "1990-01-01",
      gender: "male",
      height: 50, // Too low
      weight: 400, // Too high
      address: {
        city: "Test City",
        state: "Test State",
        country: "Test Country",
        timezone: "UTC"
      }
    }
  };
  
  assertThrows(
    () => validateUserProfile(invalidProfile),
    ValidationError,
    "Height must be between 100-250 cm"
  );
});

Deno.test("validateTargetEvent - valid event", () => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);
  
  const validEvent: TargetEvent = {
    name: "Marathon Training",
    date: futureDate.toISOString(),
    type: "endurance_event",
    specific_requirements: "Sub 3-hour marathon",
    generated_by_ai: false
  };
  
  // Should not throw
  validateTargetEvent(validEvent);
});

Deno.test("validateTargetEvent - missing name", () => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);
  
  const invalidEvent: TargetEvent = {
    name: "",
    date: futureDate.toISOString(),
    type: "endurance_event",
    specific_requirements: "Sub 3-hour marathon",
    generated_by_ai: false
  };
  
  assertThrows(
    () => validateTargetEvent(invalidEvent),
    ValidationError,
    "Event name is required"
  );
});

Deno.test("validateTargetEvent - past date", () => {
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 1);
  
  const invalidEvent: TargetEvent = {
    name: "Past Event",
    date: pastDate.toISOString(),
    type: "endurance_event",
    specific_requirements: "Test",
    generated_by_ai: false
  };
  
  assertThrows(
    () => validateTargetEvent(invalidEvent),
    ValidationError,
    "Event date must be in the future"
  );
});

Deno.test("validateTargetEvent - too far in future", () => {
  const farFutureDate = new Date();
  farFutureDate.setFullYear(farFutureDate.getFullYear() + 3);
  
  const invalidEvent: TargetEvent = {
    name: "Far Future Event",
    date: farFutureDate.toISOString(),
    type: "endurance_event",
    specific_requirements: "Test",
    generated_by_ai: false
  };
  
  assertThrows(
    () => validateTargetEvent(invalidEvent),
    ValidationError,
    "Event date cannot be more than 2 years in the future"
  );
});

Deno.test("validateWorkoutContext - valid context", () => {
  const validContext = {
    location_type: "home",
    time_available_minutes: 60
  };
  
  // Should not throw
  validateWorkoutContext(validContext);
});

Deno.test("validateWorkoutContext - invalid location type", () => {
  const invalidContext = {
    location_type: "invalid_location",
    time_available_minutes: 60
  };
  
  assertThrows(
    () => validateWorkoutContext(invalidContext),
    ValidationError,
    "Invalid location type"
  );
});

Deno.test("validateWorkoutContext - invalid time", () => {
  const invalidContext = {
    location_type: "home",
    time_available_minutes: 300 // Too high
  };
  
  assertThrows(
    () => validateWorkoutContext(invalidContext),
    ValidationError,
    "Time available must be between 5-240 minutes"
  );
});

Deno.test("validateDeloadReason - valid reasons", () => {
  assertEquals(validateDeloadReason("poor_sleep"), true);
  assertEquals(validateDeloadReason("high_stress"), true);
  assertEquals(validateDeloadReason("fatigue"), true);
  assertEquals(validateDeloadReason("overreaching"), true);
});

Deno.test("validateDeloadReason - invalid reasons", () => {
  assertEquals(validateDeloadReason("invalid_reason"), false);
  assertEquals(validateDeloadReason(""), false);
  assertEquals(validateDeloadReason("tired"), false);
});

Deno.test("validateUUID - valid UUIDs", () => {
  assertEquals(validateUUID("123e4567-e89b-12d3-a456-426614174000"), true);
  assertEquals(validateUUID("550e8400-e29b-41d4-a716-446655440000"), true);
});

Deno.test("validateUUID - invalid UUIDs", () => {
  assertEquals(validateUUID("not-a-uuid"), false);
  assertEquals(validateUUID("123e4567-e89b-12d3-a456"), false);
  assertEquals(validateUUID(""), false);
  assertEquals(validateUUID("123e4567-e89b-12d3-a456-42661417400g"), false);
});
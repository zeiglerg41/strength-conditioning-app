// Unit tests for AI provider adapters
import { assertEquals, assertRejects } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { AIProviderFactory } from "../_shared/ai-providers/adapter.ts";
import { OpenAIProvider } from "../_shared/ai-providers/openai.ts";
import { AnthropicProvider } from "../_shared/ai-providers/anthropic.ts";
import { OllamaProvider } from "../_shared/ai-providers/ollama.ts";
import { UserProfile, TargetEvent } from "../_shared/types/api.ts";

// Mock user profile for testing
const mockUserProfile: UserProfile = {
  id: "test-user-123",
  email: "test@example.com",
  profile: {
    name: "Test User",
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
  },
  lifestyle: {
    employment_status: "full_time",
    work_schedule: "standard",
    commute_distance: 10,
    commute_method: "car",
    commute_duration_minutes: 30,
    travel_for_work: {
      frequency: "monthly",
      typical_duration_days: 3,
      access_to_gym_while_traveling: "sometimes"
    },
    daily_activity_level: "moderately_active",
    sleep_schedule: {
      typical_bedtime: "23:00",
      typical_wake_time: "07:00",
      sleep_quality: "good"
    }
  },
  training_background: {
    training_age_years: 5,
    experience_level: "intermediate",
    previous_sports: ["running", "cycling"],
    current_activity_types: ["strength_training", "cardio"],
    injuries: []
  },
  equipment_access: {
    primary_location: "commercial_gym",
    available_equipment: {
      barbells: true,
      dumbbells: true,
      kettlebells: true,
      resistance_bands: false,
      pull_up_bar: true,
      cardio_equipment: ["treadmill", "bike"],
      specialized: ["squat_rack", "bench"]
    },
    backup_locations: []
  },
  performance_goals: {
    primary_focus: "strength",
    target_events: [],
    generated_challenges: [],
    performance_metrics: {
      track_strength: true,
      track_endurance: false,
      track_power: false,
      track_mobility: false,
      preferred_tests: ["squat", "bench", "deadlift"]
    }
  },
  constraints: {
    weekly_training_days: 4,
    preferred_session_duration_minutes: 90,
    max_session_duration_minutes: 120,
    preferred_training_times: ["morning"],
    training_day_preferences: ["monday", "wednesday", "friday", "saturday"],
    absolute_rest_days: ["sunday"],
    fatigue_sensitivity: "moderate",
    recovery_needs: "average"
  }
};

const mockTargetEvent: TargetEvent = {
  name: "Powerlifting Competition",
  date: "2025-12-01T00:00:00Z",
  type: "strength_test",
  specific_requirements: "Squat, Bench, Deadlift",
  generated_by_ai: false
};

Deno.test("AIProviderFactory - create OpenAI provider", () => {
  const provider = AIProviderFactory.create("openai");
  assertEquals(provider instanceof OpenAIProvider, true);
});

Deno.test("AIProviderFactory - create Anthropic provider", () => {
  const provider = AIProviderFactory.create("anthropic");
  assertEquals(provider instanceof AnthropicProvider, true);
});

Deno.test("AIProviderFactory - create Ollama provider", () => {
  const provider = AIProviderFactory.create("ollama");
  assertEquals(provider instanceof OllamaProvider, true);
});

Deno.test("AIProviderFactory - unknown provider throws error", () => {
  try {
    AIProviderFactory.create("unknown" as any);
    assertEquals(true, false, "Should have thrown an error");
  } catch (error) {
    assertEquals(error instanceof Error, true);
    assertEquals((error as Error).message.includes("Unknown AI provider: unknown"), true);
  }
});

Deno.test("AIProviderFactory - default provider from env", () => {
  // Set environment variable
  Deno.env.set("AI_PROVIDER", "anthropic");
  
  const provider = AIProviderFactory.create();
  assertEquals(provider instanceof AnthropicProvider, true);
  
  // Clean up
  Deno.env.delete("AI_PROVIDER");
});

Deno.test("AIProviderFactory - fallback to OpenAI when no env", () => {
  // Ensure no AI_PROVIDER env var
  Deno.env.delete("AI_PROVIDER");
  
  const provider = AIProviderFactory.create();
  assertEquals(provider instanceof OpenAIProvider, true);
});

// Note: These tests would require API keys to actually call the providers
// For now, we test the structure and error handling without making real API calls

Deno.test("OpenAIProvider - constructor requires API key", () => {
  // Temporarily remove API key
  const originalKey = Deno.env.get("OPENAI_API_KEY");
  Deno.env.delete("OPENAI_API_KEY");
  
  try {
    new OpenAIProvider();
    assertEquals(true, false, "Should have thrown an error");
  } catch (error) {
    assertEquals(error instanceof Error, true);
    assertEquals((error as Error).message, "OPENAI_API_KEY environment variable is required");
  }
  
  // Restore original key if it existed
  if (originalKey) {
    Deno.env.set("OPENAI_API_KEY", originalKey);
  }
});

Deno.test("AnthropicProvider - constructor requires API key", () => {
  // Temporarily remove API key
  const originalKey = Deno.env.get("ANTHROPIC_API_KEY");
  Deno.env.delete("ANTHROPIC_API_KEY");
  
  try {
    new AnthropicProvider();
    assertEquals(true, false, "Should have thrown an error");
  } catch (error) {
    assertEquals(error instanceof Error, true);
    assertEquals((error as Error).message, "ANTHROPIC_API_KEY environment variable is required");
  }
  
  // Restore original key if it existed
  if (originalKey) {
    Deno.env.set("ANTHROPIC_API_KEY", originalKey);
  }
});

Deno.test("OllamaProvider - constructor uses default URL", () => {
  // Temporarily remove base URL
  const originalUrl = Deno.env.get("OLLAMA_BASE_URL");
  Deno.env.delete("OLLAMA_BASE_URL");
  
  const provider = new OllamaProvider();
  // We can't directly access private properties, but we can test that it doesn't throw
  assertEquals(provider instanceof OllamaProvider, true);
  
  // Restore original URL if it existed
  if (originalUrl) {
    Deno.env.set("OLLAMA_BASE_URL", originalUrl);
  }
});

Deno.test("OllamaProvider - constructor validates URL format", () => {
  // Set invalid URL
  Deno.env.set("OLLAMA_BASE_URL", "invalid-url");
  
  try {
    new OllamaProvider();
    assertEquals(true, false, "Should have thrown an error");
  } catch (error) {
    assertEquals(error instanceof Error, true);
    assertEquals((error as Error).message, "OLLAMA_BASE_URL must start with http:// or https://");
  }
  
  // Clean up
  Deno.env.delete("OLLAMA_BASE_URL");
});

// Mock tests for program validation (without actual API calls)
Deno.test("OpenAIProvider - validateProgramStructure creates proper Program object", () => {
  // Set a dummy API key for testing
  Deno.env.set("OPENAI_API_KEY", "test-key");
  
  const provider = new OpenAIProvider();
  const mockProgramData = {
    name: "Test Program",
    target_event: mockTargetEvent,
    program_structure: {
      total_duration_weeks: 12,
      periodization_model: "linear",
      phases: []
    }
  };
  
  // Access the private method through any (for testing purposes)
  const result = (provider as any).validateProgramStructure(mockProgramData, "test-user-123");
  
  assertEquals(result.name, "Test Program");
  assertEquals(result.user_id, "test-user-123");
  assertEquals(result.status, "active");
  assertEquals(typeof result.id, "string");
  
  // Clean up
  Deno.env.delete("OPENAI_API_KEY");
});

Deno.test("Provider validation handles missing program name", () => {
  Deno.env.set("ANTHROPIC_API_KEY", "test-key");
  
  const provider = new AnthropicProvider();
  const mockProgramData = {
    target_event: mockTargetEvent,
    program_structure: {}
  };
  
  const result = (provider as any).validateProgramStructure(mockProgramData, "test-user-123");
  
  assertEquals(result.name, "Generated Program"); // Default name
  assertEquals(result.user_id, "test-user-123");
  
  // Clean up
  Deno.env.delete("ANTHROPIC_API_KEY");
});
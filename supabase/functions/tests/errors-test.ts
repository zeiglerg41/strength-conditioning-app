// Unit tests for error handling utilities
import { assertEquals, assertInstanceOf } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { 
  AppError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  NotFoundError,
  RateLimitError,
  AIProviderError,
  DatabaseError,
  createErrorResponse,
  createSuccessResponse
} from "../_shared/utils/errors.ts";

Deno.test("AppError - basic error creation", () => {
  const error = new AppError("Test message", "TEST_CODE", 400);
  
  assertEquals(error.message, "Test message");
  assertEquals(error.code, "TEST_CODE");
  assertEquals(error.statusCode, 400);
  assertEquals(error.name, "AppError");
});

Deno.test("AppError - with details and suggestions", () => {
  const error = new AppError(
    "Test message",
    "TEST_CODE",
    400,
    { field: "email" },
    ["Check your input", "Try again"]
  );
  
  assertEquals(error.details, { field: "email" });
  assertEquals(error.suggestions, ["Check your input", "Try again"]);
});

Deno.test("AuthenticationError - default message", () => {
  const error = new AuthenticationError();
  
  assertEquals(error.message, "Authentication required");
  assertEquals(error.code, "AUTHENTICATION_REQUIRED");
  assertEquals(error.statusCode, 401);
  assertInstanceOf(error, AppError);
});

Deno.test("AuthenticationError - custom message", () => {
  const error = new AuthenticationError("Invalid token");
  
  assertEquals(error.message, "Invalid token");
  assertEquals(error.code, "AUTHENTICATION_REQUIRED");
  assertEquals(error.statusCode, 401);
});

Deno.test("AuthorizationError - default message", () => {
  const error = new AuthorizationError();
  
  assertEquals(error.message, "Insufficient permissions");
  assertEquals(error.code, "INSUFFICIENT_PERMISSIONS");
  assertEquals(error.statusCode, 403);
});

Deno.test("ValidationError - with field", () => {
  const error = new ValidationError("Invalid email", "email");
  
  assertEquals(error.message, "Invalid email");
  assertEquals(error.code, "VALIDATION_ERROR");
  assertEquals(error.statusCode, 400);
  assertEquals(error.details, { field: "email" });
});

Deno.test("NotFoundError - default resource", () => {
  const error = new NotFoundError();
  
  assertEquals(error.message, "Resource not found");
  assertEquals(error.code, "NOT_FOUND");
  assertEquals(error.statusCode, 404);
});

Deno.test("NotFoundError - custom resource", () => {
  const error = new NotFoundError("User profile");
  
  assertEquals(error.message, "User profile not found");
  assertEquals(error.code, "NOT_FOUND");
  assertEquals(error.statusCode, 404);
});

Deno.test("RateLimitError - default retry time", () => {
  const error = new RateLimitError();
  
  assertEquals(error.message, "Rate limit exceeded");
  assertEquals(error.code, "RATE_LIMIT_EXCEEDED");
  assertEquals(error.statusCode, 429);
  assertEquals(error.details, { retry_after: 60 });
});

Deno.test("RateLimitError - custom retry time", () => {
  const error = new RateLimitError(120);
  
  assertEquals(error.details, { retry_after: 120 });
});

Deno.test("AIProviderError - with provider and error", () => {
  const error = new AIProviderError("openai", "API rate limit exceeded");
  
  assertEquals(error.message, "AI provider (openai) error: API rate limit exceeded");
  assertEquals(error.code, "AI_PROVIDER_ERROR");
  assertEquals(error.statusCode, 503);
  assertEquals(error.details, { provider: "openai", original_error: "API rate limit exceeded" });
  assertEquals(error.suggestions?.length, 3);
});

Deno.test("DatabaseError - with operation", () => {
  const error = new DatabaseError("user creation", "Unique constraint violation");
  
  assertEquals(error.message, "Database user creation failed: Unique constraint violation");
  assertEquals(error.code, "DATABASE_ERROR");
  assertEquals(error.statusCode, 500);
  assertEquals(error.details, { original_error: "Unique constraint violation" });
});

Deno.test("createErrorResponse - with AppError", async () => {
  const error = new ValidationError("Invalid input", "email");
  const response = createErrorResponse(error, "test-request-id");
  
  assertEquals(response.status, 400);
  assertEquals(response.headers.get("Content-Type"), "application/json");
  
  const body = await response.json();
  assertEquals(body.error.code, "VALIDATION_ERROR");
  assertEquals(body.error.message, "Invalid input");
  assertEquals(body.error.details, { field: "email" });
  assertEquals(body.meta.request_id, "test-request-id");
  assertEquals(body.meta.version, "1.0.0");
});

Deno.test("createErrorResponse - with generic Error", async () => {
  const error = new Error("Something went wrong");
  const response = createErrorResponse(error);
  
  assertEquals(response.status, 500);
  
  const body = await response.json();
  assertEquals(body.error.code, "INTERNAL_ERROR");
  assertEquals(body.error.message, "Something went wrong");
});

Deno.test("createSuccessResponse - with data", async () => {
  const data = { user: { id: "123", name: "John" } };
  const response = createSuccessResponse(data, 201, "test-request-id");
  
  assertEquals(response.status, 201);
  assertEquals(response.headers.get("Content-Type"), "application/json");
  
  const body = await response.json();
  assertEquals(body.data, data);
  assertEquals(body.meta.request_id, "test-request-id");
  assertEquals(body.meta.version, "1.0.0");
});

Deno.test("createSuccessResponse - default status code", async () => {
  const data = { message: "Success" };
  const response = createSuccessResponse(data);
  
  assertEquals(response.status, 200);
  
  const body = await response.json();
  assertEquals(body.data, data);
});
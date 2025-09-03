# Backend Implementation
## Supabase Edge Functions for S&C Program Generator

**Status**: 🔧 IN PROGRESS  
**Purpose**: Implement API endpoints using Supabase Edge Functions based on 01-api-design.md contracts

---

## 🏗️ Architecture Decision: Consolidated User Management

### Decision Summary
**All user-related endpoints are consolidated into a single `/users` Edge Function**, following Supabase best practices for "fat functions" and 2025 REST API design patterns.

### Rationale
1. **Follows Supabase Official Recommendation**: "Develop 'fat functions' - prefer fewer, larger functions over many small ones" for better performance and reduced cold starts
2. **Aligns with Original API Design**: Our v2 API design already specified all endpoints under `/users/*` paths
3. **Consistent REST Patterns**: Creates logical resource hierarchy under single domain
4. **Performance Benefits**: Single function deployment, shared authentication/validation, faster routing
5. **Maintainability**: Centralized user-related logic, easier to modify and extend

### Implementation Pattern
```typescript
// Single /users Edge Function handles all routes:
// /users/profile
// /users/training-background  
// /users/movement-competencies
// /users/physical-profile
// /users/exercise-exclusions
// /users/injuries
// ... etc

// Route internally based on URL segments:
const pathSegments = url.pathname.split('/').filter(Boolean)
if (pathSegments.includes('training-background')) {
  return handleTrainingBackground(userService, userId, method, req)
}
```

### Migration from Separate Functions
- ✅ Created separate functions initially for domain separation (good for development)
- ✅ Consolidated into single function following research and best practices
- ✅ Maintained all business logic and validation
- ✅ Updated all tests to use `/users/*` paths
- ✅ Removed redundant separate Edge Functions

---

## 📋 Backend Implementation Checklist

### Legend
- [ ] Not done
- 🔧 In progress / partially working
- ✅ Done and working

---

### Environment & Setup
- ✅ Set up Edge Functions development environment
- ✅ Configure environment variables for AI providers
- ✅ Create Edge Function project structure
- ✅ Set up local development and testing

### Authentication
- ✅ Built-in Supabase Auth (handles signup, login, logout, refresh, password reset)

### AI Provider Integration
- ✅ Create AI provider adapter pattern (OpenAI/Anthropic/Ollama)
- ✅ Implement OpenAI integration
- ✅ Add Anthropic adapter
- ✅ Add Ollama adapter for self-hosted models
- ✅ Environment variable switching logic
- ✅ Error handling and fallback logic

---

## User Management Endpoints (/users)

### Basic Profile
- 🔧 GET /users/profile - Get current user profile
- 🔧 PUT /users/profile - Update basic profile info
- 🔧 GET /users/profile/completion - Get onboarding progress
- 🔧 PUT /users/profile/step - Complete onboarding step
- 🔧 POST /users/onboarding/complete - Finalize onboarding

### Training & Background
- 🔧 GET /users/training-background - Get training history
- 🔧 PUT /users/training-background - Update training experience
- 🔧 GET /users/movement-competencies - Get movement assessments
- 🔧 PUT /users/movement-competencies/{pattern} - Update movement competency
- 🔧 POST /users/movement-competencies/assess - Assessment wizard

### Physical Profile
- 🔧 GET /users/physical-profile - Get injuries/limitations
- 🔧 PUT /users/physical-profile - Update physical assessment
- 🔧 GET /users/exercise-exclusions - Get "will never do" list
- 🔧 POST /users/exercise-exclusions - Add exercise exclusion
- 🔧 PUT /users/exercise-exclusions/{id} - Update exclusion
- 🔧 DELETE /users/exercise-exclusions/{id} - Remove exclusion

### Injuries
- 🔧 POST /users/injuries - Log new injury
- 🔧 PUT /users/injuries/{id} - Update injury status
- 🔧 DELETE /users/injuries/{id} - Remove resolved injury

### Lifestyle & Goals
- [ ] PUT /users/lifestyle - Update lifestyle factors
- [ ] PUT /users/equipment - Update equipment access
- [ ] PUT /users/goals - Update performance goals
- [ ] PUT /users/constraints - Update training constraints
- [ ] POST /users/goals/generate-challenge - AI-generate challenge

---

## Program Management Endpoints (/programs)
- [ ] POST /programs/generate - Generate program for event
- [ ] GET /programs/current - Get active program
- [ ] GET /programs/{id} - Get specific program
- [ ] PUT /programs/{id}/regenerate - Regenerate program
- [ ] DELETE /programs/{id} - Delete program
- [ ] POST /programs/{id}/extend - Extend timeline
- [ ] PUT /programs/{id}/context - Update context

---

## Workout Management Endpoints (/workouts)
- [ ] GET /workouts/today - Get today's workout
- [ ] GET /workouts/{id} - Get specific workout
- [ ] POST /workouts/today/deload-options - Get deload options
- [ ] PUT /workouts/today/apply-deload - Apply deload
- [ ] GET /workouts/deload-eligibility - Check deload eligibility
- [ ] POST /workouts/{id}/start - Start workout session
- [ ] PUT /workouts/{id}/log - Log exercise data
- [ ] POST /workouts/{id}/complete - Complete workout
- [ ] PUT /workouts/{id}/modify - Manual modification
- [ ] POST /workouts/travel-mode - Toggle travel mode
- [ ] GET /workouts/upcoming - Preview next 7 days

---

## Exercise Management Endpoints (/exercises)
- [ ] GET /exercises/available - Get exercises for user context
- [ ] GET /exercises/{id} - Get exercise details
- [ ] GET /exercises/substitutes/{id} - Get alternatives
- [ ] POST /exercises/filter - Filter by equipment/constraints
- [ ] GET /exercises/categories - Get categories for user

---

## Equipment & Gym Management (/equipment)
- [ ] GET /equipment-categories - Get all equipment types
- [ ] GET /equipment-categories/{id} - Get specific equipment
- [ ] GET /gyms/search - Search gyms
- [ ] GET /gyms/{id} - Get gym details
- [ ] POST /gyms - Create new gym entry
- [ ] PUT /gyms/{id}/equipment - Update gym equipment
- [ ] GET /gyms/{id}/users - Get gym community

---

## Analytics Endpoints (/analytics)
- [ ] GET /analytics/event-dashboard - Main dashboard
- [ ] GET /analytics/event-readiness - Readiness score
- [ ] GET /analytics/phase-completion - Phase progress
- [ ] GET /analytics/strength-systems - Strength progression
- [ ] GET /analytics/power-speed-systems - Power/speed metrics
- [ ] GET /analytics/endurance-systems - Cardiovascular fitness
- [ ] GET /analytics/recovery-readiness - Recovery patterns
- [ ] GET /analytics/strength-exercise/{id} - Lift progression
- [ ] GET /analytics/energy-system-exercise/{id} - Energy system work
- [ ] POST /analytics/performance-test - Log test results
- [ ] GET /analytics/heart-rate-trends/{id} - HR trends
- [ ] GET /analytics/training-load - RPE/volume balance
- [ ] GET /analytics/adherence - Training consistency

---

## Services & Business Logic

### Core Services
- ✅ Training Age Service (NSCA-based classification)
- 🔧 Behavioral Tracking Service (simplified)
- 🔧 Program Context Service
- 🔧 Progressive Classification Service
- [ ] Simple Performance Tracking Service
- [ ] Modal Feedback System

### Infrastructure
- ✅ Error handling utils
- 🔧 Input validation utils
- 🔧 Business logic validation (deload frequency in DB)
- [ ] AI service retries
- [ ] Rate limiting

### Testing
- [ ] Unit tests for business logic
- [ ] Integration tests for AI adapters
- [ ] End-to-end API testing
- [ ] Performance testing
- [ ] Load testing

---

## 🏗️ Edge Functions Architecture

### Project Structure
```
supabase/functions/
├── _shared/
│   ├── ai-providers/       ✅
│   │   ├── openai.ts       ✅
│   │   ├── anthropic.ts    ✅
│   │   ├── ollama.ts       ✅
│   │   └── adapter.ts      ✅
│   ├── services/
│   │   ├── training-age-service.ts           ✅
│   │   ├── behavioral-tracking-service.ts    🔧
│   │   ├── program-context-service.ts        🔧
│   │   └── progressive-classification.ts     🔧
│   ├── database/
│   │   ├── user-queries.ts    🔧
│   │   └── queries.ts          🔧
│   ├── utils/
│   │   ├── validation.ts      🔧
│   │   ├── errors.ts          ✅
│   │   └── auth.ts            ✅
│   └── types/                 ✅
├── users/          (all handlers 🔧)
├── programs/       (all handlers [ ])
├── workouts/       (all handlers [ ])
├── exercises/      (all handlers [ ])
├── equipment/      (all handlers [ ])
└── analytics/      (all handlers [ ])
```

---

## 📊 Implementation Reality

### What's Working ✅
1. Database schema (fully implemented)
2. AI provider integration (all 3 providers)
3. Edge Function structure
4. Supabase Auth
5. Basic services created

### What's Partial 🔧
1. User endpoints (handlers exist, not tested)
2. Service classes (created, not integrated)
3. Validation utils (exist, not used)

### What's Missing [ ]
1. Program generation with AI
2. Workout management logic
3. Exercise selection logic
4. Analytics implementation
5. Equipment/gym management
6. All testing

---

## 🎯 Priority Actions

### Week 1 - Test What Exists
1. 🔧 Test user profile endpoints
2. 🔧 Verify service integrations
3. [ ] Fix any broken handlers

### Week 2 - Core Features
1. [ ] Implement program generation with AI
2. [ ] Implement today's workout retrieval
3. [ ] Implement workout logging

### Week 3 - Complete MVP
1. [ ] Connect remaining user endpoints
2. [ ] Add exercise selection
3. [ ] Basic analytics

---

## Development Workflow

1. **Pick an endpoint** from the [ ] list
2. **Implement the logic** using existing services
3. **Test locally** with Supabase CLI
4. **Update status** to 🔧 or ✅
5. **Move to next endpoint**

### Local Testing
```bash
# Start Edge Functions locally
supabase functions serve

# Test specific function
curl http://localhost:54321/functions/v1/users/profile \
  -H "Authorization: Bearer YOUR_TOKEN"

# Deploy when ready
supabase functions deploy [function-name]
```

---

## Summary
- **Infrastructure**: ✅ Complete
- **AI Integration**: ✅ Working
- **User Endpoints**: 🔧 Partial (handlers exist)
- **Other Endpoints**: [ ] Not implemented
- **Testing**: [ ] None

**Next Step**: Test the 🔧 user endpoints to move them to ✅, then implement program generation.
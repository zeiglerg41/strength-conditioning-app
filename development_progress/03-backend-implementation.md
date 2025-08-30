# Backend Implementation
## Supabase Edge Functions for S&C Program Generator

**Status**: 🔄 IN PROGRESS  
**Purpose**: Implement API endpoints using Supabase Edge Functions based on 01-api-design.md contracts

---

## 📋 Backend Implementation Checklist

### Environment & Setup
- [x] Set up Edge Functions development environment
- [x] Configure environment variables for AI providers
- [x] Create Edge Function project structure
- [x] Set up local development and testing

### Authentication Endpoints (Supabase Auth Integration)
- [x] **POST /auth/signup** - User registration with email/password
- [x] **POST /auth/login** - User login returning JWT token
- [x] **POST /auth/logout** - User logout (invalidate token)
- [x] **POST /auth/refresh** - Refresh JWT token
- [x] **POST /auth/forgot-password** - Password reset request
- [x] **POST /auth/reset-password** - Password reset confirmation

### User Management Endpoints
- [x] **GET /users/profile** - Get current user profile
- [x] **PUT /users/profile** - Update basic profile info
- [x] **POST /users/onboarding** - Complete initial onboarding wizard
- [x] **PUT /users/lifestyle** - Update lifestyle factors
- [x] **PUT /users/training-background** - Update training history
- [x] **PUT /users/equipment** - Update equipment access
- [x] **PUT /users/goals** - Update performance goals
- [x] **PUT /users/constraints** - Update training constraints
- [x] **POST /users/goals/generate-challenge** - AI-generate performance challenge
- [x] **PUT /users/injury** - Add/update injury information
- [x] **DELETE /users/injury/{id}** - Remove resolved injury

### AI Provider Integration
- [x] Create AI provider adapter pattern (OpenAI/Anthropic/Ollama)
- [x] Implement OpenAI integration (primary)
- [x] Add Anthropic adapter
- [x] Add Ollama adapter for self-hosted models
- [x] Environment variable switching logic
- [x] Error handling and fallback logic

### Program Generation (Event-Driven)
- [ ] **POST /programs/generate** - Generate program for specific event/timeline
- [ ] **GET /programs/current** - Get active program overview
- [ ] **GET /programs/{id}** - Get specific program details
- [ ] **PUT /programs/{id}/regenerate** - Regenerate program (life changes)
- [ ] **DELETE /programs/{id}** - Delete program
- [ ] **POST /programs/{id}/extend** - Extend timeline (event date changed)
- [ ] **PUT /programs/{id}/context** - Update context (travel, equipment change)

### Daily Workout & Adaptations
- [ ] **GET /workouts/today** - Get today's workout with current context
- [ ] **GET /workouts/{id}** - Get specific workout details
- [ ] **POST /workouts/today/deload-options** - Get 1-2 deload options (if eligible)
- [ ] **PUT /workouts/today/apply-deload** - Apply volume or intensity deload
- [ ] **GET /workouts/deload-eligibility** - Check if user can deload today
- [ ] **POST /workouts/{id}/start** - Start workout session
- [ ] **PUT /workouts/{id}/log** - Log exercise data (sets/reps/RPE)
- [ ] **POST /workouts/{id}/complete** - Complete workout
- [ ] **PUT /workouts/{id}/modify** - Manual workout modification
- [ ] **POST /workouts/travel-mode** - Toggle travel mode (bodyweight/hotel gym)
- [ ] **GET /workouts/upcoming** - Preview next 7 days

### Context-Aware Exercise Selection
- [ ] **GET /exercises/available** - Get exercises for current user context
- [ ] **GET /exercises/{id}** - Get specific exercise details
- [ ] **GET /exercises/substitutes/{id}** - Get alternatives for current context
- [ ] **POST /exercises/filter** - Filter exercises by equipment/constraints/preferences
- [ ] **GET /exercises/categories** - Get exercise categories available to user

### Analytics & Progress (User Priority Hierarchy)
- [ ] **GET /analytics/event-dashboard** - Main landing: event readiness, timeline, overall progress
- [ ] **GET /analytics/event-readiness** - Readiness score breakdown by training system
- [ ] **GET /analytics/phase-completion** - Current phase progress, upcoming milestones
- [ ] **GET /analytics/strength-systems** - Overall strength progression, stalling detection
- [ ] **GET /analytics/power-speed-systems** - Power/speed development across energy systems
- [ ] **GET /analytics/endurance-systems** - Cardiovascular fitness, energy system development
- [ ] **GET /analytics/recovery-readiness** - Recovery patterns, training adaptation
- [ ] **GET /analytics/strength-exercise/{exercise_id}** - Specific lift progression
- [ ] **GET /analytics/energy-system-exercise/{exercise_id}** - Specific energy system work progressions
- [ ] **POST /analytics/performance-test** - Log performance test results
- [ ] **GET /analytics/heart-rate-trends/{exercise_id}** - HR at prescribed intensities over time
- [ ] **GET /analytics/training-load** - RPE trends, volume/intensity balance
- [ ] **GET /analytics/adherence** - Training consistency, missed sessions analysis

### Error Handling & Validation
- [ ] Implement comprehensive error response format
- [ ] Add input validation for all endpoints
- [ ] Create business logic validation (deload frequency, etc.)
- [ ] Add AI service error handling and retries
- [ ] Implement rate limiting protection

### Testing & Quality
- [ ] Unit tests for core business logic
- [ ] Integration tests for AI provider adapters
- [ ] End-to-end API testing
- [ ] Performance testing for analytics queries
- [ ] Load testing for program generation

---

## 🏗️ Edge Functions Architecture

### Project Structure
```
supabase/functions/
├── _shared/
│   ├── ai-providers/
│   │   ├── openai.ts
│   │   ├── anthropic.ts
│   │   ├── ollama.ts
│   │   └── adapter.ts
│   ├── database/
│   │   ├── queries.ts
│   │   └── types.ts
│   ├── utils/
│   │   ├── validation.ts
│   │   ├── errors.ts
│   │   └── auth.ts
│   └── types/
│       └── api.ts
├── auth/
│   └── index.ts
├── users/
│   └── index.ts
├── programs/
│   └── index.ts
├── workouts/
│   └── index.ts
├── exercises/
│   └── index.ts
├── analytics/
│   └── index.ts
└── context-periods/
    └── index.ts
```

### AI Provider Adapter Pattern
Based on 00-essential-decisions.md: Model-agnostic with swappable providers

```typescript
// _shared/ai-providers/adapter.ts
interface AIProvider {
  generateProgram(userProfile: UserProfile, targetEvent: Event): Promise<Program>;
  generateChallenge(userProfile: UserProfile): Promise<Challenge>;
  adaptWorkout(workout: Workout, context: Context): Promise<Workout>;
}

class AIProviderFactory {
  static create(provider: 'openai' | 'anthropic' | 'ollama'): AIProvider {
    switch(provider) {
      case 'openai': return new OpenAIProvider();
      case 'anthropic': return new AnthropicProvider();
      case 'ollama': return new OllamaProvider();
      default: throw new Error(`Unknown provider: ${provider}`);
    }
  }
}
```

### Authentication Strategy
Using Supabase Auth (decided in 00-essential-decisions.md):
- JWT-based, provider-agnostic
- Leverages Supabase's built-in auth system
- Edge Functions get user context via `auth.uid()`

### Database Integration
- Use Supabase client with Row Level Security
- All queries automatically filtered by `auth.uid()`
- JSONB columns for flexible user data storage

---

## 🎯 Implementation Priorities

### Phase 1: Core Infrastructure (Week 1)
1. Set up Edge Functions development environment
2. Create shared utilities (auth, validation, errors)
3. Implement AI provider adapter pattern
4. Build basic authentication endpoints

### Phase 2: User Management (Week 2)  
1. Complete user profile CRUD operations
2. Implement onboarding wizard endpoint
3. Build AI challenge generation
4. Add context periods management

### Phase 3: Program Generation (Week 3)
1. Implement core program generation logic
2. Add event-driven reverse periodization
3. Build program modification endpoints
4. Create workout adaptation logic

### Phase 4: Daily Operations (Week 4)
1. Build workout management endpoints
2. Implement deload logic with database validation
3. Add exercise selection with context filtering
4. Create travel mode functionality

### Phase 5: Analytics & Polish (Week 5)
1. Implement analytics hierarchy endpoints
2. Build performance tracking logic
3. Add comprehensive error handling
4. Complete testing and optimization

---

## 🔧 Development Environment Setup

### Required Environment Variables
```bash
# AI Providers (from 00-essential-decisions.md)
AI_PROVIDER=openai  # openai | anthropic | ollama
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
OLLAMA_BASE_URL=http://your-vps:11434

# Supabase (already configured)
SUPABASE_URL=https://gytncjaerwktkdskkhsr.supabase.co
SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

### Local Development Commands
```bash
# Start Edge Functions locally
supabase functions serve

# Deploy specific function
supabase functions deploy [function-name]

# View function logs
supabase functions logs [function-name]

# Run tests
supabase test functions
```

---

## ✅ Success Criteria

### Functional Requirements
- All API endpoints from 01-api-design.md implemented and working
- AI provider switching works seamlessly via environment variable
- Database queries respect Row Level Security policies
- Deload frequency enforcement working as designed
- Context-aware exercise selection filters correctly

### Non-Functional Requirements
- Program generation completes within 30 seconds
- Analytics queries return within 2 seconds
- 99.9% uptime for critical user operations
- Comprehensive error handling with actionable messages
- All endpoints return consistent response formats

### Quality Gates
- 90%+ code coverage with unit tests
- All integration tests passing
- Performance benchmarks met
- Security audit passed
- Documentation complete and accurate

---

## 🔄 Development Workflow

1. **Read API Contract**: Reference 01-api-design.md for exact specifications
2. **Implement Function**: Build Edge Function following the contract
3. **Test Locally**: Use Supabase local development environment
4. **Validate Database**: Ensure RLS policies work correctly
5. **Test AI Integration**: Verify all provider adapters work
6. **Deploy & Verify**: Deploy to staging and run integration tests
7. **Document**: Update this checklist and add implementation notes

---

**Next Step**: Set up Edge Functions development environment and begin Phase 1 implementation.
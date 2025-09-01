# Backend Implementation
## Supabase Edge Functions for S&C Program Generator

**Status**: 🔄 IN PROGRESS  
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

### Enhanced User Management & Profiling (From v2)
- [x] **GET /users/profile** - Get current user profile with completion status
- [x] **PUT /users/profile** - Update basic profile info
- [x] **GET /users/profile/completion** - Get onboarding progress and next steps
- [x] **PUT /users/profile/step** - Complete specific onboarding step
- [x] **POST /users/onboarding/complete** - Finalize onboarding process
- [x] **PUT /users/lifestyle** - Update lifestyle factors
- [x] **PUT /users/training-background** - Update training history
- [x] **PUT /users/equipment** - Update equipment access
- [x] **PUT /users/goals** - Update performance goals
- [x] **PUT /users/constraints** - Update training constraints
- [x] **POST /users/goals/generate-challenge** - AI-generate performance challenge
- [x] **PUT /users/injury** - Add/update injury information
- [x] **DELETE /users/injury/{id}** - Remove resolved injury

#### Enhanced User Profiling Endpoints (v2) - Consolidated into /users Edge Function
**Implementation Strategy**: Following Supabase best practices for "fat functions", all enhanced user profiling endpoints are consolidated into the single `/users` Edge Function for better performance, maintainability, and consistent routing.

- [x] **GET /users/training-background** - Get detailed training history (consolidated into /users function)
- [x] **PUT /users/training-background** - Update training experience (consolidated into /users function)
- [x] **GET /users/movement-competencies** - Get movement pattern assessments (consolidated into /users function)
- [x] **PUT /users/movement-competencies/{pattern}** - Update specific movement competency (consolidated into /users function)
- [x] **POST /users/movement-competencies/assess** - Complete movement assessment wizard (consolidated into /users function)
- [x] **GET /users/physical-profile** - Get injuries, limitations, exclusions (consolidated into /users function)
- [x] **PUT /users/physical-profile** - Update physical assessment (consolidated into /users function)
- [x] **GET /users/exercise-exclusions** - Get "will never do" exercise list (consolidated into /users function)
- [x] **POST /users/exercise-exclusions** - Add exercise exclusion (consolidated into /users function)
- [x] **PUT /users/exercise-exclusions/{id}** - Update exclusion reason/alternative (consolidated into /users function)
- [x] **DELETE /users/exercise-exclusions/{id}** - Remove exclusion (consolidated into /users function)
- [x] **POST /users/injuries** - Log new injury (consolidated into /users function)
- [x] **PUT /users/injuries/{id}** - Update injury status (consolidated into /users function)
- [x] **DELETE /users/injuries/{id}** - Remove resolved injury (consolidated into /users function)

#### Equipment & Gym Ecosystem Management (v2)
- [ ] **GET /users/equipment-access** - Get complete gym access network
- [ ] **PUT /users/equipment-access** - Update equipment preferences
- [ ] **GET /users/gyms** - Get user's gym network with equipment details
- [ ] **POST /users/gyms** - Add gym to user's network
- [ ] **PUT /users/gyms/{id}** - Update gym access details (frequency, priority)
- [ ] **DELETE /users/gyms/{id}** - Remove gym from network
- [ ] **GET /users/available-movements** - Get movement patterns available across all gyms
- [ ] **POST /users/goals/events** - Add new target event
- [ ] **PUT /users/goals/events/{id}** - Update target event details
- [ ] **DELETE /users/goals/events/{id}** - Remove target event

### Equipment & Gym Database Management (v2)
- [ ] **GET /equipment-categories** - Get all equipment types with movement patterns
- [ ] **GET /equipment-categories/{id}** - Get specific equipment details
- [ ] **GET /gyms/search** - Search gyms by location/name
- [ ] **GET /gyms/{id}** - Get specific gym details and equipment
- [ ] **POST /gyms** - Create new gym entry (user-contributed)
- [ ] **PUT /gyms/{id}/equipment** - Update gym equipment availability
- [ ] **GET /gyms/{id}/users** - Get user community at gym (privacy-respecting)

### AI Provider Integration
- [x] Create AI provider adapter pattern (OpenAI/Anthropic/Ollama)
- [x] Implement OpenAI integration (primary)
- [x] Add Anthropic adapter
- [x] Add Ollama adapter for self-hosted models
- [x] Environment variable switching logic
- [x] Error handling and fallback logic

### Program Generation (Event-Driven)
- [x] **POST /programs/generate** - Generate program for specific event/timeline
- [x] **GET /programs/current** - Get active program overview
- [x] **GET /programs/{id}** - Get specific program details
- [x] **PUT /programs/{id}/regenerate** - Regenerate program (life changes)
- [x] **DELETE /programs/{id}** - Delete program
- [x] **POST /programs/{id}/extend** - Extend timeline (event date changed)
- [x] **PUT /programs/{id}/context** - Update context (travel, equipment change)

### Daily Workout & Adaptations
- [x] **GET /workouts/today** - Get today's workout with current context
- [x] **GET /workouts/{id}** - Get specific workout details
- [x] **POST /workouts/today/deload-options** - Get 1-2 deload options (if eligible)
- [x] **PUT /workouts/today/apply-deload** - Apply volume or intensity deload
- [x] **GET /workouts/deload-eligibility** - Check if user can deload today
- [x] **POST /workouts/{id}/start** - Start workout session
- [x] **PUT /workouts/{id}/log** - Log exercise data (sets/reps/RPE)
- [x] **POST /workouts/{id}/complete** - Complete workout
- [x] **PUT /workouts/{id}/modify** - Manual workout modification
- [x] **POST /workouts/travel-mode** - Toggle travel mode (bodyweight/hotel gym)
- [x] **GET /workouts/upcoming** - Preview next 7 days

### Context-Aware Exercise Selection
- [x] **GET /exercises/available** - Get exercises for current user context
- [x] **GET /exercises/{id}** - Get specific exercise details
- [x] **GET /exercises/substitutes/{id}** - Get alternatives for current context
- [x] **POST /exercises/filter** - Filter exercises by equipment/constraints/preferences
- [x] **GET /exercises/categories** - Get exercise categories available to user

### Analytics & Progress (User Priority Hierarchy)
- [x] **GET /analytics/event-dashboard** - Main landing: event readiness, timeline, overall progress
- [x] **GET /analytics/event-readiness** - Readiness score breakdown by training system
- [x] **GET /analytics/phase-completion** - Current phase progress, upcoming milestones
- [x] **GET /analytics/strength-systems** - Overall strength progression, stalling detection
- [x] **GET /analytics/power-speed-systems** - Power/speed development across energy systems
- [x] **GET /analytics/endurance-systems** - Cardiovascular fitness, energy system development
- [x] **GET /analytics/recovery-readiness** - Recovery patterns, training adaptation
- [x] **GET /analytics/strength-exercise/{exercise_id}** - Specific lift progression
- [x] **GET /analytics/energy-system-exercise/{exercise_id}** - Specific energy system work progressions
- [x] **POST /analytics/performance-test** - Log performance test results
- [x] **GET /analytics/heart-rate-trends/{exercise_id}** - HR at prescribed intensities over time
- [x] **GET /analytics/training-load** - RPE trends, volume/intensity balance
- [x] **GET /analytics/adherence** - Training consistency, missed sessions analysis

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

### Enhanced Project Structure (v2)
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
│   │   ├── user-queries.ts        # Enhanced user profiling queries
│   │   ├── gym-queries.ts         # Equipment & gym management
│   │   ├── program-queries.ts     # Program generation & regeneration
│   │   └── types.ts
│   ├── utils/
│   │   ├── validation.ts
│   │   ├── errors.ts
│   │   ├── auth.ts
│   │   ├── profile-completion.ts  # Progressive onboarding logic
│   │   └── movement-assessment.ts # Movement competency calculations
│   └── types/
│       ├── api.ts
│       ├── user-profile.ts        # Enhanced user data models
│       ├── equipment.ts           # Equipment & gym types
│       └── analytics.ts           # Analytics response types
├── auth/
│   └── index.ts
├── users/
│   ├── index.ts                   # Basic user management
│   ├── profiling.ts               # Enhanced profiling endpoints
│   ├── movement-competencies.ts   # Movement assessment
│   ├── exercise-exclusions.ts     # Exercise exclusion management
│   ├── injuries.ts                # Injury tracking
│   └── gym-access.ts              # Gym network management
├── equipment/
│   ├── index.ts                   # Equipment categories
│   └── gyms.ts                    # Gym database management
├── programs/
│   ├── index.ts                   # Program CRUD
│   ├── generation.ts              # AI program generation
│   └── regeneration.ts            # Dynamic regeneration logic
├── workouts/
│   ├── index.ts                   # Workout management
│   ├── deload-logic.ts            # Literature-based deload enforcement
│   └── travel-mode.ts             # Context switching logic
├── exercises/
│   ├── index.ts                   # Exercise selection
│   └── context-filtering.ts       # Equipment-aware filtering
├── analytics/
│   ├── index.ts                   # Analytics hierarchy
│   ├── event-dashboard.ts         # Primary analytics
│   ├── system-performance.ts      # Secondary analytics
│   └── exercise-specific.ts       # Tertiary analytics
└── context-periods/
    └── index.ts                   # Travel & temporary context
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
- Enhanced schema v2 with equipment categories, gyms, and user gym access tables
- Profile completion tracking with database functions
- Literature-based deload frequency enforcement via database functions

### Enhanced Business Logic (v2)

#### Progressive Profile Completion
```typescript
// _shared/utils/profile-completion.ts
interface ProfileCompletionService {
  calculateCompletion(userId: string): Promise<number>;
  getNextSteps(userId: string): Promise<OnboardingStep[]>;
  markStepComplete(userId: string, step: string): Promise<void>;
}
```

#### Movement Competency Assessment
```typescript
// _shared/utils/movement-assessment.ts
interface MovementAssessment {
  assessPattern(pattern: MovementPattern, userInput: CompetencyData): CompetencyLevel;
  validateWorkingWeight(pattern: MovementPattern, weight: number, experience: string): boolean;
  suggestProgressions(currentLevel: CompetencyLevel): Exercise[];
}
```

#### Equipment Context Management
```typescript
// _shared/database/gym-queries.ts
interface GymContextService {
  getUserAvailableEquipment(userId: string): Promise<EquipmentCategory[]>;
  getMovementPatternsAvailable(userId: string): Promise<MovementPattern[]>;
  checkEquipmentAvailability(gymId: string, equipmentIds: string[]): Promise<boolean>;
  getContextForDate(userId: string, date: Date): Promise<WorkoutContext>;
}
```

#### Dynamic Program Regeneration
```typescript
// programs/regeneration.ts  
interface ProgramRegenerationService {
  shouldRegenerate(trigger: RegenerationTrigger): Promise<boolean>;
  regenerateFromTrigger(programId: string, trigger: RegenerationTrigger): Promise<Program>;
  calculateTimelineAdjustment(missedDays: number, eventDate: Date): Promise<TimelineAdjustment>;
  bridgeProgramForTravel(travelContext: TravelContext): Promise<Program>;
}
```

---

## 🎯 Enhanced Implementation Priorities (v2)

### Phase 1: Core Infrastructure & Enhanced User Profiling (Week 1-2)
1. Set up Edge Functions development environment with v2 project structure
2. Create shared utilities (auth, validation, errors, profile completion)
3. Implement AI provider adapter pattern
4. Build authentication endpoints
5. **NEW**: Implement progressive profile completion system
6. **NEW**: Build movement competency assessment logic
7. **NEW**: Create equipment & gym database management

### Phase 2: Enhanced User Management & Onboarding (Week 3)
1. Complete enhanced user profile CRUD operations
2. Implement multi-step onboarding wizard with completion tracking
3. Build exercise exclusion management system
4. **NEW**: Create gym network management endpoints
5. **NEW**: Implement movement pattern availability checking
6. Build AI challenge generation with enhanced context

### Phase 3: Program Generation & Dynamic Regeneration (Week 4)
1. Implement core program generation logic with enhanced user context
2. Add event-driven reverse periodization with equipment awareness
3. **NEW**: Build dynamic program regeneration system for travel/life changes
4. **NEW**: Implement travel mode with full program regeneration (not just substitution)
5. Create workout adaptation logic with movement pattern focus

### Phase 4: Daily Operations & Context Management (Week 5)
1. Build workout management endpoints with sequential day enforcement
2. Implement literature-based deload logic with database validation
3. Add context-aware exercise selection with equipment filtering
4. **NEW**: Create travel mode functionality with equipment context switching
5. **NEW**: Implement skip day recovery and timeline adjustment logic

### Phase 5: Analytics Hierarchy & Advanced Features (Week 6)
1. Implement comprehensive analytics hierarchy (Event → System → Exercise)
2. Build performance tracking with event readiness calculations
3. **NEW**: Create dynamic test scheduling with automatic program extension
4. Add comprehensive error handling with v2 error specifications
5. Complete testing and optimization for all v2 features

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

## ✅ Enhanced Success Criteria (v2)

### Functional Requirements
- All API endpoints from 01-api-design-v2.md implemented and working
- Enhanced user profiling system with movement competency assessment
- Progressive profile completion tracking with smart recommendations
- Equipment & gym ecosystem management with movement pattern focus
- AI provider switching works seamlessly via environment variable
- Database queries respect Row Level Security policies for all v2 tables
- Literature-based deload frequency enforcement working as designed
- Context-aware exercise selection filters by available equipment
- **NEW**: Dynamic program regeneration for travel/life changes working correctly
- **NEW**: Multi-gym access network management functional
- **NEW**: Exercise exclusion system prevents unwanted exercise recommendations
- **NEW**: Sequential day completion enforcement maintains program integrity

### Enhanced Non-Functional Requirements
- Program generation completes within 30 seconds (enhanced context processing)
- Program regeneration completes within 45 seconds (more complex than generation)
- Analytics queries return within 2 seconds (all three hierarchy levels)
- Profile completion calculation executes within 1 second
- Movement pattern availability lookup completes within 500ms
- 99.9% uptime for critical user operations
- Comprehensive error handling with actionable messages (v2 error specifications)
- All endpoints return consistent response formats with enhanced data models

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
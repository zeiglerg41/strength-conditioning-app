# Essential Technical Decisions
## Must be decided BEFORE API Design

**Status**: ✅ COMPLETE - All critical decisions made, ready for API design

---

## ✅ Completed Decisions

### Development Environment
- [✅] **Node.js**: v22.16.0 installed
- [✅] **Package Manager**: npm
- [✅] **Version Control**: Git + GitHub
- [✅] **Database**: Supabase (PostgreSQL)
- [✅] **Authentication**: Supabase Auth

---

## ✅ Completed Decisions (Ready for API Design)

### AI/LLM Provider Decision
**Why needed now**: API design changes based on provider capabilities and pricing

- [✅] **Decision Made**: **Model-agnostic architecture with swappable providers**
  - Primary: Start with **OpenAI** for development (most documented)
  - Swap via single env var: `AI_PROVIDER=openai|anthropic|ollama`
  - Support OpenAI, Anthropic, and self-hosted Ollama models
  
**Implementation Timeline**:
- **Now (00)**: Design API to be provider-agnostic
- **Phase 03 (Backend)**: Implement OpenAI integration first
- **Phase 03 (Backend)**: Add Anthropic and Ollama adapters
- **Phase 06 (Testing)**: Test all providers thoroughly

### AI Integration Architecture & Edge Functions Strategy
**Why needed now**: Determines how we structure program generation endpoints

- [✅] **Decision Made**: **Supabase Edge Functions with "Fat Functions" Architecture**
  - Rationale: Keeps everything in one platform, simpler deployment
  - Deno runtime is sufficient for API calls to LLM providers
  - Auto-scaling handles concurrent users
  - **Updated**: Following Supabase official recommendation for "fat functions" over micro-functions
  
**Implementation Strategy** (Updated based on 2025 best practices):
- **Consolidated Functions**: Group related endpoints into single functions for better performance
- **Fat Functions Benefits**: Reduced cold starts, shared authentication/validation, faster routing
- Primary functions: `/users` (all user management), `/programs`, `/workouts`, `/analytics`
- Simple adapter pattern for provider switching maintained
- Environment variables control which provider to use

**Actual Implementation Status**:
- ✅ `/users` function: Consolidated all enhanced user profiling (14+ endpoints)
- ✅ AI provider adapters: OpenAI, Anthropic, Ollama implemented
- ⏳ `/programs/generate` endpoint: Planned for next phase

### Data Storage Strategy
**Why needed now**: Affects API response structure and caching

- [✅] **Program Storage Decision**: **Full programs in database**
  - Store complete generated programs as JSON
  - Rationale: Consistency, faster retrieval, version history
  - Programs are immutable once generated (can regenerate new ones)
  - Allows offline access and program comparison

- [✅] **Workout History Decision**: **Detailed logs with smart aggregation**
  - Store every set/rep for complete history
  - Create materialized views for daily/weekly summaries
  - 3-year retention for detailed logs
  - Permanent retention for aggregated metrics
  - Rationale: Full history for analytics, aggregation for performance

### Frontend Technology Stack
**Why needed now**: Cross-platform requirements and developer expertise affect architectural decisions

- [✅] **UI Library Decision**: **React Native Elements + Styled-Components**
  - Rationale: Developer expertise prioritized for faster, higher-quality development
  - Cross-platform: iOS + Android + Desktop Web via React Native Web
  - Lightweight bundle size, proven reliability, full customization control
  
- [✅] **State Management Decision**: **Zustand + TanStack Query Hybrid**
  - Client State: Zustand (<1KB) for UI state, navigation, preferences
  - Server State: TanStack Query for API data with intelligent caching
  - Rationale: Best performance, minimal boilerplate, excellent DevTools
  
- [✅] **Cross-Platform Strategy**: **React Native Web**
  - Desktop compatibility via React Native Web
  - Single codebase for mobile + desktop scaling
  - Responsive design with styled-components theme system

**Implementation Details**:
- Primary developer has expert-level knowledge in all chosen technologies
- Bundle size optimized: ~60KB total for all state management + UI libraries
- Performance focus: Selective re-rendering and intelligent caching strategies

### Dynamic Programming Architecture Decisions
**Why needed now**: Core differentiator requiring specialized API endpoints and database triggers

- [✅] **Dynamic Program Regeneration**: **Full program recalculation vs exercise substitution**
  - Travel mode triggers complete program regeneration, not simple exercise swapping
  - Rationale: Missing critical weighted progression days affects entire program timeline
  - Example: Week of bodyweight during linear progression → entire program recalculated from that point
  - API Impact: Requires program versioning, regeneration endpoints, context tracking

- [✅] **Sequential Day Completion Enforcement**: **Database-level workout progression locks**
  - Users cannot edit future days until current day is completed
  - Skip day recovery: prompt to move missed workout to current day
  - Rationale: Maintains program integrity, prevents workout chaos
  - Implementation: Database triggers, API validation, frontend state management

- [✅] **Dynamic Test Scheduling**: **AI-scheduled with automatic program extension**
  - AI determines test days based on program phase and event timeline  
  - Missed tests trigger program extension (add training days)
  - Rationale: "Moving target" program that adapts to user behavior
  - Implementation: Background jobs, timeline recalculation algorithms

### User Experience Architecture Decisions
**Why needed now**: Affects navigation structure, API design, and state management

- [✅] **Calendar-Based Workout Interface**: **Calendar IS the workout management system**
  - Multi-scale calendar: Day (workout manager) → Week (context) → Month (program timeline)
  - No separate "workout pages" - calendar handles all workout interaction
  - Rationale: Unified interface reduces navigation complexity, provides temporal context
  - Navigation: Dashboard card → Calendar day view → Week/Month context switching

- [✅] **Context-Aware Navigation**: **Maintain viewing context across scale changes**
  - Day view → Week view (same week) → Month view (same month) 
  - Default view: Always today's date in day view
  - Rationale: User doesn't lose their place when changing perspectives
  - Implementation: Navigation state preservation, context tracking

- [✅] **Enhanced Progressive Profiling**: **6-step onboarding with completion tracking** *(IMPLEMENTED)*
  - Movement competency assessment beyond "beginner/intermediate" ✅
  - Absolute exercise exclusions with granular reasoning ✅
  - Equipment ecosystem mapping (primary + backup + travel gyms) ⏳
  - Event-driven goal structure supporting reverse periodization ✅
  - **Training schedule constraints capture**: Time availability, session duration limits, weekly frequency, commute considerations for active transport integration ⏳
  - Implementation: Profile completion percentage, step validation, smart recommendations ✅
  
**✅ IMPLEMENTED (Consolidated /users Function)**:
- **14+ Enhanced Profiling Endpoints**: All consolidated into single `/users` Edge Function
- **Training Background**: Detailed experience tracking with movement competency assessment
- **Physical Profile**: Comprehensive injury/limitation tracking with exercise exclusions  
- **Movement Competencies**: 8 movement patterns with experience levels and form confidence
- **Exercise Exclusions**: Full CRUD for "will never do" exercises with reasoning
- **Injuries Management**: Current limitations and historical injury tracking
- **Profile Completion**: Progressive onboarding with percentage tracking and next steps
- **Comprehensive Testing**: 38 total tests covering all functionality

### Equipment Context Management Decisions
**Why needed now**: Core to program generation and travel mode functionality

- [✅] **Multi-Gym Ecosystem**: **User gym networks vs single gym assumption** *(PARTIALLY IMPLEMENTED)*
  - Primary gym + backup gyms + travel gyms + home gym ✅ (database schema)
  - Equipment availability mapped per location ✅ (database schema)
  - Priority ranking system for gym selection ✅ (database schema)
  - Rationale: Real users have complex gym access patterns
  - **Implementation Status**: Database schema complete, API endpoints planned for next phase ⏳

- [✅] **Movement Pattern Focus**: **Equipment categories vs specific models** *(IMPLEMENTED)*
  - Focus on "leg press available" vs "Planet Fitness Model XY-200" ✅
  - Movement patterns: squat, press, pull, hinge, carry ✅
  - Rationale: Scalable, user-friendly, covers exercise selection needs
  - **Implementation Status**: Equipment categories table complete, movement pattern mapping implemented ✅

### Training Schedule Constraint Decisions
**Why needed now**: Core to program generation - affects session frequency, duration, and supplementary workout integration

- [✅] **Time Availability & Session Constraints**: **Realistic scheduling with lifestyle integration**
  - Capture exact weekly time budget (hours per week available for training)
  - Session duration preferences vs absolute limits (prefer 45min, max 75min)
  - Time of day availability with energy level considerations
  - Weekend vs weekday availability differences
  - Rationale: Programs must fit real schedules or users abandon them

- [✅] **Supplementary Workout Integration**: **Beyond primary gym training**
  - Willingness and capability for bodyweight sessions (comfort level, space available)
  - Home gym supplementary workouts (equipment available, noise constraints)
  - Active commute integration (bike/run to work as cardio, distance/terrain factors)
  - Short session acceptance (15-30min sessions as program supplements)
  - Rationale: Real life offers more training opportunities than just "gym sessions"

- [✅] **Weekly Training Frequency Constraints**: **Realistic vs optimal frequency**
  - Minimum viable sessions per week (what user commits to)
  - Optimal sessions per week (what user prefers when life permits)
  - Rest day requirements (medical, religious, family obligations)
  - Flexibility tolerance (can sessions move day-to-day vs fixed schedule)
  - Rationale: Programs must accommodate real constraints while optimizing for goals

### Dashboard Psychology & Motivation Decisions  
**Why needed now**: Dashboard is primary daily user touchpoint - affects long-term adherence and engagement

- [✅] **Primary Motivation Metrics**: **Exercise psychology-driven progress visualization**
  - **Training Progress Bar**: "Day 23 of 84" with visual completion bar (competence signal)
  - **Today's Workout Card**: Clickable access to day view with workout type preview (autonomy/control)
  - **Event Countdown**: "12 days until Spring Meet" when target event exists (goal gradient effect)
  - **Weekly Consistency Indicator**: "4/4 workouts complete this week" with visual streak (achievement framing)
  - Rationale: Self-Determination Theory - competence, autonomy, progress visualization increase adherence 15-20%

- [✅] **Secondary Contextual Elements**: **Situational motivation boosters**
  - **Recent Achievement Display**: "New bench PR: 225lbs" or "5-day training streak" (self-efficacy building)
  - **Next Program Milestone**: "Phase 2: Power begins in 5 days" (anticipation and preparation)
  - **Quick Action Access**: Travel mode toggle, program regeneration (user control and flexibility)
  - **Program Phase Indicator**: Current phase name and focus area (context and purpose understanding)
  - Rationale: Contextual motivators provide variety and maintain engagement without overwhelming core metrics

---

## 📊 Implementation Status Update (Current Phase)

### ✅ **Completed Implementations**
- **Enhanced User Profiling System**: Fully implemented with 14+ endpoints consolidated into `/users` function
- **Database Schema V2**: Complete with comprehensive user profiling, equipment ecosystem, and workout tracking
- **AI Provider Integration**: OpenAI, Anthropic, and Ollama adapters implemented and tested
- **Fat Functions Architecture**: Successfully implemented following Supabase best practices
- **Movement Competency Assessment**: 8 movement patterns with detailed tracking
- **Physical Profile Management**: Injury tracking, exercise exclusions, limitations management
- **Profile Completion System**: Progressive onboarding with percentage tracking

### ⏳ **Partially Implemented / Planned Next**
- **Gym Ecosystem Management**: Database schema complete, API endpoints planned
- **Equipment & Gym Database**: Basic structure implemented, full management APIs pending  
- **Program Generation**: AI providers ready, program generation logic pending
- **Workout Management**: Database ready, dynamic programming logic pending
- **Frontend Implementation**: All decisions made, implementation pending

### 🔄 **Architecture Decision Validation**

**✅ All decisions remain VALID and have been proven correct:**

1. **Fat Functions Architecture**: Validated through research and successful implementation
   - Reduced from 5 separate functions to 1 consolidated function
   - Better performance, maintainability, and consistency achieved
   
2. **Enhanced User Profiling**: Successfully implemented and exceeds original scope
   - 6-step onboarding working with completion tracking
   - Movement competency assessment beyond basic levels implemented
   - Exercise exclusions with reasoning system working
   
3. **Database Design**: V2 schema successfully handles all planned features
   - User profiling, equipment ecosystem, workout tracking all functional
   - RLS policies and performance indexes working correctly
   
4. **AI Provider Strategy**: Model-agnostic architecture working perfectly
   - Easy provider switching with single environment variable
   - All three providers (OpenAI, Anthropic, Ollama) tested and functional

**No architectural changes needed** - all decisions align with current implementation and scale well for remaining features.

---

**NEXT**: Continue with program generation implementation using established fat functions pattern, then move to frontend implementation with validated technical stack!
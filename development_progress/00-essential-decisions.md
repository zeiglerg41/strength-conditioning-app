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

### AI Integration Architecture
**Why needed now**: Determines how we structure program generation endpoints

- [✅] **Decision Made**: **Supabase Edge Functions**
  - Rationale: Keeps everything in one platform, simpler deployment
  - Deno runtime is sufficient for API calls to LLM providers
  - Auto-scaling handles concurrent users
  - Can always migrate later if needed
  
**Implementation Details**:
- Edge Functions will handle `/programs/generate` endpoint
- Simple adapter pattern for provider switching
- Environment variables control which provider to use

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

- [✅] **Enhanced Progressive Profiling**: **6-step onboarding with completion tracking**
  - Movement competency assessment beyond "beginner/intermediate"
  - Absolute exercise exclusions with granular reasoning
  - Equipment ecosystem mapping (primary + backup + travel gyms)
  - Event-driven goal structure supporting reverse periodization
  - **Training schedule constraints capture**: Time availability, session duration limits, weekly frequency, commute considerations for active transport integration
  - Implementation: Profile completion percentage, step validation, smart recommendations

### Equipment Context Management Decisions
**Why needed now**: Core to program generation and travel mode functionality

- [✅] **Multi-Gym Ecosystem**: **User gym networks vs single gym assumption**
  - Primary gym + backup gyms + travel gyms + home gym
  - Equipment availability mapped per location
  - Priority ranking system for gym selection
  - Rationale: Real users have complex gym access patterns
  - Implementation: Gym database, user-gym relationships, equipment mapping APIs

- [✅] **Movement Pattern Focus**: **Equipment categories vs specific models**  
  - Focus on "leg press available" vs "Planet Fitness Model XY-200"
  - Movement patterns: squat, press, pull, hinge, carry
  - Rationale: Scalable, user-friendly, covers exercise selection needs
  - Implementation: Equipment categories table, movement pattern mapping

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

**NEXT**: ✅ All critical architectural decisions complete! Enhanced API design and dynamic programming system ready for implementation in Phase 5!
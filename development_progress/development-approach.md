# Development Approach Strategy
## 🎯 Master Guide for S&C Program Generator Development

### 🏆 App Vision: Performance-Focused Program Generation
**The first S&C app that generates complete periodized training programs** (not just workouts) tailored to real-life constraints. Built on science-backed principles from Supertraining, Joel Jamieson's methods, and peer-reviewed periodization research.

**Key Differentiators:**
- **Dynamic Program Generation**: Full periodized programs that adapt to real life - workouts shift forward when skipped (no missed days), travel/equipment changes trigger intelligent program regeneration
- **Calendar-Based Workout Interface**: Multi-scale calendar view (day/week/month) where the calendar IS the workout management system
- **Sequential Completion Enforcement**: Users must complete prescribed days before accessing future workouts, maintaining program integrity
- **Simple Performance Tracking**: Basic performance feedback via modal notifications - target achievement rates, workout postponement frequency, intensity adherence
- **Event-Driven Periodization**: Programs reverse-engineered from target events with dynamic test scheduling and timeline adjustments
- **Context-Aware Equipment Management**: Multi-gym access networks with travel mode that regenerates entire programs, not just exercise substitutions
- **Lifestyle Integration**: Deep profiling including commute, work travel, family constraints, recovery factors
- **Performance Focus**: Trains for events/metrics with sophisticated analytics hierarchy, not aesthetics
- **Science-Backed**: Linear/undulating periodization from leading S&C literature with dynamic adaptation algorithms

### ✅ Build Order: API-First → Backend → Frontend

Based on 2025 best practices, we follow a **contract-first** development approach.

---

## 🗄️ Database Access Instructions

### Remote Supabase Database
**Project URL**: https://gytncjaerwktkdskkhsr.supabase.co
**Connection Details**: Stored in `.env` file

### How to Query the Database

#### Method 1: Via Supabase Dashboard
1. Go to https://supabase.com/dashboard/project/gytncjaerwktkdskkhsr
2. Navigate to Table Editor or SQL Editor
3. Run queries directly in browser

#### Method 2: Via Edge Functions (Recommended)
```javascript
// In any Edge Function
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single();
```

#### Method 3: Via Node.js Script
```javascript
// Example: test-supabase-connection.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

// Query example
const { data, error } = await supabase
  .from('users')
  .select('*');
```

#### Method 4: Direct SQL Connection (Admin Only)
- Connection string available in Supabase dashboard
- Use with psql, TablePlus, or other PostgreSQL clients
- Requires service role key for full access

### Testing Edge Functions
```bash
# Deploy function
supabase functions deploy [function-name] --no-verify-jwt

# Test with curl
curl -X GET "https://gytncjaerwktkdskkhsr.supabase.co/functions/v1/[function-name]/[endpoint]" \
  -H "apikey: [anon-key]" \
  -H "Authorization: Bearer [user-token]"
```

---

## 📚 Table of Contents - Development Documents

### [00-essential-decisions.md](./00-essential-decisions.md) ✅ **[COMPLETE]**
**Critical decisions that affect API design**
- [✅] AI/LLM provider selection - Model-agnostic with swappable providers
- [✅] AI integration architecture - Supabase Edge Functions
- [✅] Data storage strategy - Full programs in DB, detailed logs with aggregation

**Decisions Made:**
- Database: Supabase (PostgreSQL + Auth + Realtime)
- AI Provider: Model-agnostic (OpenAI/Anthropic/Ollama via env var)
- Integration: Supabase Edge Functions with provider adapters
- Storage: Full programs in DB, detailed workout logs with aggregation

### [01-api-design.md](./01-api-design.md) ✅ **[COMPLETE]**
**API Contracts & Data Models**
- [✅] Define all REST endpoints
- [✅] Specify request/response schemas  
- [✅] Document authentication flow
- [✅] Create data model specifications
- [✅] Define error responses

**Decisions Made:**
- **Program Structure**: Event-driven reverse periodization from target dates
- **Exercise Selection**: Context-aware, no static library (equipment/injury/travel filtered)
- **Deload Management**: Max 1 per 6 training days, literature-based education
- **Analytics Hierarchy**: User-priority flow - Event progress → System performance → Exercise-specific
- **Performance Tracking**: Stalling detection, energy system breakdown, HR efficiency trends
- **Error Handling**: Comprehensive with actionable user suggestions
- **Authentication**: JWT-based, provider-agnostic (works with Supabase Auth)

### [02-database-schema.md](./02-database-schema.md) ✅ **[COMPLETE]**
**Database Design & Setup**
- [✅] Create Supabase tables
- [✅] Set up relationships and constraints
- [✅] Configure Row Level Security
- [✅] Create indexes for performance
- [✅] Set up database functions/triggers

**Decisions Made:**
- **Schema Design**: Minimal but comprehensive - 7 core tables with JSONB for flexibility
- **User Data Storage**: JSONB columns for complex profile, lifestyle, equipment data
- **Event-Driven Programs**: Target events drive reverse periodization structure
- **Travel Context Management**: Dedicated context_periods table for multiple concurrent travel sessions
- **Performance Analytics**: Separate performance_logs table optimized for analytics queries
- **Deload Enforcement**: Database triggers enforce 1 deload per 6 training days rule
- **Security**: Row Level Security ensures users only access own data

### [03-backend-implementation.md](./03-backend-implementation.md) 🔄 **[IN PROGRESS]**
**Backend Services & Logic**
- [✅] Implement authentication endpoints
- [✅] Enhanced user profiling system (14+ endpoints consolidated)
- [✅] Equipment & gym database management
- [✅] Set up AI integration (model-agnostic architecture)
- [✅] Error handling and validation infrastructure
- [⏳] Program generation logic (TBD after AI provider validation)
- [⏳] Workout tracking services (TBD after program generation)
- [⏳] Analytics endpoints (TBD after core functionality)

**Decisions Made:**
- **AI Provider Architecture**: Model-agnostic factory pattern (OpenAI/Anthropic/Ollama)
- **Exercise Selection**: No static library - AI-generated contextual exercises based on equipment/location/injuries
- **Analytics Hierarchy**: User-priority flow - Event dashboard → System performance → Exercise-specific metrics
- **Edge Functions**: 50+ endpoints implemented across Programs, Workouts, Exercises, Analytics
- **Testing Strategy**: Unit tests with Deno test framework, comprehensive coverage for all business logic
- **Program Generation Architecture**: Structured Edge Functions with S&C knowledge base integration (Supertraining principles, Joel Jamieson periodization) embedded as prompt templates, user constraints from database as AI guardrails
- **Training Age Classification**: NSCA research-backed 5-factor model determining effective vs chronological training age for accurate blueprint selection (TrainingAgeService with detraining impact calculations)
- **AI Guardrail System**: System context injection pattern ensuring every AI call receives appropriate S&C blueprint + user constraints via ProgramContextService, prevents unsafe/inappropriate program generation

### [04-frontend-setup.md](./04-frontend-setup.md) ✅ **[COMPLETE]**
**React Native Project Initialization**
- [✅] Create Expo project
- [✅] Choose UI component library
- [✅] Set up state management
- [✅] Configure navigation
- [✅] Set up development environment

**Decisions Made:**
- **UI Library**: React Native Elements + Styled-Components (developer expertise priority)
- **State Management**: Zustand + TanStack Query hybrid approach
- **Cross-Platform Strategy**: React Native Web for desktop compatibility
- **Performance Focus**: Lightweight bundle (<60KB), selective re-rendering
- **Development Velocity**: Stack optimized for primary developer's expertise

### [05-frontend-development.md](./05-frontend-development.md) 🔄 **[IN PROGRESS]**
**Enhanced UI Implementation with Dynamic Programming Interface**

#### Core Page Structure & Navigation Flow:
- **📊 Dashboard (Landing Page)**: Event countdown, today's workout card (clickable → day view), program progress metrics, quick access to travel mode toggle
- **📅 Calendar/Workout (Primary Interface)**: Multi-scale calendar system where calendar IS the workout management
  - **Day View** (Default): Today's editable workout with set/rep logging, RPE input, exercise substitution, deload toggle
  - **Week View**: Context view with navigation to specific days, progress indicators
  - **Month View**: High-level program timeline with phases, test days, travel periods marked
- **🏗️ Program Management**: Program overview, edit mode for timeline/goals, travel period management, regeneration options
- **📈 Analytics**: Event progress dashboard → training system performance → exercise-specific metrics
- **👤 Profile**: Enhanced user profiling with movement competency tracking, equipment access management

#### Dynamic Programming Features:
- **Sequential Day Completion**: Users can only edit current/past days, future days view-only until prerequisites completed
- **Skip Day Handling**: Workouts automatically shift forward when skipped (no missed days in system), modal warnings after multiple postponements
- **Travel Mode Integration**: Full program regeneration (not substitution) when equipment/timeline changes
- **Dynamic Test Scheduling**: AI-scheduled test days with automatic program extension for missed tests
- **Context-Aware Navigation**: Day→Week→Month views maintain user's viewing context

#### Simple Performance Tracking:
- **No Missed Days**: Skipped workouts automatically move to next available day (program shifts forward)
- **Basic Performance Metrics**: Target achievement rate, workout postponement frequency, intensity adherence
- **Modal Feedback System**: Simple notifications about performance patterns:
  - "You've postponed 3 workouts this week - consider adjusting your schedule"
  - "Great job hitting 9/10 target intensities!"
  - "You're consistently missing target reps - should we adjust the program?"
- **Performance Data Sources**: User profile (self-reported experience) + logged workout data (weights, sets, reps completed vs prescribed)
- **Evaluation Triggers**: After X completed workouts, model evaluates basic performance and shows feedback modal

**Implementation Tasks:**
- [ ] Build enhanced onboarding flow (6-step progressive profiling)
- [ ] Create calendar-based workout interface (day/week/month views)
- [ ] Implement dashboard with clickable workout card navigation
- [ ] Build program management page with edit/regeneration capabilities
- [ ] Develop travel mode system with equipment context switching
- [ ] Create analytics hierarchy (event → system → exercise levels)
- [ ] Implement sequential completion enforcement logic

**Decisions Made:**
- **Primary Interface**: Calendar-based workout system (not separate workout pages)
- **Navigation Flow**: Dashboard card → Calendar day view → Week/Month context switching
- **Dynamic Programming**: Full program regeneration for travel/equipment changes vs simple substitution
- **Completion Logic**: Sequential day enforcement with skip day recovery prompts
- **Context Persistence**: Calendar navigation maintains user's current viewing context

### [06-testing-deployment.md](./06-testing-deployment.md)
**Testing & Production**
- [ ] Unit and integration tests
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Deployment pipeline setup
- [ ] Production monitoring

**Decisions Made:**
- (To be added during testing/deployment)

---

## 🏗️ Technical Stack & Decisions

### Core Stack
- **Database**: Supabase (PostgreSQL + Auth + Realtime)
- **Backend**: Supabase Edge Functions (Deno runtime)
- **Frontend**: React Native + Expo SDK 53 + React Native Elements
- **State Management**: Zustand + TanStack Query
- **Styling**: Styled-Components + React Native Vector Icons
- **AI/LLM**: Model-agnostic (OpenAI/Anthropic/Ollama via env var)
- **Version Control**: Git + GitHub

### Key Architecture Decisions
- **Development**: API-first → Backend → Frontend
- **AI Integration**: Supabase Edge Functions with provider adapters
- **Data Storage**: Full programs in DB, detailed workout logs with aggregation
- **Auth**: Supabase Auth (built-in)

---

## 🔄 Current Status

**Active Document**: `03-backend-implementation.md`  
**Phase**: Backend Implementation - Core Functionality Development  
**Current Focus**: Implementing program generation logic with AI provider testing following fat functions architecture
**Just Completed**: ✅ Enhanced user profiling system (14+ endpoints), equipment management, error handling infrastructure
**Next Tasks**: 
- Test AI provider integration for program generation workflow
- Implement `/programs` Edge Function with dynamic program regeneration
- Build workout tracking with sequential completion enforcement
- Validate program generation performance before analytics implementation

---

## 📋 Development Phases

### Phase 1: API Design ✅ **COMPLETE**
Define all contracts before writing any code. This becomes our source of truth.

### Phase 2: Database & Backend 🔄 **IN PROGRESS** ← **WE ARE HERE**
**Database Schema**: ✅ Complete - V2 comprehensive schema with core workout tracking tables applied  
**Edge Functions**: 🔄 In Progress - Core infrastructure complete (users, equipment, error handling), program generation TBD  

### Phase 3: Frontend Development ⏳ **PENDING**
Build UI that consumes the established APIs (after backend completion).

### Phase 4: Testing & Deployment
Ensure quality and deploy to production.

---

## 🛠️ Key Principles

1. **Contract-First**: API design drives everything
2. **No Premature Decisions**: Don't choose UI libraries until APIs are defined
3. **Sequential Progress**: Complete each phase before moving forward
4. **Documentation-Driven**: Write specs before code
5. **Test Early**: Validate APIs before frontend work
6. **Type Safety**: Always ensure TypeScript types are correctly defined before using them - undefined properties will cause runtime errors

---

## ✅ Completed Prerequisites
- [x] Development environment setup
- [x] Supabase database connection
- [x] Version control (GitHub)
- [x] Project structure
- [x] Development approach defined

---

## 🚀 How to Use This Guide

1. **Start with** `01-api-design.md` - Define all endpoints
2. **Complete each document** sequentially
3. **Don't skip ahead** - Each phase depends on the previous
4. **Check off tasks** as you complete them
5. **Refer back here** for overall progress

---

**Remember**: Frontend can't exist without backend. Backend can't exist without contracts. Start with contracts.
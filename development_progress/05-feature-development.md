# Feature Development Progress

This document tracks the incremental feature development for the Strength & Conditioning app. We are building features one at a time to ensure each works correctly before moving to the next.

## Reference Documents
- **Backend Status**: [03-backend-implementation.md](./03-backend-implementation.md) - User profile endpoints working
- **Database Schema**: [02-database-implementation.md](./02-database-implementation.md) - User profile structure defined  
- **Development Approach**: [development-approach.md](./development-approach.md) - Database access methods
- **Testing Status**: [/tests/TESTING-STATUS.md](../tests/TESTING-STATUS.md) - Backend endpoint test results

## Backend Capabilities Available
From testing, we have these working endpoints:
- ✅ GET /users/profile - Returns complete user profile
- ✅ PUT /users/profile - Updates profile sections (expects {section, data} format)
- ✅ GET/PUT /users/training-background
- ✅ GET/PUT /users/movement-competencies
- ✅ GET/PUT /users/equipment-access

---

## Feature 1: User Onboarding Flow

### Requirements
1. When a new user signs up, they are immediately taken to an onboarding profile form
2. If an existing user logs in without completing onboarding, show a modal prompting them to complete it
3. The onboarding form collects essential user data the app needs to function

### Data to Collect (Based on Database Schema)
From `users` table JSONB columns:

**Profile Section** (Basic Info):
- Name
- Age  
- Gender
- Location
- Height
- Weight

**Lifestyle Section**:
- Sessions per week (how many times can they train)
- Stress level
- Work schedule type
- Sleep quality

**Training Background**:
- Total training months
- Strength training months
- Movement competencies (can be assessed later)

**Performance Goals**:
- Primary goal (strength/hypertrophy/endurance/athleticism)
- Specific goals (text array)

**Equipment Access**:
- Training location (home/commercial gym/garage gym)
- Available equipment (multi-select)

**Constraints**:
- Any injuries
- Time availability per session
- Other limitations

### Implementation Plan

#### Step 1: Check Onboarding Status
- [ ] On login/signup success, check `profile_completion_percentage` from user profile
- [ ] If 0% or profile incomplete, redirect to onboarding
- [ ] For existing users, show modal if onboarding incomplete

#### Step 2: Create Onboarding Screens
- [ ] OnboardingNavigator.tsx - Stack navigator for onboarding flow
- [ ] BasicInfoScreen.tsx - Name, age, gender, physical stats
- [ ] LifestyleScreen.tsx - Training frequency, schedule constraints
- [ ] TrainingBackgroundScreen.tsx - Experience level
- [ ] GoalsScreen.tsx - Primary and specific goals
- [ ] EquipmentScreen.tsx - Gym type and available equipment
- [ ] ReviewScreen.tsx - Review and submit all data

#### Step 3: State Management
- [ ] Create onboardingStore using Zustand
- [ ] Track progress through screens
- [ ] Collect all form data
- [ ] Submit to backend on completion

#### Step 4: Backend Integration
- [ ] Use PUT /users/profile endpoint for each section
- [ ] Handle errors and retry logic
- [ ] Update local auth state when complete

### Current Status: 🔧 In Progress

Starting with the onboarding check implementation...
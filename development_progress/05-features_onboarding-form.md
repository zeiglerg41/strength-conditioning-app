# Feature 05: Onboarding Form Requirements

This document defines the complete onboarding flow for gathering user information necessary for AI-driven program generation.

## Implementation Status: 90% Complete ✅

### Completed Features:
- ✅ 6-step onboarding flow implemented
- ✅ Basic Information (Step 1)
- ✅ Location & Privacy (Step 2)
- ✅ Training Locations & Equipment (Step 3)
- ✅ Training Background (Step 4)
- ✅ Schedule & Lifestyle (Step 5)
- ✅ Review & Submission (Step 6)
- ✅ Auto-save to database on each step
- ✅ Progress persistence on app reload
- ✅ Google Places integration for gym search
- ✅ Injury detail forms with proper keyboard handling

### Pending Features:
- ⏳ Training Goals & Events selection (critical)
- ⏳ Commute integration
- ⏳ Event search/suggestion
- ⏳ Location-based challenges

## Core Principle: Event-Driven Training
Every user MUST have a target event to train for. Without an event, no program can be generated.

## Current Onboarding Flow (As Implemented)

### Step 1: Basic Information ✅
**Status**: Complete
- Name
- Birthday with auto-formatting (MM/DD/YYYY)
- Gender selection
- Height (metric: cm, imperial: ft/in separate fields)
- Weight (kg or lbs based on unit preference)
- Unit preference toggle with auto-conversion

### Step 2: Location & Privacy ✅
**Status**: Complete
- Home location (exact or general)
- Work location (exact, general, or remote)
- Location permission request
- Commute consideration (yes/no/maybe)

### Step 3: Training Locations & Equipment ✅
**Status**: Complete
- Primary training location selection
- Google Places gym search integration
- Home equipment checklist
- Secondary location options
- Facility access (park, track, pool)

### Step 4: Training Background ✅
**Status**: Complete
- Cardio experience levels with timeframes
- Strength training experience levels
- Comprehensive injury history with details:
  - Status, timeframe, severity
  - Description and movement limitations
  - Fixed keyboard dismissal issues

### Step 5: Schedule & Lifestyle ✅
**Status**: Complete
- Sessions per week (2-7)
- Preferred training times (multi-select)
- Minutes per session
- Weekend availability (Yes/No)
- Work schedule (9-5, 2nd Shift, 3rd Shift, Irregular, Flexible)
  - Additional details for Irregular/Flexible
- Travel frequency (Never/Sometimes/Frequently)
- Sleep quality (on average)
- Other physical activities

### Step 6: Review & Submission ✅
**Status**: Complete
- Summary of all entered information
- Edit capability for each section
- Submit to backend with all new fields

## Pending Implementation

### Training Goal & Event Selection ⭐ CRITICAL
**Status**: Not Started - High Priority
**Purpose**: Define what the user is training FOR
- **Primary Question**: "Do you have a specific event you're training for?"

**Option A: Yes - User has an event**
- Event name
- Event type (Marathon, Triathlon, Powerlifting meet, CrossFit comp, Obstacle race, etc.)
- Event date
- Event location
- Any specific requirements/standards to meet

**Option B: No - Help them find one**
1. Request location permission for local event search
2. AI searches for events in their area within next 3-6 months
3. Display suggested events based on:
   - Location proximity
   - User's experience level
   - Available time to train
4. If no events found or user declines suggestions:
   - **Backup**: AI generates a personal challenge based on location
     - Example: "Run from your house to [Local Park] and complete the 5K loop in under 25 minutes"
     - Example: "Complete the [Local Trail] mountain bike route in under 2 hours"
     - Example: "Achieve a 300lb squat at your local gym's next mock meet"

**Option C: Manual Entry**
- Event type dropdown
- Custom event description
- Target date
- Performance goals/metrics

⚠️ **BLOCKING REQUIREMENT**: User cannot proceed without selecting/creating an event

### Step 3: Training Environment & Commute Integration
**Purpose**: Optimize training around daily life

**Commute Assessment**:
- Do you commute to work? (Yes/No/Remote)
- If Yes:
  - Commute method (Car/Public Transit/Walk/Bike/Mixed)
  - One-way commute time
  - Would you consider run/bike commuting? (Yes/No/Maybe)
  - Request location permissions to:
    - Map route from home → work
    - Identify gyms along commute route
    - Calculate distances for run/bike commute options

**Training Locations**:
- Primary training location:
  - Home gym
  - Commercial gym (name/location)
  - Outdoor only
  - Multiple locations
- If commercial gym:
  - Gym name
  - Location relative to home/work
  - Do you have access to multiple gym locations?
- Willing to train outdoors? (Weather permitting)

### Step 4: Training Background & Experience
**Purpose**: Establish baseline fitness and experience

**Cardio Training Experience**:
- None / Beginner (0-6mo) / Novice (6-12mo) / Intermediate (1-3yr) / Advanced (3+yr)

**Strength Training Experience**:
- None / Beginner (0-6mo) / Novice (6-12mo) / Intermediate (1-3yr) / Advanced (3+yr)

**Injury History** (with detailed fields for each):
- Body part checkboxes (Shoulder, Back, Knee, Ankle, Wrist, Hip, Elbow, Neck, Other)
- For each selected:
  - Status: Active / Recovering / Past
  - When did it occur?
  - Severity: Mild / Moderate / Severe
  - Description
  - Movement limitations

### Step 5: Schedule & Constraints
**Purpose**: Understand time availability and life constraints

**Training Availability**:
- Sessions per week available (2-7)
- Preferred training time (Early AM/Morning/Lunch/Evening/Night/Flexible)
- Minutes available per session (30/45/60/90/120+)
- Weekend availability (Same/More/Less than weekdays)

**Life Factors**:
- Work schedule (Standard 9-5/Shift work/Flexible/Irregular)
- Travel frequency (Never/Monthly/Bi-weekly/Weekly)
- Sleep quality (Poor/Fair/Good/Excellent)
- Stress level (Low/Moderate/High/Variable)
- Other physical activities (Sports leagues/Manual labor job/Active hobbies)

### Step 6: Equipment Access
**Purpose**: Understand available training tools

**Available Equipment** (multi-select based on training location):
- Barbell & plates
- Dumbbells (range available)
- Kettlebells
- Pull-up bar
- Resistance bands
- Cardio equipment (specify types)
- Specialty bars
- Chains/bands for accommodating resistance
- Other (text input)

### Step 7: Review & Submission
**Purpose**: Confirm all information before program generation
- Summary of all entered information
- Edit capability for each section
- Terms acceptance
- Submit to backend

## Data Storage Strategy

### Local (Zustand):
- Cache all form data during entry
- Allow back/forward navigation without data loss
- Save progress indicators

### Backend Submission:
- On final submission, send all sections to backend
- Use PUT /users/profile with section-based updates
- Store event details in new `training_events` JSONB column

## UI/UX Requirements

### Progress Indicators:
- Show step X of 7 at all times
- Progress bar showing completion
- Ability to navigate back without losing data

### Validation:
- Event selection is MANDATORY
- Minimum required fields per section before proceeding
- Clear error messaging

### Smart Features:
- If location permission granted:
  - Auto-suggest gyms near home/work
  - Calculate commute distances
  - Find local events
  - Generate location-based challenges
- Unit conversion (metric/imperial) preserved throughout

## Success Criteria
1. ✅ User completes all 7 steps
2. ✅ Event/goal is clearly defined
3. ✅ All data saved to backend
4. ✅ Ready for AI program generation
5. ✅ Commute integration possibilities identified

## Implementation Notes
- Step 2 (Training Goal & Event) should come early to ensure user commitment
- Location permissions are optional but highly beneficial
- Event selection is the ONLY blocking requirement
- Consider saving partial progress to backend after each section
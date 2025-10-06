# [Bug Title] - [Date]

## Problem Context
- **Error Message**:
- **When Occurs**:
- **User Behavior**:
- **Current State**:

## Files Involved

### Database Schema
-

### Mobile App Code
-

### Configuration
-

## How We Serve/Restart App

### Mobile Development
```bash
# Start Expo development server
cd mobile
npm start

# Clear Metro cache if needed
npx expo start --clear

# Reset Expo cache completely
npx expo start --reset-cache
```

### Database Changes
```bash
# Apply migrations to hosted Supabase
supabase db reset
# OR push specific migration
supabase db push
```

## Solution

**Status**: [RESOLVED / IN PROGRESS / UNRESOLVED]

[Concise summary of the solution - which hypothesis solved it and what was done]

## Hypotheses

### Hypothesis 1: [Name]
**Theory**:

**Test**:

**Evidence Gathered**:
```bash

```

**Files to Check**:
-

**Resolution**: [✅ SOLVED / ❌ NOT SOLVED / ⏳ IN PROGRESS]

[Details of what was found, what was changed, and the outcome]

### Hypothesis 2: [Name]
**Theory**:

**Test**:

**Files to Check**:
-

**Resolution**: [✅ SOLVED / ❌ NOT SOLVED / ⏳ IN PROGRESS]

[Details of what was found, what was changed, and the outcome]

### Hypothesis 3: [Name]
**Theory**:

**Test**:

**Files to Check**:
-

**Resolution**: [✅ SOLVED / ❌ NOT SOLVED / ⏳ IN PROGRESS]

[Details of what was found, what was changed, and the outcome]

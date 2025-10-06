# Incomplete Profile Popup After Completing Onboarding - October 5, 2025

## Problem Context
- **Error Message**: "Profile Incomplete" popup appears, shows 83% complete
- **When Occurs**: After completing all 6 onboarding steps and clicking "Complete Setup"
- **User Behavior**: User filled out all 6 steps (Basic Info, Location, Training Locations, Training Background, Schedule/Lifestyle, Review)
- **Current State**:
  - Database shows `profile_completion_percentage: 100` ✅
  - Database shows `onboarding_completed_at: "2025-10-06T00:58:12.958+00:00"` ✅
  - App still redirects to onboarding or shows incomplete profile popup
  - Profile screen shows 83% instead of 100%

## Files Involved

### Database Schema
- `/supabase/migrations/20251006000000_fix_onboarding_completion.sql` - Fixed completion calculation (excluded goals_events from onboarding)
- `/supabase/migrations/20250831000000_add_enhanced_user_profiling.sql` - Profile completion trigger
- Database trigger `update_profile_completion_percentage()` - Auto-calculates completion based on 5 sections (not 6)

### Mobile App Code
- `/mobile/src/store/onboardingStore.ts` - Lines 336-349 (loads profile, checks completion)
- `/mobile/src/store/authStore.ts` - Lines 46-56 (`checkOnboardingStatus()` method)
- `/mobile/src/screens/profile/ProfileScreen.tsx` - Lines 32-34 (displays completion percentage)
- `/mobile/src/navigation/AppNavigator.tsx` - Navigation logic that checks `needsOnboarding` flag

### Backend Functions
- `/supabase/functions/_shared/database/user-queries.ts` - Profile service methods
- `/supabase/functions/users/index.ts` - Lines 206-217 (onboarding/complete endpoint)

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
npx supabase db push

# Auto-approve migrations
echo "Y" | npx supabase db push
```

## Solution

**✅ RESOLVED** - See Hypothesis 1

MainNavigator was checking `if (step <= 6)` to show the incomplete profile modal, which triggered even when user was on step 6 (review/complete). Fixed by checking the `isProfileComplete` flag instead, which properly reads database `onboarding_completed_at` and `profile_completion_percentage === 100` fields.

## Hypotheses

### Hypothesis 1: Navigation State Stale - needsOnboarding Flag Not Refreshing
**Theory**: Even though the database is correctly updated and onboarding store sees completion, the `needsOnboarding` flag in authStore is stale from when the app first loaded. The navigation/routing layer checks this flag BEFORE the profile refresh happens, causing the app to redirect or show incomplete popup.

**Test**:
1. Check AppNavigator.tsx to see when it checks `needsOnboarding` flag
2. Verify if authStore.checkOnboardingStatus() is called AFTER profile is refreshed
3. Check if there's a race condition between profile fetch and navigation decision
4. Look for any navigation guards or useEffect hooks that run on app mount

**Evidence Gathered**:
```bash
# From logs - onboarding store correctly identifies completion:
LOG  Onboarding complete? true
LOG  ✅ Onboarding data loaded successfully

# Database confirms completion:
"profile_completion_percentage": 100
"onboarding_completed_at": "2025-10-06T00:58:12.958+00:00"

# But app still shows incomplete - suggests navigation layer has stale state
```

**Files to Check**:
- `/mobile/src/navigation/AppNavigator.tsx` - Main navigation logic
- `/mobile/App.tsx` - App initialization and navigation setup
- `/mobile/src/store/authStore.ts` - When checkOnboardingStatus() is called
- `/mobile/src/screens/profile/ProfileScreen.tsx` - How completion percentage is calculated/displayed

**Resolution**: ✅ **SOLVED**

**Root Cause**: MainNavigator.tsx line 34 had `if (step <= 6)` which showed the incomplete profile modal even when user was on step 6 (review/complete). The `checkProfileCompletion()` function returns `6` when all data is filled, but `<= 6` evaluates to true, triggering the modal incorrectly.

**Changes Made**:
1. **File**: `/mobile/src/navigation/MainNavigator.tsx` (Lines 27-47)
   - **Before**: `if (step <= 6) { setShowOnboardingModal(true); }`
   - **After**: `if (!isProfileComplete) { setShowOnboardingModal(true); }`
   - Now uses `isProfileComplete` flag which properly checks database fields (`onboarding_completed_at` and `profile_completion_percentage === 100`)
   - Gets fresh state after `loadOnboardingProgress()` completes using `useOnboardingStore.getState()`

**Outcome**: App now correctly recognizes completed profiles and doesn't show the incomplete modal. Profile screen displays 100% completion from database.

### Hypothesis 2: [Name]
**Theory**:

**Test**:

**Files to Check**:
-

### Hypothesis 3: [Name]
**Theory**:

**Test**:

**Files to Check**:
-

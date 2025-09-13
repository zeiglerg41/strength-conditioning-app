# Feature 05: Profile Management Page Requirements

This document defines the Profile section of the app where users can view and manage their personal information, training data, and account settings.

## Purpose
The Profile page serves as the central hub for users to:
- View their complete profile information
- Edit any section of their onboarding data
- Track their training progress and statistics
- Manage account settings
- Access help and support

## Layout Structure

### Header Section
- Profile photo placeholder (future feature)
- User name (large, prominent)
- Member since date
- Profile completion badge (if 100%) or completion percentage

### Quick Stats Bar
- Current active program (if any)
- Total workouts completed
- Training streak
- Next scheduled workout

## Main Content Sections

### 1. Personal Information
**Expandable Card with Edit Button**
- Name
- Birthday & Age
- Gender
- Height & Weight
- Unit preference
- **Action**: Tap to expand, Edit button navigates to BasicInfoScreen

### 2. Location & Privacy Settings
**Expandable Card with Edit Button**
- Home location (showing privacy level)
- Work location (or "Remote")
- Location permissions status
- Commute preferences
- **Action**: Edit navigates to LocationPrivacyScreen

### 3. Training Setup
**Expandable Card with Edit Button**
- Primary training location
- Commercial gym memberships
- Home equipment available
- Secondary locations
- **Action**: Edit navigates to TrainingLocationsScreen

### 4. Training Background
**Expandable Card with Edit Button**
- Experience levels (Cardio & Strength)
- Current injuries/limitations
- Movement competencies (when available)
- **Action**: Edit navigates to TrainingBackgroundScreen

### 5. Schedule & Lifestyle
**Expandable Card with Edit Button**
- Weekly training availability
- Preferred training times
- Work schedule
- Sleep & recovery factors
- **Action**: Edit navigates to ScheduleLifestyleScreen

### 6. Training Goals & Events
**Expandable Card with Edit/Add Button**
- Current training event (if set)
- Event date countdown
- Performance goals
- Past events/achievements
- **Action**: Add/Edit navigates to Goals screen (to be built)

### 7. Account Settings
**List of Options**
- Notification preferences
- Privacy settings
- Data export
- Delete account
- Sign out

### 8. Help & Support
**List of Options**
- Contact support
- FAQs
- Terms of service
- Privacy policy
- App version

## Implementation Requirements

### Navigation
- Accessible from bottom tab bar
- Each section should navigate to its respective edit screen
- Back navigation should save changes automatically

### Data Management
- Pull all data from onboardingStore and authStore
- Real-time updates when returning from edit screens
- Show loading states during data fetch
- Handle offline gracefully

### Visual Design
- Follow dark theme from constants/theme
- Use expandable cards for information sections
- Clear visual hierarchy
- Edit buttons should be prominent but not overwhelming
- Use icons for quick identification of sections

### State Management
```typescript
// Profile store structure
interface ProfileState {
  profileData: any; // From database
  isLoading: boolean;
  error: string | null;
  expandedSections: Set<string>;

  // Actions
  loadProfile: () => Promise<void>;
  toggleSection: (section: string) => void;
  refreshProfile: () => Promise<void>;
}
```

### Edit Flow
1. User taps Edit on any section
2. Navigate to appropriate onboarding screen with data pre-filled
3. Screen shows in "edit mode" (different title, no step indicator)
4. Changes auto-save to database
5. Return to profile shows updated data

### Special Features

#### Profile Completion Indicator
- Show percentage if < 100%
- Visual progress bar
- List missing required fields
- Prompt to complete profile if incomplete

#### Training Readiness Score (Future)
Based on:
- Profile completion
- Recent workout adherence
- Recovery factors
- Injury status

#### Quick Actions
Floating action buttons or quick access tiles for:
- Start workout
- Log progress
- Update weight
- Report injury

## Success Criteria
1. ✅ All onboarding data is viewable
2. ✅ Each section is editable
3. ✅ Changes persist to database
4. ✅ Clean, intuitive navigation
5. ✅ Responsive and performant
6. ✅ Follows app design system

## Technical Implementation

### Screen Structure
```
ProfileScreen.tsx
├── ProfileHeader.tsx
├── ProfileStatsBar.tsx
├── ProfileSection.tsx (reusable)
├── ProfileSectionCard.tsx
└── AccountOptions.tsx
```

### Required Integrations
- Zustand stores (onboarding, auth)
- Supabase for data persistence
- React Navigation for screen transitions
- React Native Elements for UI components

### Performance Considerations
- Lazy load expanded sections
- Cache profile data locally
- Optimize re-renders with React.memo
- Use FlatList for long lists

## Priority Levels

### P0 - Must Have (MVP)
- View all profile information
- Edit personal information
- Edit training setup
- Sign out functionality

### P1 - Should Have
- Edit all sections
- Profile completion indicator
- Basic account settings
- Help/support links

### P2 - Nice to Have
- Profile photo
- Training statistics
- Achievement badges
- Data export

## Notes
- Profile page should feel like the user's "home base"
- Easy access to everything without being overwhelming
- Progressive disclosure through expandable sections
- Mobile-first design with thumb-friendly touch targets
# Feature 05: Profile Management Page Requirements

This document defines the Profile section of the app where users can view and manage their personal information and app settings.

## Purpose
The Profile page allows users to:
- View and edit their profile information from onboarding
- Upload and manage profile photo
- Adjust app settings and preferences
- Manage account settings
- Access help and support

## Layout Structure

### Header Section
- Profile photo (with upload/edit capability)
- User name (large, prominent)
- Email address
- Profile completion indicator (badge or percentage)

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

### 6. App Settings
**Settings Section**
- **Units**: Toggle between Metric/Imperial
- **Default Training Time**: Set preferred workout time
- **Notifications**: Push notification preferences
- **Privacy**: Location sharing, data collection
- **Theme**: Dark/Light mode (future)
- **Language**: App language preference (future)

### 7. Account Management
**Account Actions**
- Change email
- Change password
- Export my data
- Delete account
- Sign out

### 8. Help & Support
**Support Links**
- Contact support
- Report a bug
- FAQs
- Terms of service
- Privacy policy
- App version & build number

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
// Profile settings store structure
interface ProfileSettingsState {
  profilePhoto: string | null;
  appSettings: {
    units: 'metric' | 'imperial';
    defaultTrainingTime: string;
    notifications: {
      workoutReminders: boolean;
      programUpdates: boolean;
      achievements: boolean;
    };
    privacy: {
      shareLocation: boolean;
      anonymousAnalytics: boolean;
    };
  };

  // Actions
  updateProfilePhoto: (uri: string) => Promise<void>;
  updateAppSetting: (key: string, value: any) => void;
  exportUserData: () => Promise<void>;
}
```

### Edit Flow
1. User taps Edit on any section
2. Navigate to appropriate onboarding screen with data pre-filled
3. Screen shows in "edit mode" (different title, no step indicator)
4. Changes auto-save to database
5. Return to profile shows updated data

### Special Features

#### Profile Photo Management
- Tap to upload/change photo
- Options: Take photo, Choose from gallery, Remove photo
- Crop and resize functionality
- Default avatar if no photo

#### Profile Completion Indicator
- Show percentage if < 100%
- Visual progress bar
- List missing required fields
- Prompt to complete profile if incomplete

#### Settings Sync
- Settings saved to user preferences in database
- Sync across devices (future)
- Apply changes immediately (units conversion, etc.)

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
├── ProfileHeader.tsx (photo, name, email)
├── ProfileInfoSection.tsx (reusable for each data section)
├── SettingsSection.tsx (app preferences)
├── AccountSection.tsx (account management)
└── SupportSection.tsx (help links)
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
- Edit all onboarding sections
- Units preference toggle
- Sign out functionality

### P1 - Should Have
- Profile photo upload
- Profile completion indicator
- App settings (notifications, privacy)
- Help/support links
- Change email/password

### P2 - Nice to Have
- Data export
- Theme selection
- Language selection
- Advanced privacy controls

## Notes
- Profile page is for managing user information and app settings
- Training stats and analytics are in the Analytics section
- Keep it simple and focused on profile/settings management
- Progressive disclosure through expandable sections
- Mobile-first design with thumb-friendly touch targets
- All profile edits reuse the onboarding screens in "edit mode"
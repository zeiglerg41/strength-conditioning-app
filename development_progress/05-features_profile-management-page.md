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

---

## Account Management Implementation Details

### Change Email Protocol

**Security Pattern**: Supabase Email Change with Double Confirmation

**Flow**:
1. User enters new email address
2. Validate email format client-side
3. Call `supabase.auth.updateUser({ email: 'new@email.com' })`
4. Supabase sends confirmation emails to:
   - **Current email**: "Confirm you want to change your email"
   - **New email**: "Confirm this is your new email"
5. User must confirm both links to complete change
6. Session remains active throughout process

**Implementation**:
```typescript
// authStore.ts
changeEmail: async (newEmail: string) => {
  try {
    set({ loading: true, error: null });

    const { data, error } = await supabase.auth.updateUser({
      email: newEmail
    });

    if (error) throw error;

    // Show success message: "Confirmation emails sent"
    return {
      success: true,
      message: 'Please check both your current and new email for confirmation links'
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to change email';
    set({ error: message });
    throw error;
  } finally {
    set({ loading: false });
  }
}
```

**UI Requirements**:
- Email input with validation
- Clear messaging about double confirmation
- Show current email address as reference
- Disable submit until valid email entered
- Loading state during API call
- Success/error messaging

**Security Configuration** (Supabase Dashboard):
- **Secure email change**: Enabled (sends to both emails)
- **Email confirmation**: Required
- **Redirect URL**: Configure deep link for mobile app

---

### Change Password Protocol

**Security Pattern**: Supabase Secure Password Change with Optional Reauthentication

**Flow - Authenticated Password Change**:
1. User navigates to "Change Password" screen
2. Enter current password (for reauthentication)
3. Enter new password (with strength indicator)
4. Confirm new password
5. Call `supabase.auth.updateUser({ password: 'newPassword' })`
6. Success confirmation

**Flow - Forgot Password (Unauthenticated)**:
1. User clicks "Forgot Password" on login screen
2. Enter email address
3. Call `supabase.auth.resetPasswordForEmail(email, { redirectTo: 'myapp://reset-password' })`
4. User receives email with reset link
5. Parse deep link URL and extract tokens
6. Navigate to reset password screen
7. Call `supabase.auth.updateUser({ password: 'newPassword' })`

**Implementation - Authenticated Change**:
```typescript
// authStore.ts
changePassword: async (currentPassword: string, newPassword: string) => {
  try {
    set({ loading: true, error: null });

    // Optional: Reauthenticate user first (if "Secure password change" enabled)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Reauthenticate with current password
    const { error: reauth Error } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword
    });

    if (reauthError) throw new Error('Current password is incorrect');

    // Update to new password
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;

    return {
      success: true,
      message: 'Password updated successfully'
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to change password';
    set({ error: message });
    throw error;
  } finally {
    set({ loading: false });
  }
}
```

**Implementation - Password Reset Deep Link Handling**:
```typescript
// App.tsx or navigation setup
import { Linking } from 'react-native';

// Parse Supabase redirect URL (uses # instead of ? for query params)
const parseSupabaseRedirect = (url: string) => {
  // Convert myapp://reset-password#access_token=xxx&type=recovery
  // To      myapp://reset-password?access_token=xxx&type=recovery
  const parsed = url.replace('#', '?');
  return new URL(parsed);
};

// Listen for deep links
useEffect(() => {
  const handleDeepLink = (event: { url: string }) => {
    const url = parseSupabaseRedirect(event.url);

    if (url.pathname === '/reset-password') {
      const accessToken = url.searchParams.get('access_token');
      const type = url.searchParams.get('type');

      if (type === 'recovery' && accessToken) {
        // Session is automatically set by Supabase
        navigation.navigate('ResetPassword');
      }
    }
  };

  Linking.addEventListener('url', handleDeepLink);
  return () => Linking.removeEventListener('url', handleDeepLink);
}, []);
```

**UI Requirements - Change Password**:
- Current password field (secure entry)
- New password field with strength indicator
- Confirm password field
- Password requirements checklist:
  - Minimum 8 characters
  - Include uppercase, lowercase, digit, symbol
  - Not a commonly leaked password
- Show/hide password toggle
- Submit button (disabled until valid)
- Success/error messaging

**UI Requirements - Reset Password**:
- Single password entry screen after deep link
- Password strength indicator
- No current password needed (token-based)

**Security Configuration** (Supabase Dashboard):
- **Secure password change**: Enabled (requires recent sign-in within 24h)
- **Leaked password protection**: Enabled (Pro plan - uses HaveIBeenPwned API)
- **Password requirements**: Minimum 8 chars, mixed case, digits, symbols
- **Redirect URL**: `myapp://reset-password` (configure in Supabase)

---

### Export User Data (GDPR Compliance)

**Purpose**: Allow users to download all their data in JSON format per GDPR "Right to Data Portability"

**Flow**:
1. User taps "Export My Data" in Account Management
2. Show confirmation dialog explaining what data will be exported
3. Call backend Edge Function to compile user data
4. Generate JSON file with all user data
5. Download/share file via React Native Share API

**Implementation - Backend Edge Function**:
```typescript
// supabase/functions/users/export-data/index.ts
export async function handleDataExport(userId: string, supabase: SupabaseClient) {
  // Fetch all user data from all tables
  const [profile, workouts, programs, analytics] = await Promise.all([
    supabase.from('users').select('*').eq('id', userId).single(),
    supabase.from('workout_logs').select('*').eq('user_id', userId),
    supabase.from('programs').select('*').eq('user_id', userId),
    supabase.from('analytics').select('*').eq('user_id', userId)
  ]);

  // Compile into structured export
  const exportData = {
    export_date: new Date().toISOString(),
    user_id: userId,
    profile: profile.data,
    workout_history: workouts.data,
    programs: programs.data,
    analytics: analytics.data,
    // Include auth data (non-sensitive)
    account: {
      email: profile.data?.email,
      created_at: profile.data?.created_at,
      last_sign_in: profile.data?.updated_at
    }
  };

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="user-data-${userId}.json"`
    }
  });
}
```

**Implementation - Frontend**:
```typescript
// authStore.ts or profileStore.ts
exportUserData: async () => {
  try {
    set({ loading: true, error: null });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const response = await fetch(`${baseUrl}/functions/v1/users/export-data`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      }
    });

    if (!response.ok) throw new Error('Export failed');

    const jsonData = await response.json();
    const jsonString = JSON.stringify(jsonData, null, 2);

    // Save to device and share
    const fileUri = `${FileSystem.documentDirectory}user-data.json`;
    await FileSystem.writeAsStringAsync(fileUri, jsonString);

    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/json',
      dialogTitle: 'Export User Data',
      UTI: 'public.json'
    });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Export failed';
    set({ error: message });
    throw error;
  } finally {
    set({ loading: false });
  }
}
```

**Required Packages**:
```bash
expo install expo-file-system expo-sharing
```

**UI Requirements**:
- "Export My Data" button in Account Management
- Confirmation dialog:
  - Explain what data is included
  - Mention GDPR compliance
  - Warn about file size (if large)
- Loading indicator during export
- Success message with share option
- Error handling

**Data Included in Export**:
- User profile (name, age, gender, location, etc.)
- Training background and experience
- All workout logs and history
- All programs (generated and archived)
- Analytics and progress metrics
- Account metadata (email, creation date, NOT password)
- Equipment and gym preferences
- Schedule and lifestyle data

---

### Delete Account

**Purpose**: Allow permanent account deletion per GDPR "Right to Erasure"

**Security Pattern**: Two-step confirmation with reauthentication

**Flow**:
1. User taps "Delete Account" in Account Management
2. Show warning dialog with consequences
3. Require password reauthentication
4. Final confirmation with checkbox acknowledgment
5. Call backend to delete all user data
6. Delete auth user
7. Sign out and redirect to welcome screen

**Implementation - Backend**:
```typescript
// supabase/functions/users/delete-account/index.ts
export async function handleAccountDeletion(userId: string, supabase: SupabaseClient) {
  // Delete all user data in order (respecting foreign keys)
  await supabase.from('workout_logs').delete().eq('user_id', userId);
  await supabase.from('programs').delete().eq('user_id', userId);
  await supabase.from('analytics').delete().eq('user_id', userId);
  await supabase.from('users').delete().eq('id', userId);

  // Delete auth user (admin API required - use service role key)
  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) throw error;

  return { success: true, message: 'Account deleted successfully' };
}
```

**Implementation - Frontend**:
```typescript
// authStore.ts
deleteAccount: async (password: string) => {
  try {
    set({ loading: true, error: null });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Reauthenticate first
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password
    });

    if (reauthError) throw new Error('Password incorrect');

    // Call delete endpoint
    const { data: { session } } = await supabase.auth.getSession();
    const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const response = await fetch(`${baseUrl}/functions/v1/users/delete-account`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session!.access_token}`,
      }
    });

    if (!response.ok) throw new Error('Account deletion failed');

    // Sign out locally
    await supabase.auth.signOut();
    set({ user: null, userProfile: null });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Deletion failed';
    set({ error: message });
    throw error;
  } finally {
    set({ loading: false });
  }
}
```

**UI Requirements**:
- "Delete Account" button (red, destructive style)
- Warning dialog:
  - **Title**: "Delete Account?"
  - **Message**: "This will permanently delete all your data including workouts, programs, and analytics. This action cannot be undone."
- Password reauthentication field
- Final confirmation checkbox: "I understand this cannot be undone"
- Cancel and Confirm buttons
- Loading state during deletion
- Redirect to welcome screen on success

---

## Legal & Support Implementation

### Terms of Service

**Requirements**:
- Must be accessible during signup AND from Profile page
- Must be stored externally (not bundled in app)
- Should be versionable (track acceptance dates)

**Implementation Approach**:

**Option 1: External Hosting + WebView** (Recommended)
- Host Terms of Service on your domain: `https://yourdomain.com/legal/terms`
- Link to it during signup
- Open in WebView within app from Profile page

**Option 2: Markdown Rendering**
- Store terms as markdown file
- Fetch from Supabase Storage or GitHub
- Render with `react-native-markdown-display`

**Implementation**:
```typescript
// screens/legal/TermsOfServiceScreen.tsx
import { WebView } from 'react-native-webview';

export default function TermsOfServiceScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <WebView
        source={{ uri: 'https://yourdomain.com/legal/terms' }}
        style={{ flex: 1 }}
      />
    </SafeAreaView>
  );
}
```

**Required Package**:
```bash
npx expo install react-native-webview
```

**Content Structure** (Terms of Service):
1. Acceptance of Terms
2. Description of Service
3. User Accounts and Registration
4. User Responsibilities
5. Prohibited Activities
6. Intellectual Property
7. Limitation of Liability
8. Termination
9. Governing Law
10. Contact Information

**Signup Flow Integration**:
- Checkbox: "I agree to the Terms of Service and Privacy Policy"
- Tappable links to view each document
- Cannot proceed without accepting

---

### Privacy Policy

**Requirements**:
- Required by Apple App Store and Google Play Store
- Must be accessible during signup and from Profile
- Must comply with GDPR, CCPA, and other privacy laws
- Should clearly explain data collection and usage

**Implementation**: Same as Terms of Service (external hosting + WebView)

**Content Structure** (Privacy Policy):
1. Information We Collect
   - Personal information (name, email, age, gender)
   - Training data (workouts, programs, analytics)
   - Location data (gyms, if permission granted)
   - Device information
2. How We Use Your Information
   - Program generation and optimization
   - Analytics and progress tracking
   - Communications (notifications, updates)
3. Data Sharing and Third Parties
   - Supabase (hosting provider)
   - OpenAI/Anthropic (AI program generation)
   - Analytics providers (if used)
4. Data Security
   - Encryption in transit and at rest
   - RLS policies
   - Regular security audits
5. Your Rights
   - Access your data (export feature)
   - Delete your data (account deletion)
   - Opt-out of communications
6. Data Retention
   - Active accounts: Indefinite
   - Deleted accounts: 30 days grace period
7. International Data Transfers
   - Supabase region selection
8. Children's Privacy
   - Age restrictions (13+ or 18+)
9. Changes to This Policy
10. Contact Information

**Apple Store Requirement**:
- Privacy Policy must be displayed during registration
- Link to external URL required in App Store Connect

---

### FAQs (Frequently Asked Questions)

**Implementation Approach**: In-App Accordion Component

**Structure**:
```typescript
// screens/support/FAQScreen.tsx
const faqData = [
  {
    category: 'Getting Started',
    questions: [
      {
        q: 'How do I create my first program?',
        a: 'Complete your profile, then navigate to Programs and tap "Generate New Program"...'
      },
      // ... more questions
    ]
  },
  {
    category: 'Training Programs',
    questions: [
      // ... questions about programs
    ]
  },
  {
    category: 'Account & Billing',
    questions: [
      // ... questions about accounts
    ]
  }
];

export default function FAQScreen() {
  return (
    <ScrollView>
      {faqData.map(category => (
        <CategoryAccordion key={category.category} data={category} />
      ))}
    </ScrollView>
  );
}
```

**Data Source Options**:
1. **Hardcoded** (in app) - Fast, offline-capable, requires app update to change
2. **Remote JSON** (Supabase Storage) - Updatable without app release
3. **CMS** (Contentful, Sanity) - Full content management capabilities

**Recommended**: Start with hardcoded, migrate to remote JSON as FAQs grow

**FAQ Categories**:
- Getting Started
- Profile & Onboarding
- Training Programs
- Workouts & Logging
- Analytics & Progress
- Account & Settings
- Troubleshooting
- Privacy & Data

**UI Requirements**:
- Search bar at top
- Collapsible category sections
- Expandable individual questions
- Clear, concise answers
- Links to related help articles
- "Still need help? Contact Support" at bottom

---

### Contact Support

**Implementation Options**:

**Option 1: Email Link** (Simplest)
```typescript
import { Linking } from 'react-native';

const openSupport = () => {
  Linking.openURL('mailto:support@yourdomain.com?subject=Support Request');
};
```

**Option 2: In-App Form** (Better UX)
```typescript
// screens/support/ContactSupportScreen.tsx
export default function ContactSupportScreen() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const { user } = useAuthStore();

  const submitRequest = async () => {
    // Send via Edge Function
    await fetch(`${baseUrl}/functions/v1/support/ticket`, {
      method: 'POST',
      body: JSON.stringify({
        user_id: user.id,
        email: user.email,
        subject,
        message,
        device_info: {
          platform: Platform.OS,
          version: Platform.Version
        }
      })
    });
  };

  return (
    <View>
      <Input placeholder="Subject" value={subject} onChangeText={setSubject} />
      <Input multiline placeholder="Describe your issue..." value={message} onChangeText={setMessage} />
      <Button title="Submit" onPress={submitRequest} />
    </View>
  );
}
```

**Option 3: Third-Party Support Platform**
- Zendesk
- Intercom
- Freshdesk
- Crisp

**Recommended**: Start with email link, add in-app form as user base grows

---

### App Version & Build Information

**Purpose**: Help users identify their app version for troubleshooting

**Implementation**:
```typescript
import Constants from 'expo-constants';

// Display in Settings/Support section
const appVersion = Constants.expoConfig?.version || 'Unknown';
const buildNumber = Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode || 'Unknown';
const platform = Platform.OS;

// Show in UI
<Text>Version: {appVersion} ({buildNumber})</Text>
<Text>Platform: {platform}</Text>
```

**Required Package**:
```bash
expo install expo-constants
```

**UI Placement**:
- Bottom of Profile screen
- In Help & Support section
- Format: "Version 1.0.0 (Build 1) - iOS"

---

## Security Checklist

### Authentication Security
- ✅ Use Supabase Auth built-in security
- ✅ Enable "Secure email change" (double confirmation)
- ✅ Enable "Secure password change" (reauthentication if not recently signed in)
- ✅ Enable leaked password protection (HaveIBeenPwned API)
- ✅ Enforce strong password requirements (8+ chars, mixed case, symbols)
- ✅ Use secure storage for session tokens (react-native-keychain)

### Data Protection
- ✅ Enable Row-Level Security (RLS) on all tables
- ✅ Encrypt sensitive data at rest (Supabase default)
- ✅ Use HTTPS for all API calls (Supabase default)
- ✅ Never store API keys in app code (use environment variables)
- ✅ Implement GDPR data export and deletion

### Account Management
- ✅ Require password reauthentication for critical actions
- ✅ Two-step confirmation for account deletion
- ✅ Clear user data on sign out
- ✅ Implement deep linking for password reset

### Legal Compliance
- ✅ Terms of Service acceptance required at signup
- ✅ Privacy Policy accessible during signup and in-app
- ✅ GDPR compliance (data export, deletion, consent)
- ✅ CCPA compliance (California privacy rights)
- ✅ App Store requirements (external links to legal docs)
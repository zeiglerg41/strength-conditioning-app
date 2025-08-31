# Profile Fetch Error - August 31, 2025

## Problem Context
- **Error Message**: `ERROR Profile fetch error: {"code": "42703", "details": null, "hint": null, "message": "column users.user_id does not exist"}`
- **When Occurs**: After user signs in, the app automatically navigates to main app without requiring sign-in
- **User Behavior**: User didn't have to sign in manually, app just took them to the main interface
- **Current State**: Authentication seems to work (user gets to main app) but profile fetching fails

## Files Involved

### Database Schema
- `/supabase/migrations/20250830211556_create_initial_schema.sql` - Users table created with `id` column (line 6)
- `/supabase/migrations/20250830212731_add_row_level_security_policies.sql` - RLS policies reference `auth.uid() = id`
- `/supabase/migrations/20250830221000_add_users_insert_policy.sql` - INSERT policy uses `auth.uid() = id`

### Mobile App Code
- `/mobile/src/store/authStore.ts` - Contains profile fetch logic (lines 57-61, 166-170)
- `/mobile/src/services/supabase.ts` - Supabase client configuration
- `/mobile/src/screens/auth/SignupScreen.tsx` - Authentication flow

### Configuration
- `/mobile/.env` - Supabase connection details
- `/mobile/app.config.js` - Expo configuration

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

## Hypotheses

### Hypothesis 1: Column Name Mismatch
**Theory**: The authStore.ts is querying `users` table using `.eq('user_id', data.user.id)` but the database schema shows the users table has `id` as primary key, not `user_id`. This is a direct column name mismatch.

**Test**: Check lines 60 and 169 in authStore.ts - both use `.eq('user_id', ...)` when they should use `.eq('id', ...)`

**Evidence Gathered**:
```bash
# Command: grep -n "\.eq('user_id'" mobile/src/store/authStore.ts
60:          .eq('user_id', data.user.id)
169:          .eq('user_id', session.user.id)

# Command: curl Supabase API OpenAPI spec to see actual database structure
# Result shows users table definition in live database:
"users": {
  "properties": {
    "id": {"format": "uuid", "type": "string", "description": "Primary Key"},
    "email": {"format": "text", "type": "string"},
    "profile": {"format": "jsonb"},
    // ... other fields
  }
}
# CONCLUSION: 
# - users table: Has 'id' as primary key (NO user_id column)  
# - Other tables: Have both 'id' (primary key) AND 'user_id' (foreign key to users.id)
# - authStore queries users table with 'user_id' but should use 'id'
# - Schema design shows users.id is referenced by other tables as user_id foreign keys
```

**Files to Check**: 
- `/mobile/src/store/authStore.ts` lines 60, 169
- `/supabase/migrations/20250830211556_create_initial_schema.sql` line 6 (users table definition)

### Hypothesis 2: Database Schema Sync Issue  
**Theory**: 

**Test**: 

**Files to Check**: 

### Hypothesis 3: Authentication State Persistence Problem
**Theory**: 

**Test**: 

**Files to Check**: 
# Database Management Guide
## Direct Database Manipulation for S&C App

### Project Database Connection Info
- **Supabase Project URL**: `https://gytncjaerwktkdskkhsr.supabase.co`
- **Project ID**: `gytncjaerwktkdskkhsr`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5dG5jamFlcndrdGtkc2traHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNTMxNDQsImV4cCI6MjA3MTkyOTE0NH0.ouQWqYBIv7yEqZ__D3yQQ9gct7wKPeF-oImvacAYkrY`

### Method 1: SQL Migrations (PREFERRED for Schema Changes)

#### Creating a Migration
```bash
# Migration files go in: /supabase/migrations/
# Naming format: YYYYMMDDHHMMSS_description.sql

# Example: Create migration for adding columns
cat > supabase/migrations/20250907000000_add_onboarding_columns.sql << 'EOF'
-- Add missing onboarding columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS location_privacy JSONB DEFAULT NULL;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS training_locations JSONB DEFAULT NULL;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS schedule_lifestyle JSONB DEFAULT NULL;
EOF
```

#### Applying Migrations to Remote Database
```bash
# Apply all pending migrations
npx supabase db push

# Auto-approve migrations (skip confirmation)
echo "Y" | npx supabase db push

# Check migration status
npx supabase db remote status
```

### Method 2: Direct SQL via Supabase CLI

```bash
# First, link to your project (one-time setup)
npx supabase link --project-ref gytncjaerwktkdskkhsr

# Run SQL directly on remote database
npx supabase db execute --sql "SELECT * FROM users LIMIT 5;"

# Run SQL from file
npx supabase db execute --file path/to/query.sql
```

### Method 3: Node.js Script for Data Manipulation

```javascript
// test-db-connection.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../mobile/.env' });

const supabase = createClient(
  'https://gytncjaerwktkdskkhsr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5dG5jamFlcndrdGtkc2traHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNTMxNDQsImV4cCI6MjA3MTkyOTE0NH0.ouQWqYBIv7yEqZ__D3yQQ9gct7wKPeF-oImvacAYkrY'
);

// Query example
async function queryDatabase() {
  const { data, error } = await supabase
    .from('users')
    .select('*');
  
  if (error) console.error('Error:', error);
  else console.log('Data:', data);
}

// Update example
async function updateUser(userId, updates) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId);
  
  return { data, error };
}

queryDatabase();
```

### Method 4: Edge Function API Calls

```bash
# Call Edge Function with curl
curl -X GET "https://gytncjaerwktkdskkhsr.supabase.co/functions/v1/users/profile" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5dG5jamFlcndrdGtkc2traHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNTMxNDQsImV4cCI6MjA3MTkyOTE0NH0.ouQWqYBIv7yEqZ__D3yQQ9gct7wKPeF-oImvacAYkrY" \
  -H "Authorization: Bearer [user-jwt-token]"

# Update profile section
curl -X PUT "https://gytncjaerwktkdskkhsr.supabase.co/functions/v1/users/profile" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5dG5jamFlcndrdGtkc2traHNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzNTMxNDQsImV4cCI6MjA3MTkyOTE0NH0.ouQWqYBIv7yEqZ__D3yQQ9gct7wKPeF-oImvacAYkrY" \
  -H "Authorization: Bearer [user-jwt-token]" \
  -H "Content-Type: application/json" \
  -d '{"section": "profile", "data": {"name": "Test User"}}'
```

### Common Database Operations

#### Check Table Schema
```sql
-- View all columns in users table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users';

-- Check if specific columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('location_privacy', 'training_locations', 'schedule_lifestyle');
```

#### Add JSONB Columns (like we just did)
```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS location_privacy JSONB DEFAULT NULL;

-- With comment for documentation
COMMENT ON COLUMN users.location_privacy IS 'Step 2: Home/work locations and privacy preferences';
```

#### Query JSONB Data
```sql
-- Get specific JSONB field
SELECT profile->>'name' as name FROM users;

-- Query nested JSONB
SELECT training_locations->'gym_names' as gyms FROM users;

-- Update JSONB field
UPDATE users 
SET profile = jsonb_set(profile, '{name}', '"John Doe"')
WHERE id = 'user-uuid';
```

### Troubleshooting

#### Migration Errors
```bash
# Reset local migrations (careful!)
npx supabase db reset

# Check migration history
npx supabase db remote status

# Revert last migration
npx supabase db remote revert
```

#### Connection Issues
```bash
# Test connection
npx supabase db remote status

# Re-link project
npx supabase link --project-ref gytncjaerwktkdskkhsr
```

### Security Notes
- **NEVER** commit service role keys to git
- Use anon key for client-side operations only
- Service role key bypasses RLS - use with extreme caution
- Always use `IF NOT EXISTS` when adding columns to prevent errors

### Quick Reference - Actual Commands Just Used

```bash
# 1. Created migration file
cat > supabase/migrations/20250907000000_add_onboarding_columns.sql << 'EOF'
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS location_privacy JSONB DEFAULT NULL;
ALTER TABLE users
ADD COLUMN IF NOT EXISTS training_locations JSONB DEFAULT NULL;
ALTER TABLE users
ADD COLUMN IF NOT EXISTS schedule_lifestyle JSONB DEFAULT NULL;
EOF

# 2. Applied migration
echo "Y" | npx supabase db push

# 3. Verified it worked
# The app stopped throwing "column not found" errors
```

### Environment Variables Location
- Main `.env` file: `/home/gare/Projects/strength-conditioning-app/mobile/.env`
- Contains: `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- These are safe to use in client code (anon key has RLS protection)
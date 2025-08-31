-- Add missing INSERT policy for users table
-- This allows users to create their own profile record during signup

CREATE POLICY "Users can create own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
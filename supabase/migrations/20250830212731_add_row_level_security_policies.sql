-- Row Level Security Policies for S&C Program Generator
-- Ensure users can only access their own data

-- Users can only access their own profile
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Programs owned by user
CREATE POLICY "Users can access own programs" ON programs FOR ALL USING (user_id = auth.uid());

-- Workouts through program ownership
CREATE POLICY "Users can access own workouts" ON workouts FOR ALL USING (
  program_id IN (SELECT id FROM programs WHERE user_id = auth.uid())
);

-- Exercise instances through workout ownership  
CREATE POLICY "Users can access own exercise instances" ON exercise_instances FOR ALL USING (
  workout_id IN (
    SELECT w.id FROM workouts w 
    JOIN programs p ON w.program_id = p.id 
    WHERE p.user_id = auth.uid()
  )
);

-- Performance logs owned by user
CREATE POLICY "Users can access own performance data" ON performance_logs FOR ALL USING (user_id = auth.uid());

-- Deload history owned by user
CREATE POLICY "Users can access own deload history" ON deload_history FOR ALL USING (user_id = auth.uid());

-- Context periods owned by user  
CREATE POLICY "Users can access own context periods" ON context_periods FOR ALL USING (user_id = auth.uid());
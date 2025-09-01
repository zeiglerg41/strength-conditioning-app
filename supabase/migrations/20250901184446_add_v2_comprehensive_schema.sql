-- Add V2 Comprehensive Schema: Core Workout Tracking Tables + Enhanced User Profiling
-- Based on 02-database-schema-v2.md

-- ============================================================================
-- PART 1: Core Workout Tracking Tables (Essential for System Operation)
-- ============================================================================

-- Programs table - Event-driven periodized programs
CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  
  target_event JSONB NOT NULL, -- event details driving program design
  program_structure JSONB NOT NULL, -- periodization model, phases
  current_context JSONB DEFAULT '{}', -- travel, equipment state
  performance_tracking JSONB DEFAULT '{}', -- baselines, checkpoints
  
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'regenerating')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_modified TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workouts table - Daily adaptive workouts with deload tracking
CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  name TEXT NOT NULL,
  phase TEXT NOT NULL,
  week_in_phase INTEGER NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('strength', 'endurance', 'power', 'recovery', 'test')),
  
  original_prescription JSONB NOT NULL, -- AI-generated workout
  current_prescription JSONB NOT NULL,  -- may include deloads/modifications
  context JSONB DEFAULT '{}', -- location, equipment, readiness
  actual_performance JSONB DEFAULT '{}', -- what actually happened
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped', 'modified')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Exercise instances table - Specific exercises within workouts
CREATE TABLE IF NOT EXISTS exercise_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_name TEXT NOT NULL,
  category TEXT NOT NULL,
  
  prescription JSONB NOT NULL, -- sets, reps, weight, rpe target
  equipment_required JSONB DEFAULT '[]',
  performance_data JSONB DEFAULT '{}', -- actual sets completed
  
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance logs table - Exercise performance tracking
CREATE TABLE IF NOT EXISTS performance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  exercise_instance_id UUID REFERENCES exercise_instances(id) ON DELETE SET NULL,
  
  exercise_name TEXT NOT NULL,
  category TEXT NOT NULL,
  logged_date DATE NOT NULL,
  
  performance_metrics JSONB NOT NULL, -- weight, reps, time, distance, rpe
  estimated_1rm DECIMAL(5,2), -- calculated from performance
  session_rpe INTEGER CHECK (session_rpe BETWEEN 1 AND 10),
  context JSONB DEFAULT '{}', -- equipment, location, fatigue state
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deload history table - Literature-based frequency enforcement
CREATE TABLE IF NOT EXISTS deload_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
  
  deload_date DATE NOT NULL,
  deload_type TEXT NOT NULL CHECK (deload_type IN ('volume', 'intensity')),
  modifications_applied JSONB NOT NULL,
  reason TEXT NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Context periods table - Travel & temporary context management
CREATE TABLE IF NOT EXISTS context_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- Time boundaries for context application
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Context type and details
  context_type TEXT NOT NULL CHECK (context_type IN ('travel', 'temporary_gym', 'injury_modification', 'schedule_change')),
  location_type TEXT NOT NULL CHECK (location_type IN ('hotel', 'visiting_gym', 'home_away', 'outdoor', 'bodyweight_only')),
  
  -- Flexible context data
  location_details JSONB DEFAULT '{}', -- hotel name, gym address, contact info
  equipment_override JSONB NOT NULL, -- specific equipment available during this period  
  schedule_constraints JSONB DEFAULT '{}', -- meeting times, workout windows, timezone
  
  -- Status tracking
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure date ranges are valid
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- ============================================================================
-- PART 2: Row Level Security Policies for All Tables
-- ============================================================================

-- Enable RLS on all new tables
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE deload_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_periods ENABLE ROW LEVEL SECURITY;

-- User-specific access policies for core workout tables
CREATE POLICY "Users can access own programs" ON programs FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can access own workouts" ON workouts FOR ALL USING (
  program_id IN (SELECT id FROM programs WHERE user_id = auth.uid())
);

CREATE POLICY "Users can access own exercise instances" ON exercise_instances FOR ALL USING (
  workout_id IN (
    SELECT w.id FROM workouts w 
    JOIN programs p ON w.program_id = p.id 
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Users can access own performance logs" ON performance_logs FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can access own deload history" ON deload_history FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can access own context periods" ON context_periods FOR ALL USING (user_id = auth.uid());

-- ============================================================================
-- PART 3: Performance Indexes for Frequent Queries
-- ============================================================================

-- Primary lookup indexes
CREATE INDEX IF NOT EXISTS idx_programs_user_active ON programs(user_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_workouts_program_date ON workouts(program_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_exercise_instances_workout ON exercise_instances(workout_id);
CREATE INDEX IF NOT EXISTS idx_user_gym_access_user ON user_gym_access(user_id, priority_rank);

-- Analytics-optimized composite indexes
CREATE INDEX IF NOT EXISTS idx_performance_user_exercise_date ON performance_logs(user_id, exercise_name, logged_date);
CREATE INDEX IF NOT EXISTS idx_performance_user_category_date ON performance_logs(user_id, category, logged_date);
CREATE INDEX IF NOT EXISTS idx_performance_exercise_progression ON performance_logs(user_id, exercise_name, logged_date, estimated_1rm);
CREATE INDEX IF NOT EXISTS idx_deload_history_user_date ON deload_history(user_id, deload_date DESC);
CREATE INDEX IF NOT EXISTS idx_context_periods_user_dates ON context_periods(user_id, start_date, end_date) WHERE status = 'active';

-- ============================================================================
-- PART 4: Database Functions & Business Logic
-- ============================================================================

-- Function to check deload eligibility (literature-based: max 1 per 6 training days)
CREATE OR REPLACE FUNCTION check_deload_eligibility(user_uuid UUID, target_date DATE)
RETURNS JSONB AS $$
DECLARE
  recent_deloads INTEGER;
  days_since_last INTEGER;
  last_deload_date DATE;
  result JSONB;
BEGIN
  -- Count deloads in last 6 training days
  SELECT COUNT(*) INTO recent_deloads
  FROM deload_history dh
  JOIN workouts w ON dh.workout_id = w.id
  WHERE dh.user_id = user_uuid
    AND dh.deload_date >= target_date - INTERVAL '14 days' -- broader window for safety
    AND w.session_type IN ('strength', 'power'); -- only count actual training days
  
  -- Get days since last deload
  SELECT deload_date INTO last_deload_date
  FROM deload_history
  WHERE user_id = user_uuid
  ORDER BY deload_date DESC
  LIMIT 1;
  
  days_since_last := COALESCE(target_date - last_deload_date, 999);
  
  -- Build result
  result := jsonb_build_object(
    'can_deload', (recent_deloads < 1 AND days_since_last >= 4),
    'days_since_last_deload', days_since_last,
    'deloads_in_recent_period', recent_deloads,
    'reason_blocked', CASE 
      WHEN recent_deloads >= 1 THEN 'too_frequent'
      WHEN days_since_last < 4 THEN 'too_recent'
      ELSE NULL
    END
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate profile completion percentage
CREATE OR REPLACE FUNCTION update_profile_completion(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  completion_pct INTEGER := 0;
  user_record RECORD;
BEGIN
  -- Get user data
  SELECT 
    profile,
    training_background,
    physical_profile,
    performance_goals,
    equipment_access,
    lifestyle
  INTO user_record
  FROM users 
  WHERE id = user_uuid;
  
  -- Calculate completion based on key fields (adjust weights as needed)
  IF (user_record.profile->>'name') IS NOT NULL AND (user_record.profile->>'name') != '' THEN 
    completion_pct := completion_pct + 10; 
  END IF;
  
  IF (user_record.training_background->>'total_training_months') IS NOT NULL THEN 
    completion_pct := completion_pct + 20; 
  END IF;
  
  IF (user_record.performance_goals->>'primary_target_event') IS NOT NULL THEN 
    completion_pct := completion_pct + 25; 
  END IF;
  
  IF (user_record.equipment_access->>'primary_gym_id') IS NOT NULL THEN 
    completion_pct := completion_pct + 20; 
  END IF;
  
  IF user_record.physical_profile->'current_limitations' IS NOT NULL THEN 
    completion_pct := completion_pct + 15; 
  END IF;
  
  IF (user_record.lifestyle->>'sessions_per_week') IS NOT NULL THEN 
    completion_pct := completion_pct + 10; 
  END IF;
  
  -- Update the completion percentage
  UPDATE users 
  SET profile_completion_percentage = completion_pct 
  WHERE id = user_uuid;
  
  RETURN completion_pct;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VERIFICATION: Test that essential tables exist
-- ============================================================================

DO $$
BEGIN
  -- Verify core tables exist
  ASSERT (SELECT COUNT(*) FROM information_schema.tables 
          WHERE table_name IN ('programs', 'workouts', 'exercise_instances', 'performance_logs', 'deload_history', 'context_periods')) = 6,
          'Not all core workout tracking tables were created';
  
  -- Verify functions exist
  ASSERT (SELECT COUNT(*) FROM information_schema.routines 
          WHERE routine_name IN ('check_deload_eligibility', 'update_profile_completion')) = 2,
          'Database functions were not created successfully';
          
  RAISE NOTICE 'V2 Comprehensive Schema Migration Completed Successfully';
END $$;
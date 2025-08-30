-- Initial schema for S&C Program Generator
-- Event-driven periodized training programs with travel/context support

-- Users table with comprehensive profile data
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  
  -- Use JSONB for flexible, nested data that changes infrequently
  profile JSONB NOT NULL DEFAULT '{}',
  lifestyle JSONB NOT NULL DEFAULT '{}',
  training_background JSONB NOT NULL DEFAULT '{}', 
  equipment_access JSONB NOT NULL DEFAULT '{}',
  performance_goals JSONB NOT NULL DEFAULT '{}',
  constraints JSONB NOT NULL DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Programs table - event-driven periodized programs
CREATE TABLE programs (
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

-- Workouts table - daily adaptive workouts
CREATE TABLE workouts (
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

-- Exercise instances - specific exercises within workouts
CREATE TABLE exercise_instances (
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

-- Performance logs - exercise performance tracking for analytics
CREATE TABLE performance_logs (
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

-- Deload history - track deload frequency for enforcement
CREATE TABLE deload_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
  
  deload_date DATE NOT NULL,
  deload_type TEXT NOT NULL CHECK (deload_type IN ('volume', 'intensity')),
  modifications_applied JSONB NOT NULL,
  reason TEXT NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Context periods - handle travel and temporary context changes
CREATE TABLE context_periods (
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

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;  
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE deload_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_periods ENABLE ROW LEVEL SECURITY;

-- Create primary query pattern indexes
CREATE INDEX idx_programs_user_active ON programs(user_id, status) WHERE status = 'active';
CREATE INDEX idx_workouts_program_date ON workouts(program_id, scheduled_date);
CREATE INDEX idx_exercise_instances_workout ON exercise_instances(workout_id);
CREATE INDEX idx_performance_user_exercise_date ON performance_logs(user_id, exercise_name, logged_date);
CREATE INDEX idx_deload_history_user_date ON deload_history(user_id, deload_date DESC);
CREATE INDEX idx_context_periods_user_dates ON context_periods(user_id, start_date, end_date) WHERE status = 'active';

-- Analytics-optimized composite indexes
CREATE INDEX idx_performance_user_category_date ON performance_logs(user_id, category, logged_date);
CREATE INDEX idx_performance_exercise_progression ON performance_logs(user_id, exercise_name, logged_date, estimated_1rm);

-- Auto-update timestamps function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply timestamp triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Deload frequency validation function
CREATE OR REPLACE FUNCTION check_deload_frequency()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure max 1 deload per 6 training days
  IF (
    SELECT COUNT(*) 
    FROM deload_history 
    WHERE user_id = NEW.user_id 
    AND deload_date >= NEW.deload_date - INTERVAL '6 days'
  ) >= 1 THEN
    RAISE EXCEPTION 'Maximum deload frequency exceeded: 1 per 6 training days';
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply deload frequency validation trigger
CREATE TRIGGER validate_deload_frequency 
  BEFORE INSERT ON deload_history
  FOR EACH ROW EXECUTE FUNCTION check_deload_frequency();
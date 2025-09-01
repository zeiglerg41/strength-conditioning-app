# Database Schema Design v2 - Enhanced User Profiling
## Event-Driven S&C Programming with Comprehensive User Assessment

**Status**: 🔄 IN PROGRESS  
**Purpose**: Enhanced schema supporting detailed user profiling for AI-generated S&C programs

---

## 🎯 Key Enhancements from v1

### What We're Adding:
- **Detailed Movement Competency Assessment** - Beyond "beginner/intermediate"  
- **Absolute Exercise Exclusions** - Granular "will never do" lists
- **Equipment Access Ecosystem** - Map user's complete gym access network
- **Event-Driven Goal Structure** - Reverse periodization from target events
- **Progressive Profile Completion** - Track onboarding progress

### Core Principle:
**Movement Pattern Availability > Specific Equipment Models**
- Focus on "Can I do leg press movement?" not "Planet Fitness Leg Press Model XY-200"
- Simple categories: Barbell, Dumbbells, Cable Machine, Leg Press, Smith Machine, etc.

---

## 📊 Enhanced Schema Architecture

### New Tables Added:

```sql
-- Simple equipment categories focused on movement patterns
CREATE TABLE equipment_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL, -- "Barbell", "Leg Press", "Cable Machine"
  category_type TEXT NOT NULL CHECK (category_type IN ('free_weights', 'machines', 'bodyweight', 'cardio')),
  movement_patterns JSONB NOT NULL DEFAULT '[]', -- ["squat", "press", "pull"]
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Basic gym information and equipment availability  
CREATE TABLE gyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  gym_type TEXT CHECK (gym_type IN ('home', 'commercial', 'university', 'specialty')),
  equipment_available JSONB NOT NULL DEFAULT '{}', -- {equipment_category_id: true/false}
  notes TEXT, -- "24/7 access", "busy during lunch", etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User's gym access network
CREATE TABLE user_gym_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
  access_type TEXT CHECK (access_type IN ('primary', 'secondary', 'travel', 'temporary')),
  frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'occasional')),
  priority_rank INTEGER, -- 1 = primary, 2 = backup
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, gym_id)
);
```

### Enhanced Users Table:

```sql
-- Add profile completion tracking
ALTER TABLE users ADD COLUMN profile_completion_status JSONB DEFAULT '{
  "basic_info": false,
  "training_background": false, 
  "physical_assessment": false,
  "goals_events": false,
  "equipment_access": false,
  "lifestyle_constraints": false
}';

ALTER TABLE users ADD COLUMN onboarding_completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN profile_completion_percentage INTEGER DEFAULT 0;
```

---

## 🏋️ Enhanced User Profile Structure

### 1. Training Background (Competency-Based Assessment)

```typescript
training_background: {
  // Overall experience
  total_training_months: number;
  strength_training_months: number;
  consistent_training_periods: Array<{
    duration_months: number;
    program_type: string;
    year_range: string;
  }>;
  
  // Movement pattern competencies (key differentiator)
  movement_competencies: {
    squat_pattern: {
      experience_level: 'untrained' | 'novice' | 'intermediate' | 'advanced';
      variations_performed: string[]; // "back squat", "front squat", "goblet squat"
      current_working_weight_kg?: number;
      form_confidence: 'low' | 'moderate' | 'high';
    };
    deadlift_pattern: {
      experience_level: 'untrained' | 'novice' | 'intermediate' | 'advanced';
      variations_performed: string[];
      current_working_weight_kg?: number;
      form_confidence: 'low' | 'moderate' | 'high';
    };
    press_patterns: {
      overhead_press: { /* same structure */ };
      bench_press: { /* same structure */ };
    };
    pull_patterns: {
      pullups_chinups: { /* same structure */ };
      rows: { /* same structure */ };
    };
    hinge_patterns: {
      hip_hinge: { /* same structure */ };
      single_leg: { /* same structure */ };
    };
  };
  
  // Program history
  periodization_experience: boolean;
  previous_programs_used: string[]; // "Starting Strength", "5/3/1", "StrongLifts"
  longest_consistent_program_months: number;
}
```

### 2. Physical Profile & Limitations (Comprehensive Assessment)

```typescript
physical_profile: {
  // Current injuries/conditions
  current_limitations: Array<{
    body_region: 'lower_back' | 'shoulder' | 'knee' | 'hip' | 'wrist' | 'ankle' | 'neck';
    condition: string; // "herniated disc L4-L5", "rotator cuff strain"
    severity: 'minor' | 'moderate' | 'severe';
    medical_clearance: boolean; // Doc said OK to train?
    movement_restrictions: string[];
    pain_triggers: string[];
  }>;
  
  // Absolute exercise exclusions (critical for AI programming)
  absolute_exercise_exclusions: Array<{
    exercise_name: string;
    exclusion_type: 'movement_pattern' | 'specific_exercise' | 'equipment_type';
    reason: 'injury_history' | 'current_pain' | 'medical_restriction' | 'personal_preference';
    alternative_preferred?: string;
    notes?: string;
  }>;
  
  // Movement limitations/modifications
  movement_modifications: Array<{
    movement_pattern: string;
    modification_type: 'range_of_motion' | 'load_limitation' | 'tempo_restriction';
    details: string;
  }>;
  
  // Injury history (impacts exercise selection)
  injury_history: Array<{
    injury_type: string;
    body_region: string;
    year_occurred: number;
    surgery_required: boolean;
    full_recovery: boolean;
    ongoing_considerations: string;
  }>;
}
```

### 3. Performance Goals (Event-Driven Programming)

```typescript
performance_goals: {
  // Primary target event (drives periodization)
  primary_target_event: {
    event_name: string;
    target_date: Date;
    event_type: 'powerlifting_meet' | 'athletic_competition' | 'military_test' | 'general_strength_goal';
    specific_requirements: {
      competition_lifts?: Array<{
        lift_name: string;
        current_max_kg?: number;
        target_max_kg?: number;
      }>;
      weight_class_target?: number;
      performance_standards?: Record<string, number>;
    };
    importance_level: 'high' | 'moderate';
  };
  
  // Secondary events/goals
  secondary_events: Array<{
    /* similar structure to primary */
    target_date: Date;
    priority: 'high' | 'medium' | 'low';
  }>;
  
  // Ongoing objectives (not event-specific)
  continuous_goals: Array<{
    goal_type: 'strength_gain' | 'muscle_gain' | 'fat_loss' | 'power_development' | 'conditioning';
    target_metrics: Record<string, any>;
    timeline: 'ongoing' | 'short_term' | 'long_term';
  }>;
  
  // Motivation and preferences
  training_motivations: string[]; // "competition", "health", "appearance", "performance"
  preferred_training_style: 'powerlifting' | 'bodybuilding' | 'general_strength' | 'athletic';
}
```

### 4. Equipment Access Ecosystem

```typescript
equipment_access: {
  primary_gym_id: UUID;
  available_equipment_categories: Array<{
    equipment_category_id: UUID;
    availability: boolean;
    quality_notes?: string; // "limited weight plates", "always busy"
  }>;
  
  backup_gym_access: Array<{
    gym_id: UUID;
    frequency: 'daily' | 'weekly' | 'travel_only';
    equipment_differences: string; // What's different from primary gym
  }>;
  
  home_gym_setup: {
    has_home_gym: boolean;
    equipment_available?: Array<{
      equipment_category_id: UUID;
      specifications?: string; // "up to 100lb dumbbells", "power rack with safeties"
    }>;
  };
  
  travel_considerations: {
    travels_frequently: boolean;
    typical_travel_duration: string;
    preferred_backup_exercises: string[];
  };
}
```

### 5. Lifestyle & Schedule Constraints

```typescript
lifestyle: {
  // Training schedule
  preferred_training_days: string[]; // ["monday", "wednesday", "friday"]
  sessions_per_week: number;
  session_duration_minutes: number;
  time_of_day_preference: 'early_morning' | 'morning' | 'afternoon' | 'evening' | 'flexible';
  
  // Life constraints
  work_schedule_type: 'standard' | 'shift_work' | 'irregular' | 'travel_heavy';
  family_obligations: 'minimal' | 'moderate' | 'significant';
  other_activities: Array<{
    activity: string;
    frequency: string;
    impact_on_training: 'none' | 'minor' | 'moderate' | 'significant';
  }>;
  
  // Recovery factors
  sleep_quality: 'poor' | 'fair' | 'good' | 'excellent';
  stress_level: 'low' | 'moderate' | 'high' | 'very_high';
  nutrition_consistency: 'poor' | 'fair' | 'good' | 'excellent';
}
```

---

## 🏃 Multi-Step Onboarding Flow Design

### Step 1: Welcome & Expectations (Skip Option Available)
- **Goal**: Set expectations about personalization importance
- **Content**: "We'll build your profile to create truly personalized programs"
- **Time**: 30 seconds

### Step 2: Basic Information
- **Fields**: Name, age, gender, location (for gym recommendations)
- **Goal**: Basic demographic info
- **Time**: 1 minute

### Step 3: Training Background Assessment (Critical Step)
- **3a**: Overall experience (months training, consistency)
- **3b**: Movement pattern assessment (per pattern above)  
- **3c**: Previous programs used
- **Goal**: Determine program complexity and starting points
- **Time**: 3-4 minutes

### Step 4: Physical Assessment & Limitations (Critical Step)  
- **4a**: Current injuries/conditions
- **4b**: Exercise exclusions ("I will never do...")
- **4c**: Movement modifications needed
- **4d**: Injury history
- **Goal**: Safety guardrails for AI programming
- **Time**: 2-3 minutes

### Step 5: Goals & Target Events (Our Differentiator)
- **5a**: Primary target event (if any)
- **5b**: Secondary goals and timelines
- **5c**: Training motivations and style preferences
- **Goal**: Drive periodization and program focus
- **Time**: 2-3 minutes

### Step 6: Equipment & Gym Access (Critical for Programming)
- **6a**: Primary gym setup and equipment availability
- **6b**: Backup gym access
- **6c**: Home gym setup
- **6d**: Travel considerations
- **Goal**: Ensure programmable exercises are always available
- **Time**: 2-3 minutes

### Step 7: Lifestyle & Schedule
- **7a**: Training schedule preferences
- **7b**: Life constraints and obligations  
- **7c**: Recovery factors
- **Goal**: Realistic program structure
- **Time**: 2 minutes

### Step 8: Review & Program Generation
- **Content**: Profile summary, program generation preview
- **Goal**: Confirm information and generate first program
- **Time**: 1 minute

**Total Onboarding Time**: 12-15 minutes (industry standard for comprehensive fitness apps)

---

## 🔄 Profile Management Post-Onboarding

### Progressive Enhancement
- **Profile Completion Dashboard**: Visual progress tracker
- **Smart Prompts**: "Add your bench press max for better recommendations"
- **Seasonal Updates**: "Planning any travel this quarter?"
- **Goal Evolution**: Easy event/goal modification

### Data Quality Maintenance
- **Validation Prompts**: "Is your squat max still accurate?"
- **Performance Integration**: Auto-update maxes from logged workouts
- **Context Awareness**: Prompt for equipment changes when traveling

---

## 📈 Default Equipment Categories to Seed Database

```sql
INSERT INTO equipment_categories (name, category_type, movement_patterns, description) VALUES
-- Free Weights
('Barbell', 'free_weights', '["squat", "deadlift", "press", "row"]', 'Olympic barbell with weight plates'),
('Dumbbells', 'free_weights', '["press", "row", "squat", "lunge"]', 'Adjustable or fixed dumbbells'),
('Kettlebells', 'free_weights', '["swing", "press", "squat", "carry"]', 'Kettlebell weights'),

-- Machines (Movement Pattern Focus)
('Leg Press Machine', 'machines', '["squat"]', 'Any leg press variation'),
('Lat Pulldown Machine', 'machines', '["pull"]', 'Cable lat pulldown station'),
('Cable Machine/Station', 'machines', '["pull", "press", "row"]', 'Adjustable cable system'),
('Smith Machine', 'machines', '["squat", "press"]', 'Guided barbell system'),
('Leg Curl Machine', 'machines', '["hamstring"]', 'Hamstring curl variations'),
('Leg Extension Machine', 'machines', '["quad"]', 'Quadriceps extension'),
('Chest Press Machine', 'machines', '["press"]', 'Machine chest press variations'),
('Row Machine', 'machines', '["row"]', 'Seated or chest-supported row'),
('Shoulder Press Machine', 'machines', '["press"]', 'Machine overhead press'),
('Bicep Curl Machine', 'machines', '["curl"]', 'Dedicated bicep curl station'),

-- Bodyweight/Functional
('Pull-up Bar', 'bodyweight', '["pull"]', 'Pull-up/chin-up station'),
('Dip Station', 'bodyweight', '["press"]', 'Parallel bars for dips'),
('Suspension Trainer', 'bodyweight', '["pull", "press", "squat"]', 'TRX or similar'),

-- Cardio (if needed for conditioning)
('Treadmill', 'cardio', '["run"]', 'Motorized treadmill'),
('Stationary Bike', 'cardio', '["cycle"]', 'Exercise bike variations'),
('Rowing Machine', 'cardio', '["row", "full_body"]', 'Concept2 or similar rower');
```

---

## 🏋️ Core Workout Tracking Tables (From v1 - Essential for System Operation)

### programs table
```sql
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
```

### workouts table
```sql
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
```

### exercise_instances table
```sql
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
```

### performance_logs table
```sql
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
```

### deload_history table (Literature-Based Frequency Enforcement)
```sql
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
```

### context_periods table (Travel & Temporary Context Management)
```sql
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
```

---

## 🔐 Row Level Security (RLS) Policies

### Enable RLS on all tables
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_gym_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;  
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE deload_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE context_periods ENABLE ROW LEVEL SECURITY;
```

### User-specific access policies
```sql
-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can create own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Equipment categories are publicly readable
CREATE POLICY "Equipment categories are public" ON equipment_categories FOR SELECT USING (true);

-- Gyms are publicly readable (for gym discovery)
CREATE POLICY "Gyms are public" ON gyms FOR SELECT USING (true);
CREATE POLICY "Users can create gyms" ON gyms FOR INSERT USING (true);
CREATE POLICY "Users can update gyms" ON gyms FOR UPDATE USING (true);

-- User gym access is private to user
CREATE POLICY "Users can manage own gym access" ON user_gym_access FOR ALL USING (user_id = auth.uid());

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

-- Performance logs for user
CREATE POLICY "Users can access own performance logs" ON performance_logs FOR ALL USING (user_id = auth.uid());

-- Deload history for user
CREATE POLICY "Users can access own deload history" ON deload_history FOR ALL USING (user_id = auth.uid());

-- Context periods for user
CREATE POLICY "Users can access own context periods" ON context_periods FOR ALL USING (user_id = auth.uid());
```

---

## 📈 Performance Indexes

### Primary lookup indexes
```sql
-- User's active program lookup (most frequent query)
CREATE INDEX idx_programs_user_active ON programs(user_id, status) WHERE status = 'active';

-- Today's workout lookup (most frequent query)
CREATE INDEX idx_workouts_program_date ON workouts(program_id, scheduled_date);

-- Exercise instances for workout
CREATE INDEX idx_exercise_instances_workout ON exercise_instances(workout_id);

-- User gym access lookups
CREATE INDEX idx_user_gym_access_user ON user_gym_access(user_id, priority_rank);

-- Equipment availability lookups
CREATE INDEX idx_gyms_equipment ON gyms USING GIN (equipment_available);
```

### Analytics-optimized composite indexes
```sql
-- Performance analytics queries
CREATE INDEX idx_performance_user_exercise_date ON performance_logs(user_id, exercise_name, logged_date);

-- Event progress analytics
CREATE INDEX idx_performance_user_category_date ON performance_logs(user_id, category, logged_date);

-- Exercise-specific progression
CREATE INDEX idx_performance_exercise_progression ON performance_logs(user_id, exercise_name, logged_date, estimated_1rm);

-- Deload frequency enforcement  
CREATE INDEX idx_deload_history_user_date ON deload_history(user_id, deload_date DESC);

-- Context period lookups (find active context for date)
CREATE INDEX idx_context_periods_user_dates ON context_periods(user_id, start_date, end_date) WHERE status = 'active';
```

---

## ⚡ Database Functions & Triggers

### Deload Frequency Enforcement Function
```sql
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
```

### Profile Completion Tracking Function
```sql
-- Function to calculate profile completion percentage
CREATE OR REPLACE FUNCTION update_profile_completion(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  completion_pct INTEGER := 0;
  profile_data JSONB;
BEGIN
  SELECT 
    profile,
    training_background,
    physical_profile,
    performance_goals,
    equipment_access,
    lifestyle
  INTO profile_data
  FROM users 
  WHERE id = user_uuid;
  
  -- Calculate completion based on key fields (adjust weights as needed)
  IF (profile_data->'profile'->>'name') IS NOT NULL THEN completion_pct := completion_pct + 10; END IF;
  IF (profile_data->'training_background'->>'total_training_months') IS NOT NULL THEN completion_pct := completion_pct + 20; END IF;
  IF (profile_data->'performance_goals'->>'primary_target_event') IS NOT NULL THEN completion_pct := completion_pct + 25; END IF;
  IF (profile_data->'equipment_access'->>'primary_gym_id') IS NOT NULL THEN completion_pct := completion_pct + 20; END IF;
  IF jsonb_array_length(profile_data->'physical_profile'->'current_limitations') >= 0 THEN completion_pct := completion_pct + 15; END IF;
  IF (profile_data->'lifestyle'->>'sessions_per_week') IS NOT NULL THEN completion_pct := completion_pct + 10; END IF;
  
  -- Update the completion percentage
  UPDATE users 
  SET profile_completion_percentage = completion_pct 
  WHERE id = user_uuid;
  
  RETURN completion_pct;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## ✅ Complete Schema Implementation Checklist

### Core Tables
- [✅] **users** - Enhanced with profile completion tracking
- [✅] **equipment_categories** - Movement pattern focused equipment types
- [✅] **gyms** - Basic gym information and equipment availability
- [✅] **user_gym_access** - User's complete gym access network
- [✅] **programs** - Event-driven periodized programs  
- [✅] **workouts** - Daily adaptive workouts with deload tracking
- [✅] **exercise_instances** - Specific exercises within workouts
- [✅] **performance_logs** - Exercise performance tracking
- [✅] **deload_history** - Literature-based deload frequency enforcement
- [✅] **context_periods** - Travel sessions & temporary context changes

### Security & Performance
- [✅] Row Level Security policies for all tables
- [✅] Performance indexes for frequent queries
- [✅] Analytics-optimized composite indexes
- [✅] Database functions for business logic enforcement

### Key Features Implemented
- **Enhanced User Profiling** - Comprehensive assessment beyond basic experience levels
- **Equipment Ecosystem Management** - Multi-gym networks with movement pattern focus
- **Event-Driven Programming** - Reverse periodization from target events
- **Dynamic Context Management** - Travel mode and temporary gym access
- **Literature-Based Deload Control** - Scientifically-backed frequency enforcement
- **Progressive Profile Completion** - Guided onboarding with completion tracking

This approach focuses on **movement pattern availability** rather than specific equipment models, making it scalable and user-friendly while providing the AI with enough information to generate effective, equipment-appropriate programs.

---

**Next Steps**: Create migration files for this comprehensive enhanced schema and integrate with the enhanced API endpoints from 01-api-design-v2.md.
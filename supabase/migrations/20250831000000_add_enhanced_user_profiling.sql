-- Enhanced User Profiling Schema v2
-- Add equipment categories, gyms, and enhanced user profile structure

-- Equipment categories focused on movement patterns (not specific models)
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

-- Add profile completion tracking to users table
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

-- Enable RLS on new tables
ALTER TABLE equipment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_gym_access ENABLE ROW LEVEL SECURITY;

-- RLS Policies for equipment categories (public read)
CREATE POLICY "Equipment categories are publicly readable" ON equipment_categories FOR SELECT USING (true);

-- RLS Policies for gyms (users can read all, but only admins can create/update)
CREATE POLICY "Gyms are publicly readable" ON gyms FOR SELECT USING (true);

-- RLS Policies for user gym access (users can only access their own)
CREATE POLICY "Users can manage own gym access" ON user_gym_access FOR ALL USING (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX idx_equipment_categories_type ON equipment_categories(category_type);
CREATE INDEX idx_gyms_type_location ON gyms(gym_type, location);
CREATE INDEX idx_user_gym_access_user_priority ON user_gym_access(user_id, priority_rank);
CREATE INDEX idx_users_profile_completion ON users(profile_completion_percentage);

-- Seed equipment categories
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

-- Function to update profile completion percentage
CREATE OR REPLACE FUNCTION update_profile_completion_percentage()
RETURNS TRIGGER AS $$
DECLARE
  completion_count INTEGER;
  total_steps INTEGER := 6;
BEGIN
  -- Count completed profile sections
  SELECT 
    (CASE WHEN (NEW.profile_completion_status->>'basic_info')::boolean THEN 1 ELSE 0 END) +
    (CASE WHEN (NEW.profile_completion_status->>'training_background')::boolean THEN 1 ELSE 0 END) +
    (CASE WHEN (NEW.profile_completion_status->>'physical_assessment')::boolean THEN 1 ELSE 0 END) +
    (CASE WHEN (NEW.profile_completion_status->>'goals_events')::boolean THEN 1 ELSE 0 END) +
    (CASE WHEN (NEW.profile_completion_status->>'equipment_access')::boolean THEN 1 ELSE 0 END) +
    (CASE WHEN (NEW.profile_completion_status->>'lifestyle_constraints')::boolean THEN 1 ELSE 0 END)
  INTO completion_count;
  
  -- Update percentage
  NEW.profile_completion_percentage := ROUND((completion_count::float / total_steps::float) * 100);
  
  -- Set onboarding completed timestamp if 100%
  IF NEW.profile_completion_percentage = 100 AND OLD.profile_completion_percentage < 100 THEN
    NEW.onboarding_completed_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger for profile completion tracking
CREATE TRIGGER update_profile_completion_trigger
  BEFORE UPDATE OF profile_completion_status ON users
  FOR EACH ROW EXECUTE FUNCTION update_profile_completion_percentage();
-- Add missing onboarding columns to users table
-- These columns are required for the 6-step onboarding flow

-- Add location_privacy column for step 2 of onboarding
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS location_privacy JSONB DEFAULT NULL;

-- Add training_locations column for step 3 of onboarding  
ALTER TABLE users
ADD COLUMN IF NOT EXISTS training_locations JSONB DEFAULT NULL;

-- Add schedule_lifestyle column for step 5 of onboarding
ALTER TABLE users
ADD COLUMN IF NOT EXISTS schedule_lifestyle JSONB DEFAULT NULL;

-- Add comments to document the structure of each column
COMMENT ON COLUMN users.location_privacy IS 'Step 2: Home/work locations and privacy preferences - {home_location, home_location_type, work_location, work_location_type, location_permission, would_consider_commute}';

COMMENT ON COLUMN users.training_locations IS 'Step 3: Training locations and equipment - {primary_location, has_commercial_gym, has_home_gym, has_outdoor_space, gym_names, home_equipment, secondary_locations, outdoor_willing, facility_locations}';

COMMENT ON COLUMN users.schedule_lifestyle IS 'Step 5: Schedule and lifestyle factors - {sessions_per_week, preferred_time, minutes_per_session, weekend_availability, work_schedule, travel_frequency, sleep_quality, stress_level, other_activities}';
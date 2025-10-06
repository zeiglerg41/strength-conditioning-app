-- Fix Onboarding Completion Calculation
-- Remove goals_events from onboarding completion (it belongs on Programs page)
-- User should be 100% complete after finishing all onboarding screens

-- Drop existing trigger
DROP TRIGGER IF EXISTS update_profile_completion_trigger ON users;

-- Update the trigger function to exclude goals_events from onboarding
CREATE OR REPLACE FUNCTION update_profile_completion_percentage()
RETURNS TRIGGER AS $$
DECLARE
  completion_count INTEGER;
  total_steps INTEGER := 5; -- Changed from 6 to 5 (excluding goals_events)
BEGIN
  -- Count completed profile sections (EXCLUDING goals_events)
  SELECT
    (CASE WHEN (NEW.profile_completion_status->>'basic_info')::boolean THEN 1 ELSE 0 END) +
    (CASE WHEN (NEW.profile_completion_status->>'training_background')::boolean THEN 1 ELSE 0 END) +
    (CASE WHEN (NEW.profile_completion_status->>'physical_assessment')::boolean THEN 1 ELSE 0 END) +
    (CASE WHEN (NEW.profile_completion_status->>'equipment_access')::boolean THEN 1 ELSE 0 END) +
    (CASE WHEN (NEW.profile_completion_status->>'lifestyle_constraints')::boolean THEN 1 ELSE 0 END)
    -- NOTE: goals_events intentionally excluded - managed on Programs page
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

-- Recreate trigger
CREATE TRIGGER update_profile_completion_trigger
  BEFORE UPDATE OF profile_completion_status ON users
  FOR EACH ROW EXECUTE FUNCTION update_profile_completion_percentage();

-- Create helper function to auto-mark sections complete based on data presence
CREATE OR REPLACE FUNCTION auto_mark_section_complete()
RETURNS TRIGGER AS $$
DECLARE
  updated_status JSONB;
BEGIN
  updated_status := COALESCE(NEW.profile_completion_status, '{}'::jsonb);

  -- Auto-mark basic_info complete if profile has required fields
  IF (NEW.profile->>'name') IS NOT NULL
     AND (NEW.profile->>'birthday') IS NOT NULL
     AND (NEW.profile->>'gender') IS NOT NULL
     AND (NEW.profile->>'height') IS NOT NULL
     AND (NEW.profile->>'weight') IS NOT NULL THEN
    updated_status := jsonb_set(updated_status, '{basic_info}', 'true');
  END IF;

  -- Auto-mark training_background complete if data exists
  IF (NEW.training_background->>'total_training_months') IS NOT NULL
     AND (NEW.training_background->>'strength_training_months') IS NOT NULL THEN
    updated_status := jsonb_set(updated_status, '{training_background}', 'true');
  END IF;

  -- Auto-mark equipment_access complete if data exists
  IF (NEW.equipment_access->>'training_location') IS NOT NULL
     OR (NEW.training_locations->>'primary_location') IS NOT NULL THEN
    updated_status := jsonb_set(updated_status, '{equipment_access}', 'true');
  END IF;

  -- Auto-mark lifestyle_constraints complete if data exists
  IF (NEW.schedule_lifestyle->>'sessions_per_week') IS NOT NULL
     OR (NEW.lifestyle->>'sessions_per_week') IS NOT NULL THEN
    updated_status := jsonb_set(updated_status, '{lifestyle_constraints}', 'true');
  END IF;

  -- Auto-mark physical_assessment complete if injury history exists
  -- (This is optional, so we mark it complete even if empty array)
  IF (NEW.training_background->>'injury_history') IS NOT NULL THEN
    updated_status := jsonb_set(updated_status, '{physical_assessment}', 'true');
  END IF;

  -- Only update if status changed
  IF updated_status IS DISTINCT FROM NEW.profile_completion_status THEN
    NEW.profile_completion_status := updated_status;
  END IF;

  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS auto_mark_sections_trigger ON users;

-- Create trigger to auto-mark sections complete
CREATE TRIGGER auto_mark_sections_trigger
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION auto_mark_section_complete();

-- Fix existing user data (mark all sections complete for users who completed onboarding)
UPDATE users
SET profile_completion_status = jsonb_build_object(
  'basic_info',
    (profile->>'name') IS NOT NULL
    AND (profile->>'birthday') IS NOT NULL
    AND (profile->>'gender') IS NOT NULL,
  'training_background',
    (training_background->>'total_training_months') IS NOT NULL,
  'physical_assessment',
    true, -- Always mark complete (optional section)
  'equipment_access',
    (equipment_access->>'training_location') IS NOT NULL
    OR (training_locations->>'primary_location') IS NOT NULL,
  'lifestyle_constraints',
    (schedule_lifestyle->>'sessions_per_week') IS NOT NULL
    OR (lifestyle->>'sessions_per_week') IS NOT NULL,
  'goals_events',
    false -- Not part of onboarding
)
WHERE profile IS NOT NULL
  AND profile_completion_status IS NOT NULL;

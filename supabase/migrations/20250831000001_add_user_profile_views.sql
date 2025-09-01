-- User Profile Views and Helper Functions
-- Convenient views for accessing user profile data

-- View for user's complete gym access with equipment details
CREATE OR REPLACE VIEW user_gym_equipment AS
SELECT 
  uga.user_id,
  uga.gym_id,
  g.name as gym_name,
  g.gym_type,
  g.location,
  uga.access_type,
  uga.frequency,
  uga.priority_rank,
  g.equipment_available,
  g.notes as gym_notes
FROM user_gym_access uga
JOIN gyms g ON uga.gym_id = g.id
ORDER BY uga.user_id, uga.priority_rank;

-- View for equipment categories by type
CREATE OR REPLACE VIEW equipment_by_category AS
SELECT 
  category_type,
  json_agg(
    json_build_object(
      'id', id,
      'name', name,
      'movement_patterns', movement_patterns,
      'description', description
    ) ORDER BY name
  ) as equipment_items
FROM equipment_categories
GROUP BY category_type;

-- Function to get user's available movement patterns across all gyms
CREATE OR REPLACE FUNCTION get_user_available_movements(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  available_movements JSONB := '[]'::jsonb;
  gym_record RECORD;
  equipment_record RECORD;
  movement TEXT;
BEGIN
  -- Loop through user's gym access
  FOR gym_record IN 
    SELECT DISTINCT g.equipment_available 
    FROM user_gym_access uga
    JOIN gyms g ON uga.gym_id = g.id
    WHERE uga.user_id = p_user_id
  LOOP
    -- Loop through equipment available at this gym
    FOR equipment_record IN
      SELECT ec.movement_patterns
      FROM equipment_categories ec
      WHERE ec.id::text = ANY(
        SELECT jsonb_object_keys(gym_record.equipment_available)
      )
      AND (gym_record.equipment_available->ec.id::text)::boolean = true
    LOOP
      -- Add each movement pattern to available movements
      FOR movement IN
        SELECT jsonb_array_elements_text(equipment_record.movement_patterns)
      LOOP
        IF NOT available_movements ? movement THEN
          available_movements := available_movements || to_jsonb(movement);
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;
  
  RETURN available_movements;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user profile is complete enough for program generation
CREATE OR REPLACE FUNCTION is_profile_ready_for_programming(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_record RECORD;
  required_completion INTEGER := 83; -- At least 5/6 sections (83%)
BEGIN
  SELECT 
    profile_completion_percentage,
    profile_completion_status
  INTO user_record
  FROM users 
  WHERE id = p_user_id;
  
  IF user_record IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Must have at least training_background, goals_events, and equipment_access
  RETURN (
    user_record.profile_completion_percentage >= required_completion AND
    (user_record.profile_completion_status->>'training_background')::boolean = true AND
    (user_record.profile_completion_status->>'goals_events')::boolean = true AND
    (user_record.profile_completion_status->>'equipment_access')::boolean = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's next recommended onboarding step
CREATE OR REPLACE FUNCTION get_next_onboarding_step(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  completion_status JSONB;
BEGIN
  SELECT profile_completion_status 
  INTO completion_status
  FROM users 
  WHERE id = p_user_id;
  
  IF completion_status IS NULL THEN
    RETURN 'basic_info';
  END IF;
  
  -- Return first incomplete step in order of importance
  IF NOT (completion_status->>'basic_info')::boolean THEN
    RETURN 'basic_info';
  ELSIF NOT (completion_status->>'training_background')::boolean THEN
    RETURN 'training_background';
  ELSIF NOT (completion_status->>'physical_assessment')::boolean THEN
    RETURN 'physical_assessment';  
  ELSIF NOT (completion_status->>'goals_events')::boolean THEN
    RETURN 'goals_events';
  ELSIF NOT (completion_status->>'equipment_access')::boolean THEN
    RETURN 'equipment_access';
  ELSIF NOT (completion_status->>'lifestyle_constraints')::boolean THEN
    RETURN 'lifestyle_constraints';
  ELSE
    RETURN 'completed';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies for views and functions
-- Views inherit RLS from underlying tables
-- Functions are SECURITY DEFINER so they can access data within RLS context

-- Grant usage to authenticated users
GRANT SELECT ON user_gym_equipment TO authenticated;
GRANT SELECT ON equipment_by_category TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_available_movements(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_profile_ready_for_programming(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_onboarding_step(UUID) TO authenticated;
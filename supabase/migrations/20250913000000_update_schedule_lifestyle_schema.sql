-- Update schedule_lifestyle column to support additional work schedule details
-- This migration adds support for work_schedule_details field for Irregular/Flexible schedules

-- Update the comment to reflect the new structure
COMMENT ON COLUMN users.schedule_lifestyle IS 'Step 5: Schedule and lifestyle factors - {sessions_per_week, preferred_time, minutes_per_session, weekend_availability, work_schedule, work_schedule_details, travel_frequency, sleep_quality, other_activities}';

-- Note: Since schedule_lifestyle is already a JSONB column, it can accommodate the new work_schedule_details field
-- without any schema changes. The application code will handle the new field.
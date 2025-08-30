// Shared types for API contracts
// Based on 01-api-design.md specifications

export interface UserProfile {
  id: string;
  email: string;
  profile: {
    name: string;
    date_of_birth: string;
    gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
    height: number; // cm
    weight: number; // kg
    address: {
      city: string;
      state: string;
      country: string;
      timezone: string;
    };
  };
  lifestyle: {
    employment_status: 'full_time' | 'part_time' | 'student' | 'unemployed' | 'retired' | 'self_employed';
    work_schedule: 'standard' | 'shift' | 'irregular' | 'remote';
    commute_distance: number; // km one way
    commute_method: 'car' | 'public_transport' | 'bike' | 'walk' | 'work_from_home';
    commute_duration_minutes: number;
    travel_for_work: {
      frequency: 'never' | 'monthly' | 'weekly' | 'daily';
      typical_duration_days: number;
      access_to_gym_while_traveling: 'always' | 'sometimes' | 'never';
    };
    daily_activity_level: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';
    sleep_schedule: {
      typical_bedtime: string; // HH:MM
      typical_wake_time: string; // HH:MM
      sleep_quality: 'poor' | 'fair' | 'good' | 'excellent';
    };
  };
  training_background: {
    training_age_years: number;
    experience_level: 'beginner' | 'novice' | 'intermediate' | 'advanced' | 'expert';
    previous_sports: string[];
    current_activity_types: string[];
    injuries: Array<{
      type: string;
      affected_areas: string[];
      severity: 'minor' | 'moderate' | 'major' | 'chronic';
      date_occurred: string;
      current_status: 'healed' | 'healing' | 'ongoing' | 'needs_modification';
    }>;
  };
  equipment_access: {
    primary_location: 'home' | 'commercial_gym' | 'university_gym' | 'corporate_gym' | 'outdoor';
    available_equipment: {
      barbells: boolean;
      dumbbells: boolean;
      kettlebells: boolean;
      resistance_bands: boolean;
      pull_up_bar: boolean;
      cardio_equipment: string[];
      specialized: string[];
    };
    backup_locations: Array<{
      type: 'home' | 'gym' | 'outdoor' | 'bodyweight';
      equipment: string[];
      access_frequency: 'daily' | 'weekly' | 'occasional' | 'emergency_only';
    }>;
  };
  performance_goals: {
    primary_focus: 'strength' | 'power' | 'endurance' | 'general_fitness' | 'sport_specific';
    target_events: Array<{
      name: string;
      date: string;
      type: 'powerlifting' | 'marathon' | 'triathlon' | 'military_test' | 'sport_season' | 'general';
      specific_requirements: string;
      priority: 'primary' | 'secondary' | 'aspirational';
    }>;
    generated_challenges: Array<{
      name: string;
      type: 'strength' | 'endurance' | 'power' | 'mobility';
      target_date: string;
      description: string;
    }>;
    performance_metrics: {
      track_strength: boolean;
      track_endurance: boolean;
      track_power: boolean;
      track_mobility: boolean;
      preferred_tests: string[];
    };
  };
  constraints: {
    weekly_training_days: number;
    preferred_session_duration_minutes: number;
    max_session_duration_minutes: number;
    preferred_training_times: string[];
    training_day_preferences: string[];
    absolute_rest_days: string[];
    fatigue_sensitivity: 'low' | 'moderate' | 'high';
    recovery_needs: 'fast' | 'average' | 'slow';
  };
}

export interface TargetEvent {
  name: string;
  date: string;
  type: 'strength_test' | 'endurance_event' | 'sport_season' | 'ai_generated';
  specific_requirements: string;
  generated_by_ai: boolean;
}

export interface Program {
  id: string;
  user_id: string;
  name: string;
  target_event: TargetEvent;
  program_structure: {
    total_duration_weeks: number;
    periodization_model: 'linear' | 'undulating' | 'conjugate' | 'block';
    phases: Array<{
      name: 'base' | 'build' | 'peak' | 'recovery' | 'test';
      start_date: string;
      end_date: string;
      duration_weeks: number;
      focus: string;
      intensity_emphasis: 'volume' | 'intensity' | 'maintenance';
      deload_frequency: number;
    }>;
  };
  current_context: {
    travel_mode: boolean;
    available_equipment: string[];
    location_type: 'home' | 'commercial_gym' | 'hotel' | 'outdoor' | 'bodyweight';
    last_updated: string;
  };
  performance_tracking: {
    baseline_tests: Array<{
      exercise: string;
      result: number;
      date: string;
      unit: 'kg' | 'km' | 'time' | 'reps';
    }>;
    progress_checkpoints: Array<{
      week: number;
      scheduled_tests: string[];
      status: 'upcoming' | 'completed' | 'skipped';
    }>;
  };
  status: 'active' | 'completed' | 'paused' | 'regenerating';
}

export interface Workout {
  id: string;
  program_id: string;
  scheduled_date: string;
  name: string;
  phase: string;
  week_in_phase: number;
  session_type: 'strength' | 'endurance' | 'power' | 'recovery' | 'test';
  original_prescription: {
    exercises: Array<{
      exercise_id: string;
      exercise_name: string;
      sets: number;
      reps: string;
      weight: number | string;
      rpe_target: number | null;
      rest_seconds: number;
      notes: string;
    }>;
    estimated_duration_minutes: number;
  };
  current_prescription: {
    exercises: Array<{
      exercise_id: string;
      exercise_name: string;
      sets: number;
      reps: string;
      weight: number | string;
      rpe_target: number | null;
      rest_seconds: number;
      notes: string;
    }>;
    modifications_applied: Array<{
      type: 'deload_volume' | 'deload_intensity' | 'equipment_substitute' | 'travel_mode';
      reason: 'poor_sleep' | 'high_stress' | 'travel' | 'equipment_unavailable';
      changes: string;
      applied_at: string;
    }>;
  };
  context: {
    location_type: 'home' | 'commercial_gym' | 'hotel' | 'outdoor' | 'bodyweight';
    available_equipment: string[];
    travel_mode: boolean;
    user_readiness: {
      sleep_quality: 'poor' | 'fair' | 'good' | 'excellent' | null;
      stress_level: 'low' | 'moderate' | 'high' | null;
      soreness: 'none' | 'mild' | 'moderate' | 'high' | null;
      motivation: 'low' | 'moderate' | 'high' | null;
    };
  };
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'modified';
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
    suggestions?: string[];
    retry_after?: number;
  };
  meta?: {
    timestamp: string;
    request_id: string;
    version: string;
  };
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// Context-aware types
export interface ContextPeriod {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  context_type: 'travel' | 'temporary_gym' | 'injury_modification' | 'schedule_change';
  location_type: 'hotel' | 'visiting_gym' | 'home_away' | 'outdoor' | 'bodyweight_only';
  location_details: Record<string, any>;
  equipment_override: string[];
  schedule_constraints: Record<string, any>;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
}

// Deload types
export interface DeloadOption {
  type: 'volume_deload' | 'intensity_deload';
  description: string;
  available: boolean;
  modifications: Array<{
    exercise_id: string;
    original_sets?: number;
    modified_sets?: number;
    original_weight?: number;
    modified_weight?: number;
  }>;
}

export interface DeloadEligibility {
  can_deload: boolean;
  days_since_last_deload: number;
  min_days_between_deloads: number;
  deloads_in_last_6_training_days: number;
  max_deloads_per_6_training_days: number;
  reason_blocked: string | null;
  educational_message: {
    title: string | null;
    message: string | null;
    recommendations: string[];
  };
}
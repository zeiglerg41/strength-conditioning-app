// Enhanced User Profile Types for V2 API
// Based on 01-api-design-v2.md and 02-database-schema-v2.md

export interface UserProfile {
  id: string;
  email: string;
  profile: BasicProfile;
  training_background: TrainingBackground;
  physical_profile: PhysicalProfile;
  performance_goals: PerformanceGoals;
  equipment_access: EquipmentAccess;
  lifestyle: LifestyleConstraints;
  constraints: TrainingConstraints;
  profile_completion_status: ProfileCompletionStatus;
  profile_completion_percentage: number;
  onboarding_completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BasicProfile {
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
}

export interface TrainingBackground {
  total_training_months: number;
  strength_training_months: number;
  consistent_training_periods: Array<{
    duration_months: number;
    program_type: string;
    year_range: string;
  }>;
  
  movement_competencies: {
    squat_pattern: MovementCompetency;
    deadlift_pattern: MovementCompetency;
    press_patterns: {
      overhead_press: MovementCompetency;
      bench_press: MovementCompetency;
    };
    pull_patterns: {
      pullups_chinups: MovementCompetency;
      rows: MovementCompetency;
    };
    hinge_patterns: {
      hip_hinge: MovementCompetency;
      single_leg: MovementCompetency;
    };
  };
  
  periodization_experience: boolean;
  previous_programs_used: string[];
  longest_consistent_program_months: number;
  program_adherence_typical: 'high' | 'moderate' | 'low';
}

export interface MovementCompetency {
  experience_level: 'untrained' | 'novice' | 'intermediate' | 'advanced';
  variations_performed: string[];
  current_working_weight_kg?: number;
  form_confidence: 'low' | 'moderate' | 'high';
  last_assessed?: string;
  max_consecutive_reps?: number; // for bodyweight movements
}

export interface PhysicalProfile {
  current_limitations: Array<{
    body_region: string;
    condition: string;
    severity: 'minor' | 'moderate' | 'severe';
    pain_level: number; // 0-10 scale
    medical_clearance: boolean;
    movement_restrictions: string[];
    pain_triggers: string[];
    treatment_status: 'none' | 'physical_therapy' | 'medical' | 'surgical';
    notes?: string;
  }>;
  
  absolute_exercise_exclusions: Array<{
    exercise_name: string;
    exclusion_type: 'movement_pattern' | 'specific_exercise' | 'equipment_type';
    reason: 'injury_history' | 'current_pain' | 'medical_restriction' | 'personal_preference';
    alternative_preferred?: string;
    severity: 'absolute' | 'conditional';
    notes?: string;
    created_at: string;
  }>;
  
  movement_modifications: Array<{
    movement_pattern: string;
    modification_type: 'range_of_motion' | 'load_limitation' | 'tempo_restriction' | 'assistance_required';
    details: string;
    applies_to_exercises: string[];
  }>;
  
  injury_history: Array<{
    injury_type: string;
    body_region: string;
    year_occurred: number;
    surgery_required: boolean;
    surgery_type?: string;
    full_recovery: boolean;
    ongoing_considerations?: string;
    return_to_activity_timeline?: string;
    lessons_learned?: string;
  }>;
}

export interface PerformanceGoals {
  primary_target_event?: {
    event_name: string;
    target_date: string;
    event_type: 'powerlifting_meet' | 'athletic_competition' | 'military_test' | 'endurance_race' | 'strength_goal' | 'general_fitness';
    importance_level: 'high' | 'moderate';
    specific_requirements: {
      competition_lifts?: Array<{
        lift_name: string;
        current_max_kg?: number;
        target_max_kg?: number;
        priority: 'high' | 'medium' | 'low';
      }>;
      weight_class_target?: number;
      performance_standards?: Record<string, number>;
      event_specific_notes?: string;
    };
    preparation_status: 'just_started' | 'early_prep' | 'mid_prep' | 'peak_phase' | 'maintenance';
  };
  
  secondary_events: Array<{
    event_name: string;
    target_date: string;
    event_type: string;
    priority: 'high' | 'medium' | 'low';
    conflicts_with_primary: boolean;
    specific_requirements: Record<string, any>;
  }>;
  
  continuous_goals: Array<{
    goal_type: 'strength_gain' | 'muscle_gain' | 'fat_loss' | 'power_development' | 'endurance' | 'mobility' | 'injury_prevention';
    target_metrics: Record<string, number>;
    timeline: 'ongoing' | 'short_term' | 'long_term';
    priority: 'high' | 'medium' | 'low';
  }>;
  
  training_motivations: string[];
  preferred_training_style: 'powerlifting' | 'bodybuilding' | 'general_strength' | 'athletic_performance' | 'endurance' | 'functional_fitness';
  goal_flexibility: 'rigid' | 'moderate' | 'flexible';
}

export interface EquipmentAccess {
  primary_gym_id?: string;
  gym_access_network: Array<{
    gym_id: string;
    gym_name: string; // denormalized for display
    access_type: 'primary' | 'secondary' | 'travel' | 'temporary';
    frequency: 'daily' | 'weekly' | 'occasional';
    priority_rank: number;
    equipment_quality_notes?: string;
    travel_time_minutes?: number;
    cost: 'free' | 'membership' | 'day_pass';
    access_restrictions?: string;
  }>;
  
  home_gym: {
    has_home_gym: boolean;
    space_type?: 'garage' | 'basement' | 'spare_room' | 'outdoor' | 'apartment';
    equipment_owned?: Array<{
      equipment_category_id: string;
      equipment_name: string;
      specifications?: string;
      condition: 'excellent' | 'good' | 'fair' | 'poor';
      usage_frequency: 'daily' | 'weekly' | 'occasional' | 'backup_only';
    }>;
    space_limitations?: string[];
    expansion_planned: boolean;
    preferred_for?: string[];
  };
  
  travel_considerations: {
    travels_frequently: boolean;
    typical_travel_duration_days?: number;
    travel_frequency_per_month?: number;
    hotel_gym_experience: 'good' | 'poor' | 'varies';
    bodyweight_preference: 'comfortable' | 'acceptable' | 'avoid';
    day_pass_budget?: number;
    preferred_backup_exercises?: string[];
  };
}

export interface LifestyleConstraints {
  employment_status: 'full_time' | 'part_time' | 'student' | 'unemployed' | 'retired' | 'self_employed';
  work_schedule_type: 'standard' | 'shift_work' | 'irregular' | 'remote' | 'flexible';
  work_stress_level: 'low' | 'moderate' | 'high' | 'very_high';
  commute_time_minutes: number;
  commute_method: 'car' | 'public_transport' | 'bike' | 'walk' | 'work_from_home';
  
  preferred_training_days: string[];
  sessions_per_week: number;
  session_duration_preference: number; // minutes
  max_session_duration: number; // absolute limit
  time_of_day_preference: 'early_morning' | 'morning' | 'lunch' | 'afternoon' | 'evening' | 'late_night' | 'flexible';
  weekend_availability: 'full' | 'limited' | 'unavailable';
  
  family_obligations: {
    level: 'minimal' | 'moderate' | 'significant' | 'overwhelming';
    children_ages?: number[];
    caregiver_responsibilities: 'none' | 'minor' | 'moderate' | 'major';
    partner_support: 'very_supportive' | 'supportive' | 'neutral' | 'unsupportive';
  };
  
  sleep_patterns: {
    typical_bedtime: string;
    typical_wake_time: string;
    sleep_quality: 'poor' | 'fair' | 'good' | 'excellent';
    sleep_duration_hours: number;
    sleep_consistency: 'very_consistent' | 'consistent' | 'variable' | 'chaotic';
  };
  
  stress_management: {
    overall_stress_level: 'low' | 'moderate' | 'high' | 'very_high';
    stress_sources: string[];
    coping_strategies: string[];
    stress_impact_on_training: 'minimal' | 'moderate' | 'significant' | 'severe';
  };
  
  nutrition_habits: {
    consistency: 'excellent' | 'good' | 'fair' | 'poor';
    cooking_frequency: 'daily' | 'weekly' | 'occasionally' | 'never';
    dietary_restrictions: string[];
    supplement_use: 'regular' | 'occasional' | 'none';
    hydration_habits: 'excellent' | 'good' | 'fair' | 'poor';
  };
}

export interface TrainingConstraints {
  weekly_training_days: number;
  absolute_rest_days: string[];
  blackout_dates: Array<{
    start_date: string;
    end_date: string;
    reason: 'vacation' | 'work_travel' | 'family' | 'medical';
    training_impact: 'none' | 'reduced' | 'suspended';
  }>;
  
  fatigue_sensitivity: 'low' | 'moderate' | 'high';
  recovery_speed: 'fast' | 'average' | 'slow';
  injury_risk_tolerance: 'low' | 'moderate' | 'high';
  
  exercise_preferences: {
    strongly_prefer: string[];
    strongly_avoid: string[];
    variety_preference: 'high' | 'moderate' | 'low';
  };
  
  training_environment_preferences: {
    music: 'required' | 'preferred' | 'indifferent' | 'distracting';
    crowd_tolerance: 'prefer_busy' | 'indifferent' | 'prefer_quiet';
    cleanliness_importance: 'critical' | 'important' | 'moderate' | 'low';
  };
}

export interface ProfileCompletionStatus {
  basic_info: boolean;
  training_background: boolean;
  physical_assessment: boolean;
  goals_events: boolean;
  equipment_access: boolean;
  lifestyle_constraints: boolean;
}

export interface OnboardingStep {
  step: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  fields: string[];
  estimated_minutes: number;
}

// API Response Types
export interface ProfileCompletionResponse {
  completion_percentage: number;
  completed_sections: string[];
  next_steps: OnboardingStep[];
  critical_missing: string[];
}

export interface ProfileUpdateRequest {
  section: 'profile' | 'training_background' | 'physical_profile' | 'performance_goals' | 'equipment_access' | 'lifestyle' | 'constraints';
  data: Partial<UserProfile[keyof UserProfile]>;
}
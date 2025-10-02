// Core application types

export interface User {
  id: string;
  email?: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  equipment_access: EquipmentAccess;
  performance_goals: PerformanceGoals;
  training_background: TrainingBackground;
  constraints: TrainingConstraints;
  created_at: string;
  updated_at: string;
}

export interface EquipmentAccess {
  primary_location: 'home' | 'commercial_gym' | 'hotel' | 'outdoor';
  available_equipment: {
    barbells: boolean;
    dumbbells: boolean;
    kettlebells: boolean;
    resistance_bands: boolean;
    pull_up_bar: boolean;
    cardio_equipment: string[];
    specialized: string[];
  };
}

export interface PerformanceGoals {
  primary_focus: 'strength' | 'power' | 'endurance' | 'mobility' | 'general';
  specific_goals: string[];
  target_events?: TargetEvent[];
}

export interface TargetEvent {
  name: string;
  date: string;
  type: string;
  importance: 'primary' | 'secondary' | 'practice';
}

export interface TrainingBackground {
  experience_level: 'beginner' | 'novice' | 'intermediate' | 'advanced' | 'expert';
  years_training: number;
  current_program_satisfaction: number;
  injuries: Injury[];
}

export interface Injury {
  type: string;
  affected_areas: string[];
  severity: 'minor' | 'moderate' | 'major';
  current_status: 'recovered' | 'ongoing' | 'needs_modification';
  date_occurred?: string;
}

export interface TrainingConstraints {
  max_session_duration_minutes: number;
  sessions_per_week: number;
  preferred_times: string[];
  travel_frequency: 'never' | 'monthly' | 'weekly' | 'daily';
  stress_level: number;
}

export interface Program {
  id: string;
  user_id: string;
  name: string;
  target_event?: TargetEvent;
  program_structure: ProgramStructure;
  status: 'draft' | 'active' | 'paused' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface ProgramStructure {
  total_duration_weeks: number;
  periodization_model: 'linear' | 'undulating' | 'conjugate' | 'block';
  phases: ProgramPhase[];
  deload_frequency: number;
}

export interface ProgramPhase {
  name: string;
  start_date: string;
  end_date: string;
  duration_weeks: number;
  focus: string;
  intensity_emphasis: 'volume' | 'intensity' | 'maintenance';
  deload_frequency: number;
}

export interface Workout {
  id: string;
  program_id: string;
  user_id: string;
  scheduled_date: string;
  session_type: string;
  exercises: Exercise[];
  status: 'scheduled' | 'in_progress' | 'completed' | 'skipped';
  session_rpe?: number;
  completion_rate?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Exercise {
  id: string;
  name: string;
  category: string;
  movement_pattern: string;
  primary_muscles: string[];
  secondary_muscles: string[];
  equipment_required: string[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  instructions: string;
  progressions: string[];
  regressions: string[];
  coaching_cues: string[];
  safety_notes: string[];
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Onboarding: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Programs: undefined;
  Workouts: undefined;
  Analytics: undefined;
  Profile: undefined;
};

export type OnboardingStackParamList = {
  BasicInfo: { editMode?: boolean } | undefined;
  LocationPrivacy: { editMode?: boolean } | undefined;
  TrainingLocations: { editMode?: boolean } | undefined;
  TrainingBackground: { editMode?: boolean } | undefined;
  ScheduleLifestyle: { editMode?: boolean } | undefined;
  Review: { editMode?: boolean } | undefined;
};

export type MainStackParamList = {
  MainTabs: undefined;
  OnboardingStack: {
    screen: keyof OnboardingStackParamList;
    params?: { editMode?: boolean };
  } | undefined;
  Auth: undefined;
};

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}
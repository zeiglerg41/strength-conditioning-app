import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { useAuthStore } from './authStore';

interface OnboardingData {
  // Basic Info
  profile: {
    name?: string;
    birthday?: string;
    age?: number;
    gender?: string;
    height?: number;
    weight?: number;
    units_preference?: 'metric' | 'imperial';
    location?: string;
  };
  
  // Location & Privacy (Step 2)
  location_privacy?: {
    home_location?: string;
    home_location_type?: 'exact' | 'general'; // exact address or 0.25mi radius
    work_location?: string;
    work_location_type?: 'exact' | 'general' | 'remote';
    location_permission?: boolean;
    would_consider_commute?: 'yes' | 'no' | 'maybe';
  };
  
  // Training Locations & Equipment (Step 3)
  training_locations?: {
    primary_location?: 'home' | 'commercial_gym' | 'outdoor' | 'multiple';
    has_commercial_gym?: boolean;
    has_home_gym?: boolean;
    has_outdoor_space?: boolean;
    gym_names?: string[];
    home_equipment?: Record<string, boolean>;
    secondary_locations?: string[];
    outdoor_willing?: boolean;
    facility_locations?: {
      park?: string;
      track?: string;
      pool?: string;
    };
  };
  
  // Schedule & Lifestyle (Step 5)
  schedule_lifestyle?: {
    sessions_per_week?: number;
    preferred_time?: string;
    minutes_per_session?: number;
    weekend_availability?: 'yes' | 'no';
    work_schedule?: '9-5' | 'second_shift' | 'third_shift' | 'irregular' | 'flexible';
    work_schedule_details?: string; // For irregular/flexible schedules
    travel_frequency?: 'never' | 'sometimes' | 'frequently';
    sleep_quality?: 'poor' | 'fair' | 'good' | 'excellent';
    other_activities?: string[];
  };
  
  // Keeping old lifestyle for backwards compatibility
  lifestyle: {
    sessions_per_week?: number;
    stress_level?: 'low' | 'moderate' | 'high';
    work_schedule?: 'standard' | 'shift' | 'flexible' | 'irregular';
    sleep_quality?: 'poor' | 'fair' | 'good' | 'excellent';
  };
  
  // Training Background
  training_background: {
    total_training_months?: number;
    cardio_training_months?: number;
    strength_training_months?: number;
    injury_history?: string[];
    movement_competencies?: Record<string, any>;
  };
  
  // Performance Goals
  performance_goals: {
    primary_goal?: 'strength' | 'hypertrophy' | 'endurance' | 'athleticism';
    specific_goals?: string[];
    target_metrics?: Record<string, any>;
  };
  
  // Equipment Access
  equipment_access: {
    training_location?: 'home' | 'commercial_gym' | 'garage_gym';
    equipment_available?: string[];
    notes?: string;
  };
  
  // Constraints
  constraints: {
    injuries?: string[];
    time_availability?: {
      session_duration_minutes?: number;
      weekly_sessions?: number;
    };
    limitations?: string[];
  };
}

interface OnboardingState {
  data: OnboardingData;
  currentStep: number;
  loading: boolean;
  error: string | null;
  isProfileComplete: boolean;
  
  // Actions
  updateProfile: (profile: OnboardingData['profile']) => void;
  updateLocationPrivacy: (location: OnboardingData['location_privacy']) => void;
  updateTrainingLocations: (locations: OnboardingData['training_locations']) => void;
  updateScheduleLifestyle: (schedule: OnboardingData['schedule_lifestyle']) => void;
  updateLifestyle: (lifestyle: OnboardingData['lifestyle']) => void;
  updateTrainingBackground: (background: OnboardingData['training_background']) => void;
  updateGoals: (goals: OnboardingData['performance_goals']) => void;
  updateEquipment: (equipment: OnboardingData['equipment_access']) => void;
  updateConstraints: (constraints: OnboardingData['constraints']) => void;
  setCurrentStep: (step: number) => void;
  submitOnboarding: () => Promise<void>;
  loadOnboardingProgress: () => Promise<void>;
  checkProfileCompletion: () => number;
  saveToDatabase: (section: string, data: any) => Promise<void>;
  reset: () => void;
}

const initialData: OnboardingData = {
  profile: {},
  location_privacy: undefined,
  training_locations: undefined,
  schedule_lifestyle: undefined,
  lifestyle: {}, // keeping for backwards compatibility
  training_background: {},
  performance_goals: {},
  equipment_access: {},
  constraints: {},
};

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  data: initialData,
  currentStep: 1,
  loading: false,
  error: null,
  isProfileComplete: false,
  
  updateProfile: async (profile) => {
    set(state => ({ 
      data: { ...state.data, profile: { ...state.data.profile, ...profile } }
    }));
    // Auto-save to database
    await get().saveToDatabase('profile', profile);
  },
    
  updateLocationPrivacy: async (location) => {
    set(state => ({ 
      data: { ...state.data, location_privacy: location }
    }));
    // Auto-save to database
    await get().saveToDatabase('location_privacy', location);
  },
    
  updateTrainingLocations: async (locations) => {
    set(state => ({
      data: { ...state.data, training_locations: locations }
    }));
    // Auto-save to database
    await get().saveToDatabase('training_locations', locations);
  },
    
  updateScheduleLifestyle: async (schedule) => {
    set(state => ({
      data: { ...state.data, schedule_lifestyle: schedule }
    }));
    // Auto-save to database
    await get().saveToDatabase('schedule_lifestyle', schedule);
  },

  updateLifestyle: async (lifestyle) => {
    set(state => ({
      data: { ...state.data, lifestyle: { ...state.data.lifestyle, ...lifestyle } }
    }));
    // Auto-save to database
    await get().saveToDatabase('lifestyle', lifestyle);
  },
    
  updateTrainingBackground: async (background) => {
    set(state => ({
      data: { ...state.data, training_background: { ...state.data.training_background, ...background } }
    }));
    // Auto-save to database
    await get().saveToDatabase('training_background', background);
  },
    
  updateGoals: (goals) =>
    set(state => ({ 
      data: { ...state.data, performance_goals: { ...state.data.performance_goals, ...goals } }
    })),
    
  updateEquipment: (equipment) =>
    set(state => ({ 
      data: { ...state.data, equipment_access: { ...state.data.equipment_access, ...equipment } }
    })),
    
  updateConstraints: (constraints) =>
    set(state => ({ 
      data: { ...state.data, constraints: { ...state.data.constraints, ...constraints } }
    })),
    
  setCurrentStep: (step) => set({ currentStep: step }),
  
  submitOnboarding: async () => {
    const { data } = get();
    const { user } = useAuthStore.getState();
    
    if (!user) {
      throw new Error('No user found');
    }
    
    set({ loading: true, error: null });
    
    try {
      // Get the user's auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session found');
      
      const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const token = session.access_token;
      
      // Submit each section to the Edge Function
      const sections = [
        { section: 'profile', data: data.profile },
        { section: 'location_privacy', data: data.location_privacy },
        { section: 'training_locations', data: data.training_locations },
        { section: 'training_background', data: data.training_background },
        { section: 'schedule_lifestyle', data: data.schedule_lifestyle },
        { section: 'lifestyle', data: data.lifestyle }, // Keep for backwards compatibility
        { section: 'performance_goals', data: data.performance_goals },
        { section: 'equipment_access', data: data.equipment_access },
        { section: 'constraints', data: data.constraints },
      ];
      
      for (const sectionData of sections) {
        if (!sectionData.data || Object.keys(sectionData.data).length === 0) {
          console.log(`Skipping empty section: ${sectionData.section}`);
          continue;
        }

        console.log(`Submitting section: ${sectionData.section}`, sectionData.data);

        const response = await fetch(`${baseUrl}/functions/v1/users/profile`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(sectionData),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error(`Failed to submit ${sectionData.section}:`, error);
          throw new Error(error.message || 'Failed to update profile section');
        } else {
          console.log(`✅ Successfully submitted ${sectionData.section}`);
        }
      }
      
      // Update auth store to reflect onboarding complete
      useAuthStore.getState().setNeedsOnboarding(false);
      
      // Refresh user profile
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
        
      if (profile) {
        useAuthStore.getState().setUserProfile(profile);
      }
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to complete onboarding';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
  
  loadOnboardingProgress: async () => {
    console.log('=== Loading Onboarding Progress ===');
    const { user } = useAuthStore.getState();
    if (!user) {
      console.log('No user found, skipping load');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No session found, skipping load');
        return;
      }

      const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const token = session.access_token;

      console.log('Fetching saved profile from:', `${baseUrl}/functions/v1/users/profile`);

      const response = await fetch(`${baseUrl}/functions/v1/users/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const profile = await response.json();
        console.log('✅ Loaded profile from database:', profile);

        // Load saved data into store
        const savedData: OnboardingData = {
          profile: profile.profile || {},
          location_privacy: profile.location_privacy,
          training_locations: profile.training_locations,
          schedule_lifestyle: profile.schedule_lifestyle,
          lifestyle: profile.lifestyle || {},
          training_background: profile.training_background || {},
          performance_goals: profile.performance_goals || {},
          equipment_access: profile.equipment_access || {},
          constraints: profile.constraints || {},
        };

        // Determine current step based on what's completed
        const step = get().checkProfileCompletion();
        console.log('Current step determined:', step);

        set({
          data: savedData,
          currentStep: step,
          isProfileComplete: step > 6
        });

        console.log('✅ Onboarding data loaded successfully');
      } else {
        console.error('Failed to load profile, status:', response.status);
      }
    } catch (error) {
      console.error('❌ Failed to load onboarding progress:', error);
    }
  },
  
  saveToDatabase: async (section: string, data: any) => {
    try {
      console.log(`=== Saving ${section} to database ===`);
      console.log('Data to save:', data);

      const { user } = useAuthStore.getState();
      if (!user) {
        console.error('No user found, skipping save');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No session found, skipping save');
        return;
      }

      const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const token = session.access_token;

      console.log('Making request to:', `${baseUrl}/functions/v1/users/profile`);

      const response = await fetch(`${baseUrl}/functions/v1/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ section, data }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to save section: ${section}`);
        console.error('Response status:', response.status);
        console.error('Error details:', errorText);
        throw new Error(`Failed to save ${section}: ${errorText}`);
      } else {
        console.log(`✅ Successfully saved ${section} to database`);
      }
    } catch (error) {
      console.error(`❌ Error saving ${section} to database:`, error);
      // Show user-friendly error but don't block onboarding
      console.error('Full error:', JSON.stringify(error, null, 2));
    }
  },

  checkProfileCompletion: () => {
    const { data } = get();
    
    // Check completion in order of NEW 6-step onboarding
    // Step 1: Basic Info
    if (!data.profile.name || !data.profile.birthday || !data.profile.gender || 
        !data.profile.height || !data.profile.weight) {
      return 1;
    }
    
    // Step 2: Location Privacy
    if (!data.location_privacy?.home_location) {
      return 2;
    }
    
    // Step 3: Training Locations
    if (!data.training_locations?.primary_location) {
      return 3;
    }
    
    // Step 4: Training Background
    if (data.training_background.total_training_months === undefined || 
        data.training_background.strength_training_months === undefined) {
      return 4;
    }
    
    // Step 5: Schedule & Lifestyle
    if (!data.schedule_lifestyle?.sessions_per_week || 
        !data.schedule_lifestyle?.preferred_time) {
      return 5;
    }
    
    // Step 6: Review (if we're here, all data is complete)
    return 6;
  },
  
  reset: () => set({ 
    data: initialData, 
    currentStep: 1, 
    loading: false, 
    error: null,
    isProfileComplete: false
  }),
}));
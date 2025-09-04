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
    location?: string;
  };
  
  // Lifestyle
  lifestyle: {
    sessions_per_week?: number;
    stress_level?: 'low' | 'moderate' | 'high';
    work_schedule?: 'standard' | 'shift' | 'flexible' | 'irregular';
    sleep_quality?: 'poor' | 'fair' | 'good' | 'excellent';
  };
  
  // Training Background
  training_background: {
    total_training_months?: number;
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
  
  // Actions
  updateProfile: (profile: OnboardingData['profile']) => void;
  updateLifestyle: (lifestyle: OnboardingData['lifestyle']) => void;
  updateTrainingBackground: (background: OnboardingData['training_background']) => void;
  updateGoals: (goals: OnboardingData['performance_goals']) => void;
  updateEquipment: (equipment: OnboardingData['equipment_access']) => void;
  updateConstraints: (constraints: OnboardingData['constraints']) => void;
  setCurrentStep: (step: number) => void;
  submitOnboarding: () => Promise<void>;
  reset: () => void;
}

const initialData: OnboardingData = {
  profile: {},
  lifestyle: {},
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
  
  updateProfile: (profile) => 
    set(state => ({ 
      data: { ...state.data, profile: { ...state.data.profile, ...profile } }
    })),
    
  updateLifestyle: (lifestyle) =>
    set(state => ({ 
      data: { ...state.data, lifestyle: { ...state.data.lifestyle, ...lifestyle } }
    })),
    
  updateTrainingBackground: (background) =>
    set(state => ({ 
      data: { ...state.data, training_background: { ...state.data.training_background, ...background } }
    })),
    
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
        { section: 'lifestyle', data: data.lifestyle },
        { section: 'training_background', data: data.training_background },
        { section: 'performance_goals', data: data.performance_goals },
        { section: 'equipment_access', data: data.equipment_access },
        { section: 'constraints', data: data.constraints },
      ];
      
      for (const sectionData of sections) {
        if (Object.keys(sectionData.data).length === 0) continue;
        
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
          throw new Error(error.message || 'Failed to update profile section');
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
  
  reset: () => set({ 
    data: initialData, 
    currentStep: 1, 
    loading: false, 
    error: null 
  }),
}));
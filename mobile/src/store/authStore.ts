import { create } from 'zustand';
import { User, UserProfile } from '../types';
import { supabase } from '../services/supabase';

interface AuthState {
  // State
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  needsOnboarding: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setUserProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setNeedsOnboarding: (needs: boolean) => void;
  
  // Auth methods
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changeEmail: (newEmail: string) => Promise<{ success: boolean; message: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  checkSession: () => Promise<void>;
  checkOnboardingStatus: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  userProfile: null,
  loading: true,
  error: null,
  needsOnboarding: false,

  // State setters
  setUser: (user) => set({ user }),
  setUserProfile: (userProfile) => set({ userProfile }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  setNeedsOnboarding: (needs) => set({ needsOnboarding: needs }),
  
  // Check if user needs onboarding
  checkOnboardingStatus: () => {
    const profile = get().userProfile;
    if (!profile) return true;

    // Check if onboarding is complete based on database fields
    const isComplete = profile.onboarding_completed_at !== null ||
                      profile.profile_completion_percentage === 100;

    return !isComplete;
  },

  // Auth methods
  signIn: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        set({ user: data.user });
        
        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Profile fetch error:', profileError);
        } else if (profile) {
          set({ userProfile: profile });
          
          // Check if user needs onboarding
          const needsOnboarding = get().checkOnboardingStatus();
          set({ needsOnboarding });
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred during sign in';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signUp: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        set({ user: data.user });
        
        // Create user profile record in our custom users table
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email || '',
            profile: {},
            lifestyle: {},
            training_background: {},
            equipment_access: {},
            performance_goals: {},
            constraints: {},
          });
        
        if (profileError) {
          console.warn('Profile creation failed:', profileError);
          // Don't throw error - user is still created in auth
        }
        
        // New users always need onboarding
        set({ needsOnboarding: true });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred during sign up';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    try {
      set({ loading: true, error: null });
      
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;

      set({ user: null, userProfile: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred during sign out';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  resetPassword: async (email: string) => {
    try {
      set({ loading: true, error: null });

      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) throw error;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred during password reset';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  changeEmail: async (newEmail: string) => {
    try {
      set({ loading: true, error: null });

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmail)) {
        throw new Error('Please enter a valid email address');
      }

      const { data, error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) throw error;

      // Update local user state
      if (data.user) {
        set({ user: data.user });
      }

      return {
        success: true,
        message: 'Confirmation emails sent to both your current and new email addresses. Please check both inboxes to complete the change.'
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to change email';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    try {
      set({ loading: true, error: null });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email) throw new Error('Not authenticated');

      // Validate password strength
      if (newPassword.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }
      if (!/[a-z]/.test(newPassword)) {
        throw new Error('Password must contain at least one lowercase letter');
      }
      if (!/[A-Z]/.test(newPassword)) {
        throw new Error('Password must contain at least one uppercase letter');
      }
      if (!/[0-9]/.test(newPassword)) {
        throw new Error('Password must contain at least one number');
      }
      if (!/[^a-zA-Z0-9]/.test(newPassword)) {
        throw new Error('Password must contain at least one special character');
      }

      // Reauthenticate with current password
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });

      if (reauthError) {
        throw new Error('Current password is incorrect');
      }

      // Update to new password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      return {
        success: true,
        message: 'Password updated successfully'
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to change password';
      set({ error: message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  checkSession: async () => {
    try {
      set({ loading: true, error: null });
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;

      if (session?.user) {
        set({ user: session.user });
        
        // Fetch user profile
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Profile fetch error:', profileError);
        } else if (profile) {
          set({ userProfile: profile });
          
          // Check if user needs onboarding
          const needsOnboarding = get().checkOnboardingStatus();
          set({ needsOnboarding });
        }
      } else {
        set({ user: null, userProfile: null, needsOnboarding: false });
      }
    } catch (error) {
      console.error('Session check error:', error);
      set({ user: null, userProfile: null });
    } finally {
      set({ loading: false });
    }
  },
}));
// Database query utilities for Edge Functions
// Provides reusable database operations with proper error handling

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { UserProfile, Program, Workout, ContextPeriod } from '../types/api.ts';
import { DatabaseError } from '../utils/errors.ts';

export function createSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

export class UserQueries {
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    const supabase = createSupabaseClient();
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null; // No rows found
        throw new DatabaseError('fetch user profile', error.message);
      }
      
      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('fetch user profile', error.message);
    }
  }
  
  static async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const supabase = createSupabaseClient();
    
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      
      if (error) {
        throw new DatabaseError('update user profile', error.message);
      }
      
      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('update user profile', error.message);
    }
  }
  
  static async createUserProfile(profile: UserProfile): Promise<UserProfile> {
    const supabase = createSupabaseClient();
    
    try {
      const { data, error } = await supabase
        .from('users')
        .insert(profile)
        .select()
        .single();
      
      if (error) {
        throw new DatabaseError('create user profile', error.message);
      }
      
      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('create user profile', error.message);
    }
  }
}

export class ProgramQueries {
  static async getUserPrograms(userId: string): Promise<Program[]> {
    const supabase = createSupabaseClient();
    
    try {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new DatabaseError('fetch user programs', error.message);
      }
      
      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('fetch user programs', error.message);
    }
  }
  
  static async getActiveProgram(userId: string): Promise<Program | null> {
    const supabase = createSupabaseClient();
    
    try {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new DatabaseError('fetch active program', error.message);
      }
      
      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('fetch active program', error.message);
    }
  }
  
  static async createProgram(program: Program): Promise<Program> {
    const supabase = createSupabaseClient();
    
    try {
      const { data, error } = await supabase
        .from('programs')
        .insert(program)
        .select()
        .single();
      
      if (error) {
        throw new DatabaseError('create program', error.message);
      }
      
      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('create program', error.message);
    }
  }
  
  static async updateProgram(programId: string, updates: Partial<Program>): Promise<Program> {
    const supabase = createSupabaseClient();
    
    try {
      const { data, error } = await supabase
        .from('programs')
        .update(updates)
        .eq('id', programId)
        .select()
        .single();
      
      if (error) {
        throw new DatabaseError('update program', error.message);
      }
      
      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('update program', error.message);
    }
  }
  
  static async deleteProgram(programId: string): Promise<void> {
    const supabase = createSupabaseClient();
    
    try {
      const { error } = await supabase
        .from('programs')
        .delete()
        .eq('id', programId);
      
      if (error) {
        throw new DatabaseError('delete program', error.message);
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('delete program', error.message);
    }
  }
  
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    const supabase = createSupabaseClient();
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null; // No rows found
        throw new DatabaseError('fetch user profile', error.message);
      }
      
      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('fetch user profile', error.message);
    }
  }
}

export class WorkoutQueries {
  static async getTodaysWorkout(userId: string): Promise<Workout | null> {
    const supabase = createSupabaseClient();
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select(`
          *,
          programs!inner(user_id)
        `)
        .eq('programs.user_id', userId)
        .eq('scheduled_date', today)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new DatabaseError('fetch today\'s workout', error.message);
      }
      
      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('fetch today\'s workout', error.message);
    }
  }
  
  static async getUpcomingWorkouts(userId: string, days: number = 7): Promise<Workout[]> {
    const supabase = createSupabaseClient();
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const endDate = futureDate.toISOString().split('T')[0];
    
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select(`
          *,
          programs!inner(user_id)
        `)
        .eq('programs.user_id', userId)
        .gte('scheduled_date', today)
        .lte('scheduled_date', endDate)
        .order('scheduled_date', { ascending: true });
      
      if (error) {
        throw new DatabaseError('fetch upcoming workouts', error.message);
      }
      
      return data || [];
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('fetch upcoming workouts', error.message);
    }
  }
  
  static async updateWorkout(workoutId: string, updates: Partial<Workout>): Promise<Workout> {
    const supabase = createSupabaseClient();
    
    try {
      const { data, error } = await supabase
        .from('workouts')
        .update(updates)
        .eq('id', workoutId)
        .select()
        .single();
      
      if (error) {
        throw new DatabaseError('update workout', error.message);
      }
      
      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('update workout', error.message);
    }
  }
  
  static async getWorkoutById(workoutId: string, userId: string): Promise<Workout | null> {
    const supabase = createSupabaseClient();
    
    try {
      const { data, error } = await supabase
        .from('workouts')
        .select(`
          *,
          programs!inner(user_id)
        `)
        .eq('id', workoutId)
        .eq('programs.user_id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new DatabaseError('fetch workout', error.message);
      }
      
      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('fetch workout', error.message);
    }
  }
  
  static async logExercisePerformance(workoutId: string, exerciseData: any): Promise<void> {
    const supabase = createSupabaseClient();
    
    try {
      const { error } = await supabase
        .from('exercise_instances')
        .insert({
          workout_id: workoutId,
          exercise_id: exerciseData.exercise_id,
          sets_completed: exerciseData.sets_completed,
          reps_completed: exerciseData.reps_completed,
          weights_used: exerciseData.weights_used,
          rpe_scores: exerciseData.rpe_scores,
          notes: exerciseData.notes,
          completed_at: new Date().toISOString()
        });
      
      if (error) {
        throw new DatabaseError('log exercise performance', error.message);
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('log exercise performance', error.message);
    }
  }
}

export class DeloadQueries {
  static async checkDeloadEligibility(userId: string): Promise<boolean> {
    const supabase = createSupabaseClient();
    
    try {
      const { data, error } = await supabase
        .rpc('check_deload_eligibility', { p_user_id: userId });
      
      if (error) {
        throw new DatabaseError('check deload eligibility', error.message);
      }
      
      return data?.can_deload || false;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('check deload eligibility', error.message);
    }
  }
  
  static async recordDeload(userId: string, workoutId: string, deloadType: string, reason: string): Promise<void> {
    const supabase = createSupabaseClient();
    
    try {
      const { error } = await supabase
        .from('deload_history')
        .insert({
          user_id: userId,
          workout_id: workoutId,
          deload_type,
          reason,
          applied_at: new Date().toISOString()
        });
      
      if (error) {
        throw new DatabaseError('record deload', error.message);
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('record deload', error.message);
    }
  }
  
  static async getDeloadEligibility(userId: string): Promise<any> {
    const supabase = createSupabaseClient();
    
    try {
      const { data, error } = await supabase
        .rpc('check_deload_eligibility', { p_user_id: userId });
      
      if (error) {
        throw new DatabaseError('check deload eligibility', error.message);
      }
      
      return data || {
        can_deload: false,
        days_since_last_deload: 0,
        min_days_between_deloads: 3,
        deloads_in_last_6_training_days: 0,
        max_deloads_per_6_training_days: 1,
        reason_blocked: 'No data available',
        educational_message: {
          title: null,
          message: null,
          recommendations: []
        }
      };
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('check deload eligibility', error.message);
    }
  }
}

export class ContextQueries {
  static async getActiveContextPeriod(userId: string): Promise<ContextPeriod | null> {
    const supabase = createSupabaseClient();
    const now = new Date().toISOString();
    
    try {
      const { data, error } = await supabase
        .from('context_periods')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .lte('start_date', now)
        .gte('end_date', now)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new DatabaseError('fetch active context period', error.message);
      }
      
      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('fetch active context period', error.message);
    }
  }
  
  static async createContextPeriod(contextPeriod: ContextPeriod): Promise<ContextPeriod> {
    const supabase = createSupabaseClient();
    
    try {
      const { data, error } = await supabase
        .from('context_periods')
        .insert(contextPeriod)
        .select()
        .single();
      
      if (error) {
        throw new DatabaseError('create context period', error.message);
      }
      
      return data;
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('create context period', error.message);
    }
  }
  
  static async endContextPeriod(contextPeriodId: string): Promise<void> {
    const supabase = createSupabaseClient();
    
    try {
      const { error } = await supabase
        .from('context_periods')
        .update({ 
          status: 'completed',
          end_date: new Date().toISOString()
        })
        .eq('id', contextPeriodId);
      
      if (error) {
        throw new DatabaseError('end context period', error.message);
      }
    } catch (error) {
      if (error instanceof DatabaseError) throw error;
      throw new DatabaseError('end context period', error.message);
    }
  }
}
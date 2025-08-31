import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Create Supabase client with AsyncStorage for React Native compatibility
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Important: must be false for React Native
  },
});

// Database types (to be extended as we build out the app)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          equipment_access: any;
          performance_goals: any;
          training_background: any;
          constraints: any;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      programs: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          target_event: any;
          program_structure: any;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['programs']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['programs']['Insert']>;
      };
    };
  };
}
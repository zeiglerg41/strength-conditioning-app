// AI Provider Adapter Pattern
// Model-agnostic interface for swappable AI providers (OpenAI/Anthropic/Ollama)

import { UserProfile, TargetEvent, Program, Workout } from '../types/api.ts';

export interface AIProvider {
  /**
   * Generate a complete periodized training program based on user profile and target event
   * Uses reverse periodization from event date with S&C guardrails embedded
   */
  generateProgram(
    systemContext: string,
    userProfile: UserProfile, 
    targetEvent: TargetEvent,
    context?: ProgramGenerationContext
  ): Promise<Program>;

  /**
   * Generate an AI challenge/event for users without specific goals
   * Based on user's fitness level and preferences
   */
  generateChallenge(
    userProfile: UserProfile,
    challengeType?: 'strength' | 'endurance' | 'power' | 'general'
  ): Promise<{
    name: string;
    type: 'strength' | 'endurance' | 'power' | 'mobility';
    target_date: string;
    description: string;
  }>;

  /**
   * Adapt a workout based on current context (travel, equipment, readiness)
   * Provides exercise substitutions and modifications
   */
  adaptWorkout(
    workout: Workout,
    context: WorkoutAdaptationContext
  ): Promise<Workout>;

  /**
   * Generate deload options based on current workout and user fatigue
   * Returns 1-2 literature-based deload modifications
   */
  generateDeloadOptions(
    workout: Workout,
    deloadReason: 'poor_sleep' | 'high_stress' | 'fatigue' | 'overreaching'
  ): Promise<Array<{
    type: 'volume_deload' | 'intensity_deload';
    description: string;
    modifications: Record<string, any>;
  }>>;

  /**
   * Analyze user performance and provide program adjustments
   * Used for analytics and program optimization
   */
  analyzePerformance(
    userProfile: UserProfile,
    performanceData: PerformanceData,
    program: Program
  ): Promise<{
    insights: string[];
    recommendations: string[];
    program_adjustments?: Record<string, any>;
  }>;
}

export interface ProgramGenerationContext {
  available_equipment: string[];
  location_constraints: string[];
  time_constraints: {
    max_session_duration: number;
    available_days: string[];
    preferred_times: string[];
  };
  current_fitness_level?: {
    strength_indicators: Record<string, number>;
    endurance_indicators: Record<string, number>;
    power_indicators: Record<string, number>;
  };
}

export interface WorkoutAdaptationContext {
  available_equipment: string[];
  location_type: 'home' | 'commercial_gym' | 'hotel' | 'outdoor' | 'bodyweight';
  time_available_minutes: number;
  user_readiness: {
    sleep_quality: 'poor' | 'fair' | 'good' | 'excellent';
    stress_level: 'low' | 'moderate' | 'high';
    soreness: 'none' | 'mild' | 'moderate' | 'high';
    motivation: 'low' | 'moderate' | 'high';
  };
  travel_mode: boolean;
  injury_limitations?: string[];
}

export interface PerformanceData {
  recent_workouts: Array<{
    date: string;
    session_rpe: number;
    completion_rate: number;
    performance_metrics: Record<string, any>;
  }>;
  strength_progression: Record<string, Array<{
    date: string;
    estimated_1rm: number;
    volume: number;
  }>>;
  endurance_progression: Record<string, Array<{
    date: string;
    time_or_distance: number;
    heart_rate_data?: number[];
    perceived_effort: number;
  }>>;
  adherence_data: {
    planned_sessions: number;
    completed_sessions: number;
    missed_sessions: number;
    deload_frequency: number;
  };
}

/**
 * Factory class for creating AI provider instances
 * Supports OpenAI, Anthropic, and Ollama based on environment variable
 */
export class AIProviderFactory {
  static create(provider?: string): AIProvider {
    const selectedProvider = provider || Deno.env.get('AI_PROVIDER') || 'openai';
    
    switch (selectedProvider.toLowerCase()) {
      case 'openai':
        return new OpenAIProvider();
      case 'anthropic':
        return new AnthropicProvider();
      case 'ollama':
        return new OllamaProvider();
      default:
        throw new Error(`Unknown AI provider: ${selectedProvider}. Supported providers: openai, anthropic, ollama`);
    }
  }

  /**
   * Create provider with fallback logic
   * If primary provider fails, automatically try fallback
   */
  static createWithFallback(primary: string, fallback: string): AIProvider {
    return new FallbackProvider(
      AIProviderFactory.create(primary),
      AIProviderFactory.create(fallback)
    );
  }
}

/**
 * Fallback provider that tries secondary provider if primary fails
 */
class FallbackProvider implements AIProvider {
  constructor(
    private primary: AIProvider,
    private fallback: AIProvider
  ) {}

  async generateProgram(systemContext: string, userProfile: UserProfile, targetEvent: TargetEvent, context?: ProgramGenerationContext): Promise<Program> {
    try {
      return await this.primary.generateProgram(systemContext, userProfile, targetEvent, context);
    } catch (error) {
      console.warn('Primary AI provider failed, trying fallback:', error);
      return await this.fallback.generateProgram(systemContext, userProfile, targetEvent, context);
    }
  }

  async generateChallenge(userProfile: UserProfile, challengeType?: 'strength' | 'endurance' | 'power' | 'general') {
    try {
      return await this.primary.generateChallenge(userProfile, challengeType);
    } catch (error) {
      console.warn('Primary AI provider failed, trying fallback:', error);
      return await this.fallback.generateChallenge(userProfile, challengeType);
    }
  }

  async adaptWorkout(workout: Workout, context: WorkoutAdaptationContext): Promise<Workout> {
    try {
      return await this.primary.adaptWorkout(workout, context);
    } catch (error) {
      console.warn('Primary AI provider failed, trying fallback:', error);
      return await this.fallback.adaptWorkout(workout, context);
    }
  }

  async generateDeloadOptions(workout: Workout, deloadReason: 'poor_sleep' | 'high_stress' | 'fatigue' | 'overreaching') {
    try {
      return await this.primary.generateDeloadOptions(workout, deloadReason);
    } catch (error) {
      console.warn('Primary AI provider failed, trying fallback:', error);
      return await this.fallback.generateDeloadOptions(workout, deloadReason);
    }
  }

  async analyzePerformance(userProfile: UserProfile, performanceData: PerformanceData, program: Program) {
    try {
      return await this.primary.analyzePerformance(userProfile, performanceData, program);
    } catch (error) {
      console.warn('Primary AI provider failed, trying fallback:', error);
      return await this.fallback.analyzePerformance(userProfile, performanceData, program);
    }
  }
}

// Import concrete implementations
import { OpenAIProvider } from './openai.ts';
import { AnthropicProvider } from './anthropic.ts';
import { OllamaProvider } from './ollama.ts';
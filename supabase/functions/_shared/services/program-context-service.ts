/**
 * Program Context Service
 * 
 * Handles AI context injection with S&C guardrails for program generation.
 * Combines training blueprints with user-specific constraints as AI prompt context.
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { TrainingAgeService } from './training-age-service.ts'

interface UserContext {
  trainingAge: string
  equipment: any[]
  injuries: any[]
  schedule: any
  goals: any
  preferences: any
}

export class ProgramContextService {
  
  /**
   * Build complete system context for AI program generation
   * Combines S&C blueprint with user-specific constraints
   */
  static async buildSystemContext(
    supabase: SupabaseClient,
    userId: string
  ): Promise<string> {
    // Load appropriate training blueprint
    const blueprint = await TrainingAgeService.loadBlueprintForUser(supabase, userId)
    
    // Fetch user constraints from database
    const userContext = await this.getUserContext(supabase, userId)
    
    // Combine into system prompt
    return this.composeSystemPrompt(blueprint, userContext)
  }
  
  /**
   * Fetch user context data from database
   */
  private static async getUserContext(
    supabase: SupabaseClient,
    userId: string
  ): Promise<UserContext> {
    const { data: profile } = await supabase
      .from('users')
      .select(`
        training_background,
        physical_profile,
        equipment_access,
        schedule_constraints,
        goals,
        preferences
      `)
      .eq('id', userId)
      .single()
    
    if (!profile) throw new Error('User profile not found')
    
    const trainingAge = await TrainingAgeService.getEffectiveTrainingAge(supabase, userId)
    
    return {
      trainingAge,
      equipment: profile.equipment_access || [],
      injuries: profile.physical_profile?.injuries || [],
      schedule: profile.schedule_constraints || {},
      goals: profile.goals || {},
      preferences: profile.preferences || {}
    }
  }
  
  /**
   * Compose system prompt with S&C guardrails and user context
   */
  private static composeSystemPrompt(blueprint: string, userContext: UserContext): string {
    return `You are an expert Strength & Conditioning coach with deep knowledge of periodization principles from Supertraining, Joel Jamieson's methods, and peer-reviewed research.

TRAINING BLUEPRINT (MUST FOLLOW):
${this.getBlueprintContent(blueprint)}

USER CONTEXT (STRICT CONSTRAINTS):
Training Level: ${userContext.trainingAge}
Available Equipment: ${JSON.stringify(userContext.equipment, null, 2)}
Injuries/Limitations: ${JSON.stringify(userContext.injuries, null, 2)}
Schedule Constraints: ${JSON.stringify(userContext.schedule, null, 2)}
Goals: ${JSON.stringify(userContext.goals, null, 2)}
Preferences: ${JSON.stringify(userContext.preferences, null, 2)}

MANDATORY REQUIREMENTS:
1. ONLY suggest exercises compatible with available equipment
2. NEVER include exercises that conflict with injuries/limitations  
3. RESPECT schedule constraints (session frequency, duration, time of day)
4. FOLLOW the training blueprint principles for this experience level
5. Generate PERIODIZED PROGRAMS, not random workouts
6. Include progressive overload and deload scheduling per research
7. Maintain program integrity through sequential day completion

Generate programs based on science, not trends. Prioritize long-term development over short-term novelty.`
  }
  
  /**
   * Get blueprint content based on training age identifier
   */
  private static getBlueprintContent(blueprint: string): string {
    const blueprints: Record<string, string> = {
      'BEGINNER_BLUEPRINT': `
BEGINNER PRINCIPLES (0-15 effective months):
- Focus on technique mastery over load progression
- Full-body workouts 2-3x per week on non-consecutive days  
- Compound movements: squat, hinge, push, pull patterns
- 2-4 sets of 8-12 reps, RPE 7-8 (1-2 reps in reserve)
- Linear progression: add weight when form allows
- LISS cardio 20-40min, conversational pace (60-70% max HR)
- Minimal periodization needed - consistency most important
- 60-90 second rest periods between sets
- Prioritize movement competency and training habits`,

      'INTERMEDIATE_BLUEPRINT': `
INTERMEDIATE PRINCIPLES (15-30 effective months):
- Systematic progressive overload with variable manipulation
- 3-4 sessions per week, split routines (Upper/Lower, Push/Pull/Legs)
- Undulating periodization: vary intensity/volume weekly
- Strength days: 3-5 sets of 3-6 reps at 80-90% 1RM
- Hypertrophy days: 3-4 sets of 8-12 reps at 60-75% 1RM  
- Mixed energy systems: LISS, MISS (70-80% max HR), HIIT intervals
- 4-6 week mesocycles with deload weeks
- Address specific weaknesses with accessory work
- Rest periods: 2-3min strength, 60-120s hypertrophy`,

      'ADVANCED_BLUEPRINT': `
ADVANCED PRINCIPLES (30+ effective months):
- Block periodization: Accumulation → Intensification → Realization phases
- Highly individualized programming based on weaknesses/goals  
- 4-6 sessions per week, sophisticated exercise selection
- Concurrent training management to minimize interference
- Advanced techniques: cluster sets, PAP, accommodating resistance
- Energy system specificity: precise work:rest ratios for sport demands
- Meticulous recovery monitoring and fatigue management
- Regular deload weeks and competition tapering
- Performance-based auto-regulation using RPE/RIR
- Integration of all three energy systems with precise timing`
    }
    
    return blueprints[blueprint] || blueprints['BEGINNER_BLUEPRINT']
  }
}

/**
 * S&C Knowledge Base Constants
 * Core principles embedded in every AI interaction
 */
export const SC_GUARDRAILS = {
  PERIODIZATION: {
    LINEAR: 'Progressive increase in intensity with decrease in volume over time',
    UNDULATING: 'Daily or weekly variations in intensity and volume',
    BLOCK: 'Distinct phases: accumulation, intensification, realization'
  },
  
  ENERGY_SYSTEMS: {
    PHOSPHAGEN: '5-10 seconds max effort, 1:10-1:20 work:rest',
    GLYCOLYTIC: '30-90 seconds high intensity, 1:1-1:3 work:rest', 
    OXIDATIVE: 'Continuous or long intervals, conversational to threshold pace'
  },
  
  RECOVERY: {
    DELOAD_FREQUENCY: 'Every 4-6 weeks for intermediate/advanced',
    STRENGTH_RETENTION: 'Minimal loss up to 4 weeks detraining',
    MUSCLE_MEMORY: 'Rapid regain of previous strength levels'
  }
}
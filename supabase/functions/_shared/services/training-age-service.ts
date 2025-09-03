/**
 * Training Age Classification Service
 * 
 * Implements NSCA research-backed training age classification using 5-factor model:
 * 1. Current uninterrupted training time (most critical)
 * 2. Total detraining months (impacts effective age)  
 * 3. Previous training experience (lifetime exposure)
 * 4. Technical proficiency (movement competency)
 * 5. Strength level (performance validation)
 */

import { SupabaseClient } from '@supabase/supabase-js'

export interface NSCATrainingFactors {
  // Core time factors
  currentConsecutiveMonths: number    // Current streak without breaks
  totalDetrainingMonths: number       // Total months of breaks/gaps
  totalChronologicalMonths: number    // Lifetime training exposure
  
  // Proficiency factors  
  technicalProficiency: number        // 1-5 average of movement competencies
  strengthLevel?: {                   // Optional performance validation
    benchRatio: number,               // Bench press / bodyweight
    squatRatio: number,               // Squat / bodyweight  
    deadliftRatio: number             // Deadlift / bodyweight
  }
  
  // Consistency indicators
  averageSessionsPerWeek: number      // Historical training frequency
  hasUsedPeriodization: boolean       // Training sophistication
  understandsRPE: boolean            // Advanced training concepts
}

export type TrainingAge = 'beginner' | 'intermediate' | 'advanced' | 'highly_advanced'

export class TrainingAgeService {
  
  /**
   * Calculate effective training age using research-backed formula
   * Accounts for inconsistent training patterns and detraining effects
   */
  static calculateEffectiveTrainingAge(factors: NSCATrainingFactors): number {
    let baseMonths = factors.totalChronologicalMonths
    
    // 1. Consistency multiplier (research: 3x/week optimal)
    const consistencyMultiplier = Math.min(
      factors.averageSessionsPerWeek / 3.0,  // 3x/week = 1.0x
      1.5  // Cap at 1.5x for very consistent trainers
    )
    
    // 2. Detraining penalty (research: significant loss after 4+ weeks)
    const detrainingPenalty = factors.totalDetrainingMonths * 0.6  // 60% loss per gap month
    
    // 3. Current streak bonus (uninterrupted training most valuable)
    const streakBonus = Math.min(
      factors.currentConsecutiveMonths * 0.2,  // 20% bonus for consistency
      baseMonths * 0.3  // Cap at 30% of total
    )
    
    // 4. Technical proficiency multiplier
    const techniqueMultiplier = factors.technicalProficiency / 3.0  // Normalize to ~1.67x max
    
    let effectiveMonths = (baseMonths * consistencyMultiplier - detrainingPenalty + streakBonus) * techniqueMultiplier
    
    return Math.max(effectiveMonths, 0)
  }
  
  /**
   * Classify training age based on NSCA research thresholds
   */
  static classifyTrainingAge(effectiveMonths: number): TrainingAge {
    if (effectiveMonths < 15) return 'beginner'        // <15 effective months
    if (effectiveMonths < 30) return 'intermediate'    // 15-30 effective months
    if (effectiveMonths < 60) return 'advanced'        // 30-60 effective months
    return 'highly_advanced'                           // 60+ effective months
  }
  
  /**
   * Validate classification with strength standards to prevent misclassification
   */
  static validateWithStrengthStandards(
    calculatedAge: TrainingAge, 
    factors: NSCATrainingFactors
  ): TrainingAge {
    if (!factors.strengthLevel) return calculatedAge
    
    const { benchRatio, squatRatio, deadliftRatio } = factors.strengthLevel
    const avgRatio = (benchRatio + squatRatio + deadliftRatio) / 3
    
    // Performance floor - weak performers stay beginner regardless of time
    if (avgRatio < 1.0 && factors.technicalProficiency < 2.5) {
      return 'beginner'
    }
    
    // Performance ceiling - strong performers can't be beginners
    if (avgRatio > 1.5 && calculatedAge === 'beginner') {
      return 'intermediate'
    }
    
    return calculatedAge
  }
  
  /**
   * Get user's current effective training age from database
   */
  static async getEffectiveTrainingAge(
    supabase: SupabaseClient, 
    userId: string
  ): Promise<TrainingAge> {
    // Fetch user profile data
    const { data: profile } = await supabase
      .from('users')
      .select(`
        training_background,
        movement_competencies,
        physical_profile
      `)
      .eq('id', userId)
      .single()
    
    if (!profile) throw new Error('User profile not found')
    
    // Extract training factors from profile
    const factors = this.extractTrainingFactors(profile)
    
    // Calculate effective training age
    const effectiveMonths = this.calculateEffectiveTrainingAge(factors)
    const baseClassification = this.classifyTrainingAge(effectiveMonths)
    
    // Validate with strength standards
    return this.validateWithStrengthStandards(baseClassification, factors)
  }
  
  /**
   * Extract training factors from user profile data
   */
  private static extractTrainingFactors(profile: any): NSCATrainingFactors {
    const trainingBg = profile.training_background || {}
    const competencies = profile.movement_competencies || {}
    
    // Calculate average technical proficiency from movement competencies
    const competencyValues = Object.values(competencies).map((c: any) => c.experience_level || 1)
    const avgCompetency = competencyValues.reduce((sum: number, val: number) => sum + val, 0) / competencyValues.length || 1
    
    return {
      currentConsecutiveMonths: trainingBg.current_streak_months || 0,
      totalDetrainingMonths: trainingBg.total_break_months || 0,
      totalChronologicalMonths: trainingBg.total_experience_months || 0,
      technicalProficiency: avgCompetency,
      averageSessionsPerWeek: trainingBg.average_sessions_per_week || 2,
      hasUsedPeriodization: trainingBg.has_used_programs || false,
      understandsRPE: trainingBg.understands_rpe || false,
      // Strength level extraction would require additional profile fields
      strengthLevel: undefined
    }
  }
  
  /**
   * Load appropriate blueprint content based on training age
   */
  static async loadBlueprintForUser(
    supabase: SupabaseClient,
    userId: string
  ): Promise<string> {
    const trainingAge = await this.getEffectiveTrainingAge(supabase, userId)
    return await this.loadBlueprintContent(trainingAge)
  }
  
  /**
   * Load blueprint content from file system
   */
  private static async loadBlueprintContent(trainingAge: TrainingAge): Promise<string> {
    // In production, these would be stored in database or loaded from filesystem
    // For now, return blueprint identifier for AI context injection
    const blueprintMap: Record<string, string> = {
      'beginner': 'BEGINNER_BLUEPRINT',
      'intermediate': 'INTERMEDIATE_BLUEPRINT', 
      'advanced': 'ADVANCED_BLUEPRINT',
      'highly_advanced': 'ADVANCED_BLUEPRINT' // Use advanced for highly advanced
    }
    
    return blueprintMap[trainingAge] || blueprintMap['beginner']
  }
}
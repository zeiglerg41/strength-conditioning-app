/**
 * Progressive Classification Service
 * 
 * Manages dynamic training age classification that improves over time through
 * workout data analysis. Integrates behavioral signals from logged workout
 * performance with base NSCA classification model at regular audit intervals.
 * 
 * NO user-AI interaction - all learning from workout logging data only.
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { BehavioralTrackingService, TrainingAgeConfidence } from './behavioral-tracking-service.ts'
import { TrainingAgeService } from './training-age-service.ts'

export interface ProgressiveClassificationResult {
  trainingAge: 'beginner' | 'intermediate' | 'advanced' | 'highly_advanced'
  confidence: number
  classificationType: 'initial' | 'behavioral_adjusted' | 'validated'
  nextValidationTrigger?: string
  recommendedQuestions?: Array<{id: string, question: string}>
}

export interface ClassificationHistory {
  timestamp: string
  trainingAge: string
  confidence: number
  trigger: 'initial_onboarding' | 'behavioral_signals' | 'user_validation' | 'performance_data'
  supportingData: Record<string, any>
}

export class ProgressiveClassificationService {
  
  /**
   * Get training age using progressive learning approach
   * Combines base NSCA model with behavioral signals and validation
   */
  static async getProgressiveTrainingAge(
    supabase: SupabaseClient,
    userId: string
  ): Promise<ProgressiveClassificationResult> {
    
    // 1. Get base NSCA classification
    const baseClassification = await TrainingAgeService.getEffectiveTrainingAge(supabase, userId)
    
    // 2. Evaluate behavioral confidence  
    const behavioralConfidence = await BehavioralTrackingService.evaluateTrainingAgeConfidence(
      supabase, 
      userId
    )
    
    // 3. Apply behavioral adjustments if confidence is high enough
    if (behavioralConfidence.confidenceScore >= 0.7) {
      return {
        trainingAge: behavioralConfidence.currentClassification,
        confidence: behavioralConfidence.confidenceScore,
        classificationType: 'behavioral_adjusted',
        nextValidationTrigger: this.getNextValidationTrigger(behavioralConfidence),
        recommendedQuestions: await BehavioralTrackingService.getTriggeredValidationQuestions(supabase, userId)
      }
    }
    
    // 4. Return base classification with validation recommendations if confidence is low
    return {
      trainingAge: baseClassification,
      confidence: behavioralConfidence.confidenceScore,
      classificationType: behavioralConfidence.confidenceScore > 0.5 ? 'initial' : 'initial',
      nextValidationTrigger: behavioralConfidence.needsValidation ? 'low_confidence' : undefined,
      recommendedQuestions: behavioralConfidence.needsValidation ? 
        await BehavioralTrackingService.getTriggeredValidationQuestions(supabase, userId) : undefined
    }
  }
  
  /**
   * Record workout performance and extract behavioral signals
   */
  static async recordWorkoutBehavior(
    supabase: SupabaseClient,
    userId: string,
    workoutData: {
      exercises: Array<{
        name: string
        category: 'compound' | 'isolation' | 'accessory'
        sets: number
        reps: number[]
        weights: number[]
        rpe?: number[]
      }>
      sessionDuration: number
      difficultyRating: number
      completionRate: number
      notes?: string
    }
  ): Promise<void> {
    
    const signals = []
    
    // Analyze exercise selection patterns
    const compoundRatio = workoutData.exercises.filter(e => e.category === 'compound').length / 
                          workoutData.exercises.length
    
    if (compoundRatio > 0.7) {
      signals.push({
        userId,
        signalType: 'exercise_selection' as const,
        signalValue: 'compound_focused',
        trainingAgeIndicator: 'intermediate' as const,
        confidence: 0.6
      })
    } else if (compoundRatio < 0.3) {
      signals.push({
        userId,
        signalType: 'exercise_selection' as const,
        signalValue: 'isolation_focused',
        trainingAgeIndicator: 'beginner' as const,
        confidence: 0.7
      })
    }
    
    // Analyze RPE usage sophistication
    const exercises = workoutData.exercises
    const rpeUsage = exercises.filter(e => e.rpe && e.rpe.length > 0).length / exercises.length
    
    if (rpeUsage > 0.8) {
      signals.push({
        userId,
        signalType: 'terminology_usage' as const,
        signalValue: 'consistent_rpe_usage',
        trainingAgeIndicator: 'advanced' as const,
        confidence: 0.8
      })
    } else if (rpeUsage === 0) {
      signals.push({
        userId,
        signalType: 'terminology_usage' as const,
        signalValue: 'no_rpe_usage',
        trainingAgeIndicator: 'beginner' as const,
        confidence: 0.6
      })
    }
    
    // Simple progression tracking only - no complex pattern analysis
    
    // Record all behavioral signals
    for (const signal of signals) {
      await BehavioralTrackingService.recordBehavioralSignal(supabase, signal)
    }
  }
  
  /**
   * Schedule automatic training age audit
   * Called by background job every 2-4 weeks for active users
   */
  static async scheduleTrainingAgeAudit(
    supabase: SupabaseClient,
    userId: string
  ): Promise<void> {
    // Check if user has sufficient workout data for audit
    const { data: recentWorkouts } = await supabase
      .from('workout_logs')
      .select('id')
      .eq('user_id', userId)
      .gte('date', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
    
    if (!recentWorkouts || recentWorkouts.length < 4) {
      // Not enough data for meaningful audit
      return
    }
    
    // Trigger comprehensive behavioral analysis
    await BehavioralTrackingService.triggerTrainingAgeAudit(supabase, userId)
    
    // Record audit completion
    await supabase
      .from('training_age_audits')
      .insert({
        user_id: userId,
        audit_date: new Date().toISOString(),
        workouts_analyzed: recentWorkouts.length,
        audit_trigger: 'scheduled_interval'
      })
  }
  
  
  
  /**
   * Determine when next validation should be triggered
   */
  private static getNextValidationTrigger(confidence: TrainingAgeConfidence): string | undefined {
    if (confidence.confidenceScore < 0.4) {
      return 'immediately'
    } else if (confidence.confidenceScore < 0.6) {
      return 'after_next_workout'
    } else if (confidence.contradictorySignals.length > confidence.supportingSignals.length) {
      return 'conflicting_signals'
    }
    
    return undefined
  }
  
  /**
   * Get classification history for user
   */
  static async getClassificationHistory(
    supabase: SupabaseClient,
    userId: string,
    limit: number = 10
  ): Promise<ClassificationHistory[]> {
    
    const { data } = await supabase
      .from('training_age_history')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit)
    
    return data || []
  }
  
  /**
   * Record classification change in history
   */
  static async recordClassificationChange(
    supabase: SupabaseClient,
    userId: string,
    newAge: string,
    trigger: 'initial_onboarding' | 'behavioral_signals' | 'user_validation' | 'performance_data',
    supportingData: Record<string, any>
  ): Promise<void> {
    
    await supabase
      .from('training_age_history')
      .insert({
        user_id: userId,
        timestamp: new Date().toISOString(),
        training_age: newAge,
        confidence: supportingData.confidence || 0.5,
        trigger,
        supporting_data: supportingData
      })
  }
}
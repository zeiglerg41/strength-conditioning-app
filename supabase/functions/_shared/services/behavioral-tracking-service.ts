/**
 * Behavioral Tracking Service
 * 
 * Tracks user behavior patterns from workout logging data only to infer true training age.
 * Analyzes workout performance signals (sets, reps, weights, completion rates) at
 * regular audit intervals to dynamically update training age classification.
 * 
 * NO user-AI interaction - all signals extracted from logged workout data.
 */

import { SupabaseClient } from '@supabase/supabase-js'

export interface BehavioralSignal {
  userId: string
  signalType: 'exercise_selection' | 'progression_response' | 'stalling_pattern' | 'workout_performance' | 'consistency_pattern'
  signalValue: string
  trainingAgeIndicator: 'beginner' | 'intermediate' | 'advanced' | 'neutral'
  confidence: number // 0.0 - 1.0
  timestamp: string
  context?: Record<string, any>
}

export interface TrainingAgeConfidence {
  currentClassification: 'beginner' | 'intermediate' | 'advanced' | 'highly_advanced'
  confidenceScore: number // 0.0 - 1.0
  supportingSignals: BehavioralSignal[]
  contradictorySignals: BehavioralSignal[]
  lastValidated: string
  needsValidation: boolean
}

export class BehavioralTrackingService {
  
  /**
   * Core onboarding questions optimized for maximum classification accuracy
   * Takes 6-8 minutes with comprehensive equipment checklist
   */
  static getCoreOnboardingQuestions(): Array<{
    id: string
    question: string
    type: 'number' | 'select' | 'boolean'
    options?: string[]
    trainingAgeWeight: number
  }> {
    return [
      {
        id: 'consistent_months',
        question: 'How many months have you trained consistently without breaks longer than 1 month?',
        type: 'number',
        trainingAgeWeight: 0.4 // Highest weight - most predictive
      },
      {
        id: 'form_competency',
        question: 'Can you perform squat, bench press, and deadlift with good form?',
        type: 'select',
        options: ['Never tried them', 'Learning the basics', 'Pretty confident', 'Could coach others'],
        trainingAgeWeight: 0.25
      },
      {
        id: 'longest_streak',
        question: 'What\'s your longest training streak without missing more than 1 week?',
        type: 'select', 
        options: ['< 2 months', '2-6 months', '6-12 months', '12+ months'],
        trainingAgeWeight: 0.2
      },
      {
        id: 'progression_tracking',
        question: 'Do you track weights/reps and actively try to progress them?',
        type: 'select',
        options: ['What\'s progression?', 'Sometimes', 'Yes, consistently', 'Yes, with planned deloads'],
        trainingAgeWeight: 0.15
      }
    ]
  }
  
  /**
   * Simple performance indicators for basic tracking
   * No complex behavioral analysis - just basic metrics
   */
  static getSimplePerformanceIndicators() {
    return {
      targetAchievement: [
        'hits_prescribed_weight',
        'completes_prescribed_reps',
        'finishes_prescribed_sets'
      ],
      workoutFrequency: [
        'postponement_count',
        'days_between_sessions'
      ]
    }
  }
  
  /**
   * Record behavioral signals from workout data analysis
   * Called during audit intervals
   */
  static async recordBehavioralSignal(
    supabase: SupabaseClient,
    signal: Omit<BehavioralSignal, 'timestamp'>
  ): Promise<void> {
    const { error } = await supabase
      .from('behavioral_signals')
      .insert({
        ...signal,
        timestamp: new Date().toISOString()
      })
    
    if (error) throw error
  }
  
  /**
   * Trigger training age audit based on workout data
   * Called every 2-4 weeks automatically
   */
  static async triggerTrainingAgeAudit(
    supabase: SupabaseClient,
    userId: string
  ): Promise<void> {
    // Analyze recent workout data for behavioral signals
    const signals = await this.analyzeWorkoutBehaviorSignals(supabase, userId, 4)
    
    // Record all detected signals
    for (const signal of signals) {
      await this.recordBehavioralSignal(supabase, signal)
    }
    
    // Evaluate if training age needs updating
    const confidence = await this.evaluateTrainingAgeConfidence(supabase, userId)
    
    if (confidence.needsValidation && signals.length >= 3) {
      // Update training age based on behavioral evidence
      await this.updateTrainingAgeFromWorkoutData(supabase, userId, signals)
    }
  }
  
  /**
   * Analyze behavioral signals to determine training age confidence
   */
  static async evaluateTrainingAgeConfidence(
    supabase: SupabaseClient,
    userId: string
  ): Promise<TrainingAgeConfidence> {
    // Get recent behavioral signals (last 30 days)
    const { data: signals } = await supabase
      .from('behavioral_signals')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false })
    
    if (!signals?.length) {
      return {
        currentClassification: 'beginner', // Default conservative
        confidenceScore: 0.3, // Low confidence without behavioral data
        supportingSignals: [],
        contradictorySignals: [],
        lastValidated: new Date().toISOString(),
        needsValidation: true
      }
    }
    
    // Get current training age classification
    const { TrainingAgeService } = await import('./training-age-service.ts')
    const currentAge = await TrainingAgeService.getEffectiveTrainingAge(supabase, userId)
    
    // Analyze signal patterns
    const supportingSignals = signals.filter(s => 
      s.training_age_indicator === currentAge || 
      (currentAge === 'highly_advanced' && s.training_age_indicator === 'advanced')
    )
    
    const contradictorySignals = signals.filter(s => 
      s.training_age_indicator !== currentAge &&
      s.training_age_indicator !== 'neutral' &&
      !(currentAge === 'highly_advanced' && s.training_age_indicator === 'advanced')
    )
    
    // Calculate confidence score
    const supportingWeight = supportingSignals.reduce((sum, s) => sum + s.confidence, 0)
    const contradictoryWeight = contradictorySignals.reduce((sum, s) => sum + s.confidence, 0)
    const totalWeight = supportingWeight + contradictoryWeight
    
    const confidenceScore = totalWeight > 0 ? supportingWeight / totalWeight : 0.5
    
    return {
      currentClassification: currentAge,
      confidenceScore: Math.max(0.1, Math.min(0.95, confidenceScore)),
      supportingSignals,
      contradictorySignals,
      lastValidated: new Date().toISOString(),
      needsValidation: confidenceScore < 0.6 || contradictoryWeight > supportingWeight
    }
  }
  
  /**
   * Calculate simple performance metrics from workout logs
   * Basic metrics only - no complex behavioral analysis
   */
  static async calculateSimplePerformanceMetrics(
    supabase: SupabaseClient,
    userId: string,
    periodWeeks: number = 2
  ): Promise<{
    targetAchievementRate: number
    workoutPostponements: number
    averageDaysBetweenWorkouts: number
  }> {
    const startDate = new Date(Date.now() - periodWeeks * 7 * 24 * 60 * 60 * 1000).toISOString()
    
    // Get workout logs for analysis period
    const { data: workouts } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .order('date', { ascending: true })
    
    if (!workouts || workouts.length < 2) {
      return {
        targetAchievementRate: 0,
        workoutPostponements: 0,
        averageDaysBetweenWorkouts: 0
      }
    }
    
    // Simple calculations only
    let targetsHit = 0
    let totalTargets = 0
    
    for (const workout of workouts) {
      if (workout.exercises) {
        for (const exercise of workout.exercises) {
          if (exercise.target_weight && exercise.weights) {
            totalTargets++
            if (exercise.weights[0] >= exercise.target_weight) {
              targetsHit++
            }
          }
        }
      }
    }
    
    const targetAchievementRate = totalTargets > 0 ? targetsHit / totalTargets : 0
    
    // Calculate days between workouts
    const workoutDates = workouts.map(w => new Date(w.date))
    let totalDaysBetween = 0
    for (let i = 1; i < workoutDates.length; i++) {
      const days = (workoutDates[i].getTime() - workoutDates[i-1].getTime()) / (24 * 60 * 60 * 1000)
      totalDaysBetween += days
    }
    const averageDaysBetweenWorkouts = workoutDates.length > 1 ? totalDaysBetween / (workoutDates.length - 1) : 0
    
    return {
      targetAchievementRate,
      workoutPostponements: 0, // Would need to track postponements separately
      averageDaysBetweenWorkouts
    }
  }
  
  /**
   * Update training age based on behavioral signals from workout data
   * Called during audit intervals when confidence drops or patterns change
   */
  static async updateTrainingAgeFromWorkoutData(
    supabase: SupabaseClient,
    userId: string,
    behavioralSignals: BehavioralSignal[]
  ): Promise<'beginner' | 'intermediate' | 'advanced' | 'highly_advanced'> {
    // Analyze signal patterns and determine adjustment
    let adjustment = 0
    let totalConfidence = 0
    
    for (const signal of behavioralSignals) {
      const weight = signal.confidence
      totalConfidence += weight
      
      switch (signal.trainingAgeIndicator) {
        case 'beginner':
          adjustment -= (0.5 * weight) // Move toward beginner
          break
        case 'intermediate':
          adjustment += (0.2 * weight) // Slight move toward intermediate
          break
        case 'advanced':
          adjustment += (0.8 * weight) // Strong move toward advanced
          break
      }
    }
    
    // Only apply adjustment if we have sufficient signal confidence
    if (totalConfidence < 2.0) return await this.getCurrentTrainingAge(supabase, userId)
    
    // Get current effective months and adjust
    const { TrainingAgeService } = await import('./training-age-service.ts')
    const currentAge = await TrainingAgeService.getEffectiveTrainingAge(supabase, userId)
    
    // Convert to months, adjust, and reclassify
    const monthsMap = { beginner: 10, intermediate: 22, advanced: 45, highly_advanced: 70 }
    const currentMonths = monthsMap[currentAge]
    const adjustedMonths = Math.max(0, currentMonths + (adjustment * 6)) // Smaller adjustments
    
    const newAge = TrainingAgeService.classifyTrainingAge(adjustedMonths)
    
    // Update user profile with new classification
    await supabase
      .from('users')
      .update({
        training_background: {
          effective_training_months: adjustedMonths,
          classification_confidence: Math.min(0.9, totalConfidence / behavioralSignals.length),
          last_audit: new Date().toISOString(),
          behavioral_signals_count: behavioralSignals.length
        }
      })
      .eq('id', userId)
    
    return newAge
  }
  
  /**
   * Get current training age classification
   */
  private static async getCurrentTrainingAge(
    supabase: SupabaseClient,
    userId: string
  ): Promise<'beginner' | 'intermediate' | 'advanced' | 'highly_advanced'> {
    const { TrainingAgeService } = await import('./training-age-service.ts')
    return await TrainingAgeService.getEffectiveTrainingAge(supabase, userId)
  }
  
  /**
   * Generate simple performance feedback message
   */
  static generateSimplePerformanceFeedback(
    metrics: {
      targetAchievementRate: number
      workoutPostponements: number
      averageDaysBetweenWorkouts: number
    }
  ): string {
    if (metrics.targetAchievementRate > 0.8) {
      return `Great job hitting ${Math.round(metrics.targetAchievementRate * 100)}% of your target weights!`
    } else if (metrics.targetAchievementRate < 0.6) {
      return "You're missing target weights frequently - should we adjust the program?"
    } else if (metrics.averageDaysBetweenWorkouts > 4) {
      return "You've been spacing workouts further apart - consider adjusting your schedule"
    }
    
    return "You're staying consistent with your training!"
  }
  
  
  
  
  
}
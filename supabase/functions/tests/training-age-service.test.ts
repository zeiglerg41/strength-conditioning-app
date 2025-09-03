/**
 * Unit Tests for TrainingAgeService
 * Tests NSCA research-backed training age classification system
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/testing/asserts.ts"
import { TrainingAgeService, NSCATrainingFactors, TrainingAge } from '../_shared/services/training-age-service.ts'

// Mock Supabase client for testing
const mockSupabase = {
  from: (table: string) => ({
    select: (columns: string) => ({
      eq: (column: string, value: string) => ({
        single: () => Promise.resolve({ data: mockUserProfile })
      })
    })
  })
}

const mockUserProfile = {
  training_background: {
    current_streak_months: 6,
    total_break_months: 12,
    total_experience_months: 36,
    average_sessions_per_week: 3,
    has_used_programs: true,
    understands_rpe: false
  },
  movement_competencies: {
    squat: { experience_level: 3 },
    deadlift: { experience_level: 4 },
    bench_press: { experience_level: 3 },
    overhead_press: { experience_level: 2 }
  },
  physical_profile: {}
}

Deno.test("TrainingAgeService - calculateEffectiveTrainingAge", async (t) => {
  
  await t.step("should calculate effective age for consistent trainer", () => {
    const factors: NSCATrainingFactors = {
      currentConsecutiveMonths: 18,
      totalDetrainingMonths: 2,
      totalChronologicalMonths: 24,
      technicalProficiency: 4.0,
      averageSessionsPerWeek: 4,
      hasUsedPeriodization: true,
      understandsRPE: true
    }
    
    const effectiveAge = TrainingAgeService.calculateEffectiveTrainingAge(factors)
    
    // Expected: (24 * 1.33 - 1.2 + 3.6) * 1.33 ≈ 46 months
    assertEquals(Math.round(effectiveAge), 46)
  })
  
  await t.step("should penalize inconsistent 10-year trainer", () => {
    const factors: NSCATrainingFactors = {
      currentConsecutiveMonths: 4,
      totalDetrainingMonths: 36, // 3 years of breaks
      totalChronologicalMonths: 120, // 10 years total
      technicalProficiency: 2.5,
      averageSessionsPerWeek: 2,
      hasUsedPeriodization: false,
      understandsRPE: false
    }
    
    const effectiveAge = TrainingAgeService.calculateEffectiveTrainingAge(factors)
    
    // Should be much lower than 120 months due to inconsistency and detraining  
    assertEquals(effectiveAge < 60, true, `Expected <60 months, got ${effectiveAge}`)
  })
  
  await t.step("should reward consistent beginner", () => {
    const factors: NSCATrainingFactors = {
      currentConsecutiveMonths: 12,
      totalDetrainingMonths: 1,
      totalChronologicalMonths: 15,
      technicalProficiency: 3.5,
      averageSessionsPerWeek: 4,
      hasUsedPeriodization: false,
      understandsRPE: false
    }
    
    const effectiveAge = TrainingAgeService.calculateEffectiveTrainingAge(factors)
    
    // Should get consistency bonus and high frequency multiplier
    assertEquals(effectiveAge > 20, true, `Expected >20 months, got ${effectiveAge}`)
  })
  
  await t.step("should handle zero values gracefully", () => {
    const factors: NSCATrainingFactors = {
      currentConsecutiveMonths: 0,
      totalDetrainingMonths: 0,
      totalChronologicalMonths: 0,
      technicalProficiency: 1,
      averageSessionsPerWeek: 1,
      hasUsedPeriodization: false,
      understandsRPE: false
    }
    
    const effectiveAge = TrainingAgeService.calculateEffectiveTrainingAge(factors)
    
    assertEquals(effectiveAge, 0)
  })
})

Deno.test("TrainingAgeService - classifyTrainingAge", async (t) => {
  
  await t.step("should classify beginner correctly", () => {
    assertEquals(TrainingAgeService.classifyTrainingAge(5), 'beginner')
    assertEquals(TrainingAgeService.classifyTrainingAge(14), 'beginner')
  })
  
  await t.step("should classify intermediate correctly", () => {
    assertEquals(TrainingAgeService.classifyTrainingAge(15), 'intermediate')
    assertEquals(TrainingAgeService.classifyTrainingAge(29), 'intermediate')
  })
  
  await t.step("should classify advanced correctly", () => {
    assertEquals(TrainingAgeService.classifyTrainingAge(30), 'advanced')
    assertEquals(TrainingAgeService.classifyTrainingAge(59), 'advanced')
  })
  
  await t.step("should classify highly advanced correctly", () => {
    assertEquals(TrainingAgeService.classifyTrainingAge(60), 'highly_advanced')
    assertEquals(TrainingAgeService.classifyTrainingAge(100), 'highly_advanced')
  })
})

Deno.test("TrainingAgeService - validateWithStrengthStandards", async (t) => {
  
  await t.step("should enforce performance floor", () => {
    const factors: NSCATrainingFactors = {
      currentConsecutiveMonths: 12,
      totalDetrainingMonths: 0,
      totalChronologicalMonths: 24,
      technicalProficiency: 2.0, // Low technique
      averageSessionsPerWeek: 3,
      hasUsedPeriodization: false,
      understandsRPE: false,
      strengthLevel: {
        benchRatio: 0.8,  // Weak
        squatRatio: 0.9,  // Weak  
        deadliftRatio: 1.0 // Weak
      }
    }
    
    const validated = TrainingAgeService.validateWithStrengthStandards('intermediate', factors)
    
    assertEquals(validated, 'beginner', 'Weak performance should enforce beginner status')
  })
  
  await t.step("should enforce performance ceiling", () => {
    const factors: NSCATrainingFactors = {
      currentConsecutiveMonths: 6,
      totalDetrainingMonths: 0,
      totalChronologicalMonths: 8,
      technicalProficiency: 3.5,
      averageSessionsPerWeek: 4,
      hasUsedPeriodization: true,
      understandsRPE: true,
      strengthLevel: {
        benchRatio: 1.3,  // Strong
        squatRatio: 1.6,  // Strong
        deadliftRatio: 2.0 // Strong
      }
    }
    
    const validated = TrainingAgeService.validateWithStrengthStandards('beginner', factors)
    
    assertEquals(validated, 'intermediate', 'Strong performance should prevent beginner classification')
  })
  
  await t.step("should maintain classification when appropriate", () => {
    const factors: NSCATrainingFactors = {
      currentConsecutiveMonths: 12,
      totalDetrainingMonths: 2,
      totalChronologicalMonths: 18,
      technicalProficiency: 3.0,
      averageSessionsPerWeek: 3,
      hasUsedPeriodization: false,
      understandsRPE: false,
      strengthLevel: {
        benchRatio: 1.1,  // Moderate
        squatRatio: 1.3,  // Moderate
        deadliftRatio: 1.5 // Moderate
      }
    }
    
    const validated = TrainingAgeService.validateWithStrengthStandards('intermediate', factors)
    
    assertEquals(validated, 'intermediate', 'Appropriate classification should be maintained')
  })
})

Deno.test("TrainingAgeService - extractTrainingFactors", async (t) => {
  
  await t.step("should extract factors from user profile", () => {
    // Use reflection to test private method
    const factors = (TrainingAgeService as any).extractTrainingFactors(mockUserProfile)
    
    assertEquals(factors.currentConsecutiveMonths, 6)
    assertEquals(factors.totalDetrainingMonths, 12)
    assertEquals(factors.totalChronologicalMonths, 36)
    assertEquals(factors.averageSessionsPerWeek, 3)
    assertEquals(factors.hasUsedPeriodization, true)
    assertEquals(factors.understandsRPE, false)
    
    // Technical proficiency should be average of movement competencies
    const expectedAvg = (3 + 4 + 3 + 2) / 4 // = 3.0
    assertEquals(factors.technicalProficiency, expectedAvg)
  })
  
  await t.step("should handle missing profile data", () => {
    const emptyProfile = {
      training_background: {},
      movement_competencies: {},
      physical_profile: {}
    }
    
    const factors = (TrainingAgeService as any).extractTrainingFactors(emptyProfile)
    
    assertEquals(factors.currentConsecutiveMonths, 0)
    assertEquals(factors.totalDetrainingMonths, 0)
    assertEquals(factors.totalChronologicalMonths, 0)
    assertEquals(factors.technicalProficiency, 1) // Default when no competencies
    assertEquals(factors.averageSessionsPerWeek, 2) // Default
  })
})

Deno.test("TrainingAgeService - getEffectiveTrainingAge integration", async (t) => {
  
  await t.step("should return training age from database profile", async () => {
    const trainingAge = await TrainingAgeService.getEffectiveTrainingAge(mockSupabase as any, 'test-user-id')
    
    // Based on mock profile: 36 months, 12 detraining, current 6 months, avg competency 3.0
    // Should classify as advanced due to calculation
    assertEquals(trainingAge, 'advanced')
  })
})

Deno.test("TrainingAgeService - loadBlueprintContent", async (t) => {
  
  await t.step("should load correct blueprint identifiers", async () => {
    const beginnerBlueprint = (TrainingAgeService as any).loadBlueprintContent('beginner')
    const intermediateBlueprint = (TrainingAgeService as any).loadBlueprintContent('intermediate')
    const advancedBlueprint = (TrainingAgeService as any).loadBlueprintContent('advanced')
    
    assertEquals(await beginnerBlueprint, 'BEGINNER_BLUEPRINT')
    assertEquals(await intermediateBlueprint, 'INTERMEDIATE_BLUEPRINT')
    assertEquals(await advancedBlueprint, 'ADVANCED_BLUEPRINT')
  })
  
  await t.step("should default to beginner for unknown training age", async () => {
    const unknownBlueprint = await (TrainingAgeService as any).loadBlueprintContent('unknown')
    assertEquals(unknownBlueprint, 'BEGINNER_BLUEPRINT')
  })
})

// Real-world scenario tests
Deno.test("TrainingAgeService - Real World Scenarios", async (t) => {
  
  await t.step("Scenario: College athlete returning after 5 years", () => {
    const factors: NSCATrainingFactors = {
      currentConsecutiveMonths: 3, // Just restarted
      totalDetrainingMonths: 60,   // 5 years off
      totalChronologicalMonths: 84, // 7 years total (2 years college + 5 years off)
      technicalProficiency: 4.0,   // Still remembers technique
      averageSessionsPerWeek: 4,   // Going hard now
      hasUsedPeriodization: true,  // College experience
      understandsRPE: true
    }
    
    const effectiveAge = TrainingAgeService.calculateEffectiveTrainingAge(factors)
    const classification = TrainingAgeService.classifyTrainingAge(effectiveAge)
    
    // Should be highly_advanced due to high competency and previous experience
    assertEquals(classification, 'highly_advanced')
  })
  
  await t.step("Scenario: Consistent gym-goer for 2 years", () => {
    const factors: NSCATrainingFactors = {
      currentConsecutiveMonths: 24,
      totalDetrainingMonths: 1, // Minimal breaks
      totalChronologicalMonths: 24,
      technicalProficiency: 3.5,
      averageSessionsPerWeek: 4,
      hasUsedPeriodization: false,
      understandsRPE: false
    }
    
    const effectiveAge = TrainingAgeService.calculateEffectiveTrainingAge(factors)
    const classification = TrainingAgeService.classifyTrainingAge(effectiveAge)
    
    // Should be advanced due to consistency bonus
    assertEquals(classification, 'advanced')
  })
  
  await t.step("Scenario: On-off trainer for 15 years", () => {
    const factors: NSCATrainingFactors = {
      currentConsecutiveMonths: 2,
      totalDetrainingMonths: 100, // Lots of breaks
      totalChronologicalMonths: 180, // 15 years
      technicalProficiency: 2.5, // Never quite got it down
      averageSessionsPerWeek: 2, // Low frequency
      hasUsedPeriodization: false,
      understandsRPE: false
    }
    
    const effectiveAge = TrainingAgeService.calculateEffectiveTrainingAge(factors)
    const classification = TrainingAgeService.classifyTrainingAge(effectiveAge)
    
    // Should still be advanced despite inconsistency due to total time
    assertEquals(classification, 'advanced')
  })
})
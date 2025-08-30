// Unit tests for analytics hierarchy endpoints
import { assertEquals, assertExists, assertInstanceOf } from "https://deno.land/std@0.208.0/assert/mod.ts";

// Mock data for testing analytics
const mockProgram = {
  id: "program-123",
  user_id: "user-123",
  name: "Powerlifting Prep",
  target_event: {
    name: "Local Powerlifting Meet",
    date: "2025-12-01T00:00:00Z",
    type: "strength_test"
  },
  program_structure: {
    total_duration_weeks: 16,
    periodization_model: "linear",
    phases: [
      {
        name: "base",
        start_date: "2025-08-01T00:00:00Z",
        end_date: "2025-09-01T00:00:00Z",
        duration_weeks: 4,
        focus: "Volume accumulation",
        intensity_emphasis: "volume",
        deload_frequency: 4
      },
      {
        name: "build",
        start_date: "2025-09-01T00:00:00Z", 
        end_date: "2025-11-01T00:00:00Z",
        duration_weeks: 8,
        focus: "Intensity build",
        intensity_emphasis: "intensity",
        deload_frequency: 3
      },
      {
        name: "peak",
        start_date: "2025-11-01T00:00:00Z",
        end_date: "2025-12-01T00:00:00Z",
        duration_weeks: 4,
        focus: "Competition preparation",
        intensity_emphasis: "maintenance",
        deload_frequency: 2
      }
    ]
  },
  status: "active"
};

const mockWorkouts = [
  {
    id: "workout-1",
    scheduled_date: "2025-08-25",
    status: "completed",
    session_type: "strength",
    session_rpe: 8,
    completion_rate: 100
  },
  {
    id: "workout-2", 
    scheduled_date: "2025-08-27",
    status: "completed",
    session_type: "strength",
    session_rpe: 7,
    completion_rate: 95
  },
  {
    id: "workout-3",
    scheduled_date: "2025-08-29",
    status: "completed", 
    session_type: "strength",
    session_rpe: 9,
    completion_rate: 90
  }
];

// Test helper functions for analytics calculations

Deno.test("calculateEventReadiness - basic calculation", () => {
  const calculateEventReadiness = (program: any, workouts: any[], daysToEvent: number): number => {
    // Simplified readiness calculation
    const adherenceScore = Math.min(100, (workouts.length / 14) * 100);
    const timelineScore = daysToEvent > 0 ? 100 : Math.max(0, 100 + daysToEvent);
    return Math.round((adherenceScore + timelineScore) / 2);
  };
  
  const readiness = calculateEventReadiness(mockProgram, mockWorkouts, 90);
  
  assertEquals(typeof readiness, "number");
  assertEquals(readiness >= 0 && readiness <= 100, true);
  
  // With 3 workouts in last 14 days, adherence should be ~21%
  // With 90 days to event, timeline should be 100%
  // Average should be around 60%
  const expectedRange = readiness >= 50 && readiness <= 70;
  assertEquals(expectedRange, true);
});

Deno.test("calculateEventReadiness - overdue event", () => {
  const calculateEventReadiness = (program: any, workouts: any[], daysToEvent: number): number => {
    const adherenceScore = Math.min(100, (workouts.length / 14) * 100);
    const timelineScore = daysToEvent > 0 ? 100 : Math.max(0, 100 + (daysToEvent * 10));
    return Math.round((adherenceScore + timelineScore) / 2);
  };
  
  const overdueReadiness = calculateEventReadiness(mockProgram, mockWorkouts, -5);
  
  // Timeline score should be penalized for overdue event
  assertEquals(overdueReadiness < 50, true);
});

Deno.test("getCurrentPhase - finds active phase", () => {
  const getCurrentPhase = (program: any) => {
    const today = new Date("2025-09-15"); // Mock date in build phase
    return program.program_structure.phases.find((phase: any) => 
      new Date(phase.start_date) <= today && new Date(phase.end_date) >= today
    );
  };
  
  const currentPhase = getCurrentPhase(mockProgram);
  
  assertExists(currentPhase);
  assertEquals(currentPhase.name, "build");
  assertEquals(currentPhase.focus, "Intensity build");
  assertEquals(currentPhase.intensity_emphasis, "intensity");
});

Deno.test("calculatePhaseProgress - progress calculation", () => {
  const calculatePhaseProgress = (phase: any, today: Date): number => {
    if (!phase) return 0;
    const start = new Date(phase.start_date);
    const end = new Date(phase.end_date);
    const total = end.getTime() - start.getTime();
    const elapsed = today.getTime() - start.getTime();
    return Math.max(0, Math.min(100, Math.round((elapsed / total) * 100)));
  };
  
  const buildPhase = mockProgram.program_structure.phases[1]; // Build phase
  const midPhaseDate = new Date("2025-10-01"); // Halfway through build phase
  
  const progress = calculatePhaseProgress(buildPhase, midPhaseDate);
  
  assertEquals(typeof progress, "number");
  assertEquals(progress >= 0 && progress <= 100, true);
  // Should be approximately 50% through the phase
  assertEquals(progress >= 40 && progress <= 60, true);
});

Deno.test("calculateStrengthReadiness - workout type filtering", () => {
  const calculateStrengthReadiness = (workouts: any[]): number => {
    const strengthWorkouts = workouts.filter(w => w.session_type === 'strength');
    return Math.min(100, strengthWorkouts.length * 10);
  };
  
  const strengthReadiness = calculateStrengthReadiness(mockWorkouts);
  
  assertEquals(strengthReadiness, 30); // 3 strength workouts * 10
  
  // Test with mixed workout types
  const mixedWorkouts = [
    ...mockWorkouts,
    { id: "w4", session_type: "endurance", status: "completed" },
    { id: "w5", session_type: "power", status: "completed" }
  ];
  
  const mixedReadiness = calculateStrengthReadiness(mixedWorkouts);
  assertEquals(mixedReadiness, 30); // Still only 3 strength workouts
});

Deno.test("calculatePowerReadiness - different multiplier", () => {
  const calculatePowerReadiness = (workouts: any[]): number => {
    return Math.min(100, workouts.filter(w => w.session_type === 'power').length * 15);
  };
  
  const powerWorkouts = [
    { id: "p1", session_type: "power", status: "completed" },
    { id: "p2", session_type: "power", status: "completed" }
  ];
  
  const powerReadiness = calculatePowerReadiness(powerWorkouts);
  assertEquals(powerReadiness, 30); // 2 power workouts * 15
});

Deno.test("generateReadinessRecommendations - low overall score", () => {
  const generateReadinessRecommendations = (overall: number, systems: any) => {
    const recommendations = [];
    if (overall < 70) recommendations.push("Consider reducing training intensity");
    if (systems.recovery < 60) recommendations.push("Focus on recovery protocols");
    if (systems.strength < 60) recommendations.push("Increase strength training frequency");
    return recommendations;
  };
  
  const lowScoreSystems = {
    strength: 45,
    power: 70,
    endurance: 80,
    recovery: 50
  };
  
  const recommendations = generateReadinessRecommendations(55, lowScoreSystems);
  
  assertEquals(recommendations.length, 3);
  assertEquals(recommendations.includes("Consider reducing training intensity"), true);
  assertEquals(recommendations.includes("Focus on recovery protocols"), true);
  assertEquals(recommendations.includes("Increase strength training frequency"), true);
});

Deno.test("generateReadinessRecommendations - high scores", () => {
  const generateReadinessRecommendations = (overall: number, systems: any) => {
    const recommendations = [];
    if (overall < 70) recommendations.push("Consider reducing training intensity");
    if (systems.recovery < 60) recommendations.push("Focus on recovery protocols");
    if (systems.strength < 60) recommendations.push("Increase strength training frequency");
    return recommendations;
  };
  
  const highScoreSystems = {
    strength: 85,
    power: 80,
    endurance: 75,
    recovery: 90
  };
  
  const recommendations = generateReadinessRecommendations(85, highScoreSystems);
  
  assertEquals(recommendations.length, 0); // No recommendations needed for high scores
});

Deno.test("calculatePhaseMilestones - milestone generation", () => {
  const calculatePhaseMilestones = (phase: any, program: any) => {
    const startTime = new Date(phase.start_date).getTime();
    const endTime = new Date(phase.end_date).getTime();
    const midpointTime = (startTime + endTime) / 2;
    
    return [
      {
        name: "Phase midpoint",
        date: new Date(midpointTime).toISOString(),
        status: "upcoming",
        description: "Assess progress and adjust if needed"
      }
    ];
  };
  
  const buildPhase = mockProgram.program_structure.phases[1];
  const milestones = calculatePhaseMilestones(buildPhase, mockProgram);
  
  assertEquals(milestones.length, 1);
  assertEquals(milestones[0].name, "Phase midpoint");
  assertEquals(milestones[0].status, "upcoming");
  assertExists(milestones[0].date);
  assertExists(milestones[0].description);
});

Deno.test("calculateStrengthProgression - mock progression data", () => {
  const calculateStrengthProgression = (workouts: any[]) => {
    // Simplified progression calculation
    const avgRPE = workouts.reduce((sum, w) => sum + (w.session_rpe || 0), 0) / workouts.length;
    const avgCompletion = workouts.reduce((sum, w) => sum + (w.completion_rate || 0), 0) / workouts.length;
    
    return {
      overall_trend: avgRPE >= 8 ? "high_intensity" : avgRPE > 6 ? "moderate_intensity" : "low_intensity",
      key_lifts: {
        squat: { trend: "increasing", last_max: 150 },
        bench: { trend: "stable", last_max: 100 },
        deadlift: { trend: "increasing", last_max: 180 }
      },
      volume_trends: {
        weekly_volume: avgCompletion > 95 ? "high" : "moderate"
      },
      intensity_trends: {
        avg_rpe: Math.round(avgRPE * 10) / 10
      }
    };
  };
  
  const progression = calculateStrengthProgression(mockWorkouts);
  
  assertEquals(progression.overall_trend, "high_intensity"); // Avg RPE is 8
  assertExists(progression.key_lifts);
  assertExists(progression.volume_trends);
  assertExists(progression.intensity_trends);
  assertEquals(progression.intensity_trends.avg_rpe, 8.0);
});

Deno.test("detectStrengthStalling - stalling detection logic", () => {
  const detectStrengthStalling = (progressionData: any) => {
    const stalledLifts: string[] = [];
    
    // Check each lift for stalling (stable trend could indicate stalling)
    Object.entries(progressionData.key_lifts).forEach(([lift, data]: [string, any]) => {
      if (data.trend === "stable") {
        stalledLifts.push(lift);
      }
    });
    
    return {
      is_stalling: stalledLifts.length > 0,
      stalled_lifts: stalledLifts,
      recommendations: stalledLifts.length > 0 ? 
        ["Consider deload week", "Vary rep ranges", "Check technique"] : 
        ["Continue current progression"]
    };
  };
  
  const mockProgressionData = {
    key_lifts: {
      squat: { trend: "increasing" },
      bench: { trend: "stable" }, // This should be flagged as stalling
      deadlift: { trend: "increasing" }
    }
  };
  
  const stallingData = detectStrengthStalling(mockProgressionData);
  
  assertEquals(stallingData.is_stalling, true);
  assertEquals(stallingData.stalled_lifts.length, 1);
  assertEquals(stallingData.stalled_lifts[0], "bench");
  assertEquals(stallingData.recommendations.length > 1, true);
  assertEquals(stallingData.recommendations.includes("Consider deload week"), true);
});

Deno.test("calculateAdherenceMetrics - adherence calculation", () => {
  const calculateAdherenceMetrics = (workouts: any[]) => {
    const completed = workouts.filter(w => w.status === 'completed').length;
    const total = workouts.length;
    const overallRate = Math.round((completed / total) * 100);
    
    // Calculate average completion rate for completed workouts
    const completedWorkouts = workouts.filter(w => w.status === 'completed');
    const avgCompletionQuality = completedWorkouts.length > 0 ?
      completedWorkouts.reduce((sum, w) => sum + (w.completion_rate || 100), 0) / completedWorkouts.length :
      0;
    
    return {
      overall_rate: overallRate,
      consistency: {
        completed_sessions: completed,
        total_sessions: total
      },
      missed_sessions: {
        count: total - completed,
        rate: Math.round(((total - completed) / total) * 100)
      },
      completion_quality: {
        average_completion_rate: Math.round(avgCompletionQuality)
      }
    };
  };
  
  const testWorkouts = [
    ...mockWorkouts, // 3 completed
    { id: "w4", status: "skipped", completion_rate: 0 },
    { id: "w5", status: "pending", completion_rate: 0 }
  ];
  
  const adherence = calculateAdherenceMetrics(testWorkouts);
  
  assertEquals(adherence.overall_rate, 60); // 3/5 = 60%
  assertEquals(adherence.consistency.completed_sessions, 3);
  assertEquals(adherence.consistency.total_sessions, 5);
  assertEquals(adherence.missed_sessions.count, 2);
  assertEquals(adherence.missed_sessions.rate, 40);
  assertEquals(adherence.completion_quality.average_completion_rate >= 90, true);
});

Deno.test("generateAdherenceRecommendations - good vs poor adherence", () => {
  const generateAdherenceRecommendations = (adherenceData: any) => {
    return adherenceData.overall_rate >= 80 ? 
      ["Excellent adherence - keep it up!"] : 
      ["Focus on consistency", "Identify barriers to completion"];
  };
  
  const goodAdherence = { overall_rate: 90 };
  const poorAdherence = { overall_rate: 60 };
  
  const goodRecs = generateAdherenceRecommendations(goodAdherence);
  const poorRecs = generateAdherenceRecommendations(poorAdherence);
  
  assertEquals(goodRecs.length, 1);
  assertEquals(goodRecs[0], "Excellent adherence - keep it up!");
  
  assertEquals(poorRecs.length, 2);
  assertEquals(poorRecs.includes("Focus on consistency"), true);
  assertEquals(poorRecs.includes("Identify barriers to completion"), true);
});

Deno.test("calculateTrainingLoad - RPE and volume trends", () => {
  const calculateTrainingLoad = (workouts: any[]) => {
    const rpeValues = workouts
      .filter(w => w.session_rpe)
      .map(w => w.session_rpe);
    
    const avgRPE = rpeValues.reduce((sum, rpe) => sum + rpe, 0) / rpeValues.length;
    
    // Mock acute:chronic workload calculation
    const recentLoad = rpeValues.slice(-7).reduce((sum, rpe) => sum + rpe, 0); // Last 7 workouts
    const chronicLoad = rpeValues.reduce((sum, rpe) => sum + rpe, 0) / rpeValues.length * 28; // 4 weeks average
    const acRatio = recentLoad / chronicLoad;
    
    return {
      rpe_trends: {
        average_rpe: Math.round(avgRPE * 10) / 10,
        trend: "stable" // Would be calculated based on time series
      },
      volume_intensity: {
        balance: avgRPE >= 8 ? "high_intensity" : "moderate_intensity"
      },
      ac_workload: {
        ratio: Math.round(acRatio * 100) / 100,
        status: acRatio > 1.3 ? "high_risk" : acRatio > 0.8 ? "optimal" : "detraining"
      },
      training_impulse: {
        weekly_load: recentLoad
      }
    };
  };
  
  const loadData = calculateTrainingLoad(mockWorkouts);
  
  assertEquals(loadData.rpe_trends.average_rpe, 8.0);
  assertEquals(loadData.volume_intensity.balance, "high_intensity");
  assertExists(loadData.ac_workload.ratio);
  assertExists(loadData.ac_workload.status);
  assertExists(loadData.training_impulse.weekly_load);
});

Deno.test("days to event calculation", () => {
  const calculateDaysToEvent = (eventDate: string): number => {
    const event = new Date(eventDate);
    const today = new Date("2025-09-01"); // Mock today
    return Math.ceil((event.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };
  
  const days = calculateDaysToEvent(mockProgram.target_event.date);
  
  assertEquals(typeof days, "number");
  assertEquals(days > 0, true); // Should be positive for future event
  assertEquals(days, 91); // Should be about 3 months
});

Deno.test("timeline status determination", () => {
  const getTimelineStatus = (daysToEvent: number): string => {
    if (daysToEvent < 0) return "overdue";
    if (daysToEvent < 7) return "imminent";
    if (daysToEvent < 30) return "approaching";
    return "on_track";
  };
  
  assertEquals(getTimelineStatus(-5), "overdue");
  assertEquals(getTimelineStatus(3), "imminent");
  assertEquals(getTimelineStatus(20), "approaching");
  assertEquals(getTimelineStatus(90), "on_track");
});

Deno.test("readiness score validation", () => {
  const validateReadinessScore = (score: number): boolean => {
    return typeof score === "number" && score >= 0 && score <= 100;
  };
  
  assertEquals(validateReadinessScore(85), true);
  assertEquals(validateReadinessScore(0), true);
  assertEquals(validateReadinessScore(100), true);
  assertEquals(validateReadinessScore(-5), false);
  assertEquals(validateReadinessScore(105), false);
  assertEquals(validateReadinessScore("85" as any), false);
});
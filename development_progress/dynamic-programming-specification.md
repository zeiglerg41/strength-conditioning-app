# Dynamic Programming Specification
## Adaptive S&C Program Generation System

**Status**: 🔄 IN PROGRESS  
**Purpose**: Technical specification for dynamic program regeneration algorithms

---

## 🎯 Core Principle: Living, Breathing Programs

Unlike static fitness programs that break when real life intervenes, our system creates **adaptive programs** that intelligently regenerate when circumstances change. This is the key differentiator from all existing fitness apps.

### **Traditional Fitness Apps** (Static Programming):
- Generate program once → user follows rigidly → breaks when user skips days/travels
- Example: "Week 3: Squat 3x5 @ 225lbs" → User travels for work → program becomes unusable

### **Our System** (Dynamic Programming):
- Generate program → Monitor user behavior → Regenerate when needed → Maintain event readiness
- Example: "Week 3: Squat 3x5 @ 225lbs" → User travels → **Full regeneration** with bodyweight bridge program → Resume with appropriate weights

---

## 🔄 Program Regeneration Triggers

### 1. **Travel Mode Activation** (Full Regeneration Required)
**Trigger**: User specifies travel dates with different equipment access

**Why Full Regeneration**: 
- Linear progression interrupted (can't just "pick up where left off")
- Different movement patterns require adaptation period
- Timeline to event may need adjustment
- Volume/intensity balance changes with equipment constraints

**Algorithm**:
```typescript
if (travelPeriod.equipment_available !== currentProgram.required_equipment) {
  if (travelPeriod.duration_days > 7) {
    // Long travel - significant program restructuring needed
    regenerationScope = 'FULL_PROGRAM_FROM_TRAVEL_START';
    recalculateEventReadiness = true;
  } else if (missedCriticalLifts(travelPeriod)) {
    // Short travel but affects key movements
    regenerationScope = 'AFFECTED_MOVEMENTS_AND_TIMELINE';
    addTransitionWeek = true;
  }
}
```

### 2. **Missed Training Days** (Selective Regeneration)
**Trigger**: User skips prescribed training days

**Logic**:
- **Single missed day**: Prompt to move workout to today, no regeneration
- **2-3 missed days**: Timeline adjustment, possible deload insertion
- **>3 consecutive missed days**: Full regeneration from missed period

**Algorithm**:
```typescript
if (consecutiveMissedDays >= 3) {
  // Significant disruption - treat like injury/life change
  regenerationScope = 'FROM_LAST_COMPLETED_WORKOUT';
  reassessCurrentCapacity = true;
} else if (consecutiveMissedDays === 2) {
  // Minor adjustment - extend timeline
  addRecoveryDays = 2;
  adjustEventTimeline = true;
}
```

### 3. **Missed Test Days** (Timeline Extension)
**Trigger**: User doesn't complete scheduled performance tests within window

**Logic**:
- Tests are critical checkpoints for program adjustment
- Missed tests = unknown current capacity = conservative progression
- Add training days until test is completed

**Algorithm**:
```typescript
if (daysSinceScheduledTest > allowedTestWindow) {
  // Extend program until test is completed
  insertAdditionalTrainingDays = Math.min(daysSinceScheduledTest * 0.5, 14);
  maintainCurrentIntensity = true; // Don't progress without test data
  flagForTestPriority = true;
}
```

### 4. **Equipment Access Changes** (Context-Specific Regeneration)
**Trigger**: User adds/removes gym access, equipment changes at current gym

**Logic**:
- New equipment = new exercise possibilities
- Lost equipment = need alternatives and timeline adjustment
- Different equipment quality affects progression rates

### 5. **Event Date Changes** (Full Timeline Recalculation)
**Trigger**: User moves target event date

**Logic**:
- Earlier date = intensification required, possible goal adjustment
- Later date = can add base building, improve peak performance
- Completely different event = full program overhaul

---

## 📊 Regeneration Algorithms

### Core Regeneration Process
```typescript
interface RegenerationContext {
  trigger: 'travel' | 'missed_days' | 'missed_test' | 'equipment_change' | 'event_change';
  scope: 'full_program' | 'from_date' | 'timeline_only' | 'affected_movements';
  userCurrentState: {
    last_completed_workout: Date;
    current_capacity_estimate: CapacityMetrics;
    equipment_available: EquipmentAccess[];
    life_constraints: LifestyleConstraints;
  };
  eventConstraints: {
    target_date: Date;
    days_remaining: number;
    required_adaptations: AdaptationType[];
  };
}

function regenerateProgram(context: RegenerationContext): Program {
  // 1. Assess current state vs original program assumptions
  const stateAssessment = assessCurrentUserState(context);
  
  // 2. Recalculate optimal path to event given new constraints
  const optimalPath = calculateOptimalProgression(
    stateAssessment.current_capacity,
    context.eventConstraints,
    context.userCurrentState.equipment_available
  );
  
  // 3. Generate new program structure
  const newProgram = generateAdaptiveProgram({
    userProfile: context.userCurrentState,
    eventGoals: context.eventConstraints,
    progressionPath: optimalPath,
    regenerationReason: context.trigger
  });
  
  // 4. Validate against original goals and make adjustments
  return validateAndAdjustProgram(newProgram, context);
}
```

### Travel Mode Regeneration Algorithm
**Most Complex Scenario**: User on business trip with hotel gym access

```typescript
function handleTravelModeRegeneration(travelContext: TravelContext): Program {
  // Analyze equipment gap impact
  const equipmentGaps = analyzeEquipmentGaps(
    travelContext.home_equipment,
    travelContext.travel_equipment
  );
  
  if (equipmentGaps.affects_primary_movements) {
    // Major regeneration - bridge program needed
    return generateBridgeProgram({
      pre_travel_state: travelContext.last_completed_workout,
      travel_duration: travelContext.duration_days,
      available_movements: travelContext.travel_equipment.movement_patterns,
      post_travel_reintegration: true,
      event_timeline_adjustment: calculateTimelineAdjustment(equipmentGaps)
    });
  } else {
    // Minor adjustments - substitute exercises only
    return substituteExercises(
      travelContext.current_program,
      travelContext.travel_equipment
    );
  }
}
```

### Test Day Scheduling Algorithm
**Dynamic Test Insertion**: AI determines optimal test timing

```typescript
function scheduleTestDays(program: Program, userProfile: UserProfile): TestSchedule {
  const testSchedule: TestDay[] = [];
  
  program.phases.forEach((phase, index) => {
    // Test at phase transitions
    if (index > 0) {
      const testDay: TestDay = {
        scheduled_date: phase.start_date,
        test_type: 'phase_transition',
        required_tests: determinePhaseTransitionTests(phase.primary_focus),
        flexibility_window: 3, // days
        criticality: 'high'
      };
      testSchedule.push(testDay);
    }
    
    // Test mid-phase for long phases (>6 weeks)
    if (phase.duration_weeks > 6) {
      const midPhaseTest: TestDay = {
        scheduled_date: addWeeks(phase.start_date, Math.floor(phase.duration_weeks / 2)),
        test_type: 'progress_check',
        required_tests: determineMidPhaseTests(phase),
        flexibility_window: 7, // more flexible
        criticality: 'medium'
      };
      testSchedule.push(midPhaseTest);
    }
  });
  
  // Pre-event test (2-4 weeks before event)
  const preEventTest: TestDay = {
    scheduled_date: subtractWeeks(program.target_event.date, 3),
    test_type: 'pre_event_validation',
    required_tests: program.target_event.specific_requirements.competition_lifts,
    flexibility_window: 7,
    criticality: 'critical'
  };
  testSchedule.push(preEventTest);
  
  return testSchedule;
}
```

---

## 🔄 Sequential Day Completion Logic

### Completion Enforcement Rules
```typescript
interface WorkoutAccessRules {
  // Core rule: Cannot edit future days until current day complete
  canEditWorkout(workoutDate: Date, userCompletionState: CompletionState): boolean {
    const today = new Date();
    const lastCompletedWorkout = userCompletionState.last_completed_date;
    
    // Can always edit past workouts
    if (workoutDate < today) return true;
    
    // Can edit today if yesterday is complete (or it's program start)
    if (workoutDate === today) {
      return isYesterdayCompleteOrRestDay(lastCompletedWorkout, today) || isProgramStart(today);
    }
    
    // Cannot edit future days
    return false;
  }
}
```

### Skip Day Recovery System
```typescript
function handleSkippedDay(skippedWorkout: Workout, userCurrentDate: Date): SkipRecoveryAction {
  const daysSkipped = daysBetween(skippedWorkout.scheduled_date, userCurrentDate);
  
  if (daysSkipped === 1) {
    // Single skip - simple recovery
    return {
      action: 'MOVE_TO_TODAY',
      message: "Yesterday's workout moved to today. Complete it to unlock tomorrow's session.",
      program_impact: 'minimal'
    };
  } else if (daysSkipped <= 3) {
    // Short break - timeline adjustment
    return {
      action: 'TIMELINE_ADJUSTMENT',
      message: `${daysSkipped} workouts missed. Program timeline extended by ${daysSkipped} days.`,
      program_impact: 'moderate',
      timeline_shift: daysSkipped
    };
  } else {
    // Long break - regeneration required
    return {
      action: 'PROGRAM_REGENERATION',
      message: `Extended break detected. Program will be regenerated from your current fitness level.`,
      program_impact: 'significant',
      regeneration_scope: 'from_last_completed'
    };
  }
}
```

---

## 📈 Event Timeline Management

### Dynamic Timeline Adjustment
The program constantly recalculates "days to event readiness" based on:

1. **Completion Rate**: How consistently user is training
2. **Performance Trajectory**: Are they progressing as expected?
3. **Life Disruptions**: Travel, missed days, equipment changes
4. **Test Results**: Actual performance vs predicted performance

```typescript
function calculateEventReadiness(
  currentPerformance: PerformanceMetrics,
  targetRequirements: EventRequirements,
  daysRemaining: number,
  completionRate: number
): EventReadinessAssessment {
  
  const currentGap = calculatePerformanceGap(currentPerformance, targetRequirements);
  const requiredImprovementRate = currentGap / daysRemaining;
  const achievableImprovementRate = estimateAchievableRate(completionRate, userProfile);
  
  if (requiredImprovementRate > achievableImprovementRate * 1.2) {
    return {
      status: 'AT_RISK',
      recommendation: 'GOAL_ADJUSTMENT_OR_TIMELINE_EXTENSION',
      confidence: calculateConfidence(currentGap, achievableImprovementRate)
    };
  } else if (requiredImprovementRate < achievableImprovementRate * 0.8) {
    return {
      status: 'AHEAD_OF_SCHEDULE',
      recommendation: 'GOAL_ENHANCEMENT_OR_ADDITIONAL_OBJECTIVES',
      confidence: calculateConfidence(currentGap, achievableImprovementRate)
    };
  } else {
    return {
      status: 'ON_TRACK',
      recommendation: 'MAINTAIN_CURRENT_APPROACH',
      confidence: calculateConfidence(currentGap, achievableImprovementRate)
    };
  }
}
```

---

## 🎯 Implementation Requirements

### Database Requirements
- **Program versioning**: Store program history for rollback and comparison
- **Regeneration logging**: Track why and when programs were regenerated
- **Timeline tracking**: Maintain original vs current timelines
- **Context change events**: Log equipment changes, travel periods, missed days

### API Requirements
- **POST /programs/regenerate**: Trigger manual regeneration
- **PUT /programs/travel-mode**: Activate travel mode with equipment context
- **POST /programs/handle-missed-day**: Process skip day logic
- **GET /programs/timeline-analysis**: Current vs projected timeline
- **GET /programs/regeneration-history**: History of changes and reasons

### Background Job Requirements
- **Daily timeline check**: Assess if program adjustments needed
- **Test day monitoring**: Check for missed tests and extend timeline
- **Performance trajectory analysis**: Early warning for goal achievement risk

### User Interface Requirements
- **Regeneration notifications**: Clear communication about why program changed
- **Timeline visualization**: Show original vs current path to event
- **Manual regeneration controls**: Allow user-initiated regeneration with reason selection
- **Skip day recovery prompts**: Guide user through completion enforcement

---

## 🔍 Success Metrics

The dynamic programming system succeeds when:

1. **Event Readiness Maintained**: Users reach target events appropriately prepared despite life disruptions
2. **Program Adherence**: Higher completion rates due to realistic, adaptive programming
3. **User Satisfaction**: Users feel supported rather than abandoned when life interferes
4. **Performance Outcomes**: Better results than static programs due to intelligent adaptation

**Key Performance Indicators**:
- Program completion rate (target: >80% vs industry ~40%)
- Event performance achievement rate (target: >90% of users meet their goals)
- User retention after program disruptions (target: >85% continue vs restart)
- Time to recovery after missed training periods (target: <7 days to regain momentum)

---

This dynamic programming system transforms the typical "program broken by real life" experience into "program adapts to real life," creating genuine user value and strong differentiation from existing fitness applications.
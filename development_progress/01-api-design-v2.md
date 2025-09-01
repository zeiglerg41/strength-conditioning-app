# API Design & Contracts v2 - Enhanced User Profiling
## REST API Specification for Event-Driven S&C Programming

**Status**: 🔄 IN PROGRESS  
**Purpose**: Enhanced API contracts supporting detailed user profiling and equipment ecosystem

---

## 🎯 Key Enhancements from v1

### What We're Adding:
- **Enhanced User Profiling Endpoints** - Multi-step onboarding with competency assessment
- **Equipment & Gym Management** - User's complete gym access ecosystem  
- **Movement Pattern API** - Detailed competency tracking per pattern
- **Profile Completion Tracking** - Progressive onboarding with completion status
- **Exercise Exclusion Management** - Granular "will never do" exercise lists

### Core API Principles:
- **Event-Driven Programming** - All endpoints support reverse periodization from target events
- **Context-Aware Responses** - Equipment/gym availability affects all exercise recommendations
- **Progressive Profiling** - Users build comprehensive profiles over time
- **Movement Pattern Focus** - API organized around fundamental movement patterns

---

## 📋 API Design Checklist

### Authentication Endpoints
- [✅] **POST /auth/signup** - User registration with email/password
- [✅] **POST /auth/login** - User login returning JWT token
- [✅] **POST /auth/logout** - User logout (invalidate token)
- [✅] **POST /auth/refresh** - Refresh JWT token
- [✅] **POST /auth/forgot-password** - Password reset request
- [✅] **POST /auth/reset-password** - Password reset confirmation

### Enhanced User Management & Profiling
- [✅] **GET /users/profile** - Get current user profile with completion status
- [✅] **PUT /users/profile** - Update basic profile info
- [✅] **GET /users/profile/completion** - Get onboarding progress and next steps
- [✅] **PUT /users/profile/step** - Complete specific onboarding step
- [✅] **POST /users/onboarding/complete** - Finalize onboarding process

#### Training Background & Competencies
- [✅] **GET /users/training-background** - Get detailed training history
- [✅] **PUT /users/training-background** - Update training experience
- [✅] **GET /users/movement-competencies** - Get movement pattern assessments
- [✅] **PUT /users/movement-competencies/{pattern}** - Update specific movement competency
- [✅] **POST /users/movement-competencies/assess** - Complete movement assessment wizard

#### Physical Profile & Limitations
- [✅] **GET /users/physical-profile** - Get injuries, limitations, exclusions
- [✅] **PUT /users/physical-profile** - Update physical assessment
- [✅] **GET /users/exercise-exclusions** - Get "will never do" exercise list
- [✅] **POST /users/exercise-exclusions** - Add exercise exclusion
- [✅] **PUT /users/exercise-exclusions/{id}** - Update exclusion reason/alternative
- [✅] **DELETE /users/exercise-exclusions/{id}** - Remove exclusion
- [✅] **POST /users/injuries** - Log new injury
- [✅] **PUT /users/injuries/{id}** - Update injury status
- [✅] **DELETE /users/injuries/{id}** - Remove resolved injury

#### Equipment & Gym Ecosystem
- [✅] **GET /users/equipment-access** - Get complete gym access network
- [✅] **PUT /users/equipment-access** - Update equipment preferences
- [✅] **GET /users/gyms** - Get user's gym network with equipment details
- [✅] **POST /users/gyms** - Add gym to user's network
- [✅] **PUT /users/gyms/{id}** - Update gym access details (frequency, priority)
- [✅] **DELETE /users/gyms/{id}** - Remove gym from network
- [✅] **GET /users/available-movements** - Get movement patterns available across all gyms

#### Goals & Events (Event-Driven Core)
- [✅] **GET /users/goals** - Get performance goals and target events
- [✅] **PUT /users/goals** - Update goals and events
- [✅] **POST /users/goals/events** - Add new target event
- [✅] **PUT /users/goals/events/{id}** - Update target event details
- [✅] **DELETE /users/goals/events/{id}** - Remove target event
- [✅] **POST /users/goals/generate-challenge** - AI-generate performance challenge

#### Lifestyle & Constraints
- [✅] **GET /users/lifestyle** - Get lifestyle factors and constraints
- [✅] **PUT /users/lifestyle** - Update lifestyle information
- [✅] **PUT /users/constraints** - Update training constraints

### Equipment & Gym Database Management
- [✅] **GET /equipment-categories** - Get all equipment types with movement patterns
- [✅] **GET /equipment-categories/{id}** - Get specific equipment details
- [✅] **GET /gyms/search** - Search gyms by location/name
- [✅] **GET /gyms/{id}** - Get specific gym details and equipment
- [✅] **POST /gyms** - Create new gym entry (user-contributed)
- [✅] **PUT /gyms/{id}/equipment** - Update gym equipment availability
- [✅] **GET /gyms/{id}/users** - Get user community at gym (privacy-respecting)

### Program Generation (Event-Driven)
- [✅] **POST /programs/generate** - Generate program for specific event/timeline
- [✅] **GET /programs/current** - Get active program overview
- [✅] **GET /programs/{id}** - Get specific program details
- [✅] **PUT /programs/{id}/regenerate** - Regenerate program (life changes)
- [✅] **DELETE /programs/{id}** - Delete program
- [✅] **POST /programs/{id}/extend** - Extend timeline (event date changed)
- [✅] **PUT /programs/{id}/context** - Update context (travel, equipment change)

### Daily Workout & Adaptations
- [✅] **GET /workouts/today** - Get today's workout with current context
- [✅] **GET /workouts/{id}** - Get specific workout details
- [✅] **POST /workouts/today/deload-options** - Get 1-2 deload options (if eligible)
- [✅] **PUT /workouts/today/apply-deload** - Apply volume or intensity deload
- [✅] **GET /workouts/deload-eligibility** - Check if user can deload today
- [✅] **POST /workouts/{id}/start** - Start workout session
- [✅] **PUT /workouts/{id}/log** - Log exercise data (sets/reps/RPE)
- [✅] **POST /workouts/{id}/complete** - Complete workout
- [✅] **PUT /workouts/{id}/modify** - Manual workout modification
- [✅] **POST /workouts/travel-mode** - Toggle travel mode (bodyweight/hotel gym)
- [✅] **GET /workouts/upcoming** - Preview next 7 days

### Context-Aware Exercise Selection
- [✅] **GET /exercises/available** - Get exercises for current user context
- [✅] **GET /exercises/{id}** - Get specific exercise details
- [✅] **GET /exercises/substitutes/{id}** - Get alternatives for current context
- [✅] **POST /exercises/filter** - Filter exercises by equipment/constraints/preferences
- [✅] **GET /exercises/categories** - Get exercise categories available to user
- [✅] **GET /exercises/movement-patterns** - Get exercises by movement pattern

### Analytics & Progress (User Priority Hierarchy)

#### Primary: Event Progress Dashboard
- [✅] **GET /analytics/event-dashboard** - Main landing: event readiness, timeline, overall progress
- [✅] **GET /analytics/event-readiness** - Readiness score breakdown by training system
- [✅] **GET /analytics/phase-completion** - Current phase progress, upcoming milestones

#### Secondary: Training System Performance  
- [✅] **GET /analytics/strength-systems** - Overall strength progression, stalling detection
- [✅] **GET /analytics/power-speed-systems** - Power/speed development across energy systems
- [✅] **GET /analytics/endurance-systems** - Cardiovascular fitness, energy system development
- [✅] **GET /analytics/recovery-readiness** - Recovery patterns, training adaptation

#### Tertiary: Exercise-Specific Drill-Down
- [✅] **GET /analytics/strength-exercise/{exercise_id}** - Specific lift progression (bench, squat, etc.)
- [✅] **GET /analytics/energy-system-exercise/{exercise_id}** - Specific energy system work progressions
- [✅] **POST /analytics/performance-test** - Log performance test results
- [✅] **GET /analytics/heart-rate-trends/{exercise_id}** - HR at prescribed intensities over time

#### Supporting Analytics
- [✅] **GET /analytics/training-load** - RPE trends, volume/intensity balance
- [✅] **GET /analytics/adherence** - Training consistency, missed sessions analysis

---

## 📊 Enhanced Data Models

### Enhanced User Model (v2)
```json
{
  "id": "uuid",
  "email": "string",
  "profile_completion_status": {
    "basic_info": "boolean",
    "training_background": "boolean",
    "physical_assessment": "boolean", 
    "goals_events": "boolean",
    "equipment_access": "boolean",
    "lifestyle_constraints": "boolean"
  },
  "profile_completion_percentage": "number", // 0-100
  "onboarding_completed_at": "timestamp|null",
  
  "profile": {
    "name": "string",
    "date_of_birth": "date",
    "gender": "male|female|other|prefer_not_to_say",
    "height": "number", // cm
    "weight": "number", // kg
    "location": {
      "city": "string",
      "state": "string", 
      "country": "string",
      "timezone": "string"
    },
    "created_at": "timestamp",
    "updated_at": "timestamp"
  },
  
  "training_background": {
    // Overall experience metrics
    "total_training_months": "number",
    "strength_training_months": "number",
    "consistent_training_periods": [
      {
        "duration_months": "number",
        "program_type": "string", // "Starting Strength", "PPL", "Custom"
        "year_range": "string", // "2020-2021"
        "consistency": "high|moderate|low"
      }
    ],
    
    // Movement pattern competencies (key differentiator)
    "movement_competencies": {
      "squat_pattern": {
        "experience_level": "untrained|novice|intermediate|advanced",
        "variations_performed": ["back_squat", "front_squat", "goblet_squat"],
        "current_working_weight_kg": "number|null",
        "form_confidence": "low|moderate|high",
        "last_assessed": "date"
      },
      "deadlift_pattern": {
        "experience_level": "untrained|novice|intermediate|advanced",
        "variations_performed": ["conventional", "sumo", "trap_bar", "romanian"],
        "current_working_weight_kg": "number|null", 
        "form_confidence": "low|moderate|high",
        "last_assessed": "date"
      },
      "press_patterns": {
        "overhead_press": {
          "experience_level": "untrained|novice|intermediate|advanced",
          "variations_performed": ["military_press", "push_press", "dumbbell_press"],
          "current_working_weight_kg": "number|null",
          "form_confidence": "low|moderate|high"
        },
        "bench_press": {
          "experience_level": "untrained|novice|intermediate|advanced", 
          "variations_performed": ["flat_bench", "incline", "dumbbell", "close_grip"],
          "current_working_weight_kg": "number|null",
          "form_confidence": "low|moderate|high"
        }
      },
      "pull_patterns": {
        "pullups_chinups": {
          "experience_level": "untrained|novice|intermediate|advanced",
          "max_consecutive_reps": "number|null",
          "variations_performed": ["pullup", "chinup", "wide_grip", "assisted"],
          "form_confidence": "low|moderate|high"
        },
        "rows": {
          "experience_level": "untrained|novice|intermediate|advanced",
          "variations_performed": ["barbell_row", "dumbbell_row", "cable_row"],
          "current_working_weight_kg": "number|null",
          "form_confidence": "low|moderate|high"
        }
      },
      "hinge_patterns": {
        "hip_hinge": {
          "experience_level": "untrained|novice|intermediate|advanced",
          "variations_performed": ["romanian_deadlift", "good_morning", "hip_thrust"],
          "form_confidence": "low|moderate|high"
        },
        "single_leg": {
          "experience_level": "untrained|novice|intermediate|advanced", 
          "variations_performed": ["lunge", "step_up", "single_leg_deadlift"],
          "form_confidence": "low|moderate|high"
        }
      }
    },
    
    // Program history and periodization experience
    "periodization_experience": "boolean",
    "previous_programs_used": ["Starting_Strength", "5/3/1", "PPL", "StrongLifts"],
    "longest_consistent_program_months": "number",
    "program_adherence_typical": "high|moderate|low",
    
    // Sport and activity background
    "previous_sports": ["string"],
    "sport_years_played": {
      "sport_name": "number" // years played
    },
    "current_activities": ["resistance_training", "running", "cycling", "swimming", "sports"]
  },
  
  "physical_profile": {
    // Current limitations and conditions
    "current_limitations": [
      {
        "body_region": "lower_back|shoulder|knee|hip|wrist|ankle|neck|other",
        "condition": "string", // "herniated disc L4-L5", "rotator cuff strain"
        "severity": "minor|moderate|severe",
        "pain_level": "number", // 0-10 scale
        "medical_clearance": "boolean", // Doctor approval to train
        "movement_restrictions": ["overhead_pressing", "spinal_flexion", "deep_squatting"],
        "pain_triggers": ["heavy_loading", "end_range_motion", "repetitive_motion"],
        "treatment_status": "none|physical_therapy|medical|surgical",
        "notes": "string"
      }
    ],
    
    // Absolute exercise exclusions (critical for AI programming)
    "absolute_exercise_exclusions": [
      {
        "exercise_name": "string", // "Overhead Press", "Back Squat"
        "exclusion_type": "movement_pattern|specific_exercise|equipment_type",
        "reason": "injury_history|current_pain|medical_restriction|personal_preference",
        "alternative_preferred": "string|null", // "Landmine Press instead of Overhead Press"
        "severity": "absolute|conditional", // absolute = never, conditional = depends on context
        "notes": "string",
        "created_at": "timestamp"
      }
    ],
    
    // Movement limitations and required modifications
    "movement_modifications": [
      {
        "movement_pattern": "string", // "overhead_reaching", "hip_flexion"
        "modification_type": "range_of_motion|load_limitation|tempo_restriction|assistance_required",
        "details": "string", // "limited to 90% overhead reach", "max 50% 1RM"
        "applies_to_exercises": ["string"] // specific exercises affected
      }
    ],
    
    // Injury history (impacts exercise selection and progression)
    "injury_history": [
      {
        "injury_type": "string", // "ACL tear", "herniated disc"
        "body_region": "string",
        "year_occurred": "number",
        "surgery_required": "boolean",
        "surgery_type": "string|null",
        "full_recovery": "boolean",
        "ongoing_considerations": "string", // "avoid knee valgus", "maintain hip mobility"
        "return_to_activity_timeline": "string", // "6 months", "2 years"
        "lessons_learned": "string" // what user learned about training/recovery
      }
    ]
  },
  
  "performance_goals": {
    // Primary target event (drives periodization) - our key differentiator
    "primary_target_event": {
      "event_name": "string", // "Spring Powerlifting Meet", "Marathon PR Attempt" 
      "target_date": "date",
      "event_type": "powerlifting_meet|athletic_competition|military_test|endurance_race|strength_goal|general_fitness",
      "importance_level": "high|moderate", // affects program intensity
      "specific_requirements": {
        "competition_lifts": [
          {
            "lift_name": "string", // "Back Squat", "Bench Press", "Deadlift"
            "current_max_kg": "number|null",
            "target_max_kg": "number|null",
            "priority": "high|medium|low" // which lifts to focus on
          }
        ],
        "weight_class_target": "number|null", // kg
        "performance_standards": {
          "metric_name": "number" // "5k_time": 1200 (seconds)
        },
        "event_specific_notes": "string" // venue, rules, special considerations
      },
      "preparation_status": "just_started|early_prep|mid_prep|peak_phase|maintenance"
    },
    
    // Secondary events and long-term goals
    "secondary_events": [
      {
        // Similar structure to primary event
        "event_name": "string",
        "target_date": "date", 
        "event_type": "string",
        "priority": "high|medium|low",
        "conflicts_with_primary": "boolean", // scheduling conflicts
        "specific_requirements": {}
      }
    ],
    
    // Ongoing objectives (not event-specific)
    "continuous_goals": [
      {
        "goal_type": "strength_gain|muscle_gain|fat_loss|power_development|endurance|mobility|injury_prevention",
        "target_metrics": {
          "bodyweight_change_kg": "number",
          "body_fat_percentage": "number",
          "squat_1rm_kg": "number"
          // etc.
        },
        "timeline": "ongoing|short_term|long_term", // 3 months, 6 months, 1+ year
        "priority": "high|medium|low"
      }
    ],
    
    // Motivation and training style preferences
    "training_motivations": ["competition", "health_longevity", "appearance", "performance", "stress_relief", "social"],
    "preferred_training_style": "powerlifting|bodybuilding|general_strength|athletic_performance|endurance|functional_fitness",
    "goal_flexibility": "rigid|moderate|flexible" // how willing to adjust goals
  },
  
  "equipment_access": {
    // Primary gym and equipment ecosystem
    "primary_gym_id": "uuid",
    "gym_access_network": [
      {
        "gym_id": "uuid",
        "gym_name": "string", // denormalized for display
        "access_type": "primary|secondary|travel|temporary",
        "frequency": "daily|weekly|occasional",
        "priority_rank": "number", // 1 = primary, 2 = first backup, etc.
        "equipment_quality_notes": "string", // "limited plate selection", "always busy 6-8pm"
        "travel_time_minutes": "number",
        "cost": "free|membership|day_pass",
        "access_restrictions": "string" // "guest passes required", "closed weekends"
      }
    ],
    
    // Home gym setup
    "home_gym": {
      "has_home_gym": "boolean",
      "space_type": "garage|basement|spare_room|outdoor|apartment",
      "equipment_owned": [
        {
          "equipment_category_id": "uuid",
          "equipment_name": "string", // denormalized from categories
          "specifications": "string", // "adjustable up to 50kg", "full power rack with safeties"
          "condition": "excellent|good|fair|poor",
          "usage_frequency": "daily|weekly|occasional|backup_only"
        }
      ],
      "space_limitations": ["ceiling_height", "noise_restrictions", "shared_space"],
      "expansion_planned": "boolean",
      "preferred_for": ["quick_workouts", "bad_weather", "travel_prep"] // when home gym is preferred
    },
    
    // Travel and temporary access considerations
    "travel_considerations": {
      "travels_frequently": "boolean",
      "typical_travel_duration_days": "number",
      "travel_frequency_per_month": "number",
      "hotel_gym_experience": "good|poor|varies",
      "bodyweight_preference": "comfortable|acceptable|avoid", // comfort with bodyweight workouts
      "day_pass_budget": "number", // willing to spend per day pass
      "preferred_backup_exercises": ["string"] // go-to exercises when equipment limited
    }
  },
  
  "lifestyle": {
    // Work and schedule
    "employment_status": "full_time|part_time|student|unemployed|retired|self_employed",
    "work_schedule_type": "standard|shift_work|irregular|remote|flexible",
    "work_stress_level": "low|moderate|high|very_high",
    "commute_time_minutes": "number",
    "commute_method": "car|public_transport|bike|walk|work_from_home",
    
    // Training schedule preferences and constraints
    "preferred_training_days": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
    "sessions_per_week": "number", // realistic target
    "session_duration_preference": "number", // minutes
    "max_session_duration": "number", // absolute limit
    "time_of_day_preference": "early_morning|morning|lunch|afternoon|evening|late_night|flexible",
    "weekend_availability": "full|limited|unavailable",
    
    // Life constraints and obligations
    "family_obligations": {
      "level": "minimal|moderate|significant|overwhelming",
      "children_ages": ["number"], // affects training flexibility
      "caregiver_responsibilities": "none|minor|moderate|major",
      "partner_support": "very_supportive|supportive|neutral|unsupportive" // affects adherence
    },
    
    "other_commitments": [
      {
        "activity": "string", // "coaching kids soccer", "volunteer work"
        "frequency": "string", // "twice weekly", "weekends" 
        "time_commitment": "string", // "3 hours", "full day"
        "impact_on_training": "none|schedule_conflict|energy_drain|complementary"
      }
    ],
    
    // Recovery and lifestyle factors
    "sleep_patterns": {
      "typical_bedtime": "string", // "22:30"
      "typical_wake_time": "string", // "06:00"
      "sleep_quality": "poor|fair|good|excellent",
      "sleep_duration_hours": "number",
      "sleep_consistency": "very_consistent|consistent|variable|chaotic"
    },
    
    "stress_management": {
      "overall_stress_level": "low|moderate|high|very_high",
      "stress_sources": ["work", "family", "finances", "health", "training", "social"],
      "coping_strategies": ["exercise", "meditation", "social_support", "professional_help", "none"],
      "stress_impact_on_training": "minimal|moderate|significant|severe"
    },
    
    "nutrition_habits": {
      "consistency": "excellent|good|fair|poor",
      "cooking_frequency": "daily|weekly|occasionally|never",
      "dietary_restrictions": ["vegetarian", "vegan", "gluten_free", "dairy_free", "keto", "none"],
      "supplement_use": "regular|occasional|none",
      "hydration_habits": "excellent|good|fair|poor"
    },
    
    // Social and environmental factors
    "social_support": {
      "training_partner": "regular|occasional|none",
      "family_support": "very_supportive|supportive|neutral|unsupportive",
      "friend_support": "very_supportive|supportive|neutral|unsupportive",
      "community_involvement": "gym_community|online_community|training_group|none"
    }
  },
  
  "constraints": {
    // Time-based constraints
    "weekly_training_days": "number", // realistic commitment
    "absolute_rest_days": ["string"], // days that must be rest
    "blackout_dates": [
      {
        "start_date": "date",
        "end_date": "date", 
        "reason": "vacation|work_travel|family|medical",
        "training_impact": "none|reduced|suspended"
      }
    ],
    
    // Physical and recovery constraints
    "fatigue_sensitivity": "low|moderate|high", // how quickly user gets overtrained
    "recovery_speed": "fast|average|slow", // between sessions
    "injury_risk_tolerance": "low|moderate|high", // affects exercise selection
    
    // Preference constraints
    "exercise_preferences": {
      "strongly_prefer": ["string"], // exercises user loves
      "strongly_avoid": ["string"], // exercises user dislikes (not exclusions)
      "variety_preference": "high|moderate|low" // wants variety vs. consistency
    },
    
    "training_environment_preferences": {
      "music": "required|preferred|indifferent|distracting",
      "crowd_tolerance": "prefer_busy|indifferent|prefer_quiet",
      "cleanliness_importance": "critical|important|moderate|low"
    }
  }
}
```

### Equipment Category Model
```json
{
  "id": "uuid",
  "name": "string", // "Barbell", "Leg Press Machine", "Cable Station"
  "category_type": "free_weights|machines|bodyweight|cardio",
  "movement_patterns": ["squat", "press", "pull", "hinge", "carry"], // what movements this enables
  "description": "string",
  "common_variations": ["string"], // "Olympic barbell", "Standard barbell"
  "space_requirements": "minimal|moderate|large",
  "skill_requirement": "beginner|intermediate|advanced",
  "safety_considerations": ["string"],
  "created_at": "timestamp"
}
```

### Gym Model
```json
{
  "id": "uuid", 
  "name": "string",
  "location": {
    "address": "string",
    "city": "string", 
    "state": "string",
    "country": "string",
    "coordinates": {
      "lat": "number",
      "lng": "number"
    }
  },
  "gym_type": "home|commercial|university|specialty",
  "equipment_available": {
    "equipment_category_id": "boolean" // true if available
  },
  "equipment_details": {
    "equipment_category_id": {
      "quantity": "number|string", // "2" or "full set" or "limited"
      "condition": "excellent|good|fair|poor",
      "notes": "string" // "limited weight selection", "often broken"
    }
  },
  "operating_hours": {
    "monday": {"open": "string", "close": "string"}, // "06:00", "22:00"
    "tuesday": {"open": "string", "close": "string"},
    // ... other days
    "24_7": "boolean"
  },
  "access_requirements": {
    "membership_required": "boolean",
    "day_pass_available": "boolean",
    "day_pass_cost": "number",
    "guest_policy": "string"
  },
  "crowd_patterns": {
    "busy_times": ["string"], // "6-8am", "5-7pm"
    "quiet_times": ["string"], // "10am-2pm", "8-10pm"
  },
  "amenities": ["parking", "showers", "lockers", "childcare", "personal_training"],
  "user_rating": "number", // 1-5 stars average
  "user_review_count": "number",
  "verified": "boolean", // gym details verified by multiple users
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### User Gym Access Model
```json
{
  "id": "uuid",
  "user_id": "uuid", 
  "gym_id": "uuid",
  "gym_details": {
    // Denormalized gym info for display
    "name": "string",
    "location": "string",
    "gym_type": "string"
  },
  "access_type": "primary|secondary|travel|temporary",
  "frequency": "daily|weekly|occasional", 
  "priority_rank": "number", // 1 = primary, 2 = backup
  "membership_status": {
    "type": "member|day_pass|guest|owner", // for home gyms
    "cost_per_month": "number|null",
    "contract_end_date": "date|null"
  },
  "personal_notes": {
    "equipment_quality": "string", // "great barbells, limited dumbbells"
    "crowd_notes": "string", // "busy after 5pm", "friendly community"  
    "parking": "string", // "free parking", "street parking only"
    "travel_time": "number", // minutes from home/work
    "preferred_times": ["string"] // when user typically goes
  },
  "usage_stats": {
    "visits_per_month": "number",
    "last_visited": "date",
    "favorite_equipment": ["string"] // equipment user uses most
  },
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### Enhanced Workout Model (Daily Adaptive)
```json
{
  "id": "uuid",
  "program_id": "uuid",
  "scheduled_date": "date",
  "name": "string",
  "phase": "string",
  "week_in_phase": "number",
  "session_type": "strength|endurance|power|recovery|test",
  "original_prescription": {
    "exercises": [
      {
        "exercise_id": "uuid",
        "exercise_name": "string",
        "sets": "number",
        "reps": "string", // "8-10" or "8" or "AMRAP"
        "weight": "number|percentage|null", // 85% 1RM or absolute weight
        "rpe_target": "number|null",
        "rest_seconds": "number",
        "notes": "string"
      }
    ],
    "estimated_duration_minutes": "number"
  },
  "current_prescription": {
    "exercises": [], // Same structure as original, may be modified
    "modifications_applied": [
      {
        "type": "deload_volume|deload_intensity|equipment_substitute|travel_mode",
        "reason": "poor_sleep|high_stress|travel|equipment_unavailable",
        "changes": "string",
        "applied_at": "timestamp"
      }
    ]
  },
  "deload_eligibility": {
    "can_deload": "boolean",
    "days_since_last_deload": "number",
    "min_days_between_deloads": 4, // Literature-based: allow recovery between muscle group training
    "deloads_in_last_6_training_days": "number",
    "max_deloads_per_6_training_days": 1,
    "reason_blocked": "string|null", // "too_frequent", "recovery_needed", etc.
    "educational_message": {
      "title": "string|null",
      "message": "string|null", // e.g., "Frequent deloads indicate overreaching. Consider rest day, nutrition, sleep quality."
      "recommendations": ["rest_day", "nutrition_focus", "sleep_improvement", "stress_management"]
    }
  },
  "deload_options": [
    {
      "type": "volume_deload",
      "description": "Reduce sets by 25% (literature-based recommendation)",
      "available": "boolean", // based on eligibility
      "modifications": [
        {
          "exercise_id": "uuid",
          "original_sets": "number",
          "modified_sets": "number"
        }
      ]
    },
    {
      "type": "intensity_deload", 
      "description": "Reduce load by 15%, maintain volume",
      "available": "boolean", // based on eligibility
      "modifications": [
        {
          "exercise_id": "uuid",
          "original_weight": "number",
          "modified_weight": "number"
        }
      ]
    }
  ],
  "context": {
    "location_type": "home|commercial_gym|hotel|outdoor|bodyweight",
    "available_equipment": ["string"],
    "travel_mode": "boolean",
    "user_readiness": {
      "sleep_quality": "poor|fair|good|excellent|null",
      "stress_level": "low|moderate|high|null",
      "soreness": "none|mild|moderate|high|null",
      "motivation": "low|moderate|high|null"
    }
  },
  "actual_performance": {
    "exercises_completed": [
      {
        "exercise_id": "uuid",
        "sets_completed": [
          {
            "reps": "number",
            "weight": "number",
            "rpe": "number|null",
            "rest_duration_seconds": "number|null"
          }
        ]
      }
    ],
    "session_duration_minutes": "number|null",
    "session_rpe": "number|null", // Overall session difficulty
    "notes": "string"
  },
  "status": "pending|in_progress|completed|skipped|modified",
  "created_at": "timestamp",
  "started_at": "timestamp|null",
  "completed_at": "timestamp|null"
}
```

### Enhanced Exercise Model (Context-Filtered)
```json
{
  "id": "uuid",
  "name": "string",
  "category": "push|pull|squat|hinge|carry|core|power|endurance",
  "movement_pattern": "string",
  "primary_muscles": ["string"],
  "secondary_muscles": ["string"],
  "equipment_required": ["string"],
  "difficulty_level": "beginner|intermediate|advanced",
  "instructions": {
    "setup": "string",
    "execution": "string",
    "common_errors": ["string"],
    "progressions": ["string"],
    "regressions": ["string"]
  },
  "available_in_context": "boolean", // Based on current user context
  "substitutes": [
    {
      "exercise_id": "uuid",
      "exercise_name": "string", 
      "reason": "equipment_substitute|difficulty_adjustment|injury_modification",
      "available": "boolean" // Based on current context
    }
  ],
  "performance_metrics": {
    "trackable_variables": ["weight", "reps", "time", "distance"],
    "rpe_applicable": "boolean",
    "percentage_based": "boolean" // Can use %1RM
  }
}
```

### Enhanced Program Model (Event-Driven)
```json
{
  "id": "uuid",
  "user_id": "uuid", 
  "name": "string",
  
  // Event-driven core - what drives the entire program
  "target_event": {
    "name": "string",
    "date": "date", 
    "type": "powerlifting_meet|athletic_competition|military_test|endurance_race|strength_goal",
    "specific_requirements": {
      "competition_lifts": [
        {
          "lift_name": "string",
          "current_max": "number",
          "target_max": "number",
          "improvement_needed": "number" // calculated
        }
      ],
      "performance_standards": {},
      "event_location": "string",
      "event_rules": "string"
    },
    "importance": "high|moderate|low",
    "flexibility": "rigid|moderate|flexible" // can event date move?
  },
  
  // Generated program structure based on event and user profile
  "program_structure": {
    "total_duration_weeks": "number",
    "periodization_model": "linear|undulating|conjugate|block",
    "reverse_periodized": "boolean", // worked backward from event
    "phases": [
      {
        "name": "base|build|intensification|peak|recovery|test",
        "start_date": "date",
        "end_date": "date",
        "duration_weeks": "number", 
        "primary_focus": "string", // "build work capacity", "peak strength"
        "secondary_focus": ["string"],
        "intensity_emphasis": "volume|intensity|maintenance",
        "deload_frequency": "number", // every N weeks
        "key_adaptations": ["string"], // what we expect to develop
        "success_metrics": ["string"] // how to measure phase success
      }
    ]
  },
  
  // Current context affecting program execution
  "current_context": {
    "active_gym_id": "uuid",
    "available_equipment": ["uuid"], // equipment category IDs
    "travel_mode": "boolean",
    "context_limitations": ["string"], // current constraints
    "last_context_update": "timestamp",
    "context_stability": "stable|changing|unstable" // how often context changes
  },
  
  // Track all modifications made to original program
  "program_adaptations": [
    {
      "date": "date",
      "adaptation_type": "deload|equipment_substitute|travel_modification|injury_modification|life_change",
      "reason": "string",
      "affected_workouts": ["uuid"],
      "changes_made": "string", 
      "impact_assessment": "minimal|moderate|significant", // how much this affects goals
      "temporary": "boolean" // will this change revert?
    }
  ],
  
  // Performance tracking and milestone management
  "performance_tracking": {
    "baseline_tests": [
      {
        "exercise": "string",
        "result": "number",
        "unit": "kg|time|reps|distance",
        "date": "date",
        "testing_conditions": "string" // fresh, fatigued, etc.
      }
    ],
    "progress_checkpoints": [
      {
        "week": "number",
        "scheduled_tests": ["string"],
        "status": "upcoming|completed|skipped|delayed",
        "results": [
          {
            "test": "string",
            "result": "number", 
            "compared_to_baseline": "number", // % improvement
            "trend": "improving|plateauing|declining"
          }
        ]
      }
    ],
    "key_performance_indicators": [
      {
        "metric": "string", // "squat_1rm", "5k_time"
        "target_improvement": "number",
        "current_improvement": "number", 
        "on_track": "boolean",
        "projected_final": "number" // where we'll be at event
      }
    ]
  },
  
  // Program metadata and status
  "generation_details": {
    "ai_model_used": "string",
    "generation_date": "timestamp",
    "user_profile_version": "string", // snapshot of profile used
    "confidence_score": "number", // AI confidence in program suitability
    "customization_level": "high|moderate|low" // how tailored vs. template
  },
  
  "status": "active|completed|paused|regenerating|archived",
  "completion_percentage": "number", // 0-100
  "adherence_score": "number", // how well user is following program
  
  "created_at": "timestamp",
  "last_modified": "timestamp",
  "regeneration_history": [
    {
      "date": "timestamp",
      "reason": "string",
      "changes_made": "string"
    }
  ]
}
```

### Enhanced Analytics Response Models (User Priority Hierarchy)

#### Primary: Event Dashboard Response
```json
{
  "event_progress": {
    "event": {
      "name": "Powerlifting Meet",
      "date": "2024-04-15",
      "days_remaining": 42,
      "type": "strength_test"
    },
    "overall_readiness": {
      "score": 78, // 0-100
      "trend": "improving|stalling|declining",
      "confidence": "high|medium|low"
    },
    "system_breakdown": {
      "strength": {
        "score": 82,
        "trend": "improving",
        "status": "on_track|ahead|behind|stalling"
      },
      "power": {
        "score": 75, 
        "trend": "improving",
        "status": "on_track"
      },
      "endurance": {
        "score": 65,
        "trend": "stalling", 
        "status": "behind",
        "concern_level": "medium"
      },
      "recovery": {
        "score": 80,
        "trend": "stable",
        "status": "on_track"
      }
    },
    "phase_status": {
      "current_phase": "build",
      "week_in_phase": 3,
      "total_weeks_in_phase": 4,
      "completion_percentage": 75,
      "next_phase": "peak",
      "upcoming_tests": ["1RM squat assessment", "speed benchmark"]
    },
    "alerts": [
      {
        "type": "stalling|concern|milestone",
        "system": "endurance",
        "message": "Cardiovascular progression has stalled - consider aerobic base work",
        "action": "Review endurance training frequency"
      }
    ]
  }
}
```

#### Secondary: System Performance Response  
```json
{
  "strength_systems": {
    "overall_trend": "linear_progression|stalling|plateauing|declining", 
    "progression_rate": "faster_than_expected|on_track|slower_than_expected",
    "key_lifts": [
      {
        "exercise": "Back Squat",
        "current_1rm_estimate": 140,
        "baseline_1rm": 125,
        "improvement_percentage": 12,
        "trend_over_4_weeks": "linear_improvement",
        "projected_event_performance": 145,
        "target_event_performance": 150,
        "status": "slightly_behind"
      }
    ]
  },
  "power_speed_systems": {
    "energy_system_breakdown": {
      "pcr_system": { // 0-10 seconds
        "current_performance": "improving",
        "trend": "linear",
        "key_exercises": ["40m sprint", "broad jump"]
      },
      "glycolytic_system": { // 10 seconds - 2 minutes  
        "current_performance": "stalling",
        "trend": "plateau",
        "key_exercises": ["400m sprint", "2-min bike test"],
        "concern": "plateau_detected_needs_variation"
      }
    }
  },
  "endurance_systems": {
    "aerobic_base": {
      "vo2_max_estimate": 45,
      "baseline": 42,
      "improvement_percentage": 7.1,
      "trend": "slow_improvement"
    },
    "heart_rate_efficiency": {
      "zone_2_efficiency": "improving", // HR lower for same pace
      "zone_4_power": "stalling"
    }
  }
}
```

#### Tertiary: Exercise-Specific Drill-Down
```json
{
  "strength_exercise": {
    "exercise_name": "Bench Press",
    "progression_data": {
      "timeline": [
        {"date": "2024-01-01", "estimated_1rm": 95, "volume": 2850},
        {"date": "2024-02-01", "estimated_1rm": 102, "volume": 3250}
      ],
      "trend_analysis": {
        "progression_type": "linear|plateau|decline",
        "rate_per_week": 0.75, // kg per week
        "projected_event_1rm": 115,
        "stall_detection": false
      }
    }
  },
  "energy_system_exercise": {
    "exercise_name": "400m Sprint",
    "energy_system": "glycolytic", // 90-120 seconds
    "progression_data": {
      "timeline": [
        {"date": "2024-01-01", "time": 72.5, "avg_hr": 185, "recovery_hr_60s": 140},
        {"date": "2024-02-01", "time": 71.2, "avg_hr": 175, "recovery_hr_60s": 125}
      ],
      "heart_rate_efficiency": {
        "hr_at_prescribed_intensity": "decreasing", // good - more efficient
        "recovery_rate": "improving"
      }
    }
  }
}
```

---

## 🔐 Enhanced Authentication & Onboarding Flow

### Registration & Onboarding Flow (v2)
1. **POST /auth/signup** with email/password
2. Receive confirmation email and verify account
3. **Multi-Step Onboarding Process**:
   
   **Step 1: Basic Info (Required)**
   - **PUT /users/profile/step** with `step: "basic_info"`
   - Name, DOB, location, basic demographics
   
   **Step 2: Training Background Assessment (Critical)**  
   - **PUT /users/profile/step** with `step: "training_background"`
   - Overall training experience, consistency periods
   - **POST /users/movement-competencies/assess** for detailed movement assessment
   - Previous programs, periodization experience
   
   **Step 3: Physical Assessment (Critical)**
   - **PUT /users/profile/step** with `step: "physical_assessment"`
   - Current injuries/limitations via **POST /users/injuries**
   - Absolute exercise exclusions via **POST /users/exercise-exclusions**
   - Movement restrictions and modifications
   
   **Step 4: Goals & Target Events (Our Differentiator)**
   - **PUT /users/profile/step** with `step: "goals_events"` 
   - Primary target event via **POST /users/goals/events**
   - Secondary goals and motivations
   - Training style preferences
   
   **Step 5: Equipment & Gym Access (Critical for Programming)**
   - **PUT /users/profile/step** with `step: "equipment_access"`
   - Primary gym setup via **POST /users/gyms**
   - Home gym configuration
   - Travel considerations and backup options
   
   **Step 6: Lifestyle & Constraints**
   - **PUT /users/profile/step** with `step: "lifestyle_constraints"`
   - Work schedule, family obligations
   - Training preferences and time availability
   
4. **POST /users/onboarding/complete** to finalize onboarding
5. **POST /programs/generate** to create first personalized program
6. **POST /users/goals/generate-challenge** if no specific events selected

### Progressive Profile Enhancement
- **GET /users/profile/completion** - Check what's missing
- Users can return to complete sections over time
- Smart prompts for profile improvement based on program usage
- Seasonal updates for goals and equipment access changes

---

## 🆕 New API Endpoints Documentation

### Profile Completion Management

#### GET /users/profile/completion
**Purpose**: Get onboarding progress and identify next steps
```json
{
  "completion_status": {
    "basic_info": true,
    "training_background": false, 
    "physical_assessment": true,
    "goals_events": false,
    "equipment_access": true,
    "lifestyle_constraints": false
  },
  "completion_percentage": 50,
  "next_recommended_step": "training_background",
  "profile_readiness": {
    "ready_for_programming": false,
    "missing_critical_sections": ["training_background", "goals_events"],
    "optional_improvements": ["lifestyle_constraints"]
  },
  "onboarding_completed_at": null
}
```

#### PUT /users/profile/step
**Purpose**: Complete or update a specific onboarding step
```json
// Request
{
  "step": "training_background",
  "data": {
    "total_training_months": 24,
    "strength_training_months": 18,
    // ... step-specific data
  }
}

// Response  
{
  "step_completed": true,
  "completion_percentage": 66,
  "next_step": "physical_assessment"
}
```

### Movement Competency Assessment

#### GET /users/movement-competencies
**Purpose**: Get detailed movement pattern assessments
```json
{
  "squat_pattern": {
    "experience_level": "intermediate", 
    "current_working_weight_kg": 100,
    "form_confidence": "high",
    "variations_performed": ["back_squat", "front_squat", "goblet_squat"],
    "last_assessed": "2024-01-15"
  },
  "deadlift_pattern": {
    "experience_level": "advanced",
    "current_working_weight_kg": 140, 
    "form_confidence": "high",
    "variations_performed": ["conventional", "sumo", "romanian"],
    "last_assessed": "2024-01-15"
  }
  // ... other patterns
}
```

#### PUT /users/movement-competencies/{pattern}
**Purpose**: Update specific movement competency
```json
// Request
{
  "experience_level": "advanced",
  "current_working_weight_kg": 105,
  "form_confidence": "high", 
  "variations_performed": ["back_squat", "front_squat", "overhead_squat"]
}

// Response
{
  "updated": true,
  "competency_improvement_detected": true,
  "program_impact": "May suggest advanced variations and higher intensities"
}
```

### Exercise Exclusion Management

#### GET /users/exercise-exclusions
**Purpose**: Get complete list of exercises user will never do
```json
{
  "exclusions": [
    {
      "id": "uuid",
      "exercise_name": "Overhead Press",
      "exclusion_type": "movement_pattern",
      "reason": "injury_history", 
      "severity": "absolute",
      "alternative_preferred": "Landmine Press",
      "notes": "Shoulder impingement - cleared by physio for horizontal pressing only",
      "created_at": "2024-01-10"
    }
  ],
  "total_exclusions": 1,
  "patterns_affected": ["overhead_pressing"],
  "programming_impact": "moderate" // how much this limits program options
}
```

#### POST /users/exercise-exclusions
**Purpose**: Add new exercise exclusion
```json
// Request
{
  "exercise_name": "Back Squat",
  "exclusion_type": "specific_exercise",
  "reason": "knee_pain",
  "severity": "conditional", // only when knee bothers me
  "alternative_preferred": "Goblet Squat",
  "notes": "OK with light weight, avoid heavy back squats"
}

// Response
{
  "id": "uuid", 
  "created": true,
  "impact_analysis": {
    "programs_affected": ["current"],
    "alternatives_available": 8,
    "programming_complexity": "minimal" // easy to work around
  }
}
```

### Equipment & Gym Management

#### GET /users/gyms
**Purpose**: Get user's complete gym access network with equipment details
```json
{
  "primary_gym": {
    "gym_id": "uuid",
    "name": "Local Fitness Center",
    "access_type": "primary",
    "equipment_available": {
      "barbell": true,
      "dumbbells": true, 
      "leg_press": true,
      "cable_station": true
    },
    "personal_notes": "Great barbells, limited dumbbell selection, busy 5-7pm"
  },
  "backup_gyms": [
    {
      "gym_id": "uuid", 
      "name": "Home Gym",
      "access_type": "secondary",
      "priority_rank": 2,
      "equipment_available": {
        "dumbbells": true,
        "pull_up_bar": true,
        "resistance_bands": true
      }
    }
  ],
  "available_movement_patterns": ["squat", "press", "pull", "hinge", "carry"],
  "equipment_gaps": [], // movements not supported across all gyms
  "programming_flexibility": "high" // how much variety is possible
}
```

#### POST /users/gyms
**Purpose**: Add gym to user's access network
```json
// Request  
{
  "gym_id": "uuid", // existing gym, or null to create new
  "gym_details": {
    "name": "New Gym",
    "location": "Downtown",
    "gym_type": "commercial"
  },
  "access_type": "secondary",
  "frequency": "weekly",
  "membership_details": {
    "type": "day_pass",
    "cost_per_visit": 15
  }
}

// Response
{
  "gym_access_id": "uuid",
  "added": true, 
  "priority_rank": 3, // automatically assigned
  "equipment_analysis": {
    "new_movements_available": ["cable_rows"],
    "programming_options_increased": true
  }
}
```

#### GET /users/available-movements
**Purpose**: Get all movement patterns available across user's gym network
```json
{
  "available_movements": ["squat", "deadlift", "press", "pull", "hinge", "carry"],
  "movement_details": {
    "squat": {
      "available_at_gyms": ["primary", "secondary"],
      "equipment_options": ["barbell", "goblet", "leg_press"],
      "limitations": ["home_gym_weight_limited_to_50kg"]
    }
  },
  "gaps": [], // movements not available anywhere
  "recommendations": [
    "Consider adding resistance bands for travel workouts"
  ]
}
```

### Equipment Database

#### GET /equipment-categories
**Purpose**: Get all equipment types with movement patterns supported
```json
{
  "free_weights": [
    {
      "id": "uuid",
      "name": "Barbell", 
      "movement_patterns": ["squat", "deadlift", "press", "row"],
      "description": "Olympic barbell with weight plates",
      "skill_requirement": "intermediate"
    }
  ],
  "machines": [
    {
      "id": "uuid", 
      "name": "Leg Press Machine",
      "movement_patterns": ["squat"],
      "description": "Any leg press variation", 
      "skill_requirement": "beginner"
    }
  ],
  "bodyweight": [],
  "cardio": []
}
```

#### GET /gyms/search
**Purpose**: Search for gyms by location to add to user's network
```json
// Query params: ?location=city&type=commercial&equipment=barbell,dumbbells

{
  "results": [
    {
      "id": "uuid",
      "name": "Downtown Fitness", 
      "location": {
        "address": "123 Main St",
        "city": "Austin",
        "distance_km": 2.5
      },
      "gym_type": "commercial",
      "equipment_summary": {
        "free_weights": true,
        "machines": true, 
        "specialty": ["sauna", "pool"]
      },
      "user_rating": 4.2,
      "day_pass_cost": 20,
      "member_contributed": true // info from other users
    }
  ],
  "total_results": 15
}
```

---

## ⚠️ Enhanced Error Responses

### Profile Completion Errors (400)
```json
{
  "error": {
    "code": "PROFILE_INCOMPLETE_FOR_PROGRAMMING",
    "message": "Profile not complete enough to generate effective programs",
    "details": {
      "completion_percentage": 40,
      "missing_critical_sections": ["training_background", "goals_events"],
      "minimum_required_percentage": 60
    },
    "suggestions": [
      "Complete movement competency assessment", 
      "Add target event or primary goal",
      "Specify equipment access"
    ],
    "next_step_url": "/users/profile/completion"
  }
}
```

### Equipment Context Errors (400)
```json
{
  "error": {
    "code": "NO_GYMS_CONFIGURED", 
    "message": "Cannot generate program without gym or equipment access",
    "details": {
      "user_has_gyms": false,
      "home_gym_configured": false,
      "bodyweight_fallback_available": true
    },
    "suggestions": [
      "Add primary gym to your network",
      "Configure home gym equipment", 
      "Enable bodyweight-only programming"
    ]
  }
}
```

### Movement Assessment Errors (422)
```json
{
  "error": {
    "code": "MOVEMENT_COMPETENCY_MISMATCH",
    "message": "Working weight inconsistent with experience level",
    "details": {
      "movement": "squat_pattern", 
      "reported_level": "beginner",
      "working_weight_kg": 120,
      "expected_range_kg": "40-80"
    },
    "suggestions": [
      "Verify weight units (kg vs lbs)",
      "Double-check experience level",
      "Consider reassessment"
    ]
  }
}
```

### Standard Error Format (From v1)
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}, // Optional additional context
    "suggestions": ["string"], // Optional user actions
    "retry_after": "number|null" // Seconds for rate limits
  }
}
```

### Authentication & Authorization (401/403)
```json
{
  "error": {
    "code": "AUTH_TOKEN_EXPIRED",
    "message": "Your session has expired. Please log in again.",
    "suggestions": ["Use refresh token", "Redirect to login"]
  }
}
```

### Program Generation Errors (400/500/503)
```json
{
  "error": {
    "code": "PROGRAM_GENERATION_FAILED",
    "message": "Unable to generate program with current constraints",
    "details": {
      "provider": "openai|anthropic|ollama",
      "reason": "insufficient_time|conflicting_constraints|service_unavailable"
    },
    "suggestions": ["Adjust time constraints", "Try different event date", "Check equipment access"]
  }
}
```

### Deload Eligibility Violations (409)
```json
{
  "error": {
    "code": "DELOAD_TOO_FREQUENT",
    "message": "Deload not available - too many recent deloads",
    "details": {
      "days_since_last_deload": 2,
      "min_required_days": 4,
      "deloads_in_period": 2,
      "max_allowed": 1
    },
    "suggestions": ["Take rest day", "Focus on sleep/nutrition", "Consider program adjustment"]
  }
}
```

### Equipment Context Conflicts (400)
```json
{
  "error": {
    "code": "EQUIPMENT_UNAVAILABLE",
    "message": "Required equipment not available in current context",
    "details": {
      "required_equipment": ["barbell", "rack"],
      "available_equipment": ["dumbbells", "bodyweight"],
      "context": "travel_mode"
    },
    "suggestions": ["Switch to available equipment", "Exit travel mode", "Find alternative exercises"]
  }
}
```

### AI Service Errors (502/503/504)
```json
{
  "error": {
    "code": "AI_SERVICE_TIMEOUT",
    "message": "Program generation taking longer than expected",
    "details": {
      "provider": "openai",
      "timeout_seconds": 30,
      "complexity": "high"
    },
    "suggestions": ["Try again", "Simplify constraints", "Switch AI provider"],
    "retry_after": 60
  }
}
```

### Validation Errors (422)
```json
{
  "error": {
    "code": "INVALID_PERFORMANCE_DATA",
    "message": "Performance test results outside expected range",
    "details": {
      "field": "squat_1rm",
      "value": 500,
      "expected_range": "50-300",
      "user_bodyweight": 70
    },
    "suggestions": ["Check weight units (kg vs lbs)", "Verify exercise performed correctly"]
  }
}
```

### Rate Limiting (429)
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many program generations in short period",
    "details": {
      "limit": 3,
      "window_minutes": 60,
      "reset_time": "2024-01-01T15:30:00Z"
    },
    "retry_after": 1800
  }
}
```

### Business Logic Violations (409)
```json
{
  "error": {
    "code": "EVENT_DATE_INVALID",
    "message": "Target event date conflicts with program requirements",
    "details": {
      "event_date": "2024-01-15",
      "min_program_weeks": 8,
      "available_weeks": 3
    },
    "suggestions": ["Extend event date", "Choose shorter program", "Select different event"]
  }
}
```

---

## 🔄 Real-time Subscriptions (Supabase)

### Enhanced Subscription Channels
- [ ] **user_profile_completion:{user_id}** - Onboarding progress updates
- [ ] **user_gym_network:{user_id}** - Gym access changes
- [ ] **workout:{id}** - Live workout updates  
- [ ] **program:{user_id}** - Program changes
- [ ] **equipment_availability:{gym_id}** - Gym equipment status changes

## 📝 API Documentation Standards (From v1)

### Pagination
All list endpoints support:
- `?limit=` - Results per page (default: 20)
- `?offset=` - Skip N results
- `?sort=` - Sort field
- `?order=` - asc/desc

### Filtering
- Date ranges: `?start_date=&end_date=`
- Status filters: `?status=`
- Category filters: `?category=`

### Response Headers
- `X-Total-Count` - Total records for pagination
- `X-Request-ID` - Request tracking

---

## ✅ Enhanced Completion Criteria

Before moving to implementation:
- [✅] All new profiling endpoints defined with clear purposes
- [✅] Enhanced user model with detailed JSONB schemas
- [✅] Equipment and gym management endpoints specified
- [✅] Multi-step onboarding flow documented
- [✅] Movement competency assessment APIs defined
- [✅] Exercise exclusion management endpoints
- [✅] Enhanced error handling for profiling scenarios
- [✅] Progressive profile completion system designed
- [✅] Complete Workout Model with deload eligibility system merged from v1
- [✅] Enhanced Exercise Model with context filtering merged from v1
- [✅] Analytics Response Models (Event/System/Exercise-specific) merged from v1
- [✅] Comprehensive error response specifications merged from v1
- [✅] API pagination and filtering documentation merged from v1

**Key API Features Enhanced for v2:**
- Detailed movement competency assessment beyond simple experience levels
- Comprehensive equipment ecosystem management (primary + backup + travel)
- Absolute exercise exclusions with granular reasoning
- Event-driven goal structure supporting reverse periodization
- Progressive profile completion with smart recommendations
- Context-aware programming based on complete user equipment access

---

**Next Steps**: Implement enhanced mobile onboarding UI components and integrate with new API endpoints to create comprehensive user profiling experience.
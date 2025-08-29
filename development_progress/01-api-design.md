# API Design & Contracts
## REST API Specification for S&C Application

**Status**: ✅ COMPLETE  
**Purpose**: Define all API endpoints and data models BEFORE implementation

---

## 📋 API Design Checklist

### Authentication Endpoints
- [✅] **POST /auth/signup** - User registration with email/password
- [✅] **POST /auth/login** - User login returning JWT token
- [✅] **POST /auth/logout** - User logout (invalidate token)
- [✅] **POST /auth/refresh** - Refresh JWT token
- [✅] **POST /auth/forgot-password** - Password reset request
- [✅] **POST /auth/reset-password** - Password reset confirmation

### User Management
- [✅] **GET /users/profile** - Get current user profile
- [✅] **PUT /users/profile** - Update basic profile info
- [✅] **POST /users/onboarding** - Complete initial onboarding wizard
- [✅] **PUT /users/lifestyle** - Update lifestyle factors
- [✅] **PUT /users/training-background** - Update training history
- [✅] **PUT /users/equipment** - Update equipment access
- [✅] **PUT /users/goals** - Update performance goals
- [✅] **PUT /users/constraints** - Update training constraints
- [✅] **POST /users/goals/generate-challenge** - AI-generate performance challenge
- [✅] **PUT /users/injury** - Add/update injury information
- [✅] **DELETE /users/injury/{id}** - Remove resolved injury

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

### Analytics & Progress (Research-Based Metrics)
- [✅] **GET /analytics/strength-progression** - 1RM estimates, volume trends, strength ratios
- [✅] **GET /analytics/power-development** - Velocity metrics, power output, speed progression  
- [✅] **GET /analytics/endurance-performance** - VO2 estimates, time trials, HR zones
- [✅] **GET /analytics/training-load** - RPE trends, TRIMP, monotony/strain analysis
- [✅] **GET /analytics/recovery-patterns** - Readiness trends, deload frequency, sleep impact
- [✅] **GET /analytics/event-progress** - Progress toward target events/goals
- [✅] **GET /analytics/personal-records** - PRs with context (equipment, phase, conditions)
- [✅] **GET /analytics/adherence** - Training consistency, missed sessions analysis
- [✅] **POST /analytics/performance-test** - Log performance test results
- [✅] **GET /analytics/dashboard** - Personalized metrics overview based on user goals

---

## 📊 Data Models

### User Model
```json
{
  "id": "uuid",
  "email": "string",
  "profile": {
    "name": "string",
    "date_of_birth": "date",
    "gender": "male|female|other|prefer_not_to_say",
    "height": "number", // cm
    "weight": "number", // kg
    "address": {
      "city": "string",
      "state": "string", 
      "country": "string",
      "timezone": "string"
    },
    "created_at": "timestamp",
    "updated_at": "timestamp"
  },
  "lifestyle": {
    "employment_status": "full_time|part_time|student|unemployed|retired|self_employed",
    "work_schedule": "standard|shift|irregular|remote",
    "commute_distance": "number", // km one way
    "commute_method": "car|public_transport|bike|walk|work_from_home",
    "commute_duration_minutes": "number",
    "travel_for_work": {
      "frequency": "never|monthly|weekly|daily",
      "typical_duration_days": "number",
      "access_to_gym_while_traveling": "always|sometimes|never"
    },
    "daily_activity_level": "sedentary|lightly_active|moderately_active|very_active",
    "sleep_schedule": {
      "typical_bedtime": "string", // HH:MM
      "typical_wake_time": "string", // HH:MM
      "sleep_quality": "poor|fair|good|excellent"
    }
  },
  "training_background": {
    "training_age_years": "number",
    "experience_level": "beginner|novice|intermediate|advanced|expert",
    "previous_sports": ["string"],
    "current_activity_types": ["resistance_training", "cardio", "sports"],
    "injuries": [
      {
        "type": "string",
        "affected_areas": ["string"],
        "severity": "minor|moderate|major|chronic",
        "date_occurred": "date",
        "current_status": "healed|healing|ongoing|needs_modification"
      }
    ]
  },
  "equipment_access": {
    "primary_location": "home|commercial_gym|university_gym|corporate_gym|outdoor",
    "available_equipment": {
      "barbells": "boolean",
      "dumbbells": "boolean", 
      "kettlebells": "boolean",
      "resistance_bands": "boolean",
      "pull_up_bar": "boolean",
      "cardio_equipment": ["treadmill", "bike", "rower", "elliptical"],
      "specialized": ["platform", "rack", "cables", "machines"]
    },
    "backup_locations": [
      {
        "type": "home|gym|outdoor|bodyweight",
        "equipment": ["string"],
        "access_frequency": "daily|weekly|occasional|emergency_only"
      }
    ]
  },
  "performance_goals": {
    "primary_focus": "strength|power|endurance|general_fitness|sport_specific",
    "target_events": [
      {
        "name": "string",
        "date": "date",
        "type": "powerlifting|marathon|triathlon|military_test|sport_season|general",
        "specific_requirements": "string",
        "priority": "primary|secondary|aspirational"
      }
    ],
    "generated_challenges": [
      {
        "name": "string",
        "type": "strength|endurance|power|mobility",
        "target_date": "date",
        "description": "string"
      }
    ],
    "performance_metrics": {
      "track_strength": "boolean",
      "track_endurance": "boolean", 
      "track_power": "boolean",
      "track_mobility": "boolean",
      "preferred_tests": ["string"] // "5k run", "max squat", etc
    }
  },
  "constraints": {
    "weekly_training_days": "number",
    "preferred_session_duration_minutes": "number",
    "max_session_duration_minutes": "number",
    "preferred_training_times": ["morning", "lunch", "evening", "late_night"],
    "training_day_preferences": ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
    "absolute_rest_days": ["string"], // days that must be rest
    "fatigue_sensitivity": "low|moderate|high",
    "recovery_needs": "fast|average|slow"
  }
}
```

### Program Model (Event-Driven)
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "string",
  "target_event": {
    "name": "string",
    "date": "date",
    "type": "strength_test|endurance_event|sport_season|ai_generated",
    "specific_requirements": "string",
    "generated_by_ai": "boolean"
  },
  "program_structure": {
    "total_duration_weeks": "number",
    "periodization_model": "linear|undulating|conjugate|block",
    "phases": [
      {
        "name": "base|build|peak|recovery|test",
        "start_date": "date",
        "end_date": "date", 
        "duration_weeks": "number",
        "focus": "string",
        "intensity_emphasis": "volume|intensity|maintenance",
        "deload_frequency": "number" // every N weeks
      }
    ]
  },
  "current_context": {
    "travel_mode": "boolean",
    "available_equipment": ["string"],
    "location_type": "home|commercial_gym|hotel|outdoor|bodyweight",
    "last_updated": "timestamp"
  },
  "adaptations_applied": [
    {
      "date": "date",
      "type": "deload|equipment_change|travel|injury_modification",
      "description": "string",
      "affected_workouts": ["uuid"]
    }
  ],
  "performance_tracking": {
    "baseline_tests": [
      {
        "exercise": "string",
        "result": "number",
        "date": "date",
        "unit": "kg|km|time|reps"
      }
    ],
    "progress_checkpoints": [
      {
        "week": "number",
        "scheduled_tests": ["string"],
        "status": "upcoming|completed|skipped"
      }
    ]
  },
  "status": "active|completed|paused|regenerating",
  "created_at": "timestamp",
  "last_modified": "timestamp"
}
```

### Workout Model (Daily Adaptive)
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

### Exercise Model (Context-Filtered)
```json
{
  "id": "uuid",
  "name": "string",
  "category": "push|pull|squat|hinge|carry|core|power|endurance",
  "movement_pattern": "string",
  "primary_muscles": ["string"],
  "secondary_muscles": ["string"],
  "equipment_required": ["barbell", "dumbbell", "bodyweight", "resistance_band"],
  "equipment_alternatives": [
    {
      "equipment": ["string"],
      "variation_name": "string",
      "difficulty_modifier": "easier|same|harder"
    }
  ],
  "difficulty": "beginner|intermediate|advanced",
  "contraindications": {
    "injuries": ["knee", "shoulder", "back"],
    "mobility_requirements": ["ankle_dorsiflexion", "shoulder_flexion"],
    "strength_prerequisites": ["string"]
  },
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

---

## 🔐 Authentication Flow

### Registration Flow
1. **POST /auth/signup** with email/password
2. Receive confirmation email and verify account
3. **POST /users/onboarding** with comprehensive lifestyle assessment:
   - Basic profile (name, DOB, location)
   - Lifestyle factors (employment, commute, travel, sleep)
   - Training background (experience, sports, injuries)
   - Equipment access (primary/backup locations)
   - Performance goals (events, focus areas, metrics)
   - Training constraints (time, days, preferences)
4. **POST /programs/generate** to create first personalized program
5. **POST /users/goals/generate-challenge** if no specific events selected

### Login Flow
1. **POST /auth/login** with credentials
2. Receive JWT token
3. Include token in Authorization header for all requests
4. **POST /auth/refresh** when token expires

---

## ⚠️ Error Responses

### Standard Error Format
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

### Subscription Channels
- [ ] **workout:{id}** - Live workout updates
- [ ] **program:{user_id}** - Program changes
- [ ] **user:{id}** - Profile updates

---

## 📝 API Documentation Notes

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

## ✅ Completion Criteria

Before moving to database schema:
- [✅] All endpoints defined with clear purposes
- [✅] Request/response schemas documented  
- [✅] Data models finalized
- [✅] Error handling specified
- [✅] Authentication flow clear
- [✅] Real-time requirements identified

**Key API Features Completed:**
- Event-driven program generation with reverse periodization
- Literature-based deload frequency enforcement with education
- Context-aware exercise selection (no static library)
- Research-backed performance analytics and tracking
- Comprehensive error handling with actionable suggestions
- Daily workout adaptations and travel mode support

---

**Next Step**: Once all contracts are defined, proceed to `02-database-schema.md` to implement in Supabase.
# API Design & Contracts
## REST API Specification for S&C Application

**Status**: 🔄 IN PROGRESS  
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

### Program Generation
- [ ] **POST /programs/generate** - Generate new program
- [ ] **GET /programs/current** - Get active program
- [ ] **GET /programs/{id}** - Get specific program
- [ ] **PUT /programs/{id}/regenerate** - Regenerate program
- [ ] **DELETE /programs/{id}** - Delete program

### Workout Management
- [ ] **GET /workouts/today** - Get today's workout
- [ ] **GET /workouts/{id}** - Get specific workout
- [ ] **POST /workouts/{id}/start** - Start workout session
- [ ] **PUT /workouts/{id}/log** - Log exercise data
- [ ] **POST /workouts/{id}/complete** - Complete workout
- [ ] **PUT /workouts/{id}/modify** - Modify workout (fatigue override)

### Exercise Library
- [ ] **GET /exercises** - List all exercises
- [ ] **GET /exercises/{id}** - Get exercise details
- [ ] **GET /exercises/substitutes/{id}** - Get substitute exercises

### Analytics & Progress
- [ ] **GET /analytics/progress** - Get progress summary
- [ ] **GET /analytics/performance** - Get performance metrics
- [ ] **GET /analytics/adherence** - Get adherence stats
- [ ] **GET /analytics/personal-records** - Get PRs

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

### Program Model
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "name": "string",
  "start_date": "date",
  "end_date": "date",
  "phases": [
    {
      "name": "base|build|peak|recovery",
      "duration_weeks": "number",
      "focus": "string"
    }
  ],
  "status": "active|completed|paused",
  "created_at": "timestamp"
}
```

### Workout Model
```json
{
  "id": "uuid",
  "program_id": "uuid",
  "scheduled_date": "date",
  "name": "string",
  "phase": "string",
  "exercises": [
    {
      "exercise_id": "uuid",
      "sets": "number",
      "reps": "string", // "8-10" or "8"
      "weight": "number|null",
      "rpe": "number|null",
      "rest_seconds": "number"
    }
  ],
  "status": "pending|in_progress|completed|skipped",
  "actual_data": {} // Populated during workout
}
```

### Exercise Model
```json
{
  "id": "uuid",
  "name": "string",
  "category": "push|pull|squat|hinge|carry|core",
  "equipment": ["barbell", "dumbbell", "bodyweight"],
  "difficulty": "beginner|intermediate|advanced",
  "instructions": "string",
  "substitutes": ["uuid"] // IDs of substitute exercises
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
    "details": {} // Optional additional info
  }
}
```

### Common Error Codes
- [ ] Define 400 Bad Request scenarios
- [ ] Define 401 Unauthorized scenarios  
- [ ] Define 403 Forbidden scenarios
- [ ] Define 404 Not Found scenarios
- [ ] Define 409 Conflict scenarios
- [ ] Define 500 Server Error scenarios

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
- [ ] All endpoints defined with clear purposes
- [ ] Request/response schemas documented
- [ ] Data models finalized
- [ ] Error handling specified
- [ ] Authentication flow clear
- [ ] Real-time requirements identified

---

**Next Step**: Once all contracts are defined, proceed to `02-database-schema.md` to implement in Supabase.
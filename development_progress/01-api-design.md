# API Design & Contracts
## REST API Specification for S&C Application

**Status**: 🔄 IN PROGRESS  
**Purpose**: Define all API endpoints and data models BEFORE implementation

---

## 📋 API Design Checklist

### Authentication Endpoints
- [ ] **POST /auth/signup** - User registration
- [ ] **POST /auth/login** - User login  
- [ ] **POST /auth/logout** - User logout
- [ ] **POST /auth/refresh** - Refresh token
- [ ] **POST /auth/forgot-password** - Password reset request
- [ ] **POST /auth/reset-password** - Password reset confirmation

### User Management
- [ ] **GET /users/profile** - Get current user profile
- [ ] **PUT /users/profile** - Update user profile
- [ ] **POST /users/onboarding** - Complete onboarding
- [ ] **PUT /users/constraints** - Update training constraints
- [ ] **PUT /users/goals** - Update training goals

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
    "age": "number",
    "height": "number",
    "weight": "number",
    "training_experience": "beginner|intermediate|advanced",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  },
  "constraints": {
    "weekly_training_days": "number",
    "session_duration_minutes": "number",
    "equipment_access": ["barbell", "dumbbells", "kettlebells"],
    "travel_frequency": "never|monthly|weekly",
    "injuries": ["string"]
  },
  "goals": {
    "primary_goal": "strength|endurance|general_fitness",
    "target_event": {
      "name": "string",
      "date": "date",
      "type": "marathon|powerlifting|general"
    }
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
2. Receive confirmation email
3. **POST /users/onboarding** with profile data
4. **POST /programs/generate** to create first program

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
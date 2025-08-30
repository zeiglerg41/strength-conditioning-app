# Strength & Conditioning Program Generator
## AI-Powered Performance Training for Real Life

### 🎯 Vision
The first S&C app that generates complete **periodized training programs** (not just workouts) tailored to your actual lifestyle. Built on science-backed principles from Supertraining, Joel Jamieson's MMA S&C methods, and peer-reviewed periodization research.

### 🏆 What Makes This Different
- **Program Generator**: Creates full periodized programs, not random workouts
- **Lifestyle Integration**: Considers commute, work travel, equipment access, employment status
- **Performance Focus**: Trains for events and performance metrics, not aesthetics  
- **Adaptive Intelligence**: Adjusts based on fatigue, travel, equipment changes
- **Science-Backed**: Uses linear/undulating periodization principles from leading S&C literature
- **Universal Design**: Works for anyone - busy professionals to dedicated athletes

### 🧠 AI-Powered Adaptation
- Analyzes training age, lifestyle constraints, and goals
- Generates simulated performance events if you don't have real ones
- Adapts programs based on life changes (new job, travel, equipment access)
- Considers energy systems training alongside resistance work
- Built on swappable AI providers (OpenAI/Anthropic/Ollama)

### 🔬 Evidence-Based Programming
Programs generated from principles in:
- Supertraining (Siff & Verkhoshansky)
- Joel Jamieson's S&C for MMA
- Peer-reviewed periodization research
- Linear, undulating, and conjugate method programming

---

## 🏗️ Technical Architecture

### Core Stack
- **Database**: Supabase (PostgreSQL + Auth + Realtime)
- **Backend**: Supabase Edge Functions (Deno runtime) - 50+ API endpoints
- **Frontend**: React Native + Expo SDK 53 + React Native Elements
- **State Management**: Zustand + TanStack Query hybrid approach
- **Styling**: Styled-Components + React Native Vector Icons
- **AI/LLM**: Model-agnostic (OpenAI/Anthropic/Ollama via env var)
- **Cross-Platform**: iOS + Android + Desktop Web via React Native Web

### Key Features
✅ **API-First Development**: Contract-first with comprehensive testing  
✅ **Model-Agnostic AI**: Swappable AI providers via environment variable  
✅ **Context-Aware Exercises**: No static library - AI generates exercises based on equipment/location/injuries  
✅ **Analytics Hierarchy**: User-priority flow - Event progress → System performance → Exercise metrics  
✅ **Offline Support**: Critical for gym environments with poor connectivity  
✅ **Performance Optimized**: <60KB bundle size, selective re-rendering  

---

## 🚀 Development Status

### ✅ Phase 1: API Design (Complete)
- REST endpoints and data models defined
- Authentication flow specified
- Error handling standardized
- Performance tracking requirements established

### ✅ Phase 2: Database & Backend (Complete)  
- Supabase schema with 7 core tables implemented
- 50+ Edge Function endpoints deployed and tested
- Model-agnostic AI provider architecture
- Comprehensive unit test coverage (45+ tests)

### 📱 Phase 3: Frontend Development (In Progress)
- Technology stack finalized for optimal developer velocity
- Project setup and component architecture planned
- Authentication screens → Program generation → Workout tracking → Analytics

### 🎯 Phase 4: Testing & Deployment (Planned)
- End-to-end testing across platforms
- Performance optimization and monitoring
- Production deployment pipeline

---

## 📋 Getting Started

### Prerequisites
- Node.js v22.16.0+
- Expo CLI
- Supabase account
- AI Provider API key (OpenAI/Anthropic/Ollama)

### Backend Setup
```bash
# Clone and setup Supabase functions
cd supabase/functions
deno run --allow-all tests/run-tests.ts  # Verify backend
```

### Frontend Setup (Coming Soon)
```bash
# Create Expo project with dependencies
npm install react-native-elements styled-components
npm install zustand @tanstack/react-query
npm install @supabase/supabase-js
```

---

## 📚 Documentation Structure

- [`development_progress/00-essential-decisions.md`](./development_progress/00-essential-decisions.md) - Critical technical decisions
- [`development_progress/01-api-design.md`](./development_progress/01-api-design.md) - Complete API specification  
- [`development_progress/02-database-schema.md`](./development_progress/02-database-schema.md) - Database design and setup
- [`development_progress/03-backend-implementation.md`](./development_progress/03-backend-implementation.md) - Backend services and testing
- [`development_progress/04-frontend-setup.md`](./development_progress/04-frontend-setup.md) - Frontend architecture and setup

---

**Built for Performance Athletes and Busy Professionals Who Need Real Programs, Not Random Workouts** 💪
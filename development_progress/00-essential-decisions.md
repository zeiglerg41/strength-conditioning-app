# Essential Technical Decisions
## Must be decided BEFORE API Design

**Status**: ✅ COMPLETE - All critical decisions made, ready for API design

---

## ✅ Completed Decisions

### Development Environment
- [✅] **Node.js**: v22.16.0 installed
- [✅] **Package Manager**: npm
- [✅] **Version Control**: Git + GitHub
- [✅] **Database**: Supabase (PostgreSQL)
- [✅] **Authentication**: Supabase Auth

---

## ✅ Completed Decisions (Ready for API Design)

### AI/LLM Provider Decision
**Why needed now**: API design changes based on provider capabilities and pricing

- [✅] **Decision Made**: **Model-agnostic architecture with swappable providers**
  - Primary: Start with **OpenAI** for development (most documented)
  - Swap via single env var: `AI_PROVIDER=openai|anthropic|ollama`
  - Support OpenAI, Anthropic, and self-hosted Ollama models
  
**Implementation Timeline**:
- **Now (00)**: Design API to be provider-agnostic
- **Phase 03 (Backend)**: Implement OpenAI integration first
- **Phase 03 (Backend)**: Add Anthropic and Ollama adapters
- **Phase 06 (Testing)**: Test all providers thoroughly

### AI Integration Architecture
**Why needed now**: Determines how we structure program generation endpoints

- [✅] **Decision Made**: **Supabase Edge Functions**
  - Rationale: Keeps everything in one platform, simpler deployment
  - Deno runtime is sufficient for API calls to LLM providers
  - Auto-scaling handles concurrent users
  - Can always migrate later if needed
  
**Implementation Details**:
- Edge Functions will handle `/programs/generate` endpoint
- Simple adapter pattern for provider switching
- Environment variables control which provider to use

### Data Storage Strategy
**Why needed now**: Affects API response structure and caching

- [✅] **Program Storage Decision**: **Full programs in database**
  - Store complete generated programs as JSON
  - Rationale: Consistency, faster retrieval, version history
  - Programs are immutable once generated (can regenerate new ones)
  - Allows offline access and program comparison

- [✅] **Workout History Decision**: **Detailed logs with smart aggregation**
  - Store every set/rep for complete history
  - Create materialized views for daily/weekly summaries
  - 3-year retention for detailed logs
  - Permanent retention for aggregated metrics
  - Rationale: Full history for analytics, aggregation for performance

---

**NEXT**: ✅ All decisions complete! Proceed to 01-api-design.md
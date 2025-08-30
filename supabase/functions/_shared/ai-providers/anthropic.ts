// Anthropic Provider Implementation
// Secondary AI provider using Claude for program generation

import { AIProvider, ProgramGenerationContext, WorkoutAdaptationContext, PerformanceData } from './adapter.ts';
import { UserProfile, TargetEvent, Program, Workout } from '../types/api.ts';

export class AnthropicProvider implements AIProvider {
  private apiKey: string;
  private baseURL: string = 'https://api.anthropic.com/v1';
  private model: string = 'claude-3-5-sonnet-20241022'; // Latest Claude model as of 2025

  constructor() {
    this.apiKey = Deno.env.get('ANTHROPIC_API_KEY') || '';
    if (!this.apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
  }

  async generateProgram(
    userProfile: UserProfile, 
    targetEvent: TargetEvent,
    context?: ProgramGenerationContext
  ): Promise<Program> {
    const systemPrompt = `You are an expert strength and conditioning coach with deep knowledge of periodization principles from Supertraining (Siff & Verkhoshansky), Joel Jamieson's methods, and peer-reviewed S&C research.

Your task is to generate a complete periodized training program using REVERSE PERIODIZATION from the target event date. The program must:

1. Work backwards from the event to determine optimal periodization phases
2. Consider the user's lifestyle constraints (work, travel, equipment access)
3. Use evidence-based periodization models (linear, undulating, conjugate, or block)
4. Include specific deload weeks based on literature recommendations
5. Account for the user's training age and experience level
6. Focus on PERFORMANCE outcomes, not aesthetics

Return a complete program structure in JSON format matching the Program interface.`;

    const userPrompt = `Generate a periodized training program for:

USER PROFILE:
${JSON.stringify(userProfile, null, 2)}

TARGET EVENT:
${JSON.stringify(targetEvent, null, 2)}

CONTEXT:
${JSON.stringify(context, null, 2)}

The program must be scientifically sound, realistic given their constraints, and optimized for the target event. Include specific exercises, sets, reps, and RPE targets where appropriate.`;

    try {
      const response = await fetch(`${this.baseURL}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 4000,
          temperature: 0.7,
          messages: [
            {
              role: 'user',
              content: `${systemPrompt}\n\n${userPrompt}\n\nPlease respond with valid JSON only.`
            }
          ]
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const programData = JSON.parse(data.content[0].text);
      
      return this.validateProgramStructure(programData, userProfile.id);
    } catch (error) {
      console.error('Anthropic program generation error:', error);
      throw new Error(`Failed to generate program: ${error.message}`);
    }
  }

  async generateChallenge(
    userProfile: UserProfile,
    challengeType: 'strength' | 'endurance' | 'power' | 'general' = 'general'
  ) {
    const systemPrompt = `You are an expert S&C coach who creates motivating, achievable performance challenges.

Generate a specific, measurable challenge based on the user's current fitness level and goals. The challenge should:
1. Be achievable within 8-16 weeks based on their training age
2. Focus on performance metrics, not aesthetics
3. Be specific and measurable
4. Align with evidence-based training principles

Return a JSON object with name, type, target_date, and description fields.`;

    const userPrompt = `Create a ${challengeType} challenge for this user:
${JSON.stringify(userProfile, null, 2)}

Make it exciting but realistic given their experience level and constraints.`;

    try {
      const response = await fetch(`${this.baseURL}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 500,
          temperature: 0.8,
          messages: [
            {
              role: 'user',
              content: `${systemPrompt}\n\n${userPrompt}\n\nPlease respond with valid JSON only.`
            }
          ]
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return JSON.parse(data.content[0].text);
    } catch (error) {
      console.error('Anthropic challenge generation error:', error);
      throw new Error(`Failed to generate challenge: ${error.message}`);
    }
  }

  async adaptWorkout(workout: Workout, context: WorkoutAdaptationContext): Promise<Workout> {
    const systemPrompt = `You are an expert S&C coach who adapts workouts based on real-world constraints.

Your task is to modify the given workout based on the current context while maintaining the training stimulus as much as possible. Consider:
1. Available equipment limitations
2. Time constraints 
3. User readiness (sleep, stress, soreness)
4. Travel mode adaptations
5. Injury limitations

Return the modified workout in the same JSON structure, with explanations in the modifications_applied field.`;

    const userPrompt = `Adapt this workout based on current context:

ORIGINAL WORKOUT:
${JSON.stringify(workout, null, 2)}

CURRENT CONTEXT:
${JSON.stringify(context, null, 2)}

Maintain training stimulus while adapting to constraints.`;

    try {
      const response = await fetch(`${this.baseURL}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 2000,
          temperature: 0.5,
          messages: [
            {
              role: 'user',
              content: `${systemPrompt}\n\n${userPrompt}\n\nPlease respond with valid JSON only.`
            }
          ]
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const adaptedWorkout = JSON.parse(data.content[0].text);
      
      return { ...workout, ...adaptedWorkout };
    } catch (error) {
      console.error('Anthropic workout adaptation error:', error);
      throw new Error(`Failed to adapt workout: ${error.message}`);
    }
  }

  async generateDeloadOptions(
    workout: Workout,
    deloadReason: 'poor_sleep' | 'high_stress' | 'fatigue' | 'overreaching'
  ) {
    const systemPrompt = `You are an expert S&C coach who provides literature-based deload recommendations.

Based on current research, provide 1-2 deload options for the given workout. Options should:
1. Follow evidence-based deload protocols (typically 20-40% volume reduction OR 10-20% intensity reduction)
2. Maintain movement patterns while reducing stress
3. Be specific to the deload reason
4. Include clear explanations based on research

Return JSON array with type, description, and specific modifications.`;

    const userPrompt = `Provide deload options for:

WORKOUT:
${JSON.stringify(workout.current_prescription, null, 2)}

DELOAD REASON: ${deloadReason}

Base recommendations on current literature (Izquierdo, Helms, etc.).`;

    try {
      const response = await fetch(`${this.baseURL}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 1000,
          temperature: 0.3,
          messages: [
            {
              role: 'user',
              content: `${systemPrompt}\n\n${userPrompt}\n\nPlease respond with valid JSON only.`
            }
          ]
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const result = JSON.parse(data.content[0].text);
      return result.deload_options || [];
    } catch (error) {
      console.error('Anthropic deload generation error:', error);
      throw new Error(`Failed to generate deload options: ${error.message}`);
    }
  }

  async analyzePerformance(
    userProfile: UserProfile,
    performanceData: PerformanceData,
    program: Program
  ) {
    const systemPrompt = `You are an expert S&C coach and data analyst who provides actionable performance insights.

Analyze the performance data and provide:
1. Key insights about training adaptations
2. Specific recommendations for program adjustments
3. Identification of stalling patterns or overreaching
4. Suggestions for periodization modifications

Base analysis on evidence-based principles and current research.`;

    const userPrompt = `Analyze performance for:

USER: ${userProfile.profile.name} (${userProfile.training_background.experience_level})
PROGRAM: ${program.name} targeting ${program.target_event.name}

PERFORMANCE DATA:
${JSON.stringify(performanceData, null, 2)}

Provide actionable insights and recommendations.`;

    try {
      const response = await fetch(`${this.baseURL}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 1500,
          temperature: 0.4,
          messages: [
            {
              role: 'user',
              content: `${systemPrompt}\n\n${userPrompt}\n\nPlease respond with valid JSON only.`
            }
          ]
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return JSON.parse(data.content[0].text);
    } catch (error) {
      console.error('Anthropic performance analysis error:', error);
      throw new Error(`Failed to analyze performance: ${error.message}`);
    }
  }

  private validateProgramStructure(programData: any, userId: string): Program {
    const now = new Date().toISOString();
    
    return {
      id: crypto.randomUUID(),
      user_id: userId,
      name: programData.name || 'Generated Program',
      target_event: programData.target_event || {},
      program_structure: programData.program_structure || {},
      current_context: {
        travel_mode: false,
        available_equipment: [],
        location_type: 'home',
        last_updated: now
      },
      performance_tracking: programData.performance_tracking || {
        baseline_tests: [],
        progress_checkpoints: []
      },
      status: 'active'
    };
  }
}
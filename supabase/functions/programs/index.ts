// Program Generation Edge Function
// Handles AI-driven program generation, modification, and management

import { 
  createErrorResponse, 
  createSuccessResponse,
  ValidationError,
  NotFoundError 
} from '../_shared/utils/errors.ts';
import { 
  requireAuthentication,
  parseRequestBody 
} from '../_shared/utils/auth.ts';
import { 
  validateTargetEvent,
  validateUUID 
} from '../_shared/utils/validation.ts';
import { ProgramQueries, ContextQueries } from '../_shared/database/queries.ts';
import { AIProviderFactory } from '../_shared/ai-providers/adapter.ts';
import { UserProfile, TargetEvent, Program, ProgramGenerationContext } from '../_shared/types/api.ts';

interface GenerateProgramRequest {
  target_event: TargetEvent;
  context?: ProgramGenerationContext;
}

interface UpdateContextRequest {
  travel_mode: boolean;
  available_equipment: string[];
  location_type: 'home' | 'commercial_gym' | 'hotel' | 'outdoor' | 'bodyweight';
}

interface ExtendTimelineRequest {
  new_event_date: string;
  reason?: string;
}

async function handleGenerateProgram(request: Request) {
  const user = await requireAuthentication(request);
  const { target_event, context } = await parseRequestBody<GenerateProgramRequest>(request);
  
  // Validate target event
  validateTargetEvent(target_event);
  
  // Get user profile for AI generation
  const userProfile = await ProgramQueries.getUserProfile(user.id);
  if (!userProfile) {
    throw new NotFoundError('User profile');
  }
  
  // Check if user already has an active program
  const existingProgram = await ProgramQueries.getActiveProgram(user.id);
  if (existingProgram) {
    throw new ValidationError('User already has an active program. Please complete or delete it first.');
  }
  
  // Generate program using AI
  const aiProvider = AIProviderFactory.create();
  const generatedProgram = await aiProvider.generateProgram(userProfile, target_event, context);
  
  // Save to database
  const savedProgram = await ProgramQueries.createProgram(generatedProgram);
  
  return createSuccessResponse({
    program: savedProgram,
    message: 'Program generated successfully'
  }, 201);
}

async function handleGetCurrentProgram(request: Request) {
  const user = await requireAuthentication(request);
  
  const program = await ProgramQueries.getActiveProgram(user.id);
  
  if (!program) {
    return createSuccessResponse({
      program: null,
      message: 'No active program found'
    });
  }
  
  // Include any active context period
  const activeContext = await ContextQueries.getActiveContextPeriod(user.id);
  
  return createSuccessResponse({
    program,
    active_context: activeContext
  });
}

async function handleGetProgram(request: Request, programId: string) {
  const user = await requireAuthentication(request);
  
  if (!validateUUID(programId)) {
    throw new ValidationError('Invalid program ID format');
  }
  
  const programs = await ProgramQueries.getUserPrograms(user.id);
  const program = programs.find(p => p.id === programId);
  
  if (!program) {
    throw new NotFoundError('Program');
  }
  
  return createSuccessResponse(program);
}

async function handleRegenerateProgram(request: Request, programId: string) {
  const user = await requireAuthentication(request);
  
  if (!validateUUID(programId)) {
    throw new ValidationError('Invalid program ID format');
  }
  
  // Get existing program
  const programs = await ProgramQueries.getUserPrograms(user.id);
  const existingProgram = programs.find(p => p.id === programId);
  
  if (!existingProgram) {
    throw new NotFoundError('Program');
  }
  
  // Get current user profile
  const userProfile = await ProgramQueries.getUserProfile(user.id);
  if (!userProfile) {
    throw new NotFoundError('User profile');
  }
  
  // Set existing program to regenerating status
  await ProgramQueries.updateProgram(programId, { status: 'regenerating' });
  
  try {
    // Generate new program with same target event
    const aiProvider = AIProviderFactory.create();
    const newProgram = await aiProvider.generateProgram(
      userProfile, 
      existingProgram.target_event,
      existingProgram.current_context
    );
    
    // Update existing program with new structure
    const updatedProgram = await ProgramQueries.updateProgram(programId, {
      program_structure: newProgram.program_structure,
      performance_tracking: newProgram.performance_tracking,
      current_context: {
        ...existingProgram.current_context,
        last_updated: new Date().toISOString()
      },
      status: 'active'
    });
    
    return createSuccessResponse({
      program: updatedProgram,
      message: 'Program regenerated successfully'
    });
  } catch (error) {
    // Restore original status if regeneration fails
    await ProgramQueries.updateProgram(programId, { status: 'active' });
    throw error;
  }
}

async function handleDeleteProgram(request: Request, programId: string) {
  const user = await requireAuthentication(request);
  
  if (!validateUUID(programId)) {
    throw new ValidationError('Invalid program ID format');
  }
  
  const programs = await ProgramQueries.getUserPrograms(user.id);
  const program = programs.find(p => p.id === programId);
  
  if (!program) {
    throw new NotFoundError('Program');
  }
  
  await ProgramQueries.deleteProgram(programId);
  
  return createSuccessResponse({
    message: 'Program deleted successfully'
  });
}

async function handleExtendTimeline(request: Request, programId: string) {
  const user = await requireAuthentication(request);
  const { new_event_date, reason } = await parseRequestBody<ExtendTimelineRequest>(request);
  
  if (!validateUUID(programId)) {
    throw new ValidationError('Invalid program ID format');
  }
  
  // Validate new date
  const newDate = new Date(new_event_date);
  if (isNaN(newDate.getTime())) {
    throw new ValidationError('Invalid date format');
  }
  
  if (newDate <= new Date()) {
    throw new ValidationError('New event date must be in the future');
  }
  
  // Get existing program
  const programs = await ProgramQueries.getUserPrograms(user.id);
  const program = programs.find(p => p.id === programId);
  
  if (!program) {
    throw new NotFoundError('Program');
  }
  
  // Update target event date
  const updatedTargetEvent = {
    ...program.target_event,
    date: new_event_date
  };
  
  // Get user profile for regeneration
  const userProfile = await ProgramQueries.getUserProfile(user.id);
  if (!userProfile) {
    throw new NotFoundError('User profile');
  }
  
  // Regenerate program structure with new timeline
  const aiProvider = AIProviderFactory.create();
  const updatedProgram = await aiProvider.generateProgram(
    userProfile,
    updatedTargetEvent,
    program.current_context
  );
  
  // Update program
  const savedProgram = await ProgramQueries.updateProgram(programId, {
    target_event: updatedTargetEvent,
    program_structure: updatedProgram.program_structure,
    current_context: {
      ...program.current_context,
      last_updated: new Date().toISOString()
    }
  });
  
  return createSuccessResponse({
    program: savedProgram,
    message: `Program timeline extended to ${new_event_date}${reason ? ` (${reason})` : ''}`
  });
}

async function handleUpdateContext(request: Request, programId: string) {
  const user = await requireAuthentication(request);
  const contextUpdates = await parseRequestBody<UpdateContextRequest>(request);
  
  if (!validateUUID(programId)) {
    throw new ValidationError('Invalid program ID format');
  }
  
  // Get existing program
  const programs = await ProgramQueries.getUserPrograms(user.id);
  const program = programs.find(p => p.id === programId);
  
  if (!program) {
    throw new NotFoundError('Program');
  }
  
  // Update context
  const updatedContext = {
    ...program.current_context,
    ...contextUpdates,
    last_updated: new Date().toISOString()
  };
  
  const updatedProgram = await ProgramQueries.updateProgram(programId, {
    current_context: updatedContext
  });
  
  return createSuccessResponse({
    program: updatedProgram,
    message: 'Program context updated successfully'
  });
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  
  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;
    const pathParts = path.split('/').filter(Boolean);
    
    // Route handling
    if (path === '/programs/generate' && method === 'POST') {
      return await handleGenerateProgram(req);
    }
    
    if (path === '/programs/current' && method === 'GET') {
      return await handleGetCurrentProgram(req);
    }
    
    if (pathParts.length === 2 && pathParts[0] === 'programs' && method === 'GET') {
      return await handleGetProgram(req, pathParts[1]);
    }
    
    if (pathParts.length === 3 && pathParts[0] === 'programs' && pathParts[2] === 'regenerate' && method === 'PUT') {
      return await handleRegenerateProgram(req, pathParts[1]);
    }
    
    if (pathParts.length === 2 && pathParts[0] === 'programs' && method === 'DELETE') {
      return await handleDeleteProgram(req, pathParts[1]);
    }
    
    if (pathParts.length === 3 && pathParts[0] === 'programs' && pathParts[2] === 'extend' && method === 'POST') {
      return await handleExtendTimeline(req, pathParts[1]);
    }
    
    if (pathParts.length === 3 && pathParts[0] === 'programs' && pathParts[2] === 'context' && method === 'PUT') {
      return await handleUpdateContext(req, pathParts[1]);
    }
    
    // Handle preflight OPTIONS requests
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    }
    
    // Route not found
    throw new ValidationError(`Route ${method} ${path} not found`);
    
  } catch (error) {
    console.error('Programs function error:', error);
    return createErrorResponse(error, requestId);
  }
});
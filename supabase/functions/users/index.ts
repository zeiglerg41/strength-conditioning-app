// User Management Edge Function
// Handles user profile CRUD operations and onboarding

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
  validateUserProfile,
  validateUUID 
} from '../_shared/utils/validation.ts';
import { UserQueries } from '../_shared/database/queries.ts';
import { AIProviderFactory } from '../_shared/ai-providers/adapter.ts';
import { UserProfile } from '../_shared/types/api.ts';

async function handleGetProfile(request: Request) {
  const user = await requireAuthentication(request);
  
  const profile = await UserQueries.getUserProfile(user.id);
  
  if (!profile) {
    throw new NotFoundError('User profile');
  }
  
  return createSuccessResponse(profile);
}

async function handleUpdateProfile(request: Request) {
  const user = await requireAuthentication(request);
  const updates = await parseRequestBody<Partial<UserProfile>>(request);
  
  // Validate updates
  if (updates.id && updates.id !== user.id) {
    throw new ValidationError('Cannot modify user ID');
  }
  
  if (updates.email && updates.email !== user.email) {
    throw new ValidationError('Cannot modify email through this endpoint');
  }
  
  // Ensure user ID matches authenticated user
  updates.id = user.id;
  updates.email = user.email;
  
  const updatedProfile = await UserQueries.updateUserProfile(user.id, updates);
  
  return createSuccessResponse(updatedProfile);
}

async function handleOnboardingComplete(request: Request) {
  const user = await requireAuthentication(request);
  const profileData = await parseRequestBody<UserProfile>(request);
  
  // Validate complete profile
  validateUserProfile(profileData);
  
  // Set required fields
  profileData.id = user.id;
  profileData.email = user.email;
  
  // Check if profile exists
  const existingProfile = await UserQueries.getUserProfile(user.id);
  
  let profile: UserProfile;
  if (existingProfile) {
    profile = await UserQueries.updateUserProfile(user.id, profileData);
  } else {
    profile = await UserQueries.createUserProfile(profileData);
  }
  
  return createSuccessResponse({
    profile,
    message: 'Onboarding completed successfully'
  }, 201);
}

async function handleUpdateLifestyle(request: Request) {
  const user = await requireAuthentication(request);
  const lifestyleUpdates = await parseRequestBody<UserProfile['lifestyle']>(request);
  
  const updatedProfile = await UserQueries.updateUserProfile(user.id, {
    lifestyle: lifestyleUpdates
  });
  
  return createSuccessResponse(updatedProfile);
}

async function handleUpdateTrainingBackground(request: Request) {
  const user = await requireAuthentication(request);
  const trainingUpdates = await parseRequestBody<UserProfile['training_background']>(request);
  
  const updatedProfile = await UserQueries.updateUserProfile(user.id, {
    training_background: trainingUpdates
  });
  
  return createSuccessResponse(updatedProfile);
}

async function handleUpdateEquipment(request: Request) {
  const user = await requireAuthentication(request);
  const equipmentUpdates = await parseRequestBody<UserProfile['equipment_access']>(request);
  
  const updatedProfile = await UserQueries.updateUserProfile(user.id, {
    equipment_access: equipmentUpdates
  });
  
  return createSuccessResponse(updatedProfile);
}

async function handleUpdateGoals(request: Request) {
  const user = await requireAuthentication(request);
  const goalUpdates = await parseRequestBody<UserProfile['performance_goals']>(request);
  
  const updatedProfile = await UserQueries.updateUserProfile(user.id, {
    performance_goals: goalUpdates
  });
  
  return createSuccessResponse(updatedProfile);
}

async function handleUpdateConstraints(request: Request) {
  const user = await requireAuthentication(request);
  const constraintUpdates = await parseRequestBody<UserProfile['constraints']>(request);
  
  const updatedProfile = await UserQueries.updateUserProfile(user.id, {
    constraints: constraintUpdates
  });
  
  return createSuccessResponse(updatedProfile);
}

async function handleGenerateChallenge(request: Request) {
  const user = await requireAuthentication(request);
  const { challengeType } = await parseRequestBody<{ challengeType?: 'strength' | 'endurance' | 'power' | 'general' }>(request);
  
  const profile = await UserQueries.getUserProfile(user.id);
  if (!profile) {
    throw new NotFoundError('User profile');
  }
  
  const aiProvider = AIProviderFactory.create();
  const challenge = await aiProvider.generateChallenge(profile, challengeType);
  
  // Add challenge to user's generated challenges
  const updatedChallenges = [
    ...(profile.performance_goals.generated_challenges || []),
    challenge
  ];
  
  const updatedProfile = await UserQueries.updateUserProfile(user.id, {
    performance_goals: {
      ...profile.performance_goals,
      generated_challenges: updatedChallenges
    }
  });
  
  return createSuccessResponse({
    challenge,
    profile: updatedProfile,
    message: 'Challenge generated successfully'
  }, 201);
}

async function handleUpdateInjury(request: Request) {
  const user = await requireAuthentication(request);
  const injuryUpdate = await parseRequestBody<UserProfile['training_background']['injuries'][0]>(request);
  
  const profile = await UserQueries.getUserProfile(user.id);
  if (!profile) {
    throw new NotFoundError('User profile');
  }
  
  // Add or update injury in the array
  const existingInjuryIndex = profile.training_background.injuries.findIndex(
    injury => injury.type === injuryUpdate.type && 
               JSON.stringify(injury.affected_areas) === JSON.stringify(injuryUpdate.affected_areas)
  );
  
  let updatedInjuries = [...profile.training_background.injuries];
  if (existingInjuryIndex >= 0) {
    updatedInjuries[existingInjuryIndex] = injuryUpdate;
  } else {
    updatedInjuries.push(injuryUpdate);
  }
  
  const updatedProfile = await UserQueries.updateUserProfile(user.id, {
    training_background: {
      ...profile.training_background,
      injuries: updatedInjuries
    }
  });
  
  return createSuccessResponse(updatedProfile);
}

async function handleDeleteInjury(request: Request, injuryId: string) {
  const user = await requireAuthentication(request);
  
  const profile = await UserQueries.getUserProfile(user.id);
  if (!profile) {
    throw new NotFoundError('User profile');
  }
  
  // Remove injury by index (injuryId would be the index)
  const injuryIndex = parseInt(injuryId);
  if (isNaN(injuryIndex) || injuryIndex < 0 || injuryIndex >= profile.training_background.injuries.length) {
    throw new ValidationError('Invalid injury ID');
  }
  
  const updatedInjuries = profile.training_background.injuries.filter((_, index) => index !== injuryIndex);
  
  const updatedProfile = await UserQueries.updateUserProfile(user.id, {
    training_background: {
      ...profile.training_background,
      injuries: updatedInjuries
    }
  });
  
  return createSuccessResponse({
    profile: updatedProfile,
    message: 'Injury removed successfully'
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
    if (path === '/users/profile' && method === 'GET') {
      return await handleGetProfile(req);
    }
    
    if (path === '/users/profile' && method === 'PUT') {
      return await handleUpdateProfile(req);
    }
    
    if (path === '/users/onboarding' && method === 'POST') {
      return await handleOnboardingComplete(req);
    }
    
    if (path === '/users/lifestyle' && method === 'PUT') {
      return await handleUpdateLifestyle(req);
    }
    
    if (path === '/users/training-background' && method === 'PUT') {
      return await handleUpdateTrainingBackground(req);
    }
    
    if (path === '/users/equipment' && method === 'PUT') {
      return await handleUpdateEquipment(req);
    }
    
    if (path === '/users/goals' && method === 'PUT') {
      return await handleUpdateGoals(req);
    }
    
    if (path === '/users/constraints' && method === 'PUT') {
      return await handleUpdateConstraints(req);
    }
    
    if (path === '/users/goals/generate-challenge' && method === 'POST') {
      return await handleGenerateChallenge(req);
    }
    
    if (path === '/users/injury' && method === 'PUT') {
      return await handleUpdateInjury(req);
    }
    
    if (pathParts.length === 3 && pathParts[0] === 'users' && pathParts[1] === 'injury' && method === 'DELETE') {
      return await handleDeleteInjury(req, pathParts[2]);
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
    console.error('Users function error:', error);
    return createErrorResponse(error, requestId);
  }
});
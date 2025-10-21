import { type Template, type ApiResponse } from '../../src/shared/types';

// Constants
const VALID_CHANNELS = ['email', 'discord'] as const;
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Types
type ValidationResult = {
  isValid: boolean;
  error?: string;
};

type TemplateCreateRequest = {
  name: string;
  channel: 'email' | 'discord';
  body: string;
  subject?: string;
  user_id: string;
};

type TemplateRequestPayload = Partial<Omit<TemplateCreateRequest, 'user_id'>>;

// Lazy load Supabase client to avoid import errors when env vars are missing
let supabaseAdmin: any = null;
async function getSupabaseClient() {
  if (!supabaseAdmin) {
    try {
      const { supabaseAdmin: client } = await import('../../lib/supabase');
      supabaseAdmin = client;
    } catch (error) {
      console.warn('Failed to load Supabase client:', error);
      return null;
    }
  }
  return supabaseAdmin;
}

// Utility function to create standardized API responses
function createApiResponse(data: ApiResponse, status: number = HTTP_STATUS.OK): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Validate template creation request data
function validateTemplateData(body: TemplateRequestPayload & { user_id?: string }): ValidationResult {
  const errors: string[] = [];

  // Check required fields
  if (!body.name?.trim()) {
    errors.push('Template name is required');
  }
  if (!body.channel) {
    errors.push('Channel is required');
  }
  if (!body.body?.trim()) {
    errors.push('Template body is required');
  }
  if (!body.user_id?.trim()) {
    errors.push('User ID is required');
  }

  // Validate channel constraint
  if (body.channel && !VALID_CHANNELS.includes(body.channel)) {
    errors.push(`Channel must be one of: ${VALID_CHANNELS.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    error: errors.length > 0 ? errors.join('; ') : undefined,
  };
}

// Check if Supabase is properly configured
function isSupabaseConfigured(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// Extract user ID from request headers (Authorization Bearer token)
async function getUserIdFromRequest(request: Request): Promise<string | null> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.substring(7);
    
    // For now, we'll use a simple approach - in production this should validate the JWT
    // and extract the user ID from the token payload
    // This is a temporary solution until proper JWT validation is implemented
    
    // Check if we have a session token stored (mock implementation)
    if (token === 'mock_session_token' || token.includes('mock')) {
      return 'mock_user_123'; // Return mock user ID for testing
    }
    
    // In a real implementation, you would:
    // 1. Verify the JWT signature
    // 2. Extract the user_id from the token payload
    // 3. Return the user_id
    
    return null;
  } catch (error) {
    console.error('Error extracting user ID from request:', error);
    return null;
  }
}

// Create mock template response when Supabase is not configured
function createMockTemplateResponse(data: TemplateCreateRequest): ApiResponse {
  return {
    success: true,
    message: 'Template created successfully (mock - Supabase not configured)',
    data: {
      id: Math.random().toString(36).substr(2, 9),
      ...data,
      created_at: new Date().toISOString(),
    },
  };
}

// Prepare template data for database insertion
function prepareTemplateData(body: TemplateCreateRequest): Partial<Template> {
  return {
    user_id: body.user_id,
    name: body.name.trim(),
    channel: body.channel,
    body: body.body.trim(),
    subject: body.subject?.trim() || null,
  };
}

// GET /api/templates - Retrieve user's templates
export async function GET(request: Request): Promise<Response> {
  try {
    // Extract user ID from authentication
    const userId = await getUserIdFromRequest(request);
    
    if (!userId) {
      return createApiResponse(
        { success: false, error: 'Authentication required' },
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, returning empty templates list');
      return createApiResponse({ success: true, data: [] });
    }

    // Get Supabase client
    const supabase = await getSupabaseClient();
    if (!supabase) {
      console.warn('Supabase client not available, returning empty templates list');
      return createApiResponse({ success: true, data: [] });
    }

    // Fetch templates from database
    const { data: templates, error } = await supabase
      .from('templates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error fetching templates:', error);
      return createApiResponse(
        { success: false, error: 'Failed to fetch templates' },
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }

    return createApiResponse({ success: true, data: templates || [] });

  } catch (error) {
    console.error('Unexpected error in GET /api/templates:', error);
    return createApiResponse(
      { success: false, error: 'Internal server error' },
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

// POST /api/templates - Create a new template
export async function POST(request: Request): Promise<Response> {
  try {
    const rawBody = await request.json().catch(() => null);
    const body = (typeof rawBody === 'object' && rawBody !== null
      ? rawBody
      : {}) as TemplateRequestPayload;

    // Extract user ID from authentication
    const userId = await getUserIdFromRequest(request);
    
    if (!userId) {
      return createApiResponse(
        { success: false, error: 'Authentication required' },
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Validate request data (excluding user_id since it comes from auth)
    const validation = validateTemplateData({ ...body, user_id: userId });
    if (!validation.isValid) {
      return createApiResponse(
        { success: false, error: validation.error! },
        HTTP_STATUS.BAD_REQUEST
      );
    }

    if (typeof body.name !== 'string' || typeof body.channel !== 'string' || typeof body.body !== 'string') {
      return createApiResponse(
        { success: false, error: 'Invalid template payload' },
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const templateRequest: TemplateCreateRequest = {
      name: body.name,
      channel: body.channel,
      body: body.body,
      subject: typeof body.subject === 'string' ? body.subject : undefined,
      user_id: userId,
    };

    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, returning mock response');
      return createApiResponse(
        createMockTemplateResponse(templateRequest),
        HTTP_STATUS.CREATED
      );
    }

    // Get Supabase client
    const supabase = await getSupabaseClient();
    if (!supabase) {
      console.warn('Supabase client not available, returning mock response');
      return createApiResponse(
        createMockTemplateResponse(templateRequest),
        HTTP_STATUS.CREATED
      );
    }

    // Prepare data for database insertion
    const templateData = prepareTemplateData(templateRequest);

    // Insert template into database
    const { data: template, error } = await supabase
      .from('templates')
      .insert([templateData])
      .select()
      .single();

    if (error) {
      console.error('Database error creating template:', error);
      return createApiResponse(
        { success: false, error: 'Failed to create template' },
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }

    return createApiResponse(
      {
        success: true,
        message: 'Template created successfully',
        data: template,
      },
      HTTP_STATUS.CREATED
    );

  } catch (error) {
    console.error('Unexpected error in POST /api/templates:', error);
    return createApiResponse(
      { success: false, error: 'Internal server error' },
      HTTP_STATUS.INTERNAL_SERVER_ERROR
    );
  }
}

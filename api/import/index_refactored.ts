import Papa from 'papaparse';
import { supabaseAdmin } from '../../../lib/supabase';
import { MemberSchema, type Member, type ApiResponse } from '../../../src/shared/types';

// Configuration constants
const CSV_CONFIG = {
  header: true,
  skipEmptyLines: true,
  transformHeader: (header: string) => header.toLowerCase().trim()
} as const;

const COLUMN_MAPPINGS = {
  name: ['name', 'fullname', 'full_name', 'firstname'],
  email: ['email', 'email_address'],
  discordId: ['discord_id', 'discord', 'discord_username'],
  lastActiveAt: ['last_active', 'last_active_at', 'last_seen'],
  status: ['status']
} as const;

// Utility functions
function createApiResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function validateRequiredFields(body: any): { isValid: boolean; error?: string } {
  if (!body.csvData) {
    return { isValid: false, error: "CSV data is required" };
  }
  if (!body.user_id) {
    return { isValid: false, error: "User ID is required" };
  }
  return { isValid: true };
}

function parseCsvData(csvData: string): { success: boolean; data?: any[]; errors?: any[] } {
  const parseResult = Papa.parse(csvData, CSV_CONFIG);
  
  if (parseResult.errors.length > 0) {
    console.error('CSV parsing errors:', parseResult.errors);
    return { success: false, errors: parseResult.errors };
  }

  const members = parseResult.data;
  if (!Array.isArray(members) || members.length === 0) {
    return { success: false, errors: [{ message: "No valid members found in CSV" }] };
  }

  return { success: true, data: members };
}

function mapColumnValue(member: any, columnType: keyof typeof COLUMN_MAPPINGS): string | null {
  const possibleColumns = COLUMN_MAPPINGS[columnType];
  for (const column of possibleColumns) {
    if (member[column]) {
      return member[column].trim() || null;
    }
  }
  return null;
}

function transformMemberData(member: any, userId: string): Partial<Member> {
  const name = mapColumnValue(member, 'name');
  const email = mapColumnValue(member, 'email');
  const discordId = mapColumnValue(member, 'discordId');
  const lastActiveAt = mapColumnValue(member, 'lastActiveAt');
  const statusRaw = mapColumnValue(member, 'status') || 'active';

  return {
    user_id: userId,
    name: name || null,
    email: email || null,
    discord_id: discordId || null,
    last_active_at: lastActiveAt ? new Date(lastActiveAt).toISOString() : null,
    status: statusRaw.toLowerCase() === 'inactive' ? 'inactive' : 'active',
    is_suppressed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

function validateMemberData(member: Partial<Member>): boolean {
  return !!(member.email || member.discord_id);
}

async function insertMembers(members: Partial<Member>[]): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('members')
      .insert(members)
      .select('id');

    if (error) {
      console.error('Database insertion error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Database operation error:', error);
    return { success: false, error: 'Database operation failed' };
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    
    // Validate required fields
    const validation = validateRequiredFields(body);
    if (!validation.isValid) {
      return createApiResponse({ error: validation.error }, 400);
    }

    const { csvData, user_id } = body;

    // Parse CSV data
    const parseResult = parseCsvData(csvData);
    if (!parseResult.success) {
      return createApiResponse({ 
        error: "Failed to parse CSV data",
        details: parseResult.errors 
      }, 400);
    }

    const members = parseResult.data!;

    // Transform and validate member data
    const membersToInsert = members
      .map(member => transformMemberData(member, user_id))
      .filter(validateMemberData);

    if (membersToInsert.length === 0) {
      return createApiResponse({ 
        error: "No members with valid email or Discord ID found" 
      }, 400);
    }

    // Insert members into database
    const insertResult = await insertMembers(membersToInsert);
    if (!insertResult.success) {
      return createApiResponse({ 
        error: "Failed to insert members into database",
        details: insertResult.error 
      }, 500);
    }

    // Log successful import
    console.log(`Successfully imported ${insertResult.data!.length} members for user ${user_id}`);

    // Return success response
    const response: ApiResponse = {
      success: true,
      message: `Successfully imported ${insertResult.data!.length} members`,
      data: {
        imported: insertResult.data!.length,
        total_parsed: members.length,
        skipped: members.length - insertResult.data!.length
      }
    };

    return createApiResponse(response);

  } catch (error) {
    console.error('Import API error:', error);
    return createApiResponse({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
}

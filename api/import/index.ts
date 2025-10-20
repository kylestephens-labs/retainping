import Papa from 'papaparse';
import { supabaseAdmin } from '../../lib/supabase';
import { MemberSchema, type Member, type ApiResponse } from '../../src/shared/types';
import { checkRateLimit, logImportActivity } from '../../lib/rate-limiting';
import { logImportSuccess, logImportError, checkAlerts } from '../../lib/monitoring';

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

// Batch processing configuration
const BATCH_CONFIG = {
  DEFAULT_BATCH_SIZE: 1000,
  MAX_BATCH_SIZE: 10000,
  MIN_BATCH_SIZE: 100
} as const;

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  MAX_IMPORTS_PER_HOUR: 5,
  MAX_MEMBERS_PER_IMPORT: 10000
} as const;

// Utility functions
export function createApiResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function validateRequiredFields(body: any): { isValid: boolean; error?: string } {
  if (!body.csvData) {
    return { isValid: false, error: "CSV data is required" };
  }
  return { isValid: true };
}

export function parseCsvData(csvData: string): { success: boolean; data?: any[]; errors?: any[] } {
  const parseResult = Papa.parse(csvData, CSV_CONFIG);
  
  // Only treat critical structural errors as fatal, missing fields are tolerated
  const criticalErrors = parseResult.errors.filter(error => 
    error.type === 'Delimiter' || error.type === 'Quotes'
  );
  
  if (criticalErrors.length > 0) {
    console.error('Critical CSV parsing errors:', criticalErrors);
    return { success: false, errors: criticalErrors };
  }

  const members = parseResult.data;
  if (!Array.isArray(members) || members.length === 0) {
    return { success: false, errors: [{ message: "No valid members found in CSV" }] };
  }

  return { success: true, data: members };
}

export function mapColumnValue(member: any, columnType: keyof typeof COLUMN_MAPPINGS): string | null {
  const possibleColumns = COLUMN_MAPPINGS[columnType];
  for (const column of possibleColumns) {
    if (member[column]) {
      return member[column].trim() || null;
    }
  }
  return null;
}

export function transformMemberData(member: any, userId: string): Partial<Member> {
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

export function validateMemberData(member: Partial<Member>): boolean {
  return !!(member.email || member.discord_id);
}

// Batch processing utilities
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

async function getExistingMembers(userId: string, emails: string[], discordIds: string[]): Promise<Set<string>> {
  try {
    const existingMembers = new Set<string>();
    
    // Check for existing emails
    if (emails.length > 0) {
      const { data: emailData } = await supabaseAdmin
        .from('members')
        .select('email')
        .eq('user_id', userId)
        .in('email', emails);
      
      emailData?.forEach(member => {
        if (member.email) existingMembers.add(`email:${member.email}`);
      });
    }
    
    // Check for existing Discord IDs
    if (discordIds.length > 0) {
      const { data: discordData } = await supabaseAdmin
        .from('members')
        .select('discord_id')
        .eq('user_id', userId)
        .in('discord_id', discordIds);
      
      discordData?.forEach(member => {
        if (member.discord_id) existingMembers.add(`discord:${member.discord_id}`);
      });
    }
    
    return existingMembers;
  } catch (error) {
    console.error('Error checking existing members:', error);
    return new Set();
  }
}

function filterDuplicates(members: Partial<Member>[], existingMembers: Set<string>, skipDuplicates: boolean = true): {
  newMembers: Partial<Member>[];
  duplicates: Partial<Member>[];
} {
  if (!skipDuplicates) {
    return { newMembers: members, duplicates: [] };
  }
  
  const newMembers: Partial<Member>[] = [];
  const duplicates: Partial<Member>[] = [];
  
  members.forEach(member => {
    const emailKey = member.email ? `email:${member.email}` : null;
    const discordKey = member.discord_id ? `discord:${member.discord_id}` : null;
    
    const isDuplicate = (emailKey && existingMembers.has(emailKey)) || 
                       (discordKey && existingMembers.has(discordKey));
    
    if (isDuplicate) {
      duplicates.push(member);
    } else {
      newMembers.push(member);
      // Add to existing set to prevent duplicates within the same import
      if (emailKey) existingMembers.add(emailKey);
      if (discordKey) existingMembers.add(discordKey);
    }
  });
  
  return { newMembers, duplicates };
}

async function insertMembersBatch(members: Partial<Member>[]): Promise<{ success: boolean; data?: any[]; error?: string }> {
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

async function insertMembers(members: Partial<Member>[], batchSize: number = BATCH_CONFIG.DEFAULT_BATCH_SIZE): Promise<{ 
  success: boolean; 
  data?: any[]; 
  error?: string;
  totalInserted?: number;
  batchesProcessed?: number;
}> {
  try {
    // Validate batch size
    const validatedBatchSize = Math.min(
      Math.max(batchSize, BATCH_CONFIG.MIN_BATCH_SIZE),
      BATCH_CONFIG.MAX_BATCH_SIZE
    );
    
    // Split into batches
    const batches = chunkArray(members, validatedBatchSize);
    const allInsertedData: any[] = [];
    let batchesProcessed = 0;
    
    console.log(`Processing ${members.length} members in ${batches.length} batches of ${validatedBatchSize}`);
    
    // Process each batch
    for (const batch of batches) {
      const batchResult = await insertMembersBatch(batch);
      
      if (!batchResult.success) {
        console.error(`Batch ${batchesProcessed + 1} failed:`, batchResult.error);
        return { 
          success: false, 
          error: `Batch ${batchesProcessed + 1} failed: ${batchResult.error}`,
          totalInserted: allInsertedData.length,
          batchesProcessed
        };
      }
      
      allInsertedData.push(...(batchResult.data || []));
      batchesProcessed++;
      
      // Add small delay between batches to prevent overwhelming the database
      if (batches.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`Successfully processed ${batchesProcessed} batches, inserted ${allInsertedData.length} members`);
    
    return { 
      success: true, 
      data: allInsertedData,
      totalInserted: allInsertedData.length,
      batchesProcessed
    };
  } catch (error) {
    console.error('Batch processing error:', error);
    return { success: false, error: 'Batch processing failed' };
  }
}

export async function POST(request: Request): Promise<Response> {
  const startTime = Date.now();
  let userId = '';
  
  try {
    // Get the session token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    const sessionToken = authHeader?.replace('Bearer ', '');

    if (!sessionToken) {
      return createApiResponse({ 
        error: "No session token provided" 
      }, 401);
    }

    // Verify the session and get user data
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(sessionToken);

    if (authError || !user) {
      console.error('User verification error:', authError);
      return createApiResponse({ 
        error: "Invalid session token" 
      }, 401);
    }

    userId = user.id;

    const body = await request.json();
    
    // Validate required fields
    const validation = validateRequiredFields(body);
    if (!validation.isValid) {
      return createApiResponse({ error: validation.error }, 400);
    }

    const { csvData, options = {} } = body;
    const { skipDuplicates = true, batchSize = BATCH_CONFIG.DEFAULT_BATCH_SIZE } = options;

    // Rate limiting check
    const rateLimitResult = await checkRateLimit(
      userId, 
      RATE_LIMIT_CONFIG.MAX_IMPORTS_PER_HOUR, 
      60 * 60 * 1000 // 1 hour
    );
    
    if (!rateLimitResult.allowed) {
      await logImportError(userId, 'Rate limit exceeded', { 
        limit: RATE_LIMIT_CONFIG.MAX_IMPORTS_PER_HOUR,
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime
      });
      
      return createApiResponse({ 
        error: "Rate limit exceeded",
        details: `Maximum ${RATE_LIMIT_CONFIG.MAX_IMPORTS_PER_HOUR} imports per hour`,
        code: 'RATE_LIMITED',
        retry_after: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
      }, 429);
    }

    // Validate import size limits
    const estimatedRows = csvData.split('\n').length - 1; // Subtract header
    if (estimatedRows > RATE_LIMIT_CONFIG.MAX_MEMBERS_PER_IMPORT) {
      await logImportError(userId, 'Import too large', { 
        estimatedRows, 
        maxAllowed: RATE_LIMIT_CONFIG.MAX_MEMBERS_PER_IMPORT 
      });
      
      return createApiResponse({ 
        error: `Import too large. Maximum ${RATE_LIMIT_CONFIG.MAX_MEMBERS_PER_IMPORT} members per import`,
        code: 'IMPORT_TOO_LARGE'
      }, 400);
    }

    // Log import start
    await logImportActivity(userId, 'start', {
      estimatedRows,
      batchSize,
      skipDuplicates
    });

    // Parse CSV data
    const parseResult = parseCsvData(csvData);
    if (!parseResult.success) {
      await logImportError(userId, 'CSV parsing failed', parseResult.errors);
      
      return createApiResponse({ 
        error: "Failed to parse CSV data",
        details: parseResult.errors,
        code: 'CSV_PARSE_ERROR'
      }, 400);
    }

    const members = parseResult.data!;

    // Transform and validate member data
    const transformedMembers = members
      .map(member => transformMemberData(member, user_id))
      .filter(validateMemberData);

    if (transformedMembers.length === 0) {
      await logImportError(userId, 'No valid members', { 
        totalParsed: members.length 
      });
      
      return createApiResponse({ 
        error: "No members with valid email or Discord ID found",
        code: 'NO_VALID_MEMBERS'
      }, 400);
    }

    // Check for duplicates if enabled
    let duplicates: Partial<Member>[] = [];
    let membersToInsert = transformedMembers;
    
    if (skipDuplicates) {
      const emails = transformedMembers.map(m => m.email).filter(Boolean) as string[];
      const discordIds = transformedMembers.map(m => m.discord_id).filter(Boolean) as string[];
      
      const existingMembers = await getExistingMembers(user_id, emails, discordIds);
      const duplicateResult = filterDuplicates(transformedMembers, existingMembers, skipDuplicates);
      
      membersToInsert = duplicateResult.newMembers;
      duplicates = duplicateResult.duplicates;
    }

    if (membersToInsert.length === 0) {
      await logImportError(userId, 'All members are duplicates', { 
        totalParsed: members.length,
        duplicates: duplicates.length 
      });
      
      return createApiResponse({ 
        error: "All members are duplicates",
        code: 'ALL_DUPLICATES',
        data: {
          total_parsed: members.length,
          duplicates: duplicates.length,
          skipped: members.length
        }
      }, 400);
    }

    // Insert members into database with batch processing
    const insertResult = await insertMembers(membersToInsert, batchSize);
    if (!insertResult.success) {
      await logImportError(userId, 'Database insertion failed', { 
        error: insertResult.error,
        membersToInsert: membersToInsert.length 
      });
      
      return createApiResponse({ 
        error: "Failed to insert members into database",
        details: insertResult.error,
        code: 'DATABASE_ERROR'
      }, 500);
    }

    const processingTime = Date.now() - startTime;

    // Log successful import
    console.log(`Successfully imported ${insertResult.totalInserted || 0} members for user ${user_id} in ${insertResult.batchesProcessed || 0} batches (${processingTime}ms)`);

    // Log success metrics
    await logImportSuccess(userId, {
      imported: insertResult.totalInserted || 0,
      total_parsed: members.length,
      duplicates: duplicates.length,
      batches_processed: insertResult.batchesProcessed || 0,
      batch_size: batchSize,
      processing_time_ms: processingTime
    });

    // Check for alerts
    const alerts = await checkAlerts(userId);

    // Return success response
    const response: ApiResponse = {
      success: true,
      message: `Successfully imported ${insertResult.totalInserted || 0} members`,
      data: {
        imported: insertResult.totalInserted || 0,
        total_parsed: members.length,
        skipped: members.length - (insertResult.totalInserted || 0),
        duplicates: duplicates.length,
        batches_processed: insertResult.batchesProcessed || 0,
        batch_size: batchSize,
        processing_time_ms: processingTime,
        rate_limit: {
          remaining: rateLimitResult.remaining,
          reset_time: rateLimitResult.resetTime
        },
        alerts: alerts.length > 0 ? alerts : undefined
      }
    };

    return createApiResponse(response);

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    if (userId) {
      await logImportError(userId, 'Internal server error', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        processing_time_ms: processingTime
      });
    }
    
    console.error('Import API error:', error);
    return createApiResponse({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error',
      code: 'INTERNAL_ERROR'
    }, 500);
  }
}

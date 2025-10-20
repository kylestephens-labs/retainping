import { supabaseAdmin } from './supabase';

// Rate limiting utilities
interface RateLimitInfo {
  count: number;
  resetTime: number;
}

const rateLimitCache = new Map<string, RateLimitInfo>();

async function checkRateLimit(userId: string, limit: number, windowMs: number): Promise<{
  allowed: boolean;
  remaining: number;
  resetTime: number;
}> {
  const key = `import:${userId}`;
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Get current rate limit info
  let rateLimitInfo = rateLimitCache.get(key);
  
  if (!rateLimitInfo || rateLimitInfo.resetTime < now) {
    // Reset or initialize rate limit
    rateLimitInfo = {
      count: 0,
      resetTime: now + windowMs
    };
    rateLimitCache.set(key, rateLimitInfo);
  }
  
  // Check if within limit
  const allowed = rateLimitInfo.count < limit;
  
  if (allowed) {
    rateLimitInfo.count++;
  }
  
  return {
    allowed,
    remaining: Math.max(0, limit - rateLimitInfo.count),
    resetTime: rateLimitInfo.resetTime
  };
}

async function logImportActivity(userId: string, action: string, details: any): Promise<void> {
  try {
    await supabaseAdmin
      .from('events')
      .insert({
        member_id: 0, // System event
        type: `import_${action}`,
        timestamp: new Date().toISOString(),
        metadata: JSON.stringify({
          user_id: userId,
          ...details
        })
      });
  } catch (error) {
    console.error('Failed to log import activity:', error);
  }
}

async function getImportHistory(userId: string, hours: number = 24): Promise<number> {
  try {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    
    const { count } = await supabaseAdmin
      .from('events')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'import_success')
      .gte('timestamp', since)
      .like('metadata', `%"user_id":"${userId}"%`);
    
    return count || 0;
  } catch (error) {
    console.error('Failed to get import history:', error);
    return 0;
  }
}

export { checkRateLimit, logImportActivity, getImportHistory };

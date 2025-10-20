import { supabaseAdmin } from '../../lib/supabase';

export async function GET(request: Request) {
  try {
    // Get the session token from the Authorization header or cookie
    const authHeader = request.headers.get('Authorization');
    const sessionToken = authHeader?.replace('Bearer ', '') || 
      request.headers.get('Cookie')?.split('sb-')[1]?.split('=')[1]?.split(';')[0];

    if (!sessionToken) {
      return new Response(JSON.stringify({ error: "No session token provided" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verify the session and get user data
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(sessionToken);

    if (error || !user) {
      console.error('User verification error:', error);
      return new Response(JSON.stringify({ error: "Invalid session token" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;

    // Get real dashboard stats from the database
    const [
      { count: totalMembers },
      { count: inactiveMembers },
      { count: messagesSent },
      { count: activeCampaigns }
    ] = await Promise.all([
      // Total members
      supabaseAdmin
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      
      // Inactive members (not active in last 7 days)
      supabaseAdmin
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .lt('last_active_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      
      // Messages sent
      supabaseAdmin
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'sent'),
      
      // Active campaigns
      supabaseAdmin
        .from('campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_active', true)
    ]);

    // Calculate reactivated members (members who became active after being inactive)
    const { count: reactivatedMembers } = await supabaseAdmin
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('last_active_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .lt('last_active_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString());

    const stats = {
      total_members: totalMembers || 0,
      inactive_members: inactiveMembers || 0,
      messages_sent: messagesSent || 0,
      reactivated_members: reactivatedMembers || 0,
      active_campaigns: activeCampaigns || 0,
    };

    return new Response(JSON.stringify({ success: true, data: stats }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    return new Response(JSON.stringify({ error: "Failed to fetch dashboard data" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

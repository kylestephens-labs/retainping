import { supabaseAdmin } from '../../../lib/supabase';

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

    // Return the real user data
    return new Response(JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      google_user_data: {
        name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        email: user.email || ''
      }
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('User fetch error:', error);
    return new Response(JSON.stringify({ error: "Failed to fetch user data" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

import { supabaseAdmin } from '../../lib/supabase';

type SessionExchangeRequestBody = {
  code?: string;
};

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json() as SessionExchangeRequestBody;
    
    if (!body.code) {
      return new Response(JSON.stringify({ error: "No authorization code provided" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Exchange the authorization code for a session
    const { data, error } = await supabaseAdmin.auth.exchangeCodeForSession(body.code);

    if (error) {
      console.error('Session exchange error:', error);
      return new Response(JSON.stringify({ 
        error: "Failed to exchange code for session",
        details: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!data.session) {
      return new Response(JSON.stringify({ error: "No session returned from Supabase" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Set the session cookie
    const sessionCookie = `sb-${process.env.SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token=${data.session.access_token}; HttpOnly; Path=/; SameSite=Lax; Secure; Max-Age=${data.session.expires_in}`;
    
    return new Response(JSON.stringify({ 
      success: true,
      sessionToken: data.session.access_token,
      user: data.user
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Set-Cookie': sessionCookie
      },
    });
  } catch (error) {
    console.error('Session creation error:', error);
    return new Response(JSON.stringify({ 
      error: "Failed to exchange code for session",
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

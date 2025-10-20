import { supabaseAdmin } from '../../../../lib/supabase';

export async function GET() {
  try {
    // Generate the OAuth URL using Supabase Auth
    const { data, error } = await supabaseAdmin.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5173'}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });

    if (error) {
      console.error('OAuth URL generation error:', error);
      return new Response(JSON.stringify({ 
        error: "Failed to generate OAuth URL",
        details: error.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      redirectUrl: data.url 
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('OAuth redirect error:', error);
    return new Response(JSON.stringify({ 
      error: "Failed to generate OAuth redirect URL" 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

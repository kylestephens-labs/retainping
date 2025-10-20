export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.code) {
      return new Response(JSON.stringify({ error: "No authorization code provided" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Mock session creation - in a real app, this would exchange the code for a real session token
    const mockSessionToken = `mock_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return new Response(JSON.stringify({ 
      success: true,
      sessionToken: mockSessionToken 
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Set-Cookie': `mocha_session_token=${mockSessionToken}; HttpOnly; Path=/; SameSite=None; Secure; Max-Age=${60 * 24 * 60 * 60}`
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Failed to exchange code for session" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function GET() {
  try {
    // Mock OAuth redirect URL - in a real app, this would generate a proper Google OAuth URL
    const redirectUrl = `http://localhost:5173/auth/callback?code=mock_auth_code_${Date.now()}`;
    
    return new Response(JSON.stringify({ redirectUrl }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Failed to get OAuth redirect URL" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

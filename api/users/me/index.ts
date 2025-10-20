export async function GET(request: Request) {
  try {
    // Mock user data - in a real app, this would validate the session token and return real user data
    const mockUser = {
      id: 'mock_user_123',
      email: 'demo@example.com',
      name: 'Demo User',
      google_user_data: {
        name: 'Demo User',
        email: 'demo@example.com'
      }
    };
    
    return new Response(JSON.stringify(mockUser), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Failed to fetch user data" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

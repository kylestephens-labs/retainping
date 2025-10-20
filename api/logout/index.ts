export async function GET() {
  try {
    return new Response(JSON.stringify({ success: true }), {
      headers: { 
        'Content-Type': 'application/json',
        'Set-Cookie': 'mocha_session_token=; HttpOnly; Path=/; SameSite=None; Secure; Max-Age=0'
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Failed to logout" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

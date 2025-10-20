export async function GET() {
  try {
    // Return empty array for now
    return new Response(JSON.stringify({ success: true, data: [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Failed to fetch campaigns" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(request: Request) {
  try {
    await request.json(); // Parse body but don't use it yet
    
    // Mock response for now
    return new Response(JSON.stringify({ 
      success: true, 
      message: "Campaign created successfully",
      data: { id: Math.random().toString(36).substr(2, 9) }
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Failed to create campaign" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

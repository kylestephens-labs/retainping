export async function GET() {
  try {
    // For now, return mock data since we don't have a database set up yet
    const stats = {
      total_members: 0,
      inactive_members: 0,
      messages_sent: 0,
      reactivated_members: 0,
      active_campaigns: 0,
    };

    return new Response(JSON.stringify({ success: true, data: stats }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Failed to fetch dashboard data" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

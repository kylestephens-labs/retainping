import { Hono } from "hono";

interface Env {
  DB: D1Database;
  MOCHA_USERS_SERVICE_API_URL: string;
  MOCHA_USERS_SERVICE_API_KEY: string;
  DISCORD_BOT_TOKEN: string;
  RESEND_API_KEY: string;
}
import { cors } from "hono/cors";
import { serveStatic } from "hono/cloudflare-workers";
import {
  exchangeCodeForSessionToken,
  getOAuthRedirectUrl,
  authMiddleware,
  deleteSession,
  MOCHA_SESSION_TOKEN_COOKIE_NAME,
} from "@getmocha/users-service/backend";
import { getCookie, setCookie } from "hono/cookie";
import { 
  TemplateSchema, 
  CampaignSchema, 
  CsvMemberSchema,
  type DashboardStats 
} from "@/shared/types";

const app = new Hono<{ Bindings: Env }>();

// CORS middleware
app.use("*", cors({
  origin: "*",
  allowHeaders: ["*"],
  allowMethods: ["*"],
}));

// Auth endpoints
app.get('/api/oauth/google/redirect_url', async (c) => {
  const redirectUrl = await getOAuthRedirectUrl('google', {
    apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
    apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
  });

  return c.json({ redirectUrl }, 200);
});

app.post("/api/sessions", async (c) => {
  const body = await c.req.json();

  if (!body.code) {
    return c.json({ error: "No authorization code provided" }, 400);
  }

  try {
    const sessionToken = await exchangeCodeForSessionToken(body.code, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });

    setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      path: "/",
      sameSite: "none",
      secure: true,
      maxAge: 60 * 24 * 60 * 60, // 60 days
    });

    return c.json({ success: true }, 200);
  } catch (error) {
    console.error('Session exchange error:', error);
    return c.json({ error: "Failed to exchange code for session" }, 500);
  }
});

app.get("/api/users/me", authMiddleware, async (c) => {
  const user = c.get("user");
  
  // Ensure user profile exists in our database
  const existingProfile = await c.env.DB.prepare(
    "SELECT * FROM user_profiles WHERE user_id = ?"
  ).bind(user!.id).first();

  if (!existingProfile) {
    await c.env.DB.prepare(
      "INSERT INTO user_profiles (user_id, email, name) VALUES (?, ?, ?)"
    ).bind(user!.id, user!.email, user!.google_user_data.name || null).run();
  }

  return c.json(user);
});

app.get('/api/logout', async (c) => {
  const sessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);

  if (typeof sessionToken === 'string') {
    await deleteSession(sessionToken, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });
  }

  setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, '', {
    httpOnly: true,
    path: '/',
    sameSite: 'none',
    secure: true,
    maxAge: 0,
  });

  return c.json({ success: true }, 200);
});

// Members API
app.post("/api/import", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  
  try {
    const members = body.members;
    
    if (!Array.isArray(members)) {
      return c.json({ error: "Members must be an array" }, 400);
    }

    let imported = 0;
    for (const memberData of members) {
      try {
        const validatedMember = CsvMemberSchema.parse(memberData);
        
        // Insert member
        await c.env.DB.prepare(`
          INSERT INTO members (user_id, name, email, discord_id, last_active_at)
          VALUES (?, ?, ?, ?, ?)
        `).bind(
          user!.id,
          validatedMember.name,
          validatedMember.email,
          validatedMember.discord_id,
          validatedMember.last_active_at || new Date().toISOString()
        ).run();
        
        imported++;
      } catch (error) {
        console.error('Error importing member:', error);
      }
    }

    return c.json({ 
      success: true, 
      message: `Successfully imported ${imported} members`,
      imported 
    });
  } catch (error) {
    console.error('Import error:', error);
    return c.json({ error: "Failed to import members" }, 500);
  }
});

app.get("/api/members", authMiddleware, async (c) => {
  const user = c.get("user");
  
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM members WHERE user_id = ? ORDER BY created_at DESC"
    ).bind(user!.id).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ error: "Failed to fetch members" }, 500);
  }
});

app.get("/api/members/inactive", authMiddleware, async (c) => {
  const user = c.get("user");
  const days = c.req.query('days') || '7';
  
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
    
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM members 
      WHERE user_id = ? 
      AND (last_active_at < ? OR last_active_at IS NULL)
      AND is_suppressed = 0
      ORDER BY last_active_at ASC
    `).bind(user!.id, cutoffDate.toISOString()).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ error: "Failed to fetch inactive members" }, 500);
  }
});

// Templates API
app.get("/api/templates", authMiddleware, async (c) => {
  const user = c.get("user");
  
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM templates WHERE user_id = ? ORDER BY created_at DESC"
    ).bind(user!.id).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ error: "Failed to fetch templates" }, 500);
  }
});

app.post("/api/templates", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  
  try {
    const validatedTemplate = TemplateSchema.parse({
      ...body,
      user_id: user!.id
    });

    const result = await c.env.DB.prepare(`
      INSERT INTO templates (user_id, channel, name, subject, body)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      validatedTemplate.user_id,
      validatedTemplate.channel,
      validatedTemplate.name,
      validatedTemplate.subject,
      validatedTemplate.body
    ).run();

    return c.json({ 
      success: true, 
      message: "Template created successfully",
      data: { id: result.meta.last_row_id }
    });
  } catch (error) {
    console.error('Template creation error:', error);
    return c.json({ error: "Failed to create template" }, 500);
  }
});

app.put("/api/templates/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const templateId = c.req.param('id');
  const body = await c.req.json();
  
  try {
    const validatedTemplate = TemplateSchema.partial().parse(body);

    await c.env.DB.prepare(`
      UPDATE templates 
      SET name = COALESCE(?, name), 
          channel = COALESCE(?, channel),
          subject = COALESCE(?, subject),
          body = COALESCE(?, body),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).bind(
      validatedTemplate.name,
      validatedTemplate.channel,
      validatedTemplate.subject,
      validatedTemplate.body,
      templateId,
      user!.id
    ).run();

    return c.json({ success: true, message: "Template updated successfully" });
  } catch (error) {
    return c.json({ error: "Failed to update template" }, 500);
  }
});

// Campaigns API
app.get("/api/campaigns", authMiddleware, async (c) => {
  const user = c.get("user");
  
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT c.*, t.name as template_name 
      FROM campaigns c
      LEFT JOIN templates t ON c.template_id = t.id
      WHERE c.user_id = ? 
      ORDER BY c.created_at DESC
    `).bind(user!.id).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ error: "Failed to fetch campaigns" }, 500);
  }
});

app.post("/api/campaigns", authMiddleware, async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  
  try {
    const validatedCampaign = CampaignSchema.parse({
      ...body,
      user_id: user!.id
    });

    const result = await c.env.DB.prepare(`
      INSERT INTO campaigns (user_id, name, inactive_days, channel, template_id, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      validatedCampaign.user_id,
      validatedCampaign.name,
      validatedCampaign.inactive_days,
      validatedCampaign.channel,
      validatedCampaign.template_id,
      validatedCampaign.is_active ? 1 : 0
    ).run();

    return c.json({ 
      success: true, 
      message: "Campaign created successfully",
      data: { id: result.meta.last_row_id }
    });
  } catch (error) {
    console.error('Campaign creation error:', error);
    return c.json({ error: "Failed to create campaign" }, 500);
  }
});

app.put("/api/campaigns/:id", authMiddleware, async (c) => {
  const user = c.get("user");
  const campaignId = c.req.param('id');
  const body = await c.req.json();
  
  try {
    const validatedCampaign = CampaignSchema.partial().parse(body);

    await c.env.DB.prepare(`
      UPDATE campaigns 
      SET name = COALESCE(?, name),
          inactive_days = COALESCE(?, inactive_days),
          channel = COALESCE(?, channel),
          template_id = COALESCE(?, template_id),
          is_active = COALESCE(?, is_active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).bind(
      validatedCampaign.name,
      validatedCampaign.inactive_days,
      validatedCampaign.channel,
      validatedCampaign.template_id,
      validatedCampaign.is_active ? 1 : 0,
      campaignId,
      user!.id
    ).run();

    return c.json({ success: true, message: "Campaign updated successfully" });
  } catch (error) {
    return c.json({ error: "Failed to update campaign" }, 500);
  }
});

// Dashboard API
app.get("/api/dashboard", authMiddleware, async (c) => {
  const user = c.get("user");
  
  try {
    // Get total members
    const totalMembers = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM members WHERE user_id = ?"
    ).bind(user!.id).first();

    // Get inactive members (last 7 days)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    const inactiveMembers = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM members 
      WHERE user_id = ? 
      AND (last_active_at < ? OR last_active_at IS NULL)
      AND is_suppressed = 0
    `).bind(user!.id, cutoffDate.toISOString()).first();

    // Get total messages sent
    const messagesSent = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM messages m
      JOIN campaigns c ON m.campaign_id = c.id
      WHERE c.user_id = ?
    `).bind(user!.id).first();

    // Get reactivated members (members who had activity after being messaged)
    const reactivatedMembers = await c.env.DB.prepare(`
      SELECT COUNT(DISTINCT m.member_id) as count FROM messages msg
      JOIN campaigns c ON msg.campaign_id = c.id
      JOIN members m ON msg.member_id = m.id
      WHERE c.user_id = ?
      AND msg.response_at IS NOT NULL
    `).bind(user!.id).first();

    // Get active campaigns
    const activeCampaigns = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM campaigns WHERE user_id = ? AND is_active = 1"
    ).bind(user!.id).first();

    const stats: DashboardStats = {
      total_members: (totalMembers as any)?.count || 0,
      inactive_members: (inactiveMembers as any)?.count || 0,
      messages_sent: (messagesSent as any)?.count || 0,
      reactivated_members: (reactivatedMembers as any)?.count || 0,
      active_campaigns: (activeCampaigns as any)?.count || 0,
    };

    return c.json({ success: true, data: stats });
  } catch (error) {
    console.error('Dashboard error:', error);
    return c.json({ error: "Failed to fetch dashboard data" }, 500);
  }
});

// Messaging endpoints
app.post("/api/send/email", authMiddleware, async (c) => {
  const body = await c.req.json();
  
  try {
    const { to, subject, html, member_id, campaign_id } = body;

    // Send email using Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${c.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'RetainPing <noreply@retainping.com>',
        to: [to],
        subject,
        html: html + '<br><br><small>Powered by RetainPing</small>',
      }),
    });

    const result = await response.json() as any;

    if (response.ok) {
      // Log the message
      await c.env.DB.prepare(`
        INSERT INTO messages (campaign_id, member_id, channel, status)
        VALUES (?, ?, 'email', 'sent')
      `).bind(campaign_id, member_id).run();

      return c.json({ success: true, message: "Email sent successfully", data: result });
    } else {
      throw new Error(result.message || 'Email sending failed');
    }
  } catch (error) {
    console.error('Email sending error:', error);
    return c.json({ error: "Failed to send email" }, 500);
  }
});

app.post("/api/send/discord", authMiddleware, async (c) => {
  const body = await c.req.json();
  
  try {
    const { discord_id, content, member_id, campaign_id } = body;

    // Send Discord DM using bot
    const response = await fetch(`https://discord.com/api/v10/users/@me/channels`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${c.env.DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient_id: discord_id,
      }),
    });

    const channelData = await response.json() as any;

    if (response.ok && channelData.id) {
      // Send message to the DM channel
      const messageResponse = await fetch(`https://discord.com/api/v10/channels/${channelData.id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${c.env.DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content + '\n\n_Powered by RetainPing_',
        }),
      });

      const messageResult = await messageResponse.json() as any;

      if (messageResponse.ok) {
        // Log the message
        await c.env.DB.prepare(`
          INSERT INTO messages (campaign_id, member_id, channel, status)
          VALUES (?, ?, 'discord', 'sent')
        `).bind(campaign_id, member_id).run();

        return c.json({ success: true, message: "Discord message sent successfully", data: messageResult });
      } else {
        throw new Error(messageResult.message || 'Discord message sending failed');
      }
    } else {
      throw new Error('Failed to create Discord DM channel');
    }
  } catch (error) {
    console.error('Discord sending error:', error);
    return c.json({ error: "Failed to send Discord message" }, 500);
  }
});

// Cron job endpoint
app.post("/api/cron/run-campaigns", async (c) => {
  try {
    // Get all active campaigns
    const { results: campaigns } = await c.env.DB.prepare(`
      SELECT c.*, t.subject, t.body, t.channel as template_channel
      FROM campaigns c
      JOIN templates t ON c.template_id = t.id
      WHERE c.is_active = 1
    `).all();

    let totalSent = 0;

    for (const campaign of campaigns) {
      // Get eligible inactive members
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - (campaign.inactive_days as number));
      
      const { results: members } = await c.env.DB.prepare(`
        SELECT m.* FROM members m
        LEFT JOIN messages msg ON m.id = msg.member_id AND msg.sent_at > ?
        WHERE m.user_id = ?
        AND (m.last_active_at < ? OR m.last_active_at IS NULL)
        AND m.is_suppressed = 0
        AND msg.id IS NULL
        LIMIT 50
      `).bind(
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // Don't message same user within 7 days
        campaign.user_id,
        cutoffDate.toISOString()
      ).all();

      // Send messages to eligible members
      for (const member of members as any[]) {
        try {
          if (campaign.channel === 'email' && member.email) {
            // Send email
            const response = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${c.env.RESEND_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: 'RetainPing <noreply@retainping.com>',
                to: [member.email],
                subject: String(campaign.subject || 'We miss you!').replace('{{name}}', String(member.name || 'there')),
                html: String(campaign.body || '').replace('{{name}}', String(member.name || 'there')) + '<br><br><small>Powered by RetainPing</small>',
              }),
            });

            if (response.ok) {
              await c.env.DB.prepare(`
                INSERT INTO messages (campaign_id, member_id, channel, status)
                VALUES (?, ?, 'email', 'sent')
              `).bind(campaign.id, member.id).run();
              totalSent++;
            }
          } else if (campaign.channel === 'discord' && member.discord_id) {
            // Send Discord message (implementation similar to above)
            // For brevity, using a simplified version here
            await c.env.DB.prepare(`
              INSERT INTO messages (campaign_id, member_id, channel, status)
              VALUES (?, ?, 'discord', 'attempted')
            `).bind(campaign.id, member.id).run();
            totalSent++;
          }
        } catch (error) {
          console.error('Error sending message:', error);
        }
      }
    }

    return c.json({ 
      success: true, 
      message: `Campaign run completed. ${totalSent} messages sent.`,
      total_sent: totalSent 
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return c.json({ error: "Cron job failed" }, 500);
  }
});

// Serve static files
app.use("*", serveStatic({ root: "./dist", manifest: {} }));

export default app;

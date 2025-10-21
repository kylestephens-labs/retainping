import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5173;

// Middleware
app.use(cors());
app.use(express.json());

// Auth endpoints (real implementations)
app.get('/api/oauth/google/redirect_url', async (req, res) => {
  try {
    const { supabaseAdmin } = await import('./lib/supabase.mjs');
    
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
      return res.status(500).json({ 
        error: "Failed to generate OAuth URL",
        details: error.message 
      });
    }

    res.json({ redirectUrl: data.url });
  } catch (error) {
    console.error('OAuth redirect error:', error);
    res.status(500).json({ 
      error: "Failed to generate OAuth redirect URL" 
    });
  }
});

app.post('/api/sessions', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({ error: "No authorization code provided" });
    }

    const { supabaseAdmin } = await import('./lib/supabase.mjs');

    // Exchange the authorization code for a session
    const { data, error } = await supabaseAdmin.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Session exchange error:', error);
      return res.status(400).json({ 
        error: "Failed to exchange code for session",
        details: error.message 
      });
    }

    if (!data.session) {
      return res.status(400).json({ error: "No session returned from Supabase" });
    }

    // Set the session cookie
    const sessionCookie = `sb-${process.env.SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token=${data.session.access_token}; HttpOnly; Path=/; SameSite=Lax; Secure; Max-Age=${data.session.expires_in}`;
    
    res.setHeader('Set-Cookie', sessionCookie);
    res.json({ 
      success: true,
      sessionToken: data.session.access_token,
      user: data.user
    });
  } catch (error) {
    console.error('Session creation error:', error);
    res.status(500).json({ error: "Failed to exchange code for session" });
  }
});

app.get('/api/users/me', async (req, res) => {
  try {
    // Get the session token from the Authorization header or cookie
    const authHeader = req.headers.authorization;
    const sessionToken = authHeader?.replace('Bearer ', '') || 
      req.headers.cookie?.split('sb-')[1]?.split('=')[1]?.split(';')[0];

    if (!sessionToken) {
      return res.status(401).json({ error: "No session token provided" });
    }

    const { supabaseAdmin } = await import('./lib/supabase.mjs');

    // Verify the session and get user data
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(sessionToken);

    if (error || !user) {
      console.error('User verification error:', error);
      return res.status(401).json({ error: "Invalid session token" });
    }

    // Return the real user data
    res.json({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      google_user_data: {
        name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User',
        email: user.email || ''
      }
    });
  } catch (error) {
    console.error('User fetch error:', error);
    res.status(500).json({ error: "Failed to fetch user data" });
  }
});

app.get('/api/logout', (req, res) => {
  res.json({ success: true });
});

// API Routes
app.get('/api/dashboard', (req, res) => {
  const stats = {
    total_members: 0,
    inactive_members: 0,
    messages_sent: 0,
    reactivated_members: 0,
    active_campaigns: 0,
  };
  res.json({ success: true, data: stats });
});

app.get('/api/templates', (req, res) => {
  res.json({ success: true, data: [] });
});

app.post('/api/templates', (req, res) => {
  res.json({ 
    success: true, 
    message: "Template created successfully",
    data: { id: Math.random().toString(36).substr(2, 9) }
  });
});

app.get('/api/campaigns', (req, res) => {
  res.json({ success: true, data: [] });
});

app.post('/api/campaigns', (req, res) => {
  res.json({ 
    success: true, 
    message: "Campaign created successfully",
    data: { id: Math.random().toString(36).substr(2, 9) }
  });
});

app.post('/api/import', (req, res) => {
  const { members } = req.body;
  
  if (!Array.isArray(members)) {
    return res.status(400).json({ error: "Members must be an array" });
  }

  res.json({ 
    success: true, 
    message: `Successfully imported ${members.length} members`,
    imported: members.length
  });
});

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle React routing - serve index.html for all non-API routes
app.use((req, res, next) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/assets')) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    next();
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api/*`);
});

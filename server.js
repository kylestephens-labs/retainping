import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5173;

// Middleware
app.use(cors());
app.use(express.json());

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

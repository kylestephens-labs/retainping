#!/usr/bin/env node

import https from 'https';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.error('❌ Missing required environment variables');
  console.error('Make sure SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_CLIENT_ID, and GOOGLE_CLIENT_SECRET are set');
  process.exit(1);
}

// Extract project reference from Supabase URL
const projectRef = SUPABASE_URL.split('//')[1].split('.')[0];
console.log(`🔧 Configuring Google OAuth for project: ${projectRef}`);

// Configure Google OAuth provider
const authConfig = {
  GOOGLE_ENABLED: true,
  GOOGLE_CLIENT_ID: GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URL: 'http://localhost:5173/auth/callback'
};

const postData = JSON.stringify(authConfig);

const options = {
  hostname: `${projectRef}.supabase.co`,
  port: 443,
  path: '/auth/v1/admin/settings',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'apikey': SUPABASE_SERVICE_ROLE_KEY
  }
};

console.log('🚀 Sending Google OAuth configuration...');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Google OAuth configured successfully!');
      console.log('📋 Configuration details:');
      console.log(`   - Client ID: ${GOOGLE_CLIENT_ID}`);
      console.log(`   - Redirect URL: ${authConfig.GOOGLE_REDIRECT_URL}`);
      console.log('🎉 You can now test Google OAuth authentication!');
    } else {
      console.error(`❌ Failed to configure Google OAuth (Status: ${res.statusCode})`);
      console.error('Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error configuring Google OAuth:', error.message);
});

req.write(postData);
req.end();

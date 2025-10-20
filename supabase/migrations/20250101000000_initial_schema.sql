-- PostgreSQL-compatible schema for Supabase
-- Users table (will be managed by Mocha Users Service, this is for app-specific data)
CREATE TABLE user_profiles (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Members (subscribers/customers belonging to each creator)
CREATE TABLE members (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT,
  email TEXT,
  discord_id TEXT,
  last_active_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active',
  is_suppressed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message templates
CREATE TABLE templates (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('discord', 'email')),
  name TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Retention campaigns
CREATE TABLE campaigns (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  inactive_days INTEGER NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('discord', 'email')),
  template_id INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message logs
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL,
  member_id INTEGER NOT NULL,
  channel TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'sent',
  response_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity events for tracking
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  member_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_members_user_id ON members(user_id);
CREATE INDEX idx_members_last_active ON members(last_active_at);
CREATE INDEX idx_templates_user_id ON templates(user_id);
CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_campaigns_active ON campaigns(is_active);
CREATE INDEX idx_messages_campaign_id ON messages(campaign_id);
CREATE INDEX idx_messages_member_id ON messages(member_id);
CREATE INDEX idx_events_member_id ON events(member_id);

-- Add foreign key constraints
ALTER TABLE campaigns ADD CONSTRAINT fk_campaigns_template_id FOREIGN KEY (template_id) REFERENCES templates(id);
ALTER TABLE messages ADD CONSTRAINT fk_messages_campaign_id FOREIGN KEY (campaign_id) REFERENCES campaigns(id);
ALTER TABLE messages ADD CONSTRAINT fk_messages_member_id FOREIGN KEY (member_id) REFERENCES members(id);
ALTER TABLE events ADD CONSTRAINT fk_events_member_id FOREIGN KEY (member_id) REFERENCES members(id);

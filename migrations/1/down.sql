
DROP INDEX idx_events_member_id;
DROP INDEX idx_messages_member_id;
DROP INDEX idx_messages_campaign_id;
DROP INDEX idx_campaigns_active;
DROP INDEX idx_campaigns_user_id;
DROP INDEX idx_templates_user_id;
DROP INDEX idx_members_last_active;
DROP INDEX idx_members_user_id;

DROP TABLE events;
DROP TABLE messages;
DROP TABLE campaigns;
DROP TABLE templates;
DROP TABLE members;
DROP TABLE user_profiles;

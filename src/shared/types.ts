import z from "zod";

// Member schemas
export const MemberSchema = z.object({
  id: z.number().optional(),
  user_id: z.string(),
  name: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  discord_id: z.string().nullable().optional(),
  last_active_at: z.string().nullable().optional(), // ISO string
  status: z.string().default('active'),
  is_suppressed: z.boolean().default(false),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Member = z.infer<typeof MemberSchema>;

// Template schemas
export const TemplateSchema = z.object({
  id: z.number().optional(),
  user_id: z.string(),
  channel: z.enum(['discord', 'email']),
  name: z.string(),
  subject: z.string().nullable().optional(),
  body: z.string(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Template = z.infer<typeof TemplateSchema>;

// Campaign schemas
export const CampaignSchema = z.object({
  id: z.number().optional(),
  user_id: z.string(),
  name: z.string(),
  inactive_days: z.number().min(1),
  channel: z.enum(['discord', 'email']),
  template_id: z.number(),
  is_active: z.boolean().default(true),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Campaign = z.infer<typeof CampaignSchema>;

// Message schemas
export const MessageSchema = z.object({
  id: z.number().optional(),
  campaign_id: z.number(),
  member_id: z.number(),
  channel: z.string(),
  sent_at: z.string().optional(),
  status: z.string().default('sent'),
  response_at: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Message = z.infer<typeof MessageSchema>;

// Event schemas
export const EventSchema = z.object({
  id: z.number().optional(),
  member_id: z.number(),
  type: z.string(),
  timestamp: z.string().optional(),
  metadata: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Event = z.infer<typeof EventSchema>;

// CSV Import schema
export const CsvMemberSchema = z.object({
  name: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  discord_id: z.string().nullable().optional(),
  last_active_at: z.string().nullable().optional(),
});

export type CsvMember = z.infer<typeof CsvMemberSchema>;

// Dashboard stats schema
export const DashboardStatsSchema = z.object({
  total_members: z.number(),
  inactive_members: z.number(),
  messages_sent: z.number(),
  reactivated_members: z.number(),
  active_campaigns: z.number(),
});

export type DashboardStats = z.infer<typeof DashboardStatsSchema>;

// API Response schemas
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.any().optional(),
});

export type ApiResponse = z.infer<typeof ApiResponseSchema>;

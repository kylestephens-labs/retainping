# RetainPing MVP Launch Checklist

## Current Status Assessment
- **Frontend**: 95% complete ✅ (Beautiful UI, auth flow, all pages)
- **Database Schema**: 100% complete ✅ (All tables defined in migrations/1.sql)
- **API Structure**: 30% complete ❌ (Endpoints exist but return mock data)
- **Backend Logic**: 10% complete ❌ (No real data persistence or automation)
- **Deployment**: 80% complete ✅ (Vercel setup ready)

**Overall MVP Readiness**: ~40% - Need to connect backend services to make it functional.

---

## P0 - Critical Tasks (Must Complete for MVP)

### 1. Database Setup & Connection
- [ ] **Create Supabase project**
  - Go to [supabase.com](https://supabase.com) and create new project
  - Get `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
  - Run the SQL schema from `migrations/1.sql` in Supabase SQL editor

- [ ] **Add Supabase client**
  - Create `lib/supabase.ts` with database connection
  - Install `@supabase/supabase-js` package
  - Set up admin client for server-side operations

- [ ] **Environment Variables**
  - Create `.env.local` with:
    ```
    SUPABASE_URL=your_supabase_url
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
    RESEND_API_KEY=your_resend_api_key
    FROM_EMAIL=notifications@yourdomain.com
    ```
  - Add same variables to Vercel Project Settings → Environment Variables

### 2. Real API Endpoints Implementation
- [ ] **Fix `/api/import` endpoint**
  - Parse CSV data with Papa Parse
  - Insert members into Supabase `members` table
  - Return real success/error responses
  - Add user_id scoping for multi-user support

- [ ] **Fix `/api/templates` endpoint**
  - Implement POST to create templates in `templates` table
  - Implement GET to fetch user's templates
  - Add validation for required fields

- [ ] **Fix `/api/campaigns` endpoint**
  - Implement POST to create campaigns in `campaigns` table
  - Implement GET to fetch user's campaigns
  - Link campaigns to templates via `template_id`

- [ ] **Fix `/api/dashboard` endpoint**
  - Query real counts from database:
    - Total members count
    - Inactive members (last_active_at < threshold)
    - Messages sent count
    - Active campaigns count
    - Reactivated members count

### 3. Email Service Integration
- [ ] **Set up Resend account**
  - Sign up at [resend.com](https://resend.com)
  - Get API key
  - Verify domain for production (SPF/DKIM records)

- [ ] **Create `/api/send/email` endpoint**
  - Use Resend API to send emails
  - Template variable replacement (`{{name}}`, `{{community}}`)
  - Error handling and logging

- [ ] **Install Resend package**
  ```bash
  npm install resend
  ```

### 4. Automated Campaign Runner
- [ ] **Create `/api/cron/run-campaigns` endpoint**
  - Find active campaigns
  - Query eligible members (inactive_days threshold + not suppressed)
  - Skip members messaged in last 7 days
  - Send messages via selected channel
  - Log sent messages in `messages` table
  - Rate limiting (max 50 sends per campaign per run)

- [ ] **Implement inactivity logic**
  ```sql
  -- Eligible members query
  SELECT * FROM members 
  WHERE user_id = ? 
    AND last_active_at <= ? 
    AND is_suppressed = false
    AND id NOT IN (
      SELECT member_id FROM messages 
      WHERE campaign_id = ? 
        AND sent_at >= datetime('now', '-7 days')
    )
  ```

### 5. Vercel Cron Configuration
- [ ] **Set up Vercel Cron Job**
  - Go to Vercel Project → Settings → Cron Jobs
  - Add cron job:
    - Path: `/api/cron/run-campaigns`
    - Schedule: `0 * * * *` (hourly)
  - Test cron job execution

---

## P1 - Important Polish (Should Have)

### 1. User Authentication Integration
- [ ] **Connect real user data**
  - Replace mock user data in `/api/users/me`
  - Implement proper session validation
  - Scope all data to authenticated user_id

### 2. Error Handling & Logging
- [ ] **Add comprehensive error handling**
  - Try/catch blocks in all API endpoints
  - Proper HTTP status codes
  - Error logging to messages table with status='failed'

### 3. Input Validation
- [ ] **Add request validation**
  - Validate required fields in POST requests
  - Sanitize user inputs
  - Return meaningful error messages

### 4. Rate Limiting
- [ ] **Implement rate limiting**
  - Per-campaign send limits
  - Per-user API rate limits
  - Protection against abuse

---

## P2 - Nice to Have (After Launch)

### 1. Discord Integration
- [ ] **Add Discord webhook support**
  - Create `/api/send/discord` endpoint
  - Use Discord webhook URLs
  - Template variable replacement for Discord messages

### 2. Template Variables
- [ ] **Expand template system**
  - Support for `{{name}}`, `{{community}}`, `{{rejoin_link}}`
  - Dynamic content generation

### 3. Demo Data
- [ ] **Add seed data endpoint**
  - Create `/api/seed` for development
  - Insert sample members with staggered activity dates
  - Help with demos and testing

---

## Testing Checklist

### Manual Testing Steps
- [ ] **Import Flow**
  1. Upload CSV with 5+ members
  2. Verify preview shows correct data
  3. Confirm import success message
  4. Check dashboard shows member count

- [ ] **Template Creation**
  1. Create email template with `{{name}}` variable
  2. Verify template saves to database
  3. Confirm template appears in campaigns dropdown

- [ ] **Campaign Creation**
  1. Create campaign with 7-day inactive threshold
  2. Link to email template
  3. Verify campaign shows as active

- [ ] **Automated Sending**
  1. Trigger `/api/cron/run-campaigns` manually
  2. Verify emails sent via Resend dashboard
  3. Check messages logged in database
  4. Confirm members marked as contacted

- [ ] **Dashboard Updates**
  1. Verify all counters show real data
  2. Check inactive member calculation
  3. Confirm messages sent count

### Production Deployment
- [ ] **Environment Setup**
  - All environment variables set in Vercel
  - Domain verified in Resend
  - Supabase project configured for production

- [ ] **Cron Job Testing**
  - Verify hourly cron execution
  - Check Vercel function logs
  - Monitor email delivery rates

---

## File Structure to Create

```
lib/
  supabase.ts          # Database client
api/
  send/
    email.ts          # Email sending service
    discord.ts        # Discord webhook (optional)
  cron/
    run-campaigns.ts  # Campaign automation
.env.local            # Local environment variables
```

---

## Dependencies to Install

```bash
npm install @supabase/supabase-js resend
```

---

## Success Criteria

✅ **MVP is live when:**
1. Users can import CSV members
2. Users can create message templates
3. Users can create retention campaigns
4. System automatically sends messages to inactive members
5. Dashboard shows real data and metrics
6. Cron job runs hourly without errors
7. Emails are delivered successfully

**Estimated Time to Complete**: 1-2 days for P0 tasks

---

## Notes

- The frontend is already production-ready with excellent UX
- Database schema is complete and well-designed
- Focus should be on backend integration and automation
- Start with Supabase setup as it's the foundation for everything else
- Test each component individually before testing the full flow

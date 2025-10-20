# RetainPing MVP - Granular Task List

## Task 001: Set up Supabase Project
- **Task Classification**: Non-Functional
- **Status**: ✅ COMPLETED

## Overview of the task
Create a new Supabase project and obtain the necessary credentials for database connectivity.

## Goal of the task
Establish the database infrastructure that will store all application data including members, templates, campaigns, and messages.

### BDD Scenario

Feature: Database Infrastructure
  As a developer
  I want to have a Supabase project configured
  So that the application can persist and retrieve data

  Scenario: Project creation and credential retrieval
    Given I have a Supabase account
    When I create a new project
    Then I should receive SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY

    ### Acceptance Criteria
- [x] Supabase project is created successfully
- [x] SUPABASE_URL is obtained and valid
- [x] SUPABASE_SERVICE_ROLE_KEY is obtained and valid
- [x] Project is accessible from the dashboard

### Files & Resources
- **Files Affected**: None (external setup)
- **Dependencies**: Supabase account
- **External Resources**: [supabase.com](https://supabase.com)

### Business Context
- **Value**: Foundation for all data persistence
- **Risk**: Without this, no data can be stored or retrieved
- **Success**: Can connect to database and run SQL queries

---

## Task 002: Install Supabase Client Package
- **Task Classification**: Non-Functional
- **Status**: ✅ COMPLETED

## Overview of the task
Install the @supabase/supabase-js package to enable database connectivity in the application.

## Goal of the task
Add the necessary dependency to interact with the Supabase database from the Node.js backend.

### BDD Scenario

Feature: Database Client Package
  As a developer
  I want to install the Supabase client package
  So that I can connect to the database from the application

  Scenario: Package installation
    Given I have a Node.js project
    When I run npm install @supabase/supabase-js
    Then the package should be added to package.json and node_modules

    ### Acceptance Criteria
- [x] @supabase/supabase-js is installed
- [x] Package appears in package.json dependencies
- [x] Package is available in node_modules
- [x] No installation errors occur

### Files & Resources
- **Files Affected**: package.json, package-lock.json
- **Dependencies**: Task 001 (Supabase project)
- **External Resources**: npm registry

### Business Context
- **Value**: Enables database connectivity
- **Risk**: Without this package, cannot connect to database
- **Success**: Package installs without errors and is available for import

---

## Task 003: Create Environment Variables File
- **Task Classification**: Non-Functional
- **Status**: ✅ COMPLETED

## Overview of the task
Create .env.local file with all required environment variables for local development.

## Goal of the task
Store sensitive configuration data securely and make it available to the application.

### BDD Scenario

Feature: Environment Configuration
  As a developer
  I want to store environment variables in a .env.local file
  So that the application can access configuration data securely

  Scenario: Environment file creation
    Given I have the required API keys and URLs
    When I create .env.local with all variables
    Then the application should be able to access them via process.env

    ### Acceptance Criteria
- [x] .env.local file is created
- [x] SUPABASE_URL is defined
- [x] SUPABASE_SERVICE_ROLE_KEY is defined
- [x] RESEND_API_KEY is defined
- [x] FROM_EMAIL is defined
- [x] File is added to .gitignore
- [x] Variables are accessible via process.env

### Files & Resources
- **Files Affected**: .env.local, .gitignore
- **Dependencies**: Task 001 (Supabase credentials)
- **External Resources**: None

### Business Context
- **Value**: Secure configuration management
- **Risk**: Exposing secrets in version control
- **Success**: Variables are accessible and .env.local is gitignored

---

## Task 004: Create Supabase Database Client
- **Task Classification**: Functional
- **Status**: ✅ COMPLETED

## Overview of the task
Create lib/supabase.ts file with configured Supabase admin client for server-side operations.

## Goal of the task
Provide a reusable database client that can be imported and used across all API endpoints.

### BDD Scenario

Feature: Database Client
  As a developer
  I want to have a configured Supabase client
  So that I can perform database operations from API endpoints

  Scenario: Client creation and configuration
    Given I have environment variables set up
    When I create lib/supabase.ts with admin client
    Then I should be able to import and use it in API endpoints

    ### Acceptance Criteria
- [x] lib/supabase.ts file is created
- [x] Supabase admin client is configured with environment variables
- [x] Client is exported as supabaseAdmin
- [x] Client can be imported in other files
- [x] No TypeScript errors in the file

### Files & Resources
- **Files Affected**: lib/supabase.ts (new file)
- **Dependencies**: Task 002 (Supabase package), Task 003 (Environment variables)
- **External Resources**: Supabase documentation

### Business Context
- **Value**: Centralized database access
- **Risk**: Incorrect configuration could break all database operations
- **Success**: Client can be imported and used without errors

---

## Task 005: Run Database Schema in Supabase
- **Task Classification**: Non-Functional
- **Status**: ✅ COMPLETED

## Overview of the task
Execute the SQL schema from migrations/1.sql in the Supabase SQL editor to create all required tables.

## Goal of the task
Set up the database structure with all tables, indexes, and constraints needed for the application.

### BDD Scenario

Feature: Database Schema
  As a developer
  I want to create all required database tables
  So that the application can store and retrieve data in a structured way

  Scenario: Schema execution
    Given I have a Supabase project and the schema file
    When I run the SQL from migrations/1.sql in Supabase
    Then all tables should be created with proper structure

    ### Acceptance Criteria
- [x] user_profiles table is created
- [x] members table is created with all columns
- [x] templates table is created with channel constraints
- [x] campaigns table is created with foreign key to templates
- [x] messages table is created with foreign keys
- [x] events table is created
- [x] All indexes are created
- [x] No SQL execution errors

### Files & Resources
- **Files Affected**: None (database changes)
- **Dependencies**: Task 001 (Supabase project)
- **External Resources**: Supabase SQL editor

### Business Context
- **Value**: Structured data storage
- **Risk**: Missing tables or constraints could break application
- **Success**: All tables exist and can be queried

---

## Task 006: Install Resend Package
- **Task Classification**: Non-Functional
- **Status**: ✅ COMPLETED

## Overview of the task
Install the resend package to enable email sending functionality.

## Goal of the task
Add the necessary dependency to send emails via the Resend service.

### BDD Scenario

Feature: Email Service Package
  As a developer
  I want to install the Resend package
  So that I can send emails from the application

  Scenario: Package installation
    Given I have a Node.js project
    When I run npm install resend
    Then the package should be added to package.json and node_modules

    ### Acceptance Criteria
- [x] resend package is installed
- [x] Package appears in package.json dependencies
- [x] Package is available in node_modules
- [x] No installation errors occur

### Files & Resources
- **Files Affected**: package.json, package-lock.json
- **Dependencies**: None
- **External Resources**: npm registry

### Business Context
- **Value**: Enables email sending functionality
- **Risk**: Without this package, cannot send emails
- **Success**: Package installs without errors and is available for import

---

## Task 007: Set up Resend Account and API Key
- **Task Classification**: Non-Functional
- **Status**: ✅ COMPLETED

## Overview of the task
Create a Resend account and obtain the API key for email sending.

## Goal of the task
Obtain credentials to send emails through the Resend service.

### BDD Scenario

Feature: Email Service Credentials
  As a developer
  I want to have Resend API credentials
  So that the application can send emails

  Scenario: Account setup and key retrieval
    Given I have access to resend.com
    When I create an account and get API key
    Then I should have RESEND_API_KEY for configuration

    ### Acceptance Criteria
- [x] Resend account is created
- [x] API key is obtained
- [x] API key is valid and functional
- [x] Account has sending permissions

### Files & Resources
- **Files Affected**: .env.local (update)
- **Dependencies**: None
- **External Resources**: [resend.com](https://resend.com)

### Business Context
- **Value**: Enables email delivery
- **Risk**: Without valid credentials, emails cannot be sent
- **Success**: Can send test emails through Resend

---

## Task 008: Implement Real Import API Endpoint
- **Task Classification**: Functional
- **Status**: ✅ COMPLETED

## Overview of the task
Replace the mock implementation in /api/import/index.ts with real database operations using Supabase.

## Goal of the task
Allow users to import CSV data and store it in the members table with proper user scoping.

### BDD Scenario

Feature: Member Import
  As a user
  I want to import my subscriber list via CSV
  So that I can create retention campaigns for them

  Scenario: Successful CSV import
    Given I am authenticated and have a CSV file
    When I upload the CSV with member data
    Then the members should be saved to the database

    ### Acceptance Criteria
- [x] CSV data is parsed correctly using Papa Parse
- [x] Members are inserted into the members table
- [x] Each member is associated with the authenticated user_id
- [x] Duplicate members are handled appropriately
- [x] Success response includes count of imported members
- [x] Error handling for invalid CSV data
- [x] Error handling for database insertion failures

### Files & Resources
- **Files Affected**: api/import/index.ts
- **Dependencies**: Task 004 (Supabase client), Task 005 (Database schema)
- **External Resources**: Papa Parse documentation

### Business Context
- **Value**: Core functionality for user onboarding
- **Risk**: Data loss or corruption during import
- **Success**: CSV data is correctly parsed and stored in database

---

## Task 009: Implement Real Templates API Endpoints
- **Task Classification**: Functional
- **Status**: Ready

## Overview of the task
Replace mock implementations in /api/templates/index.ts with real database operations for creating and retrieving message templates.

## Goal of the task
Allow users to create and manage message templates for their retention campaigns.

### BDD Scenario

Feature: Message Templates
  As a user
  I want to create and manage message templates
  So that I can reuse them across multiple campaigns

  Scenario: Template creation and retrieval
    Given I am authenticated
    When I create a new template with subject and body
    Then it should be saved and retrievable via GET request

    ### Acceptance Criteria
- [ ] POST /api/templates creates template in database
- [ ] Template is associated with authenticated user_id
- [ ] Required fields (name, channel, body) are validated
- [ ] Channel field is validated to be 'email' or 'discord'
- [ ] GET /api/templates returns user's templates
- [ ] Templates are properly formatted in response
- [ ] Error handling for invalid data
- [ ] Error handling for database operations

### Files & Resources
- **Files Affected**: api/templates/index.ts
- **Dependencies**: Task 004 (Supabase client), Task 005 (Database schema)
- **External Resources**: None

### Business Context
- **Value**: Enables message customization and reuse
- **Risk**: Invalid templates could break campaign sending
- **Success**: Templates can be created, stored, and retrieved correctly

---

## Task 010: Implement Real Campaigns API Endpoints
- **Task Classification**: Functional
- **Status**: Ready

## Overview of the task
Replace mock implementations in /api/campaigns/index.ts with real database operations for creating and retrieving retention campaigns.

## Goal of the task
Allow users to create and manage retention campaigns that will automatically contact inactive members.

### BDD Scenario

Feature: Retention Campaigns
  As a user
  I want to create retention campaigns
  So that inactive members are automatically contacted

  Scenario: Campaign creation and retrieval
    Given I have templates and am authenticated
    When I create a campaign with inactive_days and template
    Then it should be saved and retrievable via GET request

    ### Acceptance Criteria
- [ ] POST /api/campaigns creates campaign in database
- [ ] Campaign is associated with authenticated user_id
- [ ] Required fields (name, inactive_days, channel, template_id) are validated
- [ ] Template_id references existing template
- [ ] Channel field is validated to be 'email' or 'discord'
- [ ] GET /api/campaigns returns user's campaigns
- [ ] Campaigns include template information
- [ ] Error handling for invalid data
- [ ] Error handling for database operations

### Files & Resources
- **Files Affected**: api/campaigns/index.ts
- **Dependencies**: Task 004 (Supabase client), Task 005 (Database schema), Task 009 (Templates)
- **External Resources**: None

### Business Context
- **Value**: Core automation functionality
- **Risk**: Invalid campaigns could send to wrong members
- **Success**: Campaigns can be created and linked to templates correctly

---

## Task 011: Implement Real Dashboard API Endpoint
- **Task Classification**: Functional
- **Status**: Ready

## Overview of the task
Replace mock implementation in /api/dashboard/index.ts with real database queries to calculate and return actual statistics.

## Goal of the task
Provide users with accurate metrics about their members, campaigns, and message activity.

### BDD Scenario

Feature: Dashboard Statistics
  As a user
  I want to see real statistics on my dashboard
  So that I can understand the impact of my retention efforts

  Scenario: Statistics calculation
    Given I have members, campaigns, and messages in the database
    When I request dashboard data
    Then I should see accurate counts and metrics

    ### Acceptance Criteria
- [ ] Total members count is calculated from members table
- [ ] Inactive members count uses last_active_at threshold
- [ ] Messages sent count is calculated from messages table
- [ ] Active campaigns count is calculated from campaigns table
- [ ] Reactivated members count is calculated (members who became active after being contacted)
- [ ] All counts are scoped to authenticated user
- [ ] Response includes all required statistics
- [ ] Error handling for database query failures

### Files & Resources
- **Files Affected**: api/dashboard/index.ts
- **Dependencies**: Task 004 (Supabase client), Task 005 (Database schema)
- **External Resources**: None

### Business Context
- **Value**: User engagement and success metrics
- **Risk**: Incorrect metrics could mislead users
- **Success**: Dashboard shows accurate, real-time statistics

---

## Task 012: Create Email Sending Service
- **Task Classification**: Functional
- **Status**: 🔄 IN PROGRESS

## Overview of the task
Create /api/send/email.ts endpoint that uses Resend to send emails with template variable replacement.

## Goal of the task
Enable the system to send personalized emails to inactive members using Resend service.

### BDD Scenario

Feature: Email Sending
  As a system
  I want to send personalized emails to members
  So that they can be re-engaged with the community

  Scenario: Email sending with template variables
    Given I have a member and email template
    When I send an email with template variables
    Then the email should be delivered with personalized content

    ### Acceptance Criteria
- [ ] Email is sent using Resend API
- [ ] Template variables ({{name}}) are replaced with actual values
- [ ] Email includes proper from address
- [ ] Email includes subject and HTML body
- [ ] Success response confirms email was sent
- [ ] Error handling for Resend API failures
- [ ] Error handling for invalid email addresses
- [ ] Email sending is logged for tracking

### Files & Resources
- **Files Affected**: api/send/email.ts (new file)
- **Dependencies**: Task 006 (Resend package), Task 007 (Resend credentials)
- **External Resources**: Resend API documentation

### Business Context
- **Value**: Core functionality for member re-engagement
- **Risk**: Email delivery failures could break campaigns
- **Success**: Emails are delivered successfully with correct content

---

## Task 013: Create Campaign Runner Cron Job
- **Task Classification**: Functional
- **Status**: Ready

## Overview of the task
Create /api/cron/run-campaigns.ts endpoint that finds eligible members and sends messages based on campaign rules.

## Goal of the task
Automate the process of identifying inactive members and sending them retention messages.

### BDD Scenario

Feature: Automated Campaign Execution
  As a system
  I want to automatically run campaigns
  So that inactive members are contacted without manual intervention

  Scenario: Campaign execution for inactive members
    Given I have active campaigns and members
    When the cron job runs
    Then eligible members should receive messages

    ### Acceptance Criteria
- [ ] Finds all active campaigns
- [ ] Identifies eligible members based on inactive_days threshold
- [ ] Skips members messaged in last 7 days
- [ ] Skips suppressed members
- [ ] Sends messages via appropriate channel (email/discord)
- [ ] Logs all sent messages in messages table
- [ ] Implements rate limiting (max 50 sends per campaign per run)
- [ ] Handles errors gracefully
- [ ] Returns summary of sent messages

### Files & Resources
- **Files Affected**: api/cron/run-campaigns.ts (new file)
- **Dependencies**: Task 004 (Supabase client), Task 012 (Email service), Task 005 (Database schema)
- **External Resources**: None

### Business Context
- **Value**: Core automation that drives user value
- **Risk**: Incorrect logic could spam users or miss eligible members
- **Success**: Campaigns run automatically and contact appropriate members

---

## Task 014: Configure Vercel Environment Variables
- **Task Classification**: Non-Functional
- **Status**: Ready

## Overview of the task
Add all required environment variables to Vercel project settings for production deployment.

## Goal of the task
Ensure the application has access to all necessary configuration in the production environment.

### BDD Scenario

Feature: Production Environment Configuration
  As a developer
  I want to configure environment variables in Vercel
  So that the application works correctly in production

  Scenario: Environment variable setup
    Given I have all required API keys and URLs
    When I add them to Vercel project settings
    Then the application should access them via process.env

    ### Acceptance Criteria
- [ ] SUPABASE_URL is set in Vercel
- [ ] SUPABASE_SERVICE_ROLE_KEY is set in Vercel
- [ ] RESEND_API_KEY is set in Vercel
- [ ] FROM_EMAIL is set in Vercel
- [ ] All variables are available in production
- [ ] Variables are marked as sensitive where appropriate

### Files & Resources
- **Files Affected**: None (Vercel configuration)
- **Dependencies**: Task 001 (Supabase), Task 007 (Resend)
- **External Resources**: Vercel dashboard

### Business Context
- **Value**: Enables production deployment
- **Risk**: Missing variables could break production functionality
- **Success**: Application can access all configuration in production

---

## Task 015: Set up Vercel Cron Job
- **Task Classification**: Non-Functional
- **Status**: Ready

## Overview of the task
Configure Vercel cron job to run the campaign automation hourly.

## Goal of the task
Enable automatic execution of retention campaigns without manual intervention.

### BDD Scenario

Feature: Automated Scheduling
  As a system
  I want to run campaigns automatically on a schedule
  So that retention efforts happen consistently

  Scenario: Cron job configuration
    Given I have a working campaign runner endpoint
    When I configure Vercel cron job
    Then campaigns should run automatically every hour

    ### Acceptance Criteria
- [ ] Cron job is configured in Vercel
- [ ] Schedule is set to run hourly (0 * * * *)
- [ ] Endpoint path is /api/cron/run-campaigns
- [ ] Cron job is enabled and active
- [ ] Execution logs are available for monitoring

### Files & Resources
- **Files Affected**: None (Vercel configuration)
- **Dependencies**: Task 013 (Campaign runner), Task 014 (Environment variables)
- **External Resources**: Vercel cron documentation

### Business Context
- **Value**: Enables hands-off automation
- **Risk**: Cron job failures could stop all automation
- **Success**: Campaigns run automatically every hour

---

## Task 016: Test End-to-End Import Flow
- **Task Classification**: Functional
- **Status**: Ready

## Overview of the task
Test the complete import flow from frontend CSV upload to database storage.

## Goal of the task
Verify that users can successfully import their member data through the UI.

### BDD Scenario

Feature: Member Import Flow
  As a user
  I want to import my subscriber list
  So that I can create retention campaigns for them

  Scenario: Complete import process
    Given I am logged in and on the import page
    When I upload a CSV file with member data
    Then the data should be processed and stored in the database

    ### Acceptance Criteria
- [ ] CSV file upload works via drag-and-drop
- [ ] CSV file upload works via file picker
- [ ] Preview shows correct parsed data
- [ ] Import button triggers API call
- [ ] Success message shows correct count
- [ ] Data is stored in members table
- [ ] Dashboard updates with new member count
- [ ] Error handling for invalid files
- [ ] Error handling for API failures

### Files & Resources
- **Files Affected**: All import-related files
- **Dependencies**: Task 008 (Import API), Task 011 (Dashboard API)
- **External Resources**: None

### Business Context
- **Value**: Core user onboarding flow
- **Risk**: Import failures could prevent user adoption
- **Success**: Users can successfully import their data

---

## Task 017: Test End-to-End Campaign Creation Flow
- **Task Classification**: Functional
- **Status**: Ready

## Overview of the task
Test the complete flow of creating templates and campaigns through the UI.

## Goal of the task
Verify that users can create and manage their retention campaigns.

### BDD Scenario

Feature: Campaign Creation Flow
  As a user
  I want to create retention campaigns
  So that inactive members are automatically contacted

  Scenario: Complete campaign setup
    Given I have imported members and am logged in
    When I create a template and then a campaign
    Then the campaign should be saved and ready to run

    ### Acceptance Criteria
- [ ] Template creation form works
- [ ] Template is saved to database
- [ ] Campaign creation form works
- [ ] Campaign links to template correctly
- [ ] Campaign is saved to database
- [ ] Campaign appears in campaigns list
- [ ] Form validation works correctly
- [ ] Error handling for invalid data
- [ ] Success messages are shown

### Files & Resources
- **Files Affected**: All campaign and template related files
- **Dependencies**: Task 009 (Templates API), Task 010 (Campaigns API)
- **External Resources**: None

### Business Context
- **Value**: Core functionality for retention automation
- **Risk**: Campaign creation failures could prevent user value
- **Success**: Users can create and manage campaigns

---

## Task 018: Test Automated Campaign Execution
- **Task Classification**: Functional
- **Status**: Ready

## Overview of the task
Test that the cron job correctly identifies inactive members and sends them messages.

## Goal of the task
Verify that the automation works correctly and contacts the right members.

### BDD Scenario

Feature: Automated Campaign Execution
  As a system
  I want to automatically contact inactive members
  So that they can be re-engaged with the community

  Scenario: Campaign execution
    Given I have campaigns and members with various activity levels
    When the cron job runs
    Then only eligible inactive members should receive messages

    ### Acceptance Criteria
- [ ] Cron job can be triggered manually
- [ ] Only members meeting inactive_days threshold are contacted
- [ ] Members messaged in last 7 days are skipped
- [ ] Suppressed members are skipped
- [ ] Messages are sent via correct channel
- [ ] Messages are logged in database
- [ ] Rate limiting is enforced
- [ ] Error handling works correctly
- [ ] Execution summary is returned

### Files & Resources
- **Files Affected**: All campaign execution related files
- **Dependencies**: Task 013 (Campaign runner), Task 012 (Email service)
- **External Resources**: None

### Business Context
- **Value**: Core automation that drives user success
- **Risk**: Incorrect execution could spam users or miss opportunities
- **Success**: Campaigns run correctly and contact appropriate members

---

## Task 019: Test Dashboard Data Accuracy
- **Task Classification**: Functional
- **Status**: Ready

## Overview of the task
Verify that the dashboard displays accurate, real-time data from the database.

## Goal of the task
Ensure users see correct metrics about their retention efforts.

### BDD Scenario

Feature: Dashboard Data Accuracy
  As a user
  I want to see accurate statistics on my dashboard
  So that I can measure the success of my retention efforts

  Scenario: Real-time data display
    Given I have members, campaigns, and messages in the system
    When I view the dashboard
    Then I should see accurate counts and metrics

    ### Acceptance Criteria
- [ ] Total members count is accurate
- [ ] Inactive members count is calculated correctly
- [ ] Messages sent count is accurate
- [ ] Active campaigns count is correct
- [ ] Reactivated members count is calculated
- [ ] Data updates in real-time
- [ ] No mock data is displayed
- [ ] Error handling for data loading failures

### Files & Resources
- **Files Affected**: Dashboard related files
- **Dependencies**: Task 011 (Dashboard API)
- **External Resources**: None

### Business Context
- **Value**: User engagement and success measurement
- **Risk**: Incorrect metrics could mislead users
- **Success**: Dashboard shows accurate, real-time data

---

## Task 020: Production Deployment Verification
- **Task Classification**: Non-Functional
- **Status**: Ready

## Overview of the task
Deploy to production and verify all functionality works in the live environment.

## Goal of the task
Ensure the MVP is fully functional and accessible to users in production.

### BDD Scenario

Feature: Production Deployment
  As a user
  I want to access the application in production
  So that I can use it for my retention campaigns

  Scenario: Production functionality
    Given the application is deployed to production
    When I access it and perform key actions
    Then all features should work correctly

    ### Acceptance Criteria
- [ ] Application is accessible via production URL
- [ ] Authentication works in production
- [ ] Import functionality works
- [ ] Template creation works
- [ ] Campaign creation works
- [ ] Dashboard shows real data
- [ ] Cron job runs automatically
- [ ] Emails are sent successfully
- [ ] All environment variables are configured
- [ ] No console errors in production

### Files & Resources
- **Files Affected**: All application files
- **Dependencies**: All previous tasks
- **External Resources**: Vercel, Supabase, Resend

### Business Context
- **Value**: Enables user access and value delivery
- **Risk**: Production issues could prevent user adoption
- **Success**: Application is fully functional in production

---

## Summary

**Total Tasks**: 20
**Estimated Time**: 1-2 days for P0 tasks (001-015)
**Critical Path**: Database setup → API implementation → Email service → Cron job → Testing

**Dependencies**:
- Tasks 001-007: Infrastructure setup (can be done in parallel)
- Tasks 008-015: Core functionality (sequential)
- Tasks 016-020: Testing and deployment (after core functionality)

**Risk Mitigation**:
- Test each task individually before moving to the next
- Keep database backups during schema changes
- Test email delivery in staging before production
- Monitor cron job execution logs

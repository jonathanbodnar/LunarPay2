# LunarPay - Comprehensive Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Payment Processors](#payment-processors)
4. [Core Features](#core-features)
5. [Third-Party Integrations](#third-party-integrations)
6. [API & Widget System](#api--widget-system)
7. [Database Schema](#database-schema)
8. [Deployment & Infrastructure](#deployment--infrastructure)
9. [Security & Authentication](#security--authentication)
10. [Configuration](#configuration)

---

## Project Overview

**LunarPay** is a comprehensive payment processing platform built with **CodeIgniter 3** (PHP) designed for organizations to manage donations, invoices, payments, and customer relationships. It supports multiple payment processors and provides embeddable widgets, customer portals, and extensive integrations.

### Technology Stack
- **Framework**: CodeIgniter 3 (PHP)
- **Database**: MySQL/MariaDB
- **Frontend**: Argon Dashboard Pro v1.2.0
- **Containerization**: Docker & Docker Compose
- **Deployment**: Ansible, AWS (CodeBuild)
- **Version Control**: Git

### Key Characteristics
- Multi-tenant architecture (Organizations & Sub-organizations)
- Multiple payment processor support (Fortis, PaySafe, EpicPay, Crypto)
- Embeddable donation/payment widgets
- Customer portal for invoice/payment management
- RESTful API for customer operations
- Real-time messaging/chat system
- Comprehensive reporting & statements

---

## Architecture

### Directory Structure

```
Lunarpay/
├── application/              # Main application code
│   ├── controllers/         # Business logic controllers
│   │   ├── customer/       # Customer-facing API controllers
│   │   ├── integrations/   # Third-party integration controllers
│   │   ├── extensions/     # Payment extensions
│   │   └── utilities/      # Utility controllers (migrations, etc.)
│   ├── models/             # Data models
│   ├── views/              # View templates
│   │   └── themed/         # Themed views (Argon Dashboard)
│   ├── libraries/          # Custom libraries
│   │   ├── gateways/      # Payment gateway libraries
│   │   ├── email/         # Email providers
│   │   ├── messenger/     # Messaging providers
│   │   └── integrations/  # Integration libraries
│   ├── helpers/            # Helper functions
│   ├── config/             # Configuration files
│   ├── migrations/         # Database migrations (209 files)
│   └── uploads/            # File uploads directory
├── assets/                  # Frontend assets
│   ├── argon-dashboard-pro-v1.2.0/  # Admin theme
│   ├── widget/             # Widget assets
│   ├── customer-portal/    # Customer portal assets
│   ├── js/                 # JavaScript files
│   ├── css/                # Stylesheets
│   └── images/             # Image assets
├── ansible/                 # Deployment automation
├── deploy/                  # Deployment scripts
├── system/                  # CodeIgniter system files
└── docker-compose.yml       # Docker configuration
```

### Multi-Tenant Architecture

LunarPay supports hierarchical organization structure:
- **Organizations** (Churches/Companies) - Top-level entity
- **Sub-organizations** (Campuses) - Child entities under organizations
- **Funds** - Financial categories within organizations/sub-organizations
- **Users** - Admins with access to manage organizations

---

## Payment Processors

LunarPay supports four payment processors, configurable per user/organization:

### 1. Fortis (FTS) - **Default**
- **Provider ID**: `PROVIDER_PAYMENT_FORTIS` (4)
- **Short Code**: `FTS`
- **Features**: 
  - Credit card & ACH/bank account processing
  - Merchant onboarding via API
  - Webhook support for real-time updates
  - Sandbox & production environments
- **Configuration**:
  - Developer ID, User ID, API Key, Location ID
  - Environment flag: `fortis_environment` (dev/prd)
  - Encryption phrase for secure data storage
- **Controllers**: 
  - `Fortiscron.php` - Scheduled webhook processing
  - `Fortiswebhooks.php` - Webhook receiver
- **Library**: `FortisLib.php`
- **Onboarding Model**: `Orgnx_onboard_fts_model`

### 2. PaySafe (PSF)
- **Provider ID**: `PROVIDER_PAYMENT_PAYSAFE` (2)
- **Short Code**: `PSF`
- **Features**:
  - Credit card & direct debit processing
  - Netbanx merchant portal integration
  - Single-use token API for secure payments
  - Multi-account support (mirrored systems)
- **Configuration**:
  - Partner credentials (test & live)
  - Single-use token API keys (public/private)
  - Environment flag: `paysafe_environment` (dev/prd)
- **Controllers**:
  - `Paysafe.php`
  - `Paysafecron.php`
  - `Paysafewebhooks.php`
- **Library**: `PaySafeLib.php`
- **Onboarding Model**: `Orgnx_onboard_psf_model`

### 3. EpicPay (EPP)
- **Provider ID**: `PROVIDER_PAYMENT_EPICPAY` (1)
- **Short Code**: `EPP`
- **Features**:
  - Credit card & bank account processing
  - Multiple pricing templates (ActiveBase, ActiveBase2-4)
  - Subscription management
- **Fee Templates**:
  - **AB29030**: CC 2.9% + $0.30, Bank 1% + $0.30
  - **ActiveBase2**: CC/Bank 2% + $0.30
  - **ActiveBase3**: CC/Bank 2.15% + $0.30
  - **ActiveBase4** (Default): CC/Bank 2.3% + $0.30
- **Controllers**:
  - `Epicpay.php`
- **Library**: `PtyEpicPay.php`

### 4. Cryptocurrency (ETH)
- **Provider ID**: `PROVIDER_PAYMENT_ETH` (3)
- **Short Code**: `ETH`
- **Features**:
  - Ethereum & cryptocurrency wallet support
  - Wallet address management
  - Active/inactive wallet toggle
- **Library**: `CryptoLib.php`
- **Onboarding Model**: `Orgnx_onboard_crypto_model`

### Payment Provider Interface
- **Common Library**: `PaymentsProvider.php` - Abstract interface for all processors
- **Extension System**: `extensions/Payments.php` & `SourceDataBuilder.php`

---

## Core Features

### 1. Organizations Management
**Controller**: `Organizations.php`  
**Model**: `Organization_model`

- Create, update, delete organizations (churches/companies)
- Multi-organization support per user account
- Organization-specific settings & branding
- Payment processor assignment per organization
- Token-based organization identification
- Organization onboarding workflows
- Address, phone, website management

**Key Fields**:
- `church_name` - Organization name
- `ch_id` - Organization ID
- `token` - Unique token for widget/API access
- State, city, street address, postal code
- Phone number, website

### 2. Sub-Organizations (Campuses)
**Controller**: `Suborganizations.php`  
**Model**: `Suborganization_model`

- Child entities under main organizations
- Campus/branch location management
- Separate branding & chat settings per campus
- Pastor/leader assignment
- Address & contact information
- Slug-based URL routing

### 3. Funds Management
**Controller**: `Funds.php`  
**Model**: `Fund_model`

- Financial categories for donations/transactions
- Organization & sub-organization level funds
- Fund naming & descriptions
- Active/inactive status
- Transaction linking to funds
- Fund-specific reporting

### 4. Donors/Customers Management
**Controller**: `Donors.php`  
**Model**: `Donor_model`

- Complete customer database
- Customer profiles with transaction history
- First/last donation tracking
- Total donation amounts & frequency
- Saved payment sources (credit cards, bank accounts)
- New donor identification (configurable timeframe)
- Customer created from various sources (widget, invoice, manual entry)
- Contact information management
- Integration IDs (Stripe, QuickBooks, FreshBooks)

**Donor Profile Features**:
- Full name, email, phone
- Address information
- Transaction history
- Payment methods on file
- Total giving statistics
- First/last donation dates

### 5. Donations/Transactions Management
**Controller**: `Donations.php`  
**Model**: `Donation_model`

- Complete transaction processing & tracking
- Support for multiple transaction types:
  - One-time donations
  - Recurring donations (subscriptions)
  - Refunds
  - Failed transactions
  - Manual entries
- Transaction status tracking:
  - Pending (P)
  - Completed
  - Failed
  - Refunded
  - Recovered (failed -> successful retry)
- Payment method support:
  - Credit Card (CC)
  - ACH/Bank Account (ACH)
  - Cryptocurrency
- Transaction details:
  - Amount, fee, net amount
  - Source (widget, invoice, payment link, mobile app)
  - Fund allocation (multi-fund support)
  - Receipt generation
  - Payment processor transaction IDs
- Subscription management:
  - Frequency (weekly, monthly, quarterly, yearly)
  - Status tracking
  - Automatic billing
- CSV export functionality
- Manual transaction marking (success/failure)
- Transaction filtering & search
- ACH status tracking

### 6. Invoices
**Controller**: `Invoices.php`  
**Model**: `Invoice_model`, `Invoice_products_model`

- Professional invoice generation
- Invoice status workflow:
  - Draft
  - Finalized
  - Sent
  - Paid
  - Partially Paid
  - Overdue
  - Archived
- Features:
  - Line items (products)
  - Customer assignment
  - Due dates
  - Memo/comments
  - Footer customization
  - Payment options (CC, ACH, both)
  - Cover fee option
  - Reference numbers
  - PDF generation & storage
  - Email delivery
  - Unique hash-based URLs
  - Payment tracking
  - Post-purchase links
- Clone invoice functionality
- Integration with products catalog
- Integration IDs (Stripe, QuickBooks, FreshBooks)

### 7. Products Catalog
**Controller**: `Products.php`  
**Model**: `Product_model`

- Product inventory management
- Pricing & quantity tracking
- Digital content support:
  - File uploads (hashed storage)
  - Automatic delivery after purchase
- Subscription products:
  - Recurring billing intervals
  - Trial periods
  - Start dates
- Custom date fields
- Product references
- Soft delete (trash)
- Unique slug generation
- Organization/sub-organization assignment
- Integration IDs (Stripe, QuickBooks)

### 8. Payment Links
**Controller**: `Payment_links.php`  
**Model**: `Payment_link_model`, `Payment_link_product_model`, `Payment_link_product_paid_model`

- Shareable payment collection pages
- Features:
  - Multiple products per link
  - Unlimited quantity options
  - Payment method selection (CC/ACH)
  - Organization/sub-organization assignment
  - Status management (active/inactive)
  - Unique hash-based URLs
  - Product inventory tracking
  - Subscription support through products
  - Payment tracking (paid products)
- Use cases:
  - Event registration
  - Product sales
  - Service payments
  - General collections

### 9. Statements & Reporting
**Controller**: `Statements.php`  
**Model**: `Statement_model`, `Statement_donor_model`

- Donor contribution statements
- Date range selection
- Fund-specific or all-funds reporting
- Export formats:
  - PDF (individual or batch)
  - Excel (.xlsx)
- Bulk generation for multiple donors
- Email delivery with custom messages
- Statement archiving
- ZIP file bundling for batch exports
- Admin & donor statement types

### 10. Batches
**Controller**: `Batches.php`  
**Model**: `Batches_model`, `Batch_tags_model`

- Transaction batch processing
- Manual transaction entry
- Batch status tracking:
  - Draft
  - Committed
- Batch tagging system
- Commit timestamps
- Batch-level transaction grouping

### 11. Team Management
**Controller**: `Team.php`, `Settings.php`  
**Model**: `User_model`, `Ion_auth_model`

- User access control
- Multi-user accounts
- Role-based permissions (via Ion Auth)
- Child account support (sub-users)
- User profiles:
  - First/last name
  - Email, phone
  - Password management
  - Payment processor assignment
- Session management
- OAuth integrations per user

### 12. Messaging/Chat System
**Controller**: `Messaging.php`, `Messenger.php`  
**Model**: `History_chat_model`, `Chat_model`, `Chat_setting_model`

- Real-time messaging (via Twilio)
- Organization-specific chat settings
- Inbox management
- Message history
- Chat archiving
- Status tracking (active/archived)
- Timezone support
- Public chat IDs for widget integration

### 13. Settings & Branding
**Controller**: `Settings.php`  
**Model**: `Setting_model`, `Chat_setting_model`

- System-wide settings
- Organization branding:
  - Logo upload (max 500KB)
  - Color schemes
  - Widget appearance
  - Chat widget customization
- Organization-level settings
- Sub-organization-level settings
- Email templates
- Notification preferences

### 14. Referral Program
**Controller**: `Referrals.php`  
**Model**: `Referal_model`

- User referral tracking
- Share code generation
- Referral message customization
- Month/date tracking

### 15. Pages (Custom Content)
**Controller**: `Pages.php`  
**Model**: `Page_model`

- Custom page creation
- Content management
- Soft delete functionality
- Organization-specific pages

### 16. Files Management
**Controller**: `Files.php`

- File upload handling
- Secure file storage (`/application/uploads/`)
- File retrieval via secure URLs
- Category-based organization

### 17. Communication
**Controller**: `Communication.php`  
**Model**: `Communication_model`

- Email campaign management
- Bulk communication
- Donor communication tracking

### 18. Dashboard & Analytics
**Controller**: `Dashboard.php`, `Dash.php`

- Multiple dashboard versions (v1, v2, v3)
- User profile management
- Password change functionality
- Organization overview
- Transaction analytics

### 19. Getting Started / Onboarding
**Controller**: `Getting_started.php`, `Getting_started_fts.php`

- Guided setup process
- Payment processor onboarding
- Organization setup wizard
- Step-by-step configuration

### 20. Progressive Web App (PWA)
**Controller**: `Pwa.php`

- Mobile app manifest generation
- Offline capability
- App-like experience

### 21. Give Anywhere
**Controller**: `Give_anywhere.php`  
**Model**: `Give_anywhere_model`

- Text-to-give functionality
- SMS-based donations
- Keyword-based giving

### 22. Payouts
**Controller**: `Payouts.php`

- Payout tracking
- Settlement reporting
- Payment processor payout reconciliation

### 23. Custom Text/Localization
**Controller**: `Customize_text.php`  
**Model**: `Customize_text_model`

- Multi-language support
- Custom text overrides
- Localization management

---

## Third-Party Integrations

### 1. Stripe
**Controller**: `integrations/Stripe.php`

- **Purpose**: Payment & customer data import
- **Features**:
  - OAuth connection
  - Customer import
  - Invoice import
  - Product import
  - Automatic data mapping
- **OAuth Configuration**:
  - Client ID: `STRIPE_OAUTH_CLIENT_ID`
  - Secret: `STRIPE_OAUTH_SECRET`
- **Data Storage**: `users.stripe_oauth` field

### 2. QuickBooks
**Controller**: `integrations/Quickbooks.php`

- **Purpose**: Accounting integration
- **Features**:
  - OAuth connection
  - Customer push to QuickBooks
  - Invoice creation
  - Item/product sync
  - Payment recording
  - Token refresh automation
- **OAuth Configuration**:
  - Client ID: `QUICKBOOKS_OAUTH_CLIENT_ID`
  - Secret: `QUICKBOOKS_OAUTH_SECRET`
- **Data Storage**: `users.quickbooks_oauth` field
- **Tracking Fields**:
  - `account_donor.quickbooks_id`
  - `invoices.quickbooks_id`
  - `products.id_quickbooks`
  - `transactions_funds.quickbooks_pushed`, `quickbooks_last_update`

### 3. FreshBooks
**Controller**: `integrations/Freshbooks.php`

- **Purpose**: Accounting & invoicing integration
- **Features**:
  - OAuth connection
  - Data synchronization
- **OAuth Configuration**:
  - Client ID: `FRESHBOOKS_OAUTH_CLIENT_ID`
  - Secret: `FRESHBOOKS_OAUTH_SECRET`
- **Data Storage**: `users.freshbooks_oauth` field
- **Tracking Fields**:
  - `account_donor.freshbooks_id`
  - `invoices.freshbooks_id`
  - `transactions_funds.freshbooks_pushed`, `freshbooks_last_update`

### 4. Planning Center
**Controller**: `integrations/Planningcenter.php`  
**Helper**: `planncenter_helper.php`

- **Purpose**: Church management system integration
- **Features**:
  - OAuth connection
  - Data synchronization
- **OAuth Configuration**:
  - Redirect URL: `PLANNINGCENTER_REDIRECT_URL`
  - Token URL: `PLANNINGCENTER_TOKEN_URL`
  - Client ID: `PLANNINGCENTER_CLIENT_ID`
  - Secret: `PLANNINGCENTER_SECRET`

### 5. Zapier
**Controller**: `integrations/Zapier.php`, `Zapierkpispoll.php`

- **Purpose**: Workflow automation
- **Features**:
  - Webhook triggers
  - KPI polling
  - Transaction automation
- **Configuration**:
  - Enabled flag: `ZAPIER_ENABLED`
  - Polling credentials: `ZAPIER_POLLING_KPIS_USER`, `ZAPIER_POLLING_KPIS_PASS`

### 6. Slack
**Controller**: `integrations/Slack.php`  
**Helper**: `slack_helper.php`

- **Purpose**: Team notifications
- **Features**:
  - OAuth connection
  - Channel messaging
  - Notification automation
- **Data Storage**: 
  - `users.slack_oauth`
  - `users.slack_channel`
  - `users.state_slack`

### 7. Twilio (Messaging)
**Library**: `messenger/Twilio.php`

- **Purpose**: SMS & messaging
- **Features**:
  - Text-to-give
  - Notifications
  - Two-way messaging
- **Configuration**:
  - Account SID (Live & Test)
  - Auth Token (Live & Test)
  - Environment flag: `PROVIDER_MESSENGER_TEST`
  - Main phone: `PROVIDER_MAIN_PHONE`
- **Controller**: `Twilio_tasks.php`

### 8. Mailgun (Email)
**Library**: `email/Mailgun.php`

- **Purpose**: Transactional email delivery
- **Configuration**:
  - Domain: `MAILGUN_DOMAIN`
  - API Key: `MAILGUN_API_KEY`
  - Enabled flag: `EMAILING_ENABLED`

### 9. Good Barber (Mobile Apps)
**Controller**: `Gbarber.php`  
**Library**: `Gbbot.php`

- **Purpose**: Mobile app generation
- **Features**:
  - App creation automation
  - Organization-based app provisioning
- **Configuration**:
  - Cookies: `GOODBARBER_COOKIES`
  - Username: `GOODBARBER_RESELLER_USERNAME`
  - Password: `GOODBARBER_RESELLER_PASSWORD`
  - Apps domain: `GOODBARBER_APPS_DOMAIN`
  - Requires verified organization: `GOODBARBER_APP_WITH_ORGNX`

### 10. Intercom
- **Purpose**: Customer support chat
- **Configuration**:
  - Force hide flag: `FORCE_HIDE_INTERCOM`
  - Conditional display based on environment

### 11. Google APIs
- **Configuration**: `GOOGLE_CODE_API`
- **Purpose**: Maps, geolocation services

### 12. Appcues
- **Purpose**: User onboarding & product tours
- **Configuration**: `APPCUES_ENABLED`

### 13. reCAPTCHA
- **Purpose**: Bot protection
- **Configuration**:
  - Enabled flag: `RECAPTCHA_ENABLED`
  - Secret key: `RECAPTCHA_SECRET_KEY`
  - Public key: `RECAPTCHA_PUBLIC_KEY`
  - Threshold: `RECAPTCHA_THRESHOLD` (0.1-1.0)

---

## API & Widget System

### Customer API (v1)
**Base Path**: `customer/apiv1/`  
**Authentication**: Token-based (Ion Auth)

#### Endpoints:

##### 1. Authentication
**Controller**: `customer/apiv1/Auth.php`
- User login/logout
- Session management
- Token validation

##### 2. Invoices
**Controller**: `customer/apiv1/Invoice.php`  
**Routes**: 
- `/c/invoice/{hash}`
- `/customer/apiv1/invoice/{hash}`
- Invoice retrieval by hash
- Invoice payment processing

##### 3. Payment Links
**Controller**: `customer/apiv1/Payment_link.php`  
**Routes**:
- `/c/portal/payment_link/{hash}`
- `/customer/apiv1/payment_link/{hash}`
- Payment link processing
- Product selection & payment

##### 4. Organizations
**Controller**: `customer/apiv1/Organization.php`
- Organization details retrieval
- Public organization information

##### 5. Payment Processing
**Controller**: `customer/apiv1/Pay.php`
- Payment submission
- Payment method handling
- Transaction creation

##### 6. Payment Sources
**Controller**: `customer/apiv1/Source.php`
- Saved payment methods
- Source creation/deletion
- Source management

##### 7. Subscriptions
**Controller**: `customer/apiv1/Subscription.php`
- Subscription management
- Recurring payment handling

##### 8. Tokens
**Controller**: `customer/apiv1/Token.php`
- Secure token generation
- Single-use tokens for payments

### Customer Portal
**Controllers**: `customer/Portal.php`, `customer/Invoice.php`

- Public-facing customer interface
- Invoice viewing & payment
- Payment link processing
- No authentication required (hash-based access)

### Widget System
**Controller**: `Widget.php`, `Widget_load.php`, `Widget_profile.php`  
**Library**: `Widget_api_202107.php`  
**Model**: `Api_session_model`

#### Features:
- Embeddable donation widgets
- Standalone widget pages
- Widget customization per organization
- Multi-fund support
- Recurring donation options
- Session management
- Access token validation
- Public vs. protected widgets
- Chat integration
- Branding customization

#### Widget Authentication:
- Variable names:
  - Auth object: `WIDGET_AUTH_OBJ_VAR_NAME`
  - Access token: `WIDGET_AUTH_ACCESS_TOKEN_VAR_NAME`
  - Refresh token: `WIDGET_AUTH_REFRESH_TOKEN_VAR_NAME`

#### Widget Routes:
- `/pwa/{slug}` - PWA widget
- `/{slug}` - Standalone widget (if not a controller)
- Token-based organization lookup

#### Widget Configuration:
- Minimum button count: `WIDGET_MIN_COUNT_BUTTONS` (4)
- Force multi-funds: `FORCE_MULTI_FUNDS`
- Recurring options: one-time, weekly, monthly, quarterly, yearly

#### Widget API Methods:
- `setup()` - Widget initialization
- `get_settings()` - Widget configuration
- `index()` - Main widget endpoint
- `is_logged()` - Authentication check

### Widget Token System
**Controller**: `Wtoken.php`

- Secure token generation for widgets
- Token validation
- Session management

---

## Database Schema

### Key Tables

#### Organizations & Structure
- `church` - Organizations (churches/companies)
- `campuses` - Sub-organizations
- `users` - Admin users
- `users_groups` - User role assignments
- `groups` - Role definitions

#### Financial
- `transactions_funds` - Donations/transactions
- `fund` - Fund categories
- `batches` - Transaction batches
- `batch_tags` - Batch tagging
- `tags` - Tag definitions
- `subscriptions` - Recurring donations

#### Invoicing & Products
- `invoices` - Invoice headers
- `invoice_products` - Invoice line items
- `products` - Product catalog
- `payment_links` - Payment link definitions
- `payment_link_products` - Products in payment links
- `payment_link_products_paid` - Payment link transactions

#### Customers
- `account_donor` - Customer records
- `sources` - Saved payment methods

#### Statements
- `statements` - Statement generations
- `statement_donor` - Donor-statement relationships

#### Integrations & Onboarding
- `church_onboard` - General onboarding
- `church_onboard_paysafe` - PaySafe merchant onboarding
- `church_onboard_fortis` - Fortis merchant onboarding
- `church_onboard_crypto` - Crypto wallet setup

#### Webhooks
- `paysafe_webhooks` - PaySafe webhook logs
- `fortis_webhooks` - Fortis webhook logs

#### Chat & Messaging
- `chat` - Chat configurations
- `chat_settings` - Organization chat settings
- `history_chat` - Chat message history

#### Content
- `pages` - Custom pages
- `settings` - System settings

#### API
- `api_session` - Widget API sessions
- `api_keys_merchant` - Merchant API keys

#### Referrals
- `referrals` - Referral tracking

### Migration System
- **Total Migrations**: 209 files
- **Location**: `application/migrations/`
- **Naming**: Timestamp-based (YYYYMMDDHHMMSS_description.php)
- **Management**: Via `utilities/Migrate.php` controller
- **Operations**:
  - Create: `/utilities/migrate/create`
  - Run: `/utilities/migrate/run`

---

## Deployment & Infrastructure

### Docker Setup

#### Production
**File**: `docker-compose.yml`
- PHP-FPM container
- MySQL database
- phpMyAdmin (optional)

#### Local Development
**File**: `docker-compose-local.yml`
- Port mappings: 3001 (app), 3002 (phpMyAdmin)
- Volume mounts for live development
- Local database setup

#### Dockerfiles
- `Dockerfile` - Production image
- `Dockerfile.dev` - Development image with debugging tools
- Custom `php.ini` configuration

### Ansible Deployment
**Location**: `/ansible/`

#### Structure:
- `ansible.cfg` - Ansible configuration
- `hosts.yml` - Inventory management
- `requirements.yml` - Ansible Galaxy dependencies

#### Playbooks:
- `init.yml` - Initial server setup
- `builder.yml` - Build & deployment automation

#### Roles:
- `container_image` - Docker image building
- `container_registry` - Registry management
- `k8s_login` - Kubernetes authentication
- `k8s_deployment` - Deployment management
- `k8s_env_vars` - Environment variable injection
- `k8s_migrations` - Database migration execution
- `k8s_certificates` - SSL/TLS certificate management
- `k8s_virtualserver` - NGINX Ingress configuration
- `k8s_waf` - Web Application Firewall setup
- `deployment_standard` - Standard deployment procedures

#### Group Variables:
- `all/` - Global variables & secrets
- `dev/` - Development-specific variables

### AWS CodeBuild
**File**: `buildspec-dev.yml`
- Automated CI/CD pipeline
- Build, test, deploy workflow
- Integration with AWS services

### Deployment Scripts
**Location**: `/deploy/`
- `config.js` - Deployment configuration
- `docker_build.js` - Docker build automation
- `docker_env.js` - Environment setup
- `docker_push.js` - Registry push automation
- `target_environment.js` - Environment targeting
- `utilities.js` - Common utilities

---

## Security & Authentication

### Authentication System
**Library**: Ion Auth (CodeIgniter authentication library)  
**Model**: `Ion_auth_model`

#### Features:
- User registration & login
- Password hashing (configurable hash method)
- Session management
- Remember me functionality
- Group-based permissions
- Child user accounts
- Password reset
- Email activation

### Access Control
**Controller**: `Acl.php`

- Role-based access control
- Permission checking
- AJAX form handling
- User management

### Security Features

#### CSRF Protection
- Token name: `CSRF_TOKEN_NAME`
- Route-specific CSRF handling: `routes_csrf.php`

#### Encryption
- Payment processor data encryption phrases:
  - EpicPay: `pty_epicpay_encrypt_phrase`
  - PaySafe: `paysafe_encrypt_phrase`
  - Fortis: `fortis_encrypt_phrase`
  - Integrations: `integrations_encrypt_phrase`

#### Session Security
- SameSite cookie attribute: `SET_SAME_SITE_NONE`
- Secure session handling
- API session management

#### File Security
- Secure file upload handling
- Hash-based file storage
- Protected upload directory
- `.htaccess` restrictions

#### Data Protection
- Sensitive data encryption
- Secure payment processor credentials
- Environment variable configuration
- No hardcoded secrets

### Security Controller
**Controller**: `Encrypt.php`

- Encryption utilities
- Secure data handling

### Code Security Model
**Model**: `Code_security_model`

- Security code generation
- Verification code management

---

## Configuration

### Environment Variables
**File**: `.env` (not in repo, use `.env.example`)

#### Core Settings:
- `APP_BASE_URL` - Application base URL
- `IS_DEVELOPER_MACHINE` - Development mode flag

#### Payment Processors:

##### PaySafe:
- `paysafe_encrypt_phrase`
- `paysafe_partner_user_test/live`
- `paysafe_partner_passsword_test/live`
- `paysafe_environment` (dev/prd)

##### Fortis:
- `fortis_environment` (dev/prd)
- `fortis_encrypt_phrase`
- `fortis_developer_id_sandbox/production`
- `fortis_user_id_sandbox/production`
- `fortis_user_api_key_sandbox/production`
- `fortis_location_id_sandbox`

##### Integrations:
- `integrations_encrypt_phrase`

#### Email:
- `EMAILING_ENABLED`
- `CODEIGNITER_SMTP_USER`
- `CODEIGNITER_SMTP_PASS`
- `MAILGUN_DOMAIN`
- `MAILGUN_API_KEY`

#### Messaging:
- `PROVIDER_MESSENGER_TEST`
- `TWILIO_ACCOUNT_SID_LIVE/TEST`
- `TWILIO_AUTH_TOKEN_LIVE/TEST`

#### Integrations:
- `STRIPE_OAUTH_CLIENT_ID/SECRET`
- `FRESHBOOKS_OAUTH_CLIENT_ID/SECRET`
- `QUICKBOOKS_OAUTH_CLIENT_ID/SECRET`
- `PLANNINGCENTER_*`

#### Good Barber:
- `GOODBARBER_COOKIES`
- `GOODBARBER_RESELLER_USERNAME/PASSWORD`
- `GOODBARBER_APP_WITH_ORGNX`

#### Other:
- `RECAPTCHA_ENABLED/SECRET_KEY/PUBLIC_KEY/THRESHOLD`
- `APPCUES_ENABLED`
- `ZAPIER_ENABLED`
- `ZAPIER_POLLING_KPIS_USER/PASS`
- `GOOGLE_CODE_API`
- `FORCE_HIDE_INTERCOM`
- `EPICPAY_ONBOARD_FORM_TEST`

### Configuration Files

#### `config/config.php`
- Base URL configuration
- Payment processor credentials (from env)
- URI protocol
- Session settings
- Encryption key
- CSRF settings
- Cookie settings

#### `config/database.php`
- Database connection settings
- Host, username, password, database name
- Character set, collation
- Query builder settings

#### `config/constants.php` & `config/constants_ext.php`
- System-wide constants
- Payment provider definitions
- Fee structures
- Company branding
- Email providers
- Messenger providers
- Feature flags

#### `config/routes.php`
- Custom routing rules
- Widget routing
- Customer portal routing
- Default controller: `Organizations`

#### `config/ion_auth.php`
- Authentication settings
- Password hashing method
- Login requirements
- Session configuration

### System Constants

#### Payment Processors:
```php
PROVIDER_PAYMENT_EPICPAY = 1 (EPP)
PROVIDER_PAYMENT_PAYSAFE = 2 (PSF)
PROVIDER_PAYMENT_ETH = 3 (ETH)
PROVIDER_PAYMENT_FORTIS = 4 (FTS) - DEFAULT
```

#### Email Providers:
```php
PROVIDER_EMAIL_CODEIGNITER = 1
PROVIDER_EMAIL_MAILGUN = 2
PROVIDER_EMAIL_DEFAULT = CODEIGNITER
```

#### Messenger Providers:
```php
PROVIDER_MESSENGER_TWILIO = 1
PROVIDER_MESSENGER_DEFAULT = TWILIO
```

#### Feature Flags:
- `HIDE_FUTURE_FEATURES` - Hide unreleased features
- `FORCE_MULTI_FUNDS` - Enable multi-fund support
- `ZAPIER_ENABLED` - Enable Zapier integration
- `EMAILING_ENABLED` - Enable email sending
- `APPCUES_ENABLED` - Enable Appcues onboarding
- `RECAPTCHA_ENABLED` - Enable bot protection

#### Branding:
- `COMPANY_NAME` = "LunarPay"
- `COMPANY_SITE` = "LunarPay.io"
- `FOOTER_TEXT` = "@ LunarPay"
- `THEME` = "thm2"

#### Mirrored Systems:
- PaySafe & Fortis support multiple systems sharing one account
- Webhook routing between LunarPay & ChatGive instances

---

## Installation & Setup

### Prerequisites
- Docker & Docker Compose
- Git
- MySQL/MariaDB
- PHP 7.4+ (if running without Docker)

### Installation Steps

1. **Clone Repository**
```bash
git clone git@github.com:MbizAI/LunarPay.git
cd LunarPay
```

2. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Extract Frontend Assets**
```bash
# Extract argon-dashboard-pro-v1.2.0.zip inside /assets folder
cd assets
unzip ../application/argon-dashboard-pro-v1.2.0.zip
```

4. **Start Docker Containers**
```bash
# Local development
sudo docker-compose -f docker-compose-local.yml up --build

# Stop containers
sudo docker-compose -f docker-compose-local.yml down

# Restart containers
sudo docker-compose -f docker-compose-local.yml up
```

5. **Setup Database**
- Access phpMyAdmin: http://localhost:3002
- Create database (use credentials from `.env`)
- Import initial SQL data

6. **Run Migrations**
- Create migration: http://localhost:3001/utilities/migrate/create
- Edit migration file in `application/migrations/`
- Run migration: http://localhost:3001/utilities/migrate/run

7. **Access Application**
- Application: http://localhost:3001
- phpMyAdmin: http://localhost:3002

---

## Development Guidelines

### Code Structure
- Follow CodeIgniter 3 MVC pattern
- Controllers in `application/controllers/`
- Models in `application/models/`
- Views in `application/views/themed/thm2/`
- Libraries in `application/libraries/`
- Helpers in `application/helpers/`

### Database Changes
- Always create migrations for schema changes
- Use timestamp naming convention
- Test migrations before committing

### Adding Features
1. Create controller/model
2. Add routes if needed
3. Create views
4. Update database schema via migration
5. Test thoroughly
6. Document changes

### Payment Processor Integration
- Implement `PaymentsProvider` interface
- Create library in `application/libraries/gateways/`
- Add onboarding model if needed
- Create webhook handler controller
- Update constants for provider ID

### Security Best Practices
- Always validate & sanitize user input
- Use CodeIgniter's form validation
- Never store sensitive data unencrypted
- Use environment variables for secrets
- Implement CSRF protection
- Check user authentication/authorization
- Sanitize database queries (use query builder)

---

## API Documentation

### Widget API Endpoints

#### Setup Widget
```
POST /widget/setup
Headers: Access-Token
Body: {
  chatgive_tokens: {
    connection: 1,
    page: "page_name"
  }
}
```

#### Get Widget Settings
```
GET /widget/get_settings
Params: id_bot, connection
```

#### Process Donation
```
POST /widget/index
Headers: Access-Token
Body: {
  id_bot: 123,
  amount: 100.00,
  fund_id: 5,
  recurring: "monthly"
}
```

### Customer API Endpoints

#### Get Invoice
```
GET /customer/apiv1/invoice/{hash}
```

#### Pay Invoice
```
POST /customer/apiv1/pay
Body: {
  invoice_hash: "abc123",
  source_id: 456,
  amount: 100.00
}
```

#### Get Payment Link
```
GET /customer/apiv1/payment_link/{hash}
```

#### Process Payment Link
```
POST /customer/apiv1/pay
Body: {
  payment_link_hash: "def456",
  products: [{id: 1, qty: 2}],
  source_id: 789
}
```

---

## Troubleshooting

### Common Issues

#### Database Connection Failed
- Check `.env` database credentials
- Ensure MySQL container is running
- Verify database exists

#### Permission Denied Errors
- Check file permissions: `chmod -R 755 application/`
- Writable directories: `uploads/`, `logs/`, `cache/`

#### Payment Processor Errors
- Verify API credentials in `.env`
- Check environment setting (dev/prd)
- Review webhook logs

#### Widget Not Loading
- Check organization token
- Verify widget settings in `chat_settings` table
- Check browser console for errors

#### Migration Errors
- Ensure database user has DDL permissions
- Check migration file syntax
- Review migration order

---

## Support & Maintenance

### Logs
- Location: `application/logs/`
- CodeIgniter logs errors automatically
- Check logs for debugging

### Cron Jobs
- **Fortis**: `Fortiscron.php` - Process webhooks
- **PaySafe**: `Paysafecron.php` - Process webhooks
- **General**: `Cron.php` - System maintenance tasks

### Monitoring
- Database size & performance
- API response times
- Payment processor uptime
- Webhook delivery success rates

---

## Version Control

### Git Workflow
- **Main Branch**: `main` or `master`
- **Development Branch**: `dev` or `dev-aws`
- Feature branches for new features
- Commit messages should be descriptive

### Contributing
- Fork repository
- Create feature branch
- Make changes
- Test thoroughly
- Submit pull request
- Ensure documentation is updated

---

## Future Enhancements

### Planned Features
- Enhanced analytics dashboard
- Advanced reporting
- Additional payment processors
- Mobile app improvements
- API v2 with REST standards
- GraphQL API
- Real-time notifications via WebSockets
- Advanced fraud detection

### Extensibility
- Plugin system for custom features
- Webhooks for external integrations
- Custom field support
- Theme customization engine

---

## License

See `license.txt` file for licensing information.

---

## Contact & Support

For issues, questions, or support, please contact the development team.

---

**Document Version**: 1.0  
**Last Updated**: November 2024  
**Status**: Comprehensive Documentation Complete


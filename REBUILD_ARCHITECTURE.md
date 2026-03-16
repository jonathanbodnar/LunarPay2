# LunarPay 2.0 - Modern Architecture & Rebuild Plan

## Executive Summary

Rebuilding LunarPay with modern technologies while maintaining 100% feature parity with the current PHP/CodeIgniter system. All Fortis payment integrations, invoicing, payment links, customer portal, and business logic will be preserved exactly as they currently work.

---

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router, React 18, TypeScript)
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand + React Query (TanStack Query)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts for analytics
- **Tables**: TanStack Table for data grids
- **Date/Time**: date-fns
- **HTTP Client**: Axios with interceptors

### Backend
- **Runtime**: Node.js 20+ with TypeScript
- **API Framework**: Next.js 14 API Routes (serverless)
- **Database**: Supabase PostgreSQL (with RLS policies)
- **ORM**: Prisma (type-safe database access)
- **Authentication**: Supabase Auth + JWT
- **File Storage**: Supabase Storage
- **Email**: Resend or SendGrid
- **SMS**: Twilio (same as current)
- **Cron Jobs**: Vercel Cron or Railway scheduled tasks

### Payment Processing
- **Processor**: Fortis API (identical integration)
- **Endpoints**: All 5 existing endpoints preserved
- **Webhooks**: Same webhook handling logic
- **Onboarding**: Fortis embedded onboarding (iframe)
- **Elements**: Fortis Elements for payment forms

### Deployment
- **Platform**: Railway (full-stack hosting)
- **Database**: Supabase (managed PostgreSQL)
- **CDN**: Railway/Vercel Edge Network
- **Environment**: Docker containers on Railway
- **CI/CD**: GitHub Actions
- **Monitoring**: Railway metrics + Sentry

### Development Tools
- **Package Manager**: pnpm (faster than npm)
- **Linting**: ESLint + Prettier
- **Type Checking**: TypeScript strict mode
- **Testing**: Jest + React Testing Library + Playwright
- **API Documentation**: OpenAPI/Swagger
- **Version Control**: Git (GitHub)

---

## Project Structure

```
lunarpay2/
├── .github/
│   └── workflows/              # CI/CD pipelines
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Database migrations
│   └── seed.ts                # Seed data
├── public/
│   ├── images/
│   └── widgets/               # Embeddable widget assets
├── src/
│   ├── app/                   # Next.js 14 App Router
│   │   ├── (auth)/           # Auth routes group
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── forgot-password/
│   │   ├── (dashboard)/      # Dashboard routes group
│   │   │   ├── organizations/
│   │   │   ├── invoices/
│   │   │   ├── payment-links/
│   │   │   ├── transactions/
│   │   │   ├── customers/
│   │   │   ├── products/
│   │   │   ├── statements/
│   │   │   ├── funds/
│   │   │   ├── settings/
│   │   │   └── getting-started/
│   │   ├── (customer)/       # Customer portal routes
│   │   │   ├── invoice/[hash]/
│   │   │   └── payment-link/[hash]/
│   │   ├── api/              # API routes
│   │   │   ├── auth/
│   │   │   ├── organizations/
│   │   │   ├── invoices/
│   │   │   ├── payment-links/
│   │   │   ├── transactions/
│   │   │   ├── fortis/
│   │   │   │   ├── onboard/
│   │   │   │   ├── transaction/
│   │   │   │   ├── refund/
│   │   │   │   └── webhooks/
│   │   │   └── cron/
│   │   │       └── subscriptions/
│   │   ├── widget/           # Embeddable widget
│   │   │   └── [slug]/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/               # shadcn/ui components
│   │   ├── forms/            # Reusable form components
│   │   ├── tables/           # Data table components
│   │   ├── layouts/          # Layout components
│   │   ├── dashboard/        # Dashboard-specific
│   │   ├── customer/         # Customer portal components
│   │   └── widget/           # Widget components
│   ├── lib/
│   │   ├── fortis/           # Fortis API client
│   │   │   ├── client.ts
│   │   │   ├── onboarding.ts
│   │   │   ├── transactions.ts
│   │   │   ├── refunds.ts
│   │   │   └── types.ts
│   │   ├── supabase/         # Supabase client
│   │   ├── prisma.ts         # Prisma client
│   │   ├── auth.ts           # Auth utilities
│   │   ├── email.ts          # Email service
│   │   ├── sms.ts            # Twilio SMS
│   │   └── utils.ts          # Helper functions
│   ├── hooks/                # React hooks
│   │   ├── useAuth.ts
│   │   ├── useOrganization.ts
│   │   └── useFortis.ts
│   ├── stores/               # Zustand stores
│   │   ├── authStore.ts
│   │   └── organizationStore.ts
│   ├── types/                # TypeScript types
│   │   ├── database.ts
│   │   ├── fortis.ts
│   │   └── api.ts
│   └── middleware.ts         # Next.js middleware
├── .env.example
├── .env.local
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── Dockerfile
├── railway.json              # Railway config
└── README.md
```

---

## Database Schema Migration

### Migration Strategy
1. **Export** existing MySQL schema to PostgreSQL-compatible SQL
2. **Create** Prisma schema matching exact structure
3. **Add** PostgreSQL-specific features (JSON, arrays, full-text search)
4. **Maintain** all foreign keys and indexes
5. **Preserve** all data types and constraints

### Key Tables (Prisma Schema)

```prisma
// Organizations
model Organization {
  id              Int       @id @default(autoincrement()) @map("ch_id")
  name            String    @map("church_name")
  legalName       String?   @map("legal_name")
  phoneNumber     String?   @map("phone_no")
  website         String?
  streetAddress   String?   @map("street_address")
  city            String?
  state           String?
  postal          String?
  token           String    @unique
  slug            String?   @unique
  userId          Int       @map("client_id")
  fortisTemplate  String?   @map("fortis_template")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  
  user            User      @relation(fields: [userId], references: [id])
  invoices        Invoice[]
  funds           Fund[]
  donors          Donor[]
  
  @@map("church_detail")
}

// Fortis Onboarding
model FortisOnboarding {
  id                    Int       @id @default(autoincrement())
  userId                Int       @map("user_id")
  organizationId        Int       @map("church_id")
  signFirstName         String?   @map("sign_first_name")
  signLastName          String?   @map("sign_last_name")
  signPhoneNumber       String?   @map("sign_phone_number")
  email                 String?
  merchantAddressLine1  String?   @map("merchant_address_line_1")
  merchantState         String?   @map("merchant_state")
  merchantCity          String?   @map("merchant_city")
  merchantPostalCode    String?   @map("merchant_postal_code")
  accountNumberLast4    String?   @map("account_number_last4")
  routingNumberLast4    String?   @map("routing_number_last4")
  accountHolderName     String?   @map("account_holder_name")
  appStatus             String?   @map("app_status")
  mpaLink               String?   @map("mpa_link") @db.Text
  locationId            String?   @map("location_id")
  authUserId            String?   @map("auth_user_id")
  authUserApiKey        String?   @map("auth_user_api_key")
  processorResponse     String?   @map("processor_response") @db.Text
  createdAt             DateTime  @default(now()) @map("created_at")
  updatedAt             DateTime? @updatedAt @map("updated_at")
  
  @@map("church_onboard_fortis")
}

// Transactions
model Transaction {
  id                    BigInt    @id @default(autoincrement())
  userId                Int       @map("user_id")
  donorId               Int       @map("donor_id")
  organizationId        Int       @map("church_id")
  amount                Decimal   @db.Decimal(10, 2)
  fee                   Decimal   @db.Decimal(10, 2)
  net                   Decimal   @db.Decimal(10, 2)
  source                String    @map("src") @db.VarChar(10)
  status                String    @db.Char(1)
  statusAch             String?   @map("status_ach")
  transactionType       String?   @map("trx_type")
  givingSource          String?   @map("giving_source")
  fortisTransactionId   String?   @map("epicpay_transaction_id")
  requestData           String?   @map("request_data") @db.Text
  requestResponse       String?   @map("request_response") @db.Text
  receiptFileUri        String?   @map("receipt_file_uri")
  invoiceId             Int?      @map("invoice_id")
  paymentLinkId         Int?      @map("payment_link_id")
  subscriptionId        Int?      @map("subscription_id")
  date                  DateTime  @default(now())
  createdAt             DateTime  @default(now()) @map("created_at")
  
  donor                 Donor     @relation(fields: [donorId], references: [id])
  
  @@map("epicpay_customer_transactions")
}

// Invoices, Products, Payment Links, etc. - All preserved
```

---

## Feature Migration Plan

### Phase 1: Foundation (Week 1-2)
- [ ] Initialize Next.js 14 project with TypeScript
- [ ] Set up Supabase project and database
- [ ] Create Prisma schema (complete database model)
- [ ] Implement authentication (Supabase Auth)
- [ ] Build basic dashboard layout
- [ ] Set up Railway deployment pipeline

### Phase 2: Core Payment Integration (Week 2-3)
- [ ] Fortis API client library (TypeScript)
- [ ] Transaction processing endpoints
- [ ] Fortis Elements integration (frontend)
- [ ] Webhook receiver for Fortis events
- [ ] Customer & payment source management
- [ ] Refund processing

### Phase 3: Merchant Onboarding (Week 3-4)
- [ ] Getting Started wizard (multi-step)
- [ ] Fortis embedded onboarding integration
- [ ] Organization creation flow
- [ ] Fund setup
- [ ] Chat widget configuration
- [ ] Text-to-give setup (Twilio)

### Phase 4: Invoicing System (Week 4-5)
- [ ] Invoice creation & editing
- [ ] Product catalog management
- [ ] Invoice line items
- [ ] PDF generation (using @react-pdf/renderer)
- [ ] Invoice status workflow
- [ ] Customer invoice portal (public access)
- [ ] Email delivery
- [ ] Payment processing from invoices

### Phase 5: Payment Links (Week 5-6)
- [ ] Payment link creation
- [ ] Product selection & inventory
- [ ] Public payment link pages
- [ ] Payment processing
- [ ] Subscription products support
- [ ] Analytics tracking

### Phase 6: Customer Management (Week 6-7)
- [ ] Donor/customer database
- [ ] Transaction history
- [ ] Saved payment methods
- [ ] Customer portal authentication
- [ ] Profile management
- [ ] Statement generation (PDF/Excel)

### Phase 7: Subscriptions & Recurring (Week 7-8)
- [ ] Subscription creation
- [ ] Recurring payment cron job
- [ ] Subscription management (pause, cancel)
- [ ] Failed payment handling
- [ ] Retry logic
- [ ] Customer subscription portal

### Phase 8: Advanced Features (Week 8-10)
- [ ] Batch processing
- [ ] Fund management
- [ ] Sub-organizations (campuses)
- [ ] Team & user management
- [ ] Statements generation
- [ ] Communication/messaging system
- [ ] Text-to-give (Twilio integration)

### Phase 9: Integrations (Week 10-11)
- [ ] QuickBooks integration
- [ ] Stripe data import
- [ ] FreshBooks integration
- [ ] Planning Center integration
- [ ] Zapier webhooks
- [ ] Slack notifications

### Phase 10: Widget & Embeds (Week 11-12)
- [ ] Embeddable donation widget
- [ ] Widget customization
- [ ] Multi-fund widget
- [ ] Standalone widget pages
- [ ] Widget analytics

### Phase 11: Reporting & Analytics (Week 12-13)
- [ ] Dashboard analytics
- [ ] Transaction reports
- [ ] Donor insights
- [ ] Export functionality (CSV, Excel, PDF)
- [ ] Custom date ranges
- [ ] Fund-level reporting

### Phase 12: Testing & Launch (Week 13-14)
- [ ] End-to-end testing (Playwright)
- [ ] API testing
- [ ] Payment flow testing
- [ ] Load testing
- [ ] Security audit
- [ ] Data migration from production
- [ ] Soft launch
- [ ] Full production launch

---

## API Architecture

### RESTful API Structure

```typescript
// Authentication
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
POST   /api/auth/forgot-password
POST   /api/auth/reset-password

// Organizations
GET    /api/organizations
POST   /api/organizations
GET    /api/organizations/:id
PUT    /api/organizations/:id
DELETE /api/organizations/:id

// Fortis Integration
POST   /api/fortis/onboard
POST   /api/fortis/transaction-intention
POST   /api/fortis/transaction
POST   /api/fortis/refund
POST   /api/fortis/webhooks

// Invoices
GET    /api/invoices
POST   /api/invoices
GET    /api/invoices/:id
PUT    /api/invoices/:id
DELETE /api/invoices/:id
POST   /api/invoices/:id/finalize
POST   /api/invoices/:id/send
GET    /api/invoices/public/:hash

// Payment Links
GET    /api/payment-links
POST   /api/payment-links
GET    /api/payment-links/:id
PUT    /api/payment-links/:id
DELETE /api/payment-links/:id
GET    /api/payment-links/public/:hash

// Transactions
GET    /api/transactions
GET    /api/transactions/:id
POST   /api/transactions/:id/refund

// Customers
GET    /api/customers
POST   /api/customers
GET    /api/customers/:id
PUT    /api/customers/:id

// Subscriptions
GET    /api/subscriptions
POST   /api/subscriptions
GET    /api/subscriptions/:id
DELETE /api/subscriptions/:id

// Cron Jobs
POST   /api/cron/process-subscriptions
```

---

## Fortis Integration (Preserved Logic)

### All 5 Endpoints Maintained

```typescript
// lib/fortis/client.ts

export class FortisClient {
  private baseURL: string;
  private developerId: string;
  private userId: string;
  private userApiKey: string;

  constructor(config: FortisConfig) {
    this.baseURL = config.environment === 'production' 
      ? 'https://api.fortis.tech/v1/'
      : 'https://api.sandbox.fortis.tech/v1/';
    this.developerId = config.developerId;
    this.userId = config.userId;
    this.userApiKey = config.userApiKey;
  }

  // 1. Merchant Onboarding
  async onboardMerchant(data: MerchantOnboardingData) {
    return this.request('POST', 'onboarding', data);
  }

  // 2. Transaction Intention (Elements)
  async createTransactionIntention(data: TransactionIntentionData) {
    return this.request('POST', 'elements/transaction/intention', data);
  }

  // 3. Credit Card Sale
  async processCreditCardSale(data: CreditCardSaleData) {
    return this.request('POST', 'transactions/cc/sale/token', data);
  }

  // 4. ACH Debit
  async processACHDebit(data: ACHDebitData) {
    return this.request('POST', 'transactions/ach/debit/token', data);
  }

  // 5. Refund Transaction
  async refundTransaction(transactionId: string, amount: number) {
    return this.request('PATCH', `transactions/${transactionId}/refund`, {
      transaction_amount: amount
    });
  }

  private async request(method: string, endpoint: string, data?: any) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'developer-id': this.developerId,
        'user-id': this.userId,
        'user-api-key': this.userApiKey,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    return response.json();
  }
}
```

---

## Environment Variables

```env
# App
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://app.lunarpay2.io

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=

# Fortis Sandbox
FORTIS_ENVIRONMENT=dev
FORTIS_DEVELOPER_ID_SANDBOX=
FORTIS_USER_ID_SANDBOX=
FORTIS_USER_API_KEY_SANDBOX=
FORTIS_LOCATION_ID_SANDBOX=

# Fortis Production
FORTIS_DEVELOPER_ID_PRODUCTION=
FORTIS_USER_ID_PRODUCTION=
FORTIS_USER_API_KEY_PRODUCTION=

# Encryption
FORTIS_ENCRYPT_PHRASE=
JWT_SECRET=

# Email
RESEND_API_KEY=

# SMS
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Integrations
STRIPE_OAUTH_CLIENT_ID=
STRIPE_OAUTH_SECRET=
QUICKBOOKS_OAUTH_CLIENT_ID=
QUICKBOOKS_OAUTH_SECRET=
```

---

## Deployment on Railway

### railway.json
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pnpm install && pnpm build"
  },
  "deploy": {
    "startCommand": "pnpm start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Dockerfile (Alternative)
```dockerfile
FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable pnpm && pnpm build

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
```

---

## Testing Strategy

### Unit Tests
```typescript
// __tests__/lib/fortis/client.test.ts
describe('FortisClient', () => {
  it('should create transaction intention', async () => {
    const client = new FortisClient(testConfig);
    const result = await client.createTransactionIntention({
      location_id: 'test',
      action: 'sale',
      amount: 10000
    });
    expect(result.data.client_token).toBeDefined();
  });
});
```

### Integration Tests
```typescript
// __tests__/api/transactions.test.ts
describe('POST /api/transactions', () => {
  it('should process payment', async () => {
    const response = await fetch('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData)
    });
    expect(response.status).toBe(200);
  });
});
```

### E2E Tests
```typescript
// e2e/invoice-payment.spec.ts
test('complete invoice payment flow', async ({ page }) => {
  await page.goto('/invoices/abc123');
  await page.fill('[name="cardNumber"]', '4111111111111111');
  await page.click('button:text("Pay Invoice")');
  await expect(page.locator('text=Payment Successful')).toBeVisible();
});
```

---

## Security Measures

1. **Authentication**: JWT tokens with refresh mechanism
2. **Authorization**: Row-Level Security (RLS) in Supabase
3. **API Security**: Rate limiting, CORS, CSRF protection
4. **Data Encryption**: Sensitive data encrypted at rest
5. **PCI Compliance**: Fortis Elements (no card data touches server)
6. **SQL Injection**: Prisma ORM with parameterized queries
7. **XSS Protection**: React auto-escaping + Content Security Policy
8. **Secrets Management**: Environment variables, no hardcoded keys

---

## Performance Optimizations

1. **Server Components**: Default to RSC for better performance
2. **Image Optimization**: Next.js Image component
3. **Code Splitting**: Automatic route-based splitting
4. **Caching**: React Query + HTTP caching headers
5. **Database Indexing**: All foreign keys and search fields
6. **CDN**: Static assets via Railway/Vercel Edge
7. **Lazy Loading**: Dynamic imports for heavy components
8. **Streaming SSR**: Suspense boundaries for progressive rendering

---

## Migration Strategy (Production Data)

### Phase 1: Parallel Running
- Run old and new systems simultaneously
- Sync data in real-time
- Test with subset of users

### Phase 2: Data Migration
```typescript
// scripts/migrate-data.ts
async function migrateOrganizations() {
  const oldOrgs = await mysql.query('SELECT * FROM church_detail');
  
  for (const org of oldOrgs) {
    await prisma.organization.create({
      data: {
        id: org.ch_id,
        name: org.church_name,
        // ... map all fields
      }
    });
  }
}
```

### Phase 3: Cutover
- DNS switch
- Redirect old URLs
- Monitor for issues
- Rollback plan ready

---

## Success Criteria

- [ ] All features working identically to current system
- [ ] Fortis integration 100% functional
- [ ] All existing data migrated successfully
- [ ] Performance equal or better than current system
- [ ] Zero downtime deployment
- [ ] All tests passing (unit, integration, e2e)
- [ ] Security audit passed
- [ ] User acceptance testing passed

---

## Timeline: 14 Weeks Total

**Start Date**: [TBD]  
**Soft Launch**: Week 13  
**Production Launch**: Week 14

---

## Next Steps

1. ✅ Review and approve architecture
2. Initialize GitHub repository
3. Set up Supabase project
4. Create initial Prisma schema
5. Begin Phase 1 development

---

**Document Version**: 1.0  
**Last Updated**: November 2024  
**Status**: Architecture Planning Complete - Ready for Implementation


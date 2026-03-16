# LunarPay 2.0 - Next Steps & Implementation Guide

## ✅ Phase 1 Complete: Foundation

The following has been completed and pushed to GitHub:

### 1. Project Initialized ✓
- Next.js 14 with App Router
- TypeScript configured
- Tailwind CSS set up
- All core dependencies installed

### 2. Database Schema Complete ✓
- **Complete Prisma schema** with all tables from original system
- 20+ models covering entire LunarPay database
- All relationships and constraints defined
- Ready for Supabase deployment

### 3. Architecture Documented ✓
- Full tech stack defined
- Project structure planned
- API architecture designed
- 14-week implementation roadmap

### 4. Repository Set Up ✓
- GitHub repository initialized
- Initial commit pushed
- README with setup instructions
- Environment variable templates

---

## 🚀 Immediate Next Steps (Do These Now)

### Step 1: Set Up Supabase

```bash
# 1. Go to https://supabase.com
# 2. Create new project
# 3. Name it: lunarpay2-production (or your choice)
# 4. Choose region closest to your users
# 5. Wait for database to provision (~2 minutes)
```

### Step 2: Configure Database

```bash
# 1. In Supabase dashboard, go to Settings > Database
# 2. Copy the connection string (URI format)
# 3. Create .env.local file in lunarpay2/
# 4. Add: DATABASE_URL="your-connection-string"
```

### Step 3: Initialize Database Schema

```bash
cd /Users/jonathanbodnar/lunarpay2

# Generate Prisma Client
npx prisma generate

# Push schema to Supabase (creates all tables)
npx prisma db push

# Verify in Supabase dashboard - you should see 30+ tables!
```

### Step 4: Set Up Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Link to existing project or create new one
# Select: Create new project
# Name: lunarpay2

# Add Supabase plugin (or use existing Supabase)
railway add
# Select: PostgreSQL (if not using external Supabase)
```

### Step 5: Configure Environment Variables

Create `/Users/jonathanbodnar/lunarpay2/.env.local`:

```env
# Get from Supabase dashboard
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# Copy from current LunarPay .env
FORTIS_ENVIRONMENT=dev
FORTIS_DEVELOPER_ID_SANDBOX=
FORTIS_USER_ID_SANDBOX=
FORTIS_USER_API_KEY_SANDBOX=
FORTIS_LOCATION_ID_SANDBOX=

FORTIS_DEVELOPER_ID_PRODUCTION=
FORTIS_USER_ID_PRODUCTION=
FORTIS_USER_API_KEY_PRODUCTION=

# Generate new 32+ character strings
FORTIS_ENCRYPT_PHRASE="generate-new-random-32-chars-minimum"
JWT_SECRET="generate-new-random-32-chars-minimum"
NEXTAUTH_SECRET="generate-new-random-32-chars-minimum"

# Copy from current system
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

### Step 6: Test Development Environment

```bash
cd /Users/jonathanbodnar/lunarpay2

# Start dev server
npm run dev

# Open browser
# Visit: http://localhost:3000
# You should see Next.js welcome page
```

---

## 📋 Phase 2: Core Features (Week 1-2)

### Task 1: Fortis Client Library

Create `src/lib/fortis/client.ts`:

```typescript
import axios, { AxiosInstance } from 'axios';

interface FortisConfig {
  environment: 'sandbox' | 'production';
  developerId: string;
  userId: string;
  userApiKey: string;
}

export class FortisClient {
  private client: AxiosInstance;
  
  constructor(config: FortisConfig) {
    const baseURL = config.environment === 'production'
      ? 'https://api.fortis.tech/v1/'
      : 'https://api.sandbox.fortis.tech/v1/';
    
    this->client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'developer-id': config.developerId,
        'user-id': config.userId,
        'user-api-key': config.userApiKey,
      },
    });
  }
  
  // All 5 Fortis endpoints...
  async onboardMerchant(data: any) {
    const response = await this.client.post('onboarding', data);
    return response.data;
  }
  
  async createTransactionIntention(data: any) {
    const response = await this.client.post('elements/transaction/intention', data);
    return response.data;
  }
  
  async processCreditCardSale(data: any) {
    const response = await this.client.post('transactions/cc/sale/token', data);
    return response.data;
  }
  
  async processACHDebit(data: any) {
    const response = await this.client.post('transactions/ach/debit/token', data);
    return response.data;
  }
  
  async refundTransaction(transactionId: string, amount: number) {
    const response = await this.client.patch(
      `transactions/${transactionId}/refund`,
      { transaction_amount: amount }
    );
    return response.data;
  }
}
```

### Task 2: Prisma Client Setup

Create `src/lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### Task 3: Supabase Client

Create `src/lib/supabase/client.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### Task 4: Authentication API

Create `src/app/api/auth/login/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      token,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 🎯 Feature Implementation Priority

### Week 1: Authentication & Organizations
1. ✅ Database schema (DONE)
2. User authentication (login/register)
3. Organization CRUD operations
4. Basic dashboard layout
5. Navigation & routing

### Week 2: Fortis Integration Core
1. Fortis client library
2. Merchant onboarding flow
3. Transaction processing
4. Webhook receiver
5. Test payments

### Week 3: Invoicing
1. Invoice creation
2. Product line items
3. PDF generation
4. Customer invoice portal
5. Payment processing

### Week 4: Payment Links
1. Payment link creation
2. Product selection
3. Public payment pages
4. Inventory management
5. Purchase tracking

### Week 5-6: Customer Management
1. Donor database
2. Transaction history
3. Saved payment methods
4. Customer portal
5. Statements generation

### Week 7-8: Subscriptions
1. Subscription creation
2. Recurring payment cron
3. Failed payment handling
4. Customer subscription management
5. Retry logic

### Week 9-10: Advanced Features
1. Fund management
2. Sub-organizations
3. Team management
4. Batch processing
5. Text-to-give

### Week 11-12: Integrations
1. QuickBooks
2. Stripe import
3. FreshBooks
4. Zapier webhooks
5. Slack notifications

### Week 13-14: Testing & Launch
1. E2E testing
2. Data migration
3. Security audit
4. Performance testing
5. Production launch

---

## 📦 Required Dependencies

Install additional packages as needed:

```bash
# Authentication
npm install bcryptjs jsonwebtoken
npm install -D @types/bcryptjs @types/jsonwebtoken

# PDF Generation
npm install @react-pdf/renderer

# Excel Export
npm install xlsx

# Date utilities (already installed)
# date-fns

# Charts & Analytics
npm install recharts

# shadcn/ui (for beautiful UI components)
npx shadcn-ui@latest init
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add card
```

---

## 🔄 Data Migration Strategy

### From Production MySQL to Supabase PostgreSQL

1. **Export current data**:
```bash
# From current LunarPay
cd /Users/jonathanbodnar/Lunarpay
php index.php utilities/export_data
```

2. **Convert to PostgreSQL format**:
```bash
# Create migration script
node scripts/convert-mysql-to-postgres.js
```

3. **Import to Supabase**:
```bash
# Use Prisma seed
npx prisma db seed
```

---

## 📊 Testing Checklist

Before each deployment:

- [ ] All API endpoints return correct responses
- [ ] Fortis test transactions complete successfully
- [ ] Invoice PDFs generate correctly
- [ ] Payment links accept payments
- [ ] Subscriptions process on schedule
- [ ] Webhooks update database correctly
- [ ] Customer portal accessible
- [ ] All forms validate properly
- [ ] Email notifications sent
- [ ] SMS notifications sent (Twilio)

---

## 🚢 Railway Deployment

```bash
# Deploy to Railway
railway up

# Set environment variables in Railway dashboard
# Database, Fortis, Twilio, etc.

# Run migrations on Railway
railway run npx prisma db push

# View logs
railway logs

# Open deployed app
railway open
```

---

## 📝 Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database GUI
npx prisma studio

# Generate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push

# Create migration
npx prisma migrate dev

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Seed database
npx prisma db seed

# Format code
npm run format

# Lint code
npm run lint

# Run tests
npm test
```

---

## 🆘 Troubleshooting

### Database Connection Issues
```bash
# Test connection
npx prisma db pull

# If fails, check:
# 1. DATABASE_URL format correct
# 2. Supabase project running
# 3. IP allowlist (Supabase allows all by default)
```

### Fortis API Errors
```bash
# Check credentials
echo $FORTIS_USER_ID_SANDBOX
echo $FORTIS_USER_API_KEY_SANDBOX

# Test API directly
curl https://api.sandbox.fortis.tech/v1/ping \
  -H "developer-id: YOUR_DEV_ID" \
  -H "user-id: YOUR_USER_ID" \
  -H "user-api-key: YOUR_API_KEY"
```

### Railway Deployment Issues
```bash
# Check logs
railway logs --tail

# Verify env vars
railway variables

# Restart service
railway restart
```

---

## 🎉 Success Criteria

You'll know Phase 2 is complete when:

1. ✅ User can login to dashboard
2. ✅ User can create organization
3. ✅ Fortis onboarding completes
4. ✅ Test payment processes successfully
5. ✅ Invoice creates and sends
6. ✅ Payment link accepts payment
7. ✅ Customer can view invoice
8. ✅ Subscription creates and processes
9. ✅ All deployed to Railway
10. ✅ All data migrated from old system

---

## 📞 Support

Questions? Issues? Contact the development team or refer to:

- [Architecture Doc](./REBUILD_ARCHITECTURE.md)
- [Fortis API Doc](../Lunarpay/FORTIS_API_DOCUMENTATION.md)
- [Original System Doc](../Lunarpay/COMPREHENSIVE_DOCUMENTATION.md)
- [Prisma Docs](https://www.prisma.io/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)

---

**Current Status**: ✅ Phase 1 Complete - Foundation Ready  
**Next Phase**: 🚀 Phase 2 - Core Features Development  
**Estimated Time**: 2 weeks to functional MVP


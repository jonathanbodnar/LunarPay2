# LunarPay 2.0 - Modern Payment Processing Platform

Complete rebuild of LunarPay with modern technologies while maintaining 100% feature parity.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- pnpm (recommended) or npm
- Supabase account
- Railway account
- Fortis payment processor credentials

### Installation

```bash
# Clone repository
git clone git@github.com:jonathanbodnar/LunarPay2.git
cd lunarpay2

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Set up Supabase database
# 1. Create new project on Supabase
# 2. Get DATABASE_URL from project settings
# 3. Update .env.local with connection string

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Seed initial data (optional)
npx prisma db seed

# Start development server
npm run dev
```

Visit http://localhost:3000

## 📦 Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **Auth**: Supabase Auth
- **Payments**: Fortis API
- **Deployment**: Railway + Supabase

## 🗂️ Project Structure

```
lunarpay2/
├── prisma/
│   └── schema.prisma          # Complete database schema
├── src/
│   ├── app/                   # Next.js 14 App Router
│   │   ├── (auth)/           # Authentication routes
│   │   ├── (dashboard)/      # Protected dashboard routes
│   │   ├── (customer)/       # Customer portal routes
│   │   ├── api/              # API endpoints
│   │   └── widget/           # Embeddable widget
│   ├── components/           # React components
│   ├── lib/                  # Utilities & integrations
│   │   ├── fortis/          # Fortis payment client
│   │   ├── prisma.ts        # Prisma client
│   │   └── supabase/        # Supabase client
│   ├── hooks/                # Custom React hooks
│   ├── stores/               # State management
│   └── types/                # TypeScript definitions
└── public/                   # Static assets
```

## 🔧 Environment Variables

Create `.env.local` with the following:

```env
# Database
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-key"

# Fortis Payment Processor
FORTIS_ENVIRONMENT=dev
FORTIS_DEVELOPER_ID_SANDBOX=
FORTIS_USER_ID_SANDBOX=
FORTIS_USER_API_KEY_SANDBOX=
FORTIS_LOCATION_ID_SANDBOX=

# Security
FORTIS_ENCRYPT_PHRASE=
JWT_SECRET=
NEXTAUTH_SECRET=

# Email & SMS
RESEND_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
```

## 🔌 Fortis Integration

All 5 Fortis API endpoints are implemented:

1. **Merchant Onboarding** - `POST /v1/onboarding`
2. **Transaction Intention** - `POST /v1/elements/transaction/intention`
3. **Credit Card Sale** - `POST /v1/transactions/cc/sale/token`
4. **ACH Debit** - `POST /v1/transactions/ach/debit/token`
5. **Refund** - `PATCH /v1/transactions/{id}/refund`

## 📊 Database Schema

Complete Prisma schema includes:

- Users & Authentication
- Organizations & Sub-organizations
- Fortis Onboarding
- Customers/Donors
- Transactions & Subscriptions
- Invoices & Products
- Payment Links
- Funds & Fund Allocations
- Webhooks & Settings

## 🚢 Deployment

### Railway Deployment

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Link project
railway link

# Deploy
railway up
```

### Environment Setup on Railway

1. Create new project on Railway
2. Add Supabase database
3. Set all environment variables
4. Deploy from GitHub (automatic)

## 📝 Development Workflow

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run Prisma Studio (database GUI)
npx prisma studio

# Generate Prisma client after schema changes
npx prisma generate

# Create new migration
npx prisma migrate dev --name migration_name

# Format code
npm run format

# Lint code
npm run lint
```

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run e2e tests
npm run test:e2e

# Run tests in watch mode
npm run test:watch
```

## 📚 API Documentation

API endpoints mirror the original LunarPay structure:

### Authentication
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`

### Organizations
- `GET /api/organizations`
- `POST /api/organizations`
- `PUT /api/organizations/:id`

### Fortis
- `POST /api/fortis/onboard`
- `POST /api/fortis/transaction`
- `POST /api/fortis/refund`
- `POST /api/fortis/webhooks`

### Invoices
- `GET /api/invoices`
- `POST /api/invoices`
- `GET /api/invoices/:id`
- `POST /api/invoices/:id/finalize`

### Payment Links
- `GET /api/payment-links`
- `POST /api/payment-links`
- `GET /api/payment-links/public/:hash`

### Transactions
- `GET /api/transactions`
- `POST /api/transactions/:id/refund`

### Subscriptions
- `GET /api/subscriptions`
- `POST /api/subscriptions`
- `DELETE /api/subscriptions/:id`

## 🔐 Security

- JWT-based authentication
- Row-Level Security (RLS) in Supabase
- PCI-compliant (Fortis Elements)
- CORS protection
- Rate limiting
- Input validation with Zod
- SQL injection prevention (Prisma)

## 📖 Documentation

- [Architecture Overview](./REBUILD_ARCHITECTURE.md)
- [Fortis API Integration](../Lunarpay/FORTIS_API_DOCUMENTATION.md)
- [Database Schema](./prisma/schema.prisma)
- [Original System Docs](../Lunarpay/COMPREHENSIVE_DOCUMENTATION.md)

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Run tests
4. Submit pull request

## 📄 License

Proprietary - All rights reserved

## 🆘 Support

For issues or questions, contact the development team.

---

**Status**: 🚧 Foundation Complete - Ready for Feature Development

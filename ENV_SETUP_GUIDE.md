# Environment Variables Setup Guide

## 🔑 Required Variables (Must Have)

### 1. Database (Supabase) - **REQUIRED**

```env
DATABASE_URL="postgresql://postgres.xxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**How to get**:
1. Go to https://supabase.com/dashboard
2. Create new project
3. Go to Settings → Database → Copy connection string
4. Go to Settings → API → Copy URL and keys

---

### 2. Fortis Payment Processor - **REQUIRED**

```env
FORTIS_ENVIRONMENT=dev

# Sandbox (for development/testing)
FORTIS_DEVELOPER_ID_SANDBOX=your_developer_id
FORTIS_USER_ID_SANDBOX=your_user_id
FORTIS_USER_API_KEY_SANDBOX=your_api_key
FORTIS_LOCATION_ID_SANDBOX=your_location_id

# Production (for live payments)
FORTIS_DEVELOPER_ID_PRODUCTION=your_developer_id
FORTIS_USER_ID_PRODUCTION=your_user_id
FORTIS_USER_API_KEY_PRODUCTION=your_api_key
```

**How to get**:
- Copy from your current LunarPay `.env` file
- Or get from Fortis merchant portal

---

### 3. Security Keys - **REQUIRED**

```env
JWT_SECRET=your_random_32_char_minimum_secret
NEXTAUTH_SECRET=your_random_32_char_minimum_secret
FORTIS_ENCRYPT_PHRASE=your_random_32_char_minimum_secret
CRON_SECRET=your_random_secret_for_cron
```

**How to generate**:
```bash
# Generate 4 random secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📧 Optional Variables (Recommended for Full Features)

### 4. Email Service (For Notifications)

**Option A: Resend (Recommended)**
```env
RESEND_API_KEY=re_123456789
EMAIL_FROM=noreply@lunarpay.io
```
Get from: https://resend.com/api-keys

**Option B: SendGrid**
```env
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@lunarpay.io
```

---

### 5. SMS Service (For Text-to-Give)

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+14155551234
```

**How to get**:
- Copy from current LunarPay
- Or get from https://console.twilio.com

---

## 🔌 Optional Integrations

### 6. QuickBooks

```env
QUICKBOOKS_OAUTH_CLIENT_ID=your_client_id
QUICKBOOKS_OAUTH_SECRET=your_secret
```

### 7. Stripe (for importing data)

```env
STRIPE_OAUTH_CLIENT_ID=ca_xxxxx
STRIPE_OAUTH_SECRET=sk_xxxxx
```

### 8. FreshBooks

```env
FRESHBOOKS_OAUTH_CLIENT_ID=your_client_id
FRESHBOOKS_OAUTH_SECRET=your_secret
```

---

## 📋 Complete .env.local Template

**For local development**, create `/Users/jonathanbodnar/lunarpay2/.env.local`:

```env
# ============================================
# REQUIRED - Copy these from Supabase
# ============================================
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# ============================================
# REQUIRED - Copy from current LunarPay
# ============================================
FORTIS_ENVIRONMENT=dev
FORTIS_DEVELOPER_ID_SANDBOX=
FORTIS_USER_ID_SANDBOX=
FORTIS_USER_API_KEY_SANDBOX=
FORTIS_LOCATION_ID_SANDBOX=

# For production
FORTIS_DEVELOPER_ID_PRODUCTION=
FORTIS_USER_ID_PRODUCTION=
FORTIS_USER_API_KEY_PRODUCTION=

# ============================================
# REQUIRED - Generate new random strings
# ============================================
JWT_SECRET=
NEXTAUTH_SECRET=
FORTIS_ENCRYPT_PHRASE=
CRON_SECRET=

# ============================================
# RECOMMENDED - For email notifications
# ============================================
RESEND_API_KEY=
EMAIL_FROM=noreply@lunarpay.io

# ============================================
# RECOMMENDED - For text-to-give
# ============================================
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# ============================================
# OPTIONAL - Integrations (add later)
# ============================================
STRIPE_OAUTH_CLIENT_ID=
STRIPE_OAUTH_SECRET=
QUICKBOOKS_OAUTH_CLIENT_ID=
QUICKBOOKS_OAUTH_SECRET=
```

---

## 🚀 Railway Environment Variables

When deploying to Railway, add these in the dashboard:

### Required for Production:
1. All Supabase variables
2. All Fortis production variables (not sandbox)
3. All security keys
4. `NODE_ENV=production`
5. `NEXT_PUBLIC_APP_URL=https://your-app.railway.app`

### Copy from Railway to .env.local:
```bash
# Railway provides these automatically
RAILWAY_ENVIRONMENT=production
RAILWAY_PUBLIC_DOMAIN=your-app.railway.app
```

---

## ✅ Quick Setup Checklist

- [ ] Create Supabase project
- [ ] Copy DATABASE_URL and Supabase keys
- [ ] Copy Fortis credentials from current LunarPay
- [ ] Generate 4 random secrets (JWT, NEXTAUTH, ENCRYPT, CRON)
- [ ] Create `.env.local` file
- [ ] Run `npx prisma generate`
- [ ] Run `npx prisma db push`
- [ ] Test with `npm run dev`
- [ ] Add same variables to Railway dashboard
- [ ] Deploy!

---

**Need Help?** See `DEPLOYMENT_GUIDE.md` for detailed instructions!


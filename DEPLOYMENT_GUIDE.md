# LunarPay 2.0 - Deployment Guide

## 🚀 Deploying to Railway + Supabase

This guide walks you through deploying LunarPay 2.0 to production.

---

## Prerequisites

- [ ] GitHub repository: `git@github.com:jonathanbodnar/LunarPay2.git`
- [ ] Supabase account
- [ ] Railway account
- [ ] Fortis payment processor credentials
- [ ] Domain name (optional, Railway provides subdomain)

---

## Step 1: Set Up Supabase (10 minutes)

### 1.1 Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in details:
   - **Name**: `lunarpay2-production`
   - **Database Password**: Generate strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free (for testing) or Pro (for production)
4. Click "Create new project"
5. Wait 2-3 minutes for provisioning

### 1.2 Get Database Connection String

1. In Supabase dashboard, go to **Settings** → **Database**
2. Scroll to "Connection string" section
3. Select **URI** tab
4. Copy the connection string
5. Replace `[YOUR-PASSWORD]` with your database password
6. Save this as `DATABASE_URL`

Example:
```
postgres://postgres.xxx:password@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### 1.3 Get API Keys

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key**: `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

### 1.4 Initialize Database Schema

On your local machine:

```bash
cd /Users/jonathanbodnar/lunarpay2

# Create .env.local with Supabase credentials
cat > .env.local << 'EOF'
DATABASE_URL="your-connection-string-here"
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-key"
EOF

# Generate Prisma client
npx prisma generate

# Push schema to Supabase (creates all tables)
npx prisma db push

# Verify - you should see 30+ tables created!
```

### 1.5 Enable Row Level Security (RLS)

In Supabase dashboard:

1. Go to **Authentication** → **Policies**
2. For each table, consider enabling RLS for production security
3. Or use service role key for backend (current approach)

---

## Step 2: Set Up Railway (15 minutes)

### 2.1 Install Railway CLI

```bash
npm i -g @railway/cli
```

### 2.2 Login to Railway

```bash
railway login
```

This opens browser for authentication.

### 2.3 Create New Project

```bash
cd /Users/jonathanbodnar/lunarpay2

# Initialize Railway project
railway init

# Choose:
# - Create new project: Yes
# - Project name: lunarpay2
# - Environment: production
```

### 2.4 Link to GitHub Repository

In Railway dashboard:
1. Go to your project
2. Click "New" → "GitHub Repo"
3. Select `jonathanbodnar/LunarPay2`
4. Railway will auto-deploy on every push to `main`

---

## Step 3: Configure Environment Variables on Railway

### 3.1 Add Environment Variables

In Railway dashboard → Your Project → Variables:

```env
# Node Environment
NODE_ENV=production

# App URL (Railway provides this, or use custom domain)
NEXT_PUBLIC_APP_URL=https://lunarpay2-production.up.railway.app

# Database (from Supabase)
DATABASE_URL=postgresql://...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Fortis - Copy from current LunarPay
FORTIS_ENVIRONMENT=prd
FORTIS_DEVELOPER_ID_SANDBOX=
FORTIS_USER_ID_SANDBOX=
FORTIS_USER_API_KEY_SANDBOX=
FORTIS_LOCATION_ID_SANDBOX=
FORTIS_DEVELOPER_ID_PRODUCTION=
FORTIS_USER_ID_PRODUCTION=
FORTIS_USER_API_KEY_PRODUCTION=

# Security - Generate new random strings
FORTIS_ENCRYPT_PHRASE=generate-new-32-char-minimum-string
JWT_SECRET=generate-new-32-char-minimum-string
NEXTAUTH_SECRET=generate-new-32-char-minimum-string

# Cron job security
CRON_SECRET=generate-random-secret-for-cron

# Email (Resend)
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@lunarpay.io

# SMS (Twilio) - Copy from current system
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Integrations - Copy from current system
STRIPE_OAUTH_CLIENT_ID=
STRIPE_OAUTH_SECRET=
QUICKBOOKS_OAUTH_CLIENT_ID=
QUICKBOOKS_OAUTH_SECRET=
FRESHBOOKS_OAUTH_CLIENT_ID=
FRESHBOOKS_OAUTH_SECRET=
```

### 3.2 Generate Random Secrets

```bash
# Generate secure random strings
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run this 3 times for:
- `FORTIS_ENCRYPT_PHRASE`
- `JWT_SECRET`
- `NEXTAUTH_SECRET`
- `CRON_SECRET`

---

## Step 4: Deploy Application

### 4.1 Trigger Deployment

```bash
# Push to GitHub (Railway auto-deploys)
git add .
git commit -m "Add deployment configuration"
git push origin main
```

Or manually trigger:
```bash
railway up
```

### 4.2 Monitor Deployment

1. Watch logs in Railway dashboard
2. Check build succeeds
3. Verify deployment is live
4. Visit health check: `https://your-app.railway.app/api/health`

### 4.3 Run Database Migrations on Railway

```bash
# Connect to Railway
railway link

# Run Prisma commands on Railway
railway run npx prisma db push

# Or use Railway dashboard → Deploy tab → Run Command
```

---

## Step 5: Configure Fortis Webhooks

### 5.1 Get Railway Public URL

Your URL: `https://lunarpay2-production.up.railway.app`

### 5.2 Configure in Fortis Dashboard

1. Login to Fortis merchant portal
2. Go to **Settings** → **Webhooks**
3. Add webhook URL:
   ```
   https://lunarpay2-production.up.railway.app/api/fortis/webhooks
   ```
4. Select events:
   - Merchant account approved
   - Transaction completed
   - Transaction failed
   - Refund processed

### 5.3 Test Webhook

Fortis provides webhook testing tool in dashboard.

---

## Step 6: Configure Cron Jobs on Railway

### 6.1 Set Up Subscription Processing

Railway automatically reads `railway.json` for cron configuration.

Verify in **Deployments** → **Cron Jobs**:
- Schedule: `0 2 * * *` (2 AM daily)
- Command: `curl -X POST...`

### 6.2 Test Cron Manually

```bash
railway run curl -X POST https://your-app.railway.app/api/cron/process-subscriptions \
  -H "Authorization: Bearer $CRON_SECRET"
```

---

## Step 7: Custom Domain (Optional)

### 7.1 Add Custom Domain in Railway

1. Railway dashboard → Settings → Domains
2. Click "Add Domain"
3. Enter: `app.lunarpay2.io`
4. Railway provides DNS instructions

### 7.2 Update DNS Records

Add these records in your DNS provider:

```
Type: CNAME
Name: app
Value: your-app.up.railway.app
```

### 7.3 Update Environment Variable

```env
NEXT_PUBLIC_APP_URL=https://app.lunarpay2.io
```

Redeploy after changing.

---

## Step 8: Verify Deployment

### 8.1 Health Check

```bash
curl https://your-app.railway.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

### 8.2 Test Endpoints

```bash
# Register a user
curl -X POST https://your-app.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "securepassword123",
    "firstName": "Test",
    "lastName": "User"
  }'

# Login
curl -X POST https://your-app.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "securepassword123"
  }'
```

### 8.3 Test Fortis Integration

1. Register account
2. Create organization
3. Complete Fortis onboarding
4. Verify webhook received
5. Process test transaction

---

## Step 9: Data Migration (When Ready)

### 9.1 Export from Current System

```bash
cd /Users/jonathanbodnar/Lunarpay

# Export data to JSON
php index.php utilities/export_data
```

### 9.2 Create Migration Script

Create `scripts/migrate-data.ts` (see detailed script in repo).

### 9.3 Run Migration

```bash
npm run db:migrate-data
```

### 9.4 Verify Data

1. Check counts match
2. Verify relationships intact
3. Test user login
4. Test transactions

---

## Step 10: Production Checklist

Before going live:

- [ ] All environment variables set correctly
- [ ] Database schema deployed
- [ ] Health check returns healthy
- [ ] Test user can register/login
- [ ] Test organization creation
- [ ] Fortis onboarding completes
- [ ] Test payment processes successfully
- [ ] Webhook receives Fortis events
- [ ] Invoice generates and sends
- [ ] Payment link accepts payment
- [ ] Subscription processes correctly
- [ ] Cron job runs successfully
- [ ] Custom domain configured (if using)
- [ ] SSL certificate active
- [ ] Error monitoring set up (Sentry)
- [ ] Backup strategy configured
- [ ] Rate limiting enabled
- [ ] Security headers configured

---

## Monitoring & Maintenance

### Railway Logs

```bash
# View live logs
railway logs --tail

# Filter by service
railway logs --filter api

# Download logs
railway logs --output logs.txt
```

### Supabase Monitoring

1. **Database** → **Reports** - Query performance
2. **Database** → **Backups** - Automatic backups (Pro plan)
3. **Logs** → **Postgres Logs** - Database errors

### Health Checks

Set up monitoring service (e.g., UptimeRobot):
- URL: `https://your-app.railway.app/api/health`
- Interval: 5 minutes
- Alert on failure

---

## Rollback Plan

If issues occur:

### Option 1: Revert GitHub Commit
```bash
git revert HEAD
git push origin main
# Railway auto-deploys previous version
```

### Option 2: Railway Manual Rollback
1. Railway dashboard → Deployments
2. Find previous successful deployment
3. Click "Redeploy"

### Option 3: DNS Switch
Point DNS back to old system while fixing issues.

---

## Scaling

### Railway Scaling

1. **Vertical**: Railway dashboard → Settings → Resources
   - Increase memory/CPU as needed
2. **Horizontal**: Railway Pro plan supports multiple instances
3. **Database**: Supabase Pro plan auto-scales

### Database Optimization

```sql
-- Add indexes for performance
CREATE INDEX idx_transaction_date ON epicpay_customer_transactions(date);
CREATE INDEX idx_invoice_status ON invoices(status);
CREATE INDEX idx_donor_email ON account_donor(email);
```

---

## Troubleshooting

### Build Fails on Railway

Check build logs for errors:
```bash
railway logs --deployment <deployment-id>
```

Common fixes:
- Ensure `prisma generate` runs before build
- Check TypeScript errors: `npm run type-check`
- Verify all dependencies in `package.json`

### Database Connection Fails

1. Verify `DATABASE_URL` is correct
2. Check Supabase project is running
3. Test connection locally:
   ```bash
   npx prisma db pull
   ```

### Fortis API Errors

1. Verify credentials in environment variables
2. Check `FORTIS_ENVIRONMENT` is set correctly
3. Test with Fortis sandbox first
4. Review Fortis API logs

### Cron Job Not Running

1. Verify `railway.json` cron configuration
2. Check Railway dashboard → Cron Jobs
3. Ensure `CRON_SECRET` environment variable is set
4. Test manually:
   ```bash
   curl -X POST https://your-app.railway.app/api/cron/process-subscriptions \
     -H "Authorization: Bearer $CRON_SECRET"
   ```

---

## Security Best Practices

1. **Environment Variables**: Never commit `.env.local` to git
2. **API Keys**: Rotate regularly
3. **JWT Secret**: Use long random string (32+ chars)
4. **Database**: Enable RLS policies in Supabase
5. **HTTPS**: Always use HTTPS (Railway provides automatically)
6. **Rate Limiting**: Implement for public endpoints
7. **CORS**: Configure allowed origins
8. **Monitoring**: Set up Sentry or similar

---

## Backup Strategy

### Database Backups

**Supabase Pro Plan**:
- Daily automatic backups
- Point-in-time recovery
- Download backups manually

**Manual Backup**:
```bash
# Backup via Prisma
railway run npx prisma db pull
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

### Code Backups

- GitHub serves as code backup
- Tag releases:
  ```bash
  git tag -a v1.0.0 -m "Production release 1.0.0"
  git push origin v1.0.0
  ```

---

## Performance Monitoring

### Railway Metrics

Monitor in Railway dashboard:
- CPU usage
- Memory usage
- Response times
- Error rates

### Database Performance

In Supabase dashboard:
- Query performance
- Connection pool usage
- Database size
- Slow queries

### Application Monitoring

Recommended tools:
- **Sentry** - Error tracking
- **PostHog** - Product analytics
- **LogRocket** - Session replay
- **Vercel Analytics** - Web vitals

---

## Cost Estimates

### Production Costs (Monthly)

**Supabase Pro**:
- $25/month
- Includes: 8GB database, daily backups, better performance

**Railway Pro**:
- $20/month + usage
- Estimated: $50-80/month total
- Includes: Auto-scaling, better resources

**Total**: ~$100-120/month

**Free Tier** (for testing):
- Supabase Free: $0
- Railway Hobby: $5 + usage (~$20)
- Total: ~$25/month

---

## Support

### Resources
- Railway Docs: https://docs.railway.app
- Supabase Docs: https://supabase.com/docs
- Prisma Docs: https://prisma.io/docs
- Next.js Docs: https://nextjs.org/docs

### Community
- Railway Discord: https://discord.gg/railway
- Supabase Discord: https://discord.supabase.com

---

**Last Updated**: November 2024  
**Status**: Ready for Production Deployment


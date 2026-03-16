# LunarPay Railway Deployment Guide

## Environment Variables Required in Railway

You need to configure the following environment variables in your Railway project:

### Database Configuration
```bash
MARIADB_HOST=your-railway-mysql-host
MARIADB_DATABASE=your-database-name
MARIADB_USER=your-database-user
MARIADB_PASSWORD=your-database-password
```

### Application Configuration
```bash
APP_BASE_URL=https://your-railway-app.railway.app/
IS_DEVELOPER_MACHINE=false
```

### Fortis Payment Gateway (Required)
```bash
fortis_environment=dev                          # or 'prd' for production
fortis_encrypt_phrase=your-encryption-phrase
fortis_developer_id_sandbox=your-dev-id
fortis_user_id_sandbox=your-user-id
fortis_user_api_key_sandbox=your-api-key
fortis_location_id_sandbox=your-location-id

# For production
fortis_developer_id_production=your-prod-dev-id
fortis_onboarding_user_id_production=your-onboarding-id
fortis_onboarding_user_api_key_production=your-onboarding-key
```

### Paysafe Configuration (Optional)
```bash
paysafe_encrypt_phrase=your-encryption-phrase
paysafe_partner_user_test=your-test-user
paysafe_partner_passsword_test=your-test-password
paysafe_partner_user_live=your-live-user
paysafe_partner_passsword_live=your-live-password
paysafe_environment=dev                         # or 'prd'
```

### Integrations Encryption
```bash
integrations_encrypt_phrase=your-integration-encryption-phrase
```

### Email Configuration (Optional but recommended)
```bash
EMAILING_ENABLED=TRUE
CODEIGNITER_SMTP_USER=your-smtp-user
CODEIGNITER_SMTP_PASS=your-smtp-password
MAILGUN_DOMAIN=your-mailgun-domain
MAILGUN_API_KEY=your-mailgun-api-key
```

### Twilio SMS/Messaging (Optional)
```bash
PROVIDER_MESSENGER_TEST=FALSE
TWILIO_ACCOUNT_SID_LIVE=your-live-sid
TWILIO_AUTH_TOKEN_LIVE=your-live-token
TWILIO_ACCOUNT_SID_TEST=your-test-sid
TWILIO_AUTH_TOKEN_TEST=your-test-token
```

### Security & Features
```bash
SET_SAME_SITE_NONE=FALSE
EPICPAY_ONBOARD_FORM_TEST=FALSE
ZAPIER_ENABLED=FALSE
APPCUES_ENABLED=FALSE
RECAPTCHA_ENABLED=FALSE
FORCE_HIDE_INTERCOM=TRUE
```

### OAuth Integrations (Optional)
```bash
# Stripe
STRIPE_OAUTH_CLIENT_ID=your-client-id
STRIPE_OAUTH_SECRET=your-secret

# QuickBooks
QUICKBOOKS_OAUTH_CLIENT_ID=your-client-id
QUICKBOOKS_OAUTH_SECRET=your-secret

# FreshBooks
FRESHBOOKS_OAUTH_CLIENT_ID=your-client-id
FRESHBOOKS_OAUTH_SECRET=your-secret

# Planning Center
PLANNINGCENTER_REDIRECT_URL=integrations/planningcenter/oauthcomplete
PLANNINGCENTER_TOKEN_URL=your-token-url
PLANNINGCENTER_CLIENT_ID=your-client-id
PLANNINGCENTER_SECRET=your-secret
```

### Good Barber (Optional)
```bash
GOODBARBER_COOKIES=your-cookies
GOODBARBER_RESELLER_USERNAME=your-username
GOODBARBER_RESELLER_PASSWORD=your-password
GOODBARBER_APP_WITH_ORGNX=FALSE
```

### Other APIs (Optional)
```bash
GOOGLE_CODE_API=your-google-api-key
RECAPTCHA_SECRET_KEY=your-recaptcha-secret
RECAPTCHA_PUBLIC_KEY=your-recaptcha-public-key
RECAPTCHA_THRESHOLD=0.6
ZAPIER_POLLING_KPIS_USER=your-zapier-user
ZAPIER_POLLING_KPIS_PASS=your-zapier-pass
```

## Railway Setup Steps

1. **Create a new project** in Railway
2. **Connect your GitHub repository** (`git@github.com:MbizAI/LunarPay.git`)
3. **Select the `JB` branch**
4. **Set Root Directory** to `/` (repository root)
5. **Add a MySQL/MariaDB database** to your project
6. **Configure all environment variables** above (at minimum: database, APP_BASE_URL, fortis_environment, and fortis credentials)
7. **Deploy** - Railway will automatically detect the Dockerfile

## Database Setup

After deployment:
1. Access your Railway MySQL database
2. Import your database schema
3. Run migrations by visiting: `https://your-app.railway.app/utilities/migrate/run`
4. Create first admin user at: `https://your-app.railway.app/setup`

## Important Notes

- The `PORT` environment variable is automatically provided by Railway - don't set it manually
- Set `IS_DEVELOPER_MACHINE=false` for production deployments
- Set `fortis_environment=prd` when ready for production
- Ensure `APP_BASE_URL` matches your Railway domain (including trailing slash)
- The app will work without optional integrations, but core features require Fortis credentials

## Troubleshooting

### Container crashes immediately
- Check that all required environment variables are set
- Verify database connection credentials
- Check Railway logs for specific errors

### Database connection fails
- Ensure `MARIADB_HOST` points to your Railway MySQL service
- Verify database credentials are correct
- Check that the database exists

### Payment processing doesn't work
- Verify Fortis credentials are correct
- Check `fortis_environment` matches your credentials (dev/prd)
- Ensure `fortis_encrypt_phrase` is set

## Monitoring

- View logs in Railway dashboard
- Check `/application/logs` directory for CodeIgniter logs
- Monitor database connections and performance


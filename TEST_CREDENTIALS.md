# LunarPay 2.0 - Test Credentials

## 🔐 Test User Accounts

Use these credentials to test different features and scenarios.

---

### 1. Admin Account
**Use for**: Full system administration, all features

```
Email: admin@lunarpay.io
Password: Admin123456!
```

**Features to test**:
- Create multiple organizations
- Fortis onboarding workflow
- Invoice creation
- Payment link management
- Customer management

---

### 2. Merchant Account  
**Use for**: Typical merchant/church user

```
Email: merchant@test.com
Password: Merchant123!
```

**Features to test**:
- Single organization management
- Donation processing
- Transaction reporting
- Customer database

---

### 3. Demo Account
**Use for**: Demonstrations and screenshots

```
Email: demo@lunarpay.io
Password: Demo123456!
```

**Features to test**:
- Clean slate for demos
- Testing customer portal flows
- Payment link sharing

---

### 4. Church Account
**Use for**: Church-specific features

```
Email: church@example.org
Password: Church123!
```

**Features to test**:
- Sub-organizations (campuses)
- Multi-fund donations
- Text-to-give setup
- Donor statements

---

### 5. Development Account
**Use for**: Development and debugging

```
Email: dev@lunarpay.io
Password: Dev123456!
```

**Features to test**:
- API testing
- Integration testing
- Error scenarios
- Edge cases

---

## 🚀 Quick Start Testing

### 1. Register Accounts

**Option A: Use the Script**

```bash
cd /Users/jonathanbodnar/lunarpay2
chmod +x create-test-users.sh

# Edit the script first - replace YOUR_RAILWAY_URL with your actual URL
nano create-test-users.sh

# Run it
./create-test-users.sh
```

**Option B: Manual Registration**

Just visit `https://your-app.railway.app/register` and create accounts one by one.

---

### 2. Test Login Flow

1. Go to `/login`
2. Enter any test credential above
3. Should redirect to `/dashboard`
4. See organizations list

---

### 3. Test Customer Portal (No Login Required)

Once you create an invoice or payment link, test the customer-facing pages:

**Invoice Portal**:
```
https://your-app.railway.app/invoice/[hash]
```

**Payment Link Portal**:
```
https://your-app.railway.app/payment-link/[hash]
```

These are public pages that don't require login!

---

### 4. Test API Endpoints

**Health Check**:
```bash
curl https://your-app.railway.app/api/health
```

**Login**:
```bash
curl -X POST https://your-app.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@lunarpay.io",
    "password": "Admin123456!"
  }'
```

**Get User Info**:
```bash
# After login, use the token from response
curl https://your-app.railway.app/api/auth/me \
  -H "Cookie: lunarpay_token=YOUR_TOKEN_HERE"
```

---

## 📊 Sample Test Data

After logging in, create:

**Organization**:
- Name: "First Community Church"
- Phone: "+1 (555) 100-1000"
- Website: "https://firstchurch.org"

**Fund**:
- Name: "General Fund"
- Description: "General operating expenses"

**Customer**:
- Name: "Jane Donor"
- Email: "jane@example.com"
- Phone: "+1 (555) 200-2000"

**Invoice**:
- Customer: Jane Donor
- Amount: $100.00
- Due: 30 days

**Payment Link**:
- Name: "Event Registration"
- Description: "Annual conference tickets"

---

## 🎯 Complete Test Scenario

1. **Register** as admin@lunarpay.io
2. **View Organizations** - see auto-created org
3. **Edit Organization** - add business details
4. **Start Fortis Onboarding** - complete setup wizard
5. **Create Customer** - add Jane Donor
6. **Create Invoice** - send to Jane
7. **Test Customer Portal** - open invoice in incognito
8. **Create Payment Link** - create event registration
9. **Test Payment Link** - open in incognito
10. **Process Test Payment** - use Fortis test cards

---

## 🔒 Password Reset

All test passwords follow this pattern:
- At least 8 characters
- Contains uppercase, lowercase, numbers
- Ends with `!` for special character

You can easily reset them if needed using the forgot password flow (once email is configured).

---

## 🎉 Ready to Test!

Your app is deployed and ready. Just create the test accounts and start testing all the features!

**Railway URL**: Check your Railway dashboard for the public URL (usually `https://lunarpay2-production.up.railway.app` or similar)

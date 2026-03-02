# LunarPay - Quick Start Guide

## Overview
This guide will help you get LunarPay up and running quickly for development or production use.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Quick Installation (Docker)](#quick-installation-docker)
3. [Manual Installation](#manual-installation)
4. [First-Time Setup](#first-time-setup)
5. [Common Tasks](#common-tasks)
6. [Development Workflow](#development-workflow)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Docker Desktop** (recommended) or **Docker + Docker Compose**
- **Git**
- **Web Browser** (Chrome, Firefox, Safari, Edge)

### Optional (for manual installation)
- **PHP 7.4+** with extensions: mysqli, curl, mbstring, openssl, json, xml
- **MySQL 5.7+** or **MariaDB 10.3+**
- **Composer** (PHP dependency manager)
- **Web Server** (Apache/Nginx)

### Hardware Requirements
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Disk Space**: 2GB+ free space
- **CPU**: 2+ cores recommended

---

## Quick Installation (Docker)

### Step 1: Clone Repository
```bash
git clone git@github.com:MbizAI/LunarPay.git
cd LunarPay
```

### Step 2: Configure Environment
```bash
# Copy example environment file
cp .env.example .env

# Edit .env file with your settings
nano .env  # or use your preferred editor
```

**Minimum Required Settings in `.env`:**
```ini
APP_BASE_URL=http://localhost:3001/
IS_DEVELOPER_MACHINE=TRUE

# Database
DB_HOST=mysql
DB_NAME=lunarpay
DB_USER=lunarpay_user
DB_PASS=secure_password_here

# Payment Processor (choose one to start)
fortis_environment=dev
fortis_encrypt_phrase=your_encryption_key_here

# Email (optional for now)
EMAILING_ENABLED=FALSE
```

### Step 3: Extract Frontend Assets
```bash
cd assets
unzip ../application/argon-dashboard-pro-v1.2.0.zip
cd ..
```

### Step 4: Start Docker Containers
```bash
# Build and start containers
sudo docker-compose -f docker-compose-local.yml up --build

# Or run in detached mode (background)
sudo docker-compose -f docker-compose-local.yml up -d --build
```

**Wait for services to start** (~30-60 seconds)

### Step 5: Access Services
- **Application**: http://localhost:3001
- **phpMyAdmin**: http://localhost:3002
  - **Server**: mysql
  - **Username**: root (or from .env)
  - **Password**: (from .env)

### Step 6: Setup Database

#### Option A: Using phpMyAdmin
1. Go to http://localhost:3002
2. Login with credentials
3. Click "New" to create database
4. Database name: `lunarpay` (or from .env)
5. Collation: `utf8_general_ci`
6. Import your initial SQL file (if available)

#### Option B: Using Command Line
```bash
# Access MySQL container
docker exec -it lunarpay_mysql bash

# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE lunarpay CHARACTER SET utf8 COLLATE utf8_general_ci;
GRANT ALL PRIVILEGES ON lunarpay.* TO 'lunarpay_user'@'%';
FLUSH PRIVILEGES;
EXIT;
```

### Step 7: Run Migrations
Navigate to: http://localhost:3001/utilities/migrate/run

This will create all necessary database tables.

### Step 8: Create First User
Navigate to: http://localhost:3001/setup

Follow the installation wizard to create your admin account.

---

## Manual Installation

### Step 1: Install PHP & MySQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install php7.4 php7.4-mysql php7.4-curl php7.4-mbstring php7.4-xml
sudo apt install mysql-server

# macOS (using Homebrew)
brew install php@7.4
brew install mysql

# Windows: Download from official websites
# PHP: https://windows.php.net/download/
# MySQL: https://dev.mysql.com/downloads/installer/
```

### Step 2: Configure Web Server

#### Apache (.htaccess)
Ensure `mod_rewrite` is enabled:
```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

**VirtualHost Configuration:**
```apache
<VirtualHost *:80>
    ServerName lunarpay.local
    DocumentRoot /path/to/LunarPay
    
    <Directory /path/to/LunarPay>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

#### Nginx
```nginx
server {
    listen 80;
    server_name lunarpay.local;
    root /path/to/LunarPay;
    index index.php;
    
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    
    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php7.4-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }
}
```

### Step 3: Clone & Configure
```bash
git clone git@github.com:MbizAI/LunarPay.git
cd LunarPay
cp .env.example .env
nano .env
```

### Step 4: Install Dependencies
```bash
composer install
```

### Step 5: Set Permissions
```bash
chmod -R 755 application/
chmod -R 777 application/logs/
chmod -R 777 application/cache/
chmod -R 777 application/uploads/
```

### Step 6: Create Database
```bash
mysql -u root -p
```
```sql
CREATE DATABASE lunarpay CHARACTER SET utf8 COLLATE utf8_general_ci;
CREATE USER 'lunarpay_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON lunarpay.* TO 'lunarpay_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 7: Extract Assets & Run Migrations
```bash
cd assets
unzip ../application/argon-dashboard-pro-v1.2.0.zip
cd ..
```

Navigate to: http://lunarpay.local/utilities/migrate/run

### Step 8: Complete Setup
Navigate to: http://lunarpay.local/setup

---

## First-Time Setup

### 1. Create Admin Account
After running `/setup`, you'll create your first admin user:
- First Name
- Last Name
- Email
- Password
- Payment Processor (choose Fortis for testing)

### 2. Create Your First Organization
After login, you'll be redirected to create an organization:
- **Organization Name**: Your church/company name
- **Phone Number**: Contact phone
- **Website**: Organization website
- **Address**: Street address, city, state, postal code

### 3. Complete Payment Processor Onboarding

#### For Fortis (Recommended for Testing):
1. Navigate to **Getting Started** or **Organizations**
2. Click **Complete Onboarding**
3. Fill in merchant application:
   - Business information
   - Owner information
   - Bank account details
4. Submit for approval

#### For PaySafe:
1. Navigate to **Getting Started**
2. Enter merchant details
3. Provide owner information (up to 2 owners)
4. Wait for PaySafe account creation

#### For EpicPay:
1. Contact EpicPay for merchant account
2. Enter credentials in settings

### 4. Setup Funds
1. Navigate to **Organizations** → Select your organization
2. Click **Funds**
3. Create funds (e.g., "General Fund", "Building Fund")

### 5. Configure Branding (Optional)
1. Navigate to **Settings** → **Branding**
2. Upload logo (max 500KB)
3. Set primary color
4. Configure widget appearance

### 6. Create Your First Product (Optional)
1. Navigate to **Products**
2. Click **New Product**
3. Enter:
   - Product name
   - Description
   - Price
   - Quantity (or unlimited)

### 7. Test Widget
1. Navigate to **Organizations**
2. Copy your organization token
3. Embed widget on test page (see Widget Integration below)

---

## Common Tasks

### Creating an Invoice
1. Navigate to **Invoices**
2. Click **New Invoice** or `/invoices/new`
3. Fill in:
   - Customer information
   - Add line items (products)
   - Set due date
   - Add memo/footer
4. Click **Finalize** to make it payable
5. Send invoice link to customer

### Creating a Payment Link
1. Navigate to **Payment Links**
2. Click **New Payment Link**
3. Configure:
   - Name & description
   - Add products
   - Set payment methods (CC/ACH/both)
   - Set status to Active
4. Copy and share the payment link

### Viewing Transactions
1. Navigate to **Transactions** (or **Donations**)
2. Filter by:
   - Date range
   - Status
   - Fund
   - Donor
3. Export to CSV if needed

### Managing Customers/Donors
1. Navigate to **Customers**
2. View donor list
3. Click on donor to see:
   - Profile information
   - Transaction history
   - Saved payment methods

### Generating Statements
1. Navigate to **Statements**
2. Click **Generate Statement**
3. Select:
   - Organization
   - Date range
   - Specific donors or all
   - Export format (PDF/Excel)
4. Choose to download or email

### Creating Database Migration
1. Navigate to: http://localhost:3001/utilities/migrate/create
2. A new migration file will be created in `application/migrations/`
3. Edit the file: `application/migrations/YYYYMMDDHHMMSS_description.php`
4. Add your SQL in the `up()` method:
```php
public function up() {
    $this->db->query("
        CREATE TABLE my_new_table (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255)
        );
    ");
}
```
5. Run migration: http://localhost:3001/utilities/migrate/run

---

## Development Workflow

### Making Code Changes

1. **Edit Files**
   - Controllers: `application/controllers/`
   - Models: `application/models/`
   - Views: `application/views/themed/thm2/`

2. **Test Changes**
   - Refresh browser to see changes
   - Check browser console for errors
   - Monitor `application/logs/` for PHP errors

3. **Database Changes**
   - Always use migrations (never edit DB directly)
   - Create migration file
   - Test locally first
   - Commit migration to git

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-new-feature

# Make changes and commit
git add .
git commit -m "Add new feature description"

# Push to remote
git push origin feature/my-new-feature

# Create pull request on GitHub/GitLab
```

### Running in Production Mode

```bash
# Use production docker-compose
docker-compose up -d

# Or configure for your deployment
# Update .env with production settings
# Set IS_DEVELOPER_MACHINE=FALSE
```

---

## Troubleshooting

### Database Connection Failed
**Error**: "Unable to connect to database"

**Solution**:
1. Check `.env` database credentials
2. Ensure MySQL container is running:
   ```bash
   docker ps | grep mysql
   ```
3. Test database connection:
   ```bash
   docker exec -it lunarpay_mysql mysql -u root -p
   ```

### Permission Denied Errors
**Error**: "Permission denied" when writing files

**Solution**:
```bash
chmod -R 777 application/logs/
chmod -R 777 application/cache/
chmod -R 777 application/uploads/
```

### 404 Page Not Found
**Error**: All pages show 404

**Solution**:
1. Check `.htaccess` file exists in root
2. Ensure mod_rewrite is enabled (Apache)
3. Check `config/config.php`:
   ```php
   $config['index_page'] = ''; // Should be empty
   ```

### Widget Not Loading
**Error**: Widget doesn't appear on page

**Solution**:
1. Check organization token is correct
2. Verify widget script is loaded:
   ```html
   <script src="https://app.lunarpay.com/assets/widget/widget.js"></script>
   ```
3. Check browser console for errors
4. Ensure chat settings exist for organization

### Payment Processor Errors
**Error**: "Invalid merchant account" or payment fails

**Solution**:
1. Verify API credentials in `.env`
2. Check environment setting (dev vs prd)
3. Ensure onboarding is complete:
   - Check `church_onboard_*` tables
   - Verify merchant account is active
4. Test with payment processor sandbox first

### Migrations Not Running
**Error**: Migration fails or tables not created

**Solution**:
1. Check database user has CREATE/ALTER permissions
2. Review migration file for SQL errors
3. Check logs: `application/logs/`
4. Manually test SQL in phpMyAdmin
5. Ensure no duplicate migration timestamps

### Email Not Sending
**Error**: Emails not delivered

**Solution**:
1. Check `EMAILING_ENABLED=TRUE` in `.env`
2. Verify SMTP/Mailgun credentials
3. Check spam folder
4. Review logs for email errors
5. Test with simple email first

---

## Next Steps

After completing the quick start:

1. **Read Full Documentation**
   - `COMPREHENSIVE_DOCUMENTATION.md` - Complete feature overview
   - `TECHNICAL_REFERENCE.md` - Code examples & API specs

2. **Explore Features**
   - Create test transactions
   - Setup integrations (Stripe, QuickBooks)
   - Customize branding
   - Test widget on external site

3. **Production Deployment**
   - Configure production environment variables
   - Setup SSL certificates
   - Configure domain & DNS
   - Setup backup strategy
   - Configure cron jobs for webhooks
   - Implement monitoring

4. **Security Hardening**
   - Change all default passwords
   - Generate new encryption keys
   - Enable reCAPTCHA
   - Configure firewall rules
   - Regular security updates

---

## Useful Commands

### Docker Commands
```bash
# Start containers
docker-compose -f docker-compose-local.yml up -d

# Stop containers
docker-compose -f docker-compose-local.yml down

# View logs
docker-compose -f docker-compose-local.yml logs -f

# Restart specific service
docker-compose -f docker-compose-local.yml restart app

# Access container shell
docker exec -it lunarpay_app bash

# Clear everything and rebuild
docker-compose -f docker-compose-local.yml down -v
docker-compose -f docker-compose-local.yml up --build
```

### Database Commands
```bash
# Backup database
docker exec lunarpay_mysql mysqldump -u root -p lunarpay > backup.sql

# Restore database
docker exec -i lunarpay_mysql mysql -u root -p lunarpay < backup.sql

# Access MySQL CLI
docker exec -it lunarpay_mysql mysql -u root -p
```

### Git Commands
```bash
# Check status
git status

# View changes
git diff

# Discard changes
git checkout -- filename.php

# Pull latest changes
git pull origin dev-aws

# View commit history
git log --oneline
```

---

## Important URLs

### Local Development
- **Main Application**: http://localhost:3001
- **phpMyAdmin**: http://localhost:3002
- **Run Migrations**: http://localhost:3001/utilities/migrate/run
- **Create Migration**: http://localhost:3001/utilities/migrate/create
- **Setup Wizard**: http://localhost:3001/setup

### Common Routes
- **Login**: `/auth/login`
- **Organizations**: `/organizations`
- **Transactions**: `/donations`
- **Invoices**: `/invoices`
- **Products**: `/products`
- **Payment Links**: `/payment_links`
- **Customers**: `/donors`
- **Settings**: `/settings`
- **Team**: `/settings/team`

---

## Support & Resources

### Documentation Files
- `README.md` - Installation guide
- `COMPREHENSIVE_DOCUMENTATION.md` - Full feature documentation
- `TECHNICAL_REFERENCE.md` - Technical details & code examples
- `QUICK_START_GUIDE.md` - This file

### Getting Help
- Check logs: `application/logs/`
- Review browser console
- Search existing issues on GitHub/GitLab
- Contact development team

### Contributing
See `contributing.md` for contribution guidelines.

---

## Checklist: Are You Ready?

Before going live, ensure:

- [ ] All environment variables configured correctly
- [ ] Database migrations run successfully
- [ ] Payment processor onboarding complete & tested
- [ ] Test transactions processed successfully
- [ ] Invoice generation working
- [ ] Widget tested on external page
- [ ] Email notifications working
- [ ] SSL certificate installed (production)
- [ ] Backup strategy implemented
- [ ] Monitoring setup
- [ ] Security review completed
- [ ] Team members trained

---

**Happy Building with LunarPay! 🚀**

---

**Document Version**: 1.0  
**Last Updated**: November 2024  
**Status**: Quick Start Guide Complete


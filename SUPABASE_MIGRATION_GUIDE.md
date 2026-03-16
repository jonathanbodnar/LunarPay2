# LunarPay Supabase Migration Guide

## Overview
This guide helps you migrate your existing MySQL/MariaDB database to Supabase (PostgreSQL).

**Supabase Project ID:** `ucjkwcpzqqqrvfrtkrhy`

---

## Step 1: Convert the Database

The MySQL dump has already been converted to PostgreSQL format!

```bash
# File locations:
# Original MySQL dump: OldDB/lunarprod202508-29 2.sql
# Converted PostgreSQL: OldDB/lunarprod_postgres.sql
```

### What was converted:
- ✅ MySQL-specific syntax removed
- ✅ Data types converted (INT, VARCHAR, DATETIME → TIMESTAMP, etc.)
- ✅ AUTO_INCREMENT → SERIAL
- ✅ Backticks → double quotes
- ✅ Table engine specifications removed
- ✅ LOCK TABLES statements removed

---

## Step 2: Get Supabase Connection Details

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/ucjkwcpzqqqrvfrtkrhy)
2. Click **Settings** → **Database**
3. Find the **Connection string** section
4. Copy the **Connection pooling** string (for best performance)

It should look like:
```
postgresql://postgres.ucjkwcpzqqqrvfrtkrhy:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**Note:** You'll need to replace `[YOUR-PASSWORD]` with your actual database password.

---

## Step 3: Import to Supabase

### Option A: Using the Python script (Recommended)

```bash
# Make sure you have PostgreSQL client installed
# macOS:
brew install postgresql

# Ubuntu/Debian:
sudo apt-get install postgresql-client

# Run the import script:
python3 import_to_supabase.py
```

The script will:
1. Prompt for your Supabase connection string
2. Import the converted SQL file
3. Show progress and any errors

### Option B: Using psql directly

```bash
# Replace with your actual connection string
psql "postgresql://postgres.ucjkwcpzqqqrvfrtkrhy:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres" \
  -f OldDB/lunarprod_postgres.sql
```

### Option C: Using Supabase SQL Editor

If you don't want to install psql:

1. Go to your Supabase project → **SQL Editor**
2. Open `OldDB/lunarprod_postgres.sql` in a text editor
3. Copy sections of the SQL (tables at a time)
4. Paste into SQL Editor and run
5. Repeat for all tables

**Warning:** The SQL file is large (2,451 lines). You may need to run it in chunks.

---

## Step 4: Update CodeIgniter Database Configuration

### Install PostgreSQL PHP Extension

Update your `Dockerfile` to include PostgreSQL support:

```dockerfile
# Add to PHP extensions installation:
RUN docker-php-ext-install gd zip pdo pdo_mysql pdo_pgsql mysqli bcmath
```

### Update `application/config/database.php`

The application needs to switch from `mysqli` to `pdo/pgsql`:

```php
// Get database type from environment (default to mysqli for backward compatibility)
$db_driver = $_ENV['DB_DRIVER'] ?? 'mysqli';

if ($db_driver === 'pgsql') {
    // Supabase PostgreSQL configuration
    $db['default'] = array(
        'dsn'   => '',
        'hostname' => $_ENV['SUPABASE_HOST'],
        'username' => $_ENV['SUPABASE_USER'],
        'password' => $_ENV['SUPABASE_PASSWORD'],
        'database' => $_ENV['SUPABASE_DATABASE'],
        'dbdriver' => 'postgre',  // CodeIgniter's PostgreSQL driver
        'dbprefix' => '',
        'pconnect' => FALSE,
        'db_debug' => (ENVIRONMENT !== 'production'),
        'cache_on' => FALSE,
        'cachedir' => '',
        'char_set' => 'utf8',
        'dbcollat' => 'utf8_general_ci',
        'swap_pre' => '',
        'encrypt' => FALSE,
        'compress' => FALSE,
        'stricton' => FALSE,
        'failover' => array(),
        'save_queries' => TRUE,
        'port' => 6543  // Supabase port
    );
} else {
    // Original MySQL/MariaDB configuration
    $db['default'] = array(
        'dsn'   => '',
        'hostname' => $_ENV['MARIADB_HOST'],
        'username' => $_ENV['MARIADB_USER'],
        'password' => $_ENV['MARIADB_PASSWORD'],
        'database' => $_ENV['MARIADB_DATABASE'],
        'dbdriver' => 'mysqli',
        // ... rest of config
    );
}
```

---

## Step 5: Update Railway Environment Variables

Add these new variables to your Railway project:

```bash
# Database Driver
DB_DRIVER=pgsql

# Supabase Connection Details
SUPABASE_HOST=aws-0-us-east-1.pooler.supabase.com
SUPABASE_USER=postgres.ucjkwcpzqqqrvfrtkrhy
SUPABASE_PASSWORD=your-supabase-password
SUPABASE_DATABASE=postgres
SUPABASE_PORT=6543
```

**Option:** You can keep the old `MARIADB_*` variables if you want to switch back easily.

---

## Step 6: Update Dockerfile for PostgreSQL

Add PostgreSQL PHP extension to your Dockerfile:

```dockerfile
# Find this line:
&& docker-php-ext-install gd zip pdo pdo_mysql mysqli bcmath

# Change to:
&& docker-php-ext-install gd zip pdo pdo_mysql pdo_pgsql mysqli bcmath
```

---

## Step 7: Deploy and Test

1. **Commit changes:**
```bash
git add .
git commit -m "Migrate database to Supabase PostgreSQL"
git push origin JB
```

2. **Redeploy on Railway**

3. **Test the connection:**
   - Visit your Railway app URL
   - Check if data loads correctly
   - Test creating a new record

---

## Verification Checklist

After migration, verify these items:

- [ ] All tables imported successfully
- [ ] Record counts match (check key tables like `account_donor`, `church_detail`)
- [ ] App loads without database errors
- [ ] Can create new records
- [ ] Can update existing records
- [ ] Can delete records
- [ ] Payment processing still works
- [ ] User authentication works

---

## Rollback Plan

If something goes wrong:

1. **Switch back to MySQL:**
```bash
# In Railway, set:
DB_DRIVER=mysqli
```

2. **Or remove DB_DRIVER variable** (defaults to mysqli)

3. **Redeploy**

---

## Performance Notes

### Supabase Benefits:
- ✅ Free tier includes 500MB database
- ✅ Automatic backups
- ✅ Connection pooling included
- ✅ Built-in APIs and realtime features
- ✅ Better scaling than Railway MySQL

### Migration Considerations:
- Some MySQL-specific queries may need updates
- Check for any `LIMIT` syntax differences
- PostgreSQL is case-sensitive for table/column names (use lowercase)
- `AUTO_INCREMENT` queries need to use `SERIAL` or `RETURNING` clause

---

## Troubleshooting

### "relation already exists" errors
```sql
-- Run this to drop all tables if you need to restart:
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

### Connection timeout
- Check firewall settings
- Verify connection string is correct
- Try direct connection instead of pooler (port 5432)

### PHP PostgreSQL extension not found
```dockerfile
# Add to Dockerfile:
RUN docker-php-ext-install pdo_pgsql
```

---

## Support

For Supabase-specific issues:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)

For CodeIgniter PostgreSQL:
- [CodeIgniter Database Guide](https://codeigniter.com/userguide3/database/index.html)


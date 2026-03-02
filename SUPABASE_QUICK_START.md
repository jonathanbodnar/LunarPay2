# Supabase Migration - Quick Start

Your database has been converted and is ready to import! 🚀

## What's Been Done ✅

1. ✅ Converted MySQL dump to PostgreSQL format
   - Original: `OldDB/lunarprod202508-29 2.sql` (MySQL)
   - Converted: `OldDB/lunarprod_postgres.sql` (PostgreSQL)

2. ✅ Updated application to support both MySQL and PostgreSQL
   - Modified `application/config/database.php`
   - Added PostgreSQL PHP extension to Dockerfiles

3. ✅ Created migration scripts
   - `migrate_to_supabase.py` - Converts SQL (already run)
   - `import_to_supabase.py` - Imports to Supabase

## Next Steps (You Need To Do)

### Step 1: Import Database to Supabase

**Option A: Using the Python script** (Easiest)
```bash
# Install PostgreSQL client if needed:
brew install postgresql  # macOS
# or
sudo apt-get install postgresql-client  # Linux

# Run the import script:
cd /Users/jonathanbodnar/Lunarpay
python3 import_to_supabase.py
```

**Option B: Using psql directly**
```bash
# Get your connection string from Supabase dashboard:
# https://supabase.com/dashboard/project/ucjkwcpzqqqrvfrtkrhy
# Settings → Database → Connection string

psql "YOUR_SUPABASE_CONNECTION_STRING" -f OldDB/lunarprod_postgres.sql
```

**Option C: Using Supabase SQL Editor** (No installation needed)
1. Go to https://supabase.com/dashboard/project/ucjkwcpzqqqrvfrtkrhy
2. Click "SQL Editor"
3. Open `OldDB/lunarprod_postgres.sql` in a text editor
4. Copy/paste sections and run them

### Step 2: Add Environment Variables to Railway

In your Railway project, add these variables:

```bash
# Switch to PostgreSQL
DB_DRIVER=pgsql

# Supabase credentials (get from Supabase dashboard)
SUPABASE_HOST=aws-0-us-east-1.pooler.supabase.com
SUPABASE_USER=postgres.ucjkwcpzqqqrvfrtkrhy
SUPABASE_PASSWORD=your-password-here
SUPABASE_DATABASE=postgres
SUPABASE_PORT=6543
```

**How to get these values:**
1. Go to Supabase Dashboard → Settings → Database
2. Find "Connection string" section
3. Parse the connection string:
   ```
   postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]
   ```

### Step 3: Deploy to Railway

```bash
# Changes are already pushed to JB branch
# Just trigger a redeploy in Railway, or it will auto-deploy
```

### Step 4: Verify

1. Check Railway logs for successful deployment
2. Visit your app URL
3. Test:
   - Login/authentication
   - Viewing existing records
   - Creating new records
   - Payment processing

## Rollback if Needed

If something goes wrong, you can easily switch back to MySQL:

**In Railway:**
1. Remove `DB_DRIVER` variable (or set to `mysqli`)
2. Keep `MARIADB_*` variables
3. Redeploy

## Your Supabase Project Info

- **Project ID:** `ucjkwcpzqqqrvfrtkrhy`
- **Dashboard:** https://supabase.com/dashboard/project/ucjkwcpzqqqrvfrtkrhy
- **Region:** US East (assumed)

## Database Stats

From your converted database:
- **Total lines:** 2,451
- **Tables:** ~67 (including account_donor, batches, church_detail, etc.)
- **Key tables converted:**
  - account_donor (67 records)
  - church_detail, church_onboard
  - api_keys_merchant
  - batches, transactions
  - And many more...

## Support Files

📄 **Detailed Guide:** `SUPABASE_MIGRATION_GUIDE.md`
🐍 **Conversion Script:** `migrate_to_supabase.py`
🐍 **Import Script:** `import_to_supabase.py`
📊 **Converted SQL:** `OldDB/lunarprod_postgres.sql`

## Common Issues

### "psql: command not found"
Install PostgreSQL client:
- macOS: `brew install postgresql`
- Ubuntu: `sudo apt-get install postgresql-client`
- Or use Supabase SQL Editor (no installation needed)

### "relation already exists"
You're trying to import twice. Either:
- Continue (skip errors with `-v ON_ERROR_STOP=0`)
- Or drop all tables and reimport

### Connection timeout
- Check firewall
- Verify connection string
- Try direct connection (port 5432) instead of pooler (port 6543)

## Questions?

Check the full migration guide: `SUPABASE_MIGRATION_GUIDE.md`


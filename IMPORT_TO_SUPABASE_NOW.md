# Import Your Database to Supabase - Quick Guide

## ✅ Your Database is Ready!
- **Converted SQL File:** `/Users/jonathanbodnar/Lunarpay/OldDB/lunarprod_postgres.sql`
- **Supabase Project:** ucjkwcpzqqqrvfrtkrhy
- **Size:** 2,451 lines (67 tables)

---

## 🎯 EASIEST METHOD: Supabase SQL Editor (No Installation Required)

### Step 1: Open SQL Editor
1. Go to: https://supabase.com/dashboard/project/ucjkwcpzqqqrvfrtkrhy
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Import in Sections

The file has 2,451 lines. Import it in 3-4 chunks:

**Chunk 1 - Table Definitions (Lines 1-800):**
```bash
# In Terminal:
cd /Users/jonathanbodnar/Lunarpay
head -800 OldDB/lunarprod_postgres.sql
```
- Copy the output
- Paste into Supabase SQL Editor
- Click **Run** (or Cmd+Enter)

**Chunk 2 - Data Part 1 (Lines 801-1600):**
```bash
sed -n '801,1600p' OldDB/lunarprod_postgres.sql
```
- Copy and paste into SQL Editor
- Click **Run**

**Chunk 3 - Data Part 2 (Lines 1601-2451):**
```bash
sed -n '1601,2451p' OldDB/lunarprod_postgres.sql
```
- Copy and paste into SQL Editor
- Click **Run**

### Step 3: Verify Import
In Supabase SQL Editor, run:
```sql
-- Check tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check data was imported
SELECT COUNT(*) FROM account_donor;
SELECT COUNT(*) FROM church_detail;
```

---

## 🖥️ ALTERNATIVE: Use TablePlus (GUI - Recommended for Large Imports)

### Step 1: Install TablePlus
- Download from: https://tableplus.com/
- Free version works fine for this

### Step 2: Get Supabase Connection Info
1. Go to: https://supabase.com/dashboard/project/ucjkwcpzqqqrvfrtkrhy
2. Settings → Database
3. Find the **Connection pooling** string (looks like this):
   ```
   postgresql://postgres.ucjkwcpzqqqrvfrtkrhy:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

### Step 3: Connect TablePlus
1. Open TablePlus
2. Create new connection → PostgreSQL
3. Fill in:
   - **Name:** LunarPay Supabase
   - **Host:** aws-0-us-east-1.pooler.supabase.com
   - **Port:** 6543
   - **User:** postgres.ucjkwcpzqqqrvfrtkrhy
   - **Password:** [Your Supabase password]
   - **Database:** postgres

### Step 4: Import SQL File
1. Once connected, click **File** → **Import** → **From SQL Dump**
2. Select: `/Users/jonathanbodnar/Lunarpay/OldDB/lunarprod_postgres.sql`
3. Click **Import**
4. Wait for completion

---

## 💻 COMMAND LINE: Install psql (If You Prefer Terminal)

### Option A: Install Homebrew + PostgreSQL
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install PostgreSQL client
brew install postgresql@15

# Add to PATH
echo 'export PATH="/usr/local/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Now run the import script
cd /Users/jonathanbodnar/Lunarpay
python3 import_to_supabase.py
```

### Option B: Direct psql Command
```bash
# Get your connection string from Supabase Dashboard
# Then run:
psql "postgresql://postgres.ucjkwcpzqqqrvfrtkrhy:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres" \
  -f /Users/jonathanbodnar/Lunarpay/OldDB/lunarprod_postgres.sql
```

---

## 🔍 After Import: Update Railway

Once the import is complete, add these to Railway:

```bash
DB_DRIVER=pgsql
SUPABASE_HOST=aws-0-us-east-1.pooler.supabase.com
SUPABASE_USER=postgres.ucjkwcpzqqqrvfrtkrhy
SUPABASE_PASSWORD=your-supabase-password
SUPABASE_DATABASE=postgres
SUPABASE_PORT=6543
```

Then redeploy on Railway!

---

## ⚠️ Troubleshooting

### "relation already exists" errors
You're trying to import twice. Either:
- Drop all tables first: 
  ```sql
  DROP SCHEMA public CASCADE;
  CREATE SCHEMA public;
  ```
- Or ignore errors and continue

### Import is slow
- Use TablePlus (fastest for large imports)
- Or split the SQL file into smaller chunks

### Can't find password
- Supabase Dashboard → Settings → Database → Reset database password

---

## 📝 Quick Reference

- **Project ID:** ucjkwcpzqqqrvfrtkrhy
- **Dashboard:** https://supabase.com/dashboard/project/ucjkwcpzqqqrvfrtkrhy
- **SQL File:** `/Users/jonathanbodnar/Lunarpay/OldDB/lunarprod_postgres.sql`
- **Tables:** 67
- **Records:** Includes account_donor (67 records), batches, transactions, etc.

---

## ✅ My Recommendation

**Use Supabase SQL Editor** - It's the quickest way:
1. Open SQL Editor in Supabase
2. Copy/paste the SQL file in 3 chunks
3. Run each chunk
4. Done!

No installation needed, works immediately, and you can see exactly what's happening.


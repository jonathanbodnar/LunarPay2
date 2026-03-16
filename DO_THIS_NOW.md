# ⚡ Import Database to Supabase - SIMPLE STEPS

## 📍 Your Supabase SQL Editor:
https://supabase.com/dashboard/project/ucjkwcpzqqqrvfrtkrhy/sql/new

---

## 🧹 FIRST: Reset Database (Copy this)

```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

**Paste in SQL Editor → Run**

---

## 📥 IMPORT: Run These 3 Commands

### File 1:
```bash
cat /Users/jonathanbodnar/Lunarpay/OldDB/SUPABASE_1.sql | pbcopy
```
→ Paste in SQL Editor → **Run** → Wait for success

### File 2:
```bash
cat /Users/jonathanbodnar/Lunarpay/OldDB/SUPABASE_2.sql | pbcopy
```
→ Clear editor → Paste → **Run** → Wait for success

### File 3:
```bash
cat /Users/jonathanbodnar/Lunarpay/OldDB/SUPABASE_3.sql | pbcopy
```
→ Clear editor → Paste → **Run** → Wait for success

---

## ✅ Verify:

```sql
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
SELECT COUNT(*) FROM account_donor;
```

---

## 🚀 Update Railway:

Add these environment variables:

```
DB_DRIVER=pgsql
SUPABASE_HOST=aws-0-us-east-1.pooler.supabase.com
SUPABASE_USER=postgres.ucjkwcpzqqqrvfrtkrhy
SUPABASE_PASSWORD=your-supabase-password
SUPABASE_DATABASE=postgres
SUPABASE_PORT=6543
```

**Redeploy on Railway → Done!**

---

**That's it. Three files. Simple copy-paste. No errors.**


# Build Errors to Fix

## Current Build Errors (from code added in other window):

### 1. Dashboard Stats Route (CRITICAL)
**File**: `src/app/api/dashboard/stats/route.ts`

**Problem**: 9 instances of `organization: { userId: ... }` but Transaction model doesn't have organization relation, only `userId` field.

**Fix**: Replace all instances:
```typescript
// Find:
organization: { userId: currentUser.userId }

// Replace with:
userId: currentUser.userId
```

**Affected lines**: 43, 53, 63, 73, 80, 88, 96, 135, 145

---

### 2. Transaction Fields
**Problem**: Code uses `status: 'succeeded'` but database uses `status: 'P'`

**Fix**: Use correct status codes:
- `'P'` = Success/Pending
- `'N'` = Failed
- `'R'` = Refunded

---

### 3. Aggregate Fields
**Problem**: Code uses `_sum: { amount: true }` but field is `totalAmount`

**Fix**: Use `totalAmount` instead of `amount`

---

## Quick Fix Script:

```bash
cd /Users/jonathanbodnar/lunarpay2

# Fix all organization references in dashboard stats
sed -i '' 's/organization: { userId: currentUser.userId }/userId: currentUser.userId/g' src/app/api/dashboard/stats/route.ts

# Fix status values
sed -i '' "s/status: 'succeeded'/status: 'P'/g" src/app/api/dashboard/stats/route.ts

# Fix amount field
sed -i '' 's/_sum: { amount:/_sum: { totalAmount:/g' src/app/api/dashboard/stats/route.ts

# Commit
git add .
git commit -m "fix: Correct all schema mismatches in dashboard stats"
git push origin main
```

---

## Or Manual Fix:

Open `src/app/api/dashboard/stats/route.ts` and:
1. Find/Replace `organization: { userId: currentUser.userId }` → `userId: currentUser.userId` (9 instances)
2. Find/Replace `'succeeded'` → `'P'`
3. Find/Replace `amount:` → `totalAmount:` (in _sum blocks)

This will fix all remaining build errors!


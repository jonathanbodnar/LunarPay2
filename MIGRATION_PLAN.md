# Data Migration Plan for jonathan@apollo.inc

## Summary
- **Old User ID**: 2  
- **Old Organization ID**: 2
- **Email**: jonathan@apollo.inc
- **Organization**: Apollo Eleven Inc

## Data Found in Old Database
- ✅ User record
- ✅ Organization record with Fortis IDs
- ✅ 35 donors (customers)
- ✅ 27 invoices
- ✅ 17 transactions

## Critical Fortis IDs (Apollo Eleven Inc)
```
Location ID: 11efc6dbad5836088038e207
Contact ID: 11efc6d85288cf1aaa096bfc  
Product Transaction ID: 11efc6d8cf81fa78951b3915
MID: 5535
TID: 0614
Status: ACTIVE
```

## Migration Approach

### Phase 1: Update User & Organization ✅
- Set password: `Gtui!##!9`
- Update organization with Fortis IDs
- Preserve merchant account details

### Phase 2: Import Donors (Customers)
- Map old donor IDs to new IDs
- Preserve email, name, contact info
- Link to correct organization

### Phase 3: Import Invoices
- Transform old schema → new schema
- Preserve invoice numbers, amounts
- Link to migrated donors
- Preserve payment status

### Phase 4: Import Transactions
- Preserve Fortis transaction IDs (critical!)
- Link to invoices
- Preserve amounts, fees, dates
- Maintain payment status

## API Endpoints Created
1. `POST /api/admin/set-password` - Set user password
2. `POST /api/admin/migrate-data` - Run full migration

## Usage After Deployment

### 1. Set Password
```bash
curl -X POST https://your-app.railway.app/api/admin/set-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jonathan@apollo.inc",
    "password": "Gtui!##!9",
    "adminSecret": "YOUR_ADMIN_SECRET"
  }'
```

### 2. Run Migration
```bash
curl -X POST https://your-app.railway.app/api/admin/migrate-data \
  -H "Content-Type: application/json" \
  -d '{
    "adminSecret": "YOUR_ADMIN_SECRET"
  }'
```

### 3. Verify
- Log in as jonathan@apollo.inc
- Check dashboard for imported data
- Verify Fortis payment processing works

### 4. Clean Up (IMPORTANT!)
After migration, DELETE these files for security:
- `src/app/api/admin/set-password/route.ts`
- `src/app/api/admin/migrate-data/route.ts`
- Remove from middleware publicApiRoutes

## Environment Variables Needed
Add to Railway:
```
ADMIN_SECRET=your-random-secret-key-here
```



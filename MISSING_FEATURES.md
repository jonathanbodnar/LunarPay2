# Missing Features Analysis

## Critical Missing Features (From User Report)

### 1. Invoice System
- ❌ **Invoice creation doesn't work** - Need to fix API and form submission
- ❌ **Invoice branding/customization** - Should show live preview with color scheme and logo
- ❌ **Inline customer creation** - Dropdown should have "+ Create New Customer" option
- ❌ **Inline product selection** - Should search products AND allow creating new ones inline
- ❌ **Email preview in invoice modal** - Should show live preview of email with branding
- ❌ **PDF generation** - Should generate branded PDF for invoices
- ❌ **Email sending** - Should send invoice email with PDF attachment
- ❌ **Cover fee option** - Let customer cover transaction fees
- ❌ **Post-purchase link** - Optional redirect link after payment
- ❌ **Invoice cloning** - Clone existing invoices
- ❌ **Draft vs Send** - Should have "Save Draft" and "Review & Send" options
- ❌ **Status management** - Draft, Open, Paid, Past Due, Canceled statuses
- ❌ **Due date tracking** - Auto-mark invoices as past due

### 2. Product Management
- ❌ **Product creation page missing or broken** - No way to add products
- ❌ **Recurrence options** - One Time, Periodically (daily/weekly/monthly/quarterly/semi-annual/yearly), Custom
- ❌ **Billing period selection** - For recurring products
- ❌ **Custom payment schedules** - Define specific dates and amounts
- ❌ **Digital content delivery** - Upload PDF file to deliver after purchase
- ❌ **Product profile/detail page** - View product details and usage
- ❌ **Subscription start options** - Let customer choose subscription start date
- ❌ **Quantity management** - Track available quantity
- ❌ **Product reference numbers** - Auto-generated product references (PR######-####)

### 3. Payment Links
- ❌ **Can't add products to payment link** - Critical missing functionality
- ❌ **Product quantity editing** - Mark products as editable/fixed quantity
- ❌ **Multiple products per link** - Should support multiple products
- ❌ **Payment method options** - Credit Card, ACH, or both
- ❌ **Payment link view page** - View payment link details and transactions

### 4. Branding/Customization
- ❌ **Branding settings page** - Logo upload, theme color, background color
- ❌ **Live preview** - Show email preview with branding changes
- ❌ **Organization-specific branding** - Per organization/suborganization branding
- ❌ **Logo in emails/PDFs** - Apply branding to all customer communications

### 5. Customer Management
- ❌ **Inline customer creation** - Create customer without leaving invoice/payment form
- ❌ **Customer search with create option** - Search existing or create new
- ❌ **Phone number with country code** - Proper phone field with country selector
- ❌ **Customer profile page enhancements** - Saved payment sources, transaction history
- ❌ **Customer statements** - Generate customer statements

### 6. Transaction Management
- ❌ **Refund functionality** - Refund transactions
- ❌ **Mark as failed** - Manually mark transactions as failed
- ❌ **Bank transaction status toggle** - Special handling for ACH transactions
- ❌ **Export to CSV** - Export transactions to CSV
- ❌ **Transaction detail page** - Full transaction details with all metadata
- ❌ **Manual transactions** - Record manual/offline transactions

### 7. Subscription Management
- ❌ **Subscription listing** - View all active subscriptions
- ❌ **Stop subscription** - Cancel recurring subscriptions
- ❌ **Subscription detail page** - View subscription details and history
- ❌ **Custom recurrence** - Custom payment schedules for subscriptions
- ❌ **Subscription status** - Active, Canceled statuses

### 8. Additional Features
- ❌ **Donations** - Full donation management system
- ❌ **Funds** - Fund/department management
- ❌ **Batches** - Batch processing and reporting
- ❌ **Statements** - Customer statement generation
- ❌ **Referrals** - Referral system
- ❌ **Team management** - User roles and permissions
- ❌ **Suborganizations/Campuses** - Multi-location support
- ❌ **Integrations** - Stripe, QuickBooks, FreshBooks, Planning Center, Slack, Zapier
- ❌ **Getting Started wizard** - Onboarding flow
- ❌ **Dashboard stats** - Revenue, transaction counts, charts
- ❌ **Widget/Embed** - Embeddable payment widget
- ❌ **Pages** - Custom payment pages

## Feature Comparison Matrix

| Feature | Original Platform | New Platform | Status |
|---------|------------------|--------------|--------|
| Invoice Creation | ✅ Full-featured modal | ⚠️ Basic form | Needs enhancement |
| Invoice Preview | ✅ Live email preview | ❌ None | Missing |
| Branding Page | ✅ With live preview | ❌ None | Missing |
| Inline Customer Creation | ✅ Modal popup | ❌ None | Missing |
| Inline Product Creation | ✅ Modal popup | ❌ None | Missing |
| Product Recurrence | ✅ One Time/Recurring/Custom | ⚠️ Basic subscription | Incomplete |
| Payment Links + Products | ✅ Multi-product | ❌ Can't add products | Broken |
| Invoice PDF | ✅ Auto-generated | ❌ None | Missing |
| Invoice Email | ✅ Branded emails | ❌ None | Missing |
| Cover Fee | ✅ Yes | ❌ No | Missing |
| Refunds | ✅ Yes | ❌ No | Missing |
| Subscriptions | ✅ Full management | ⚠️ Basic | Incomplete |
| Digital Delivery | ✅ PDF delivery | ❌ None | Missing |
| Custom Schedules | ✅ Yes | ❌ No | Missing |

## Implementation Priority

### Phase 1: Critical Fixes (User's Top Issues)
1. Fix invoice creation (broken)
2. Add inline customer creation to invoice
3. Add inline product search/creation to invoice
4. Fix payment link product addition
5. Add product creation page

### Phase 2: Branding & Preview
6. Add branding/customization page
7. Add invoice preview in modal
8. Add email template system
9. Add PDF generation

### Phase 3: Core Features
10. Product recurrence options
11. Cover fee functionality
12. Post-purchase links
13. Invoice status management
14. Payment link enhancements

### Phase 4: Advanced Features
15. Digital content delivery
16. Custom payment schedules
17. Subscription management
18. Refund functionality
19. Transaction management

### Phase 5: Additional Systems
20. Donations
21. Funds
22. Batches
23. Statements
24. Integrations


type InvoiceStatus = 'U' | 'P' | 'E'

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
    U: 'Open',
    P: 'Paid',
    E: 'Past Due',
};

export const INVOICE_STATUS_VARIANTS_MAP: Record<InvoiceStatus, any> = {
    P: "default",       // Paid – custom success (you can define this variant)
    U: "primary",       // Open – primary default  
    E: "destructive",   // Past Due – red
};

export type Invoice = {
    id: string;
    reference: string;
    church_id: string;
    campus_id: string;
    hash: string;
    donor_id: string;
    total_amount: string;
    due_date: string;
    status: InvoiceStatus;
    _status: string;
    cover_fee: string;
    finalized: string;
    pdf_url: string;
    created_at: string;
    updated_at: string;
    post_purchase_link: string;
    _link: string;
}
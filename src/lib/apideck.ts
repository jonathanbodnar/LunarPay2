// Apideck Unified Accounting API Integration
// Docs: https://developers.apideck.com/apis/accounting/reference

const APIDECK_BASE_URL = 'https://unify.apideck.com';

interface ApideckConfig {
  apiKey: string;
  appId: string;
  consumerId: string; // Usually the organization ID
}

interface ApideckResponse<T> {
  status_code: number;
  status: string;
  data: T;
  meta?: {
    cursors?: {
      current?: string;
      next?: string;
    };
  };
}

// Available accounting connectors in Apideck
export const APIDECK_CONNECTORS = [
  { id: 'quickbooks', name: 'QuickBooks Online', icon: '/integrations/quickbooks.svg', category: 'accounting' },
  { id: 'xero', name: 'Xero', icon: '/integrations/xero.svg', category: 'accounting' },
  { id: 'freshbooks', name: 'FreshBooks', icon: '/integrations/freshbooks.svg', category: 'accounting' },
  { id: 'sage-intacct', name: 'Sage Intacct', icon: '/integrations/sage.svg', category: 'accounting' },
  { id: 'netsuite', name: 'NetSuite', icon: '/integrations/netsuite.svg', category: 'accounting' },
  { id: 'myob', name: 'MYOB', icon: '/integrations/myob.svg', category: 'accounting' },
  { id: 'exact-online', name: 'Exact Online', icon: '/integrations/exact.svg', category: 'accounting' },
  { id: 'zoho-books', name: 'Zoho Books', icon: '/integrations/zoho.svg', category: 'accounting' },
  { id: 'wave', name: 'Wave', icon: '/integrations/wave.svg', category: 'accounting' },
  { id: 'kashflow', name: 'KashFlow', icon: '/integrations/kashflow.svg', category: 'accounting' },
  { id: 'clear-books', name: 'Clear Books', icon: '/integrations/clearbooks.svg', category: 'accounting' },
  { id: 'freeagent', name: 'FreeAgent', icon: '/integrations/freeagent.svg', category: 'accounting' },
  { id: 'quickbooks-desktop', name: 'QuickBooks Desktop', icon: '/integrations/quickbooks.svg', category: 'accounting' },
  { id: 'sage-business-cloud', name: 'Sage Business Cloud', icon: '/integrations/sage.svg', category: 'accounting' },
  { id: 'microsoft-dynamics-365', name: 'Microsoft Dynamics 365', icon: '/integrations/dynamics.svg', category: 'accounting' },
];

function getConfig(consumerId: string): ApideckConfig {
  const apiKey = process.env.APIDECK_API_KEY;
  const appId = process.env.APIDECK_APP_ID;

  if (!apiKey || !appId) {
    throw new Error('Apideck not configured: missing APIDECK_API_KEY or APIDECK_APP_ID');
  }

  return { apiKey, appId, consumerId };
}

function getHeaders(config: ApideckConfig) {
  return {
    'Authorization': `Bearer ${config.apiKey}`,
    'x-apideck-app-id': config.appId,
    'x-apideck-consumer-id': config.consumerId,
    'Content-Type': 'application/json',
  };
}

/**
 * Create a Vault session for a user to connect their accounting software
 */
export async function createVaultSession(
  consumerId: string,
  redirectUri: string,
  connectorId?: string
): Promise<{ sessionUrl: string; sessionToken: string } | null> {
  try {
    const config = getConfig(consumerId);
    
    const body: Record<string, unknown> = {
      redirect_uri: redirectUri,
      settings: {
        unified_apis: ['accounting'],
      },
    };

    // If a specific connector is requested, pre-select it
    if (connectorId) {
      body.settings = {
        ...body.settings as object,
        session_length: '30m',
      };
    }

    const response = await fetch(`${APIDECK_BASE_URL}/vault/sessions`, {
      method: 'POST',
      headers: getHeaders(config),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[APIDECK] Failed to create vault session:', error);
      return null;
    }

    const data: ApideckResponse<{ session_uri: string; session_token: string }> = await response.json();
    
    return {
      sessionUrl: data.data.session_uri,
      sessionToken: data.data.session_token,
    };
  } catch (error) {
    console.error('[APIDECK] Create vault session error:', error);
    return null;
  }
}

/**
 * Get all connections for a consumer
 */
export async function getConnections(consumerId: string): Promise<Array<{
  id: string;
  service_id: string;
  name: string;
  state: string;
  enabled: boolean;
  icon?: string;
}>> {
  try {
    const config = getConfig(consumerId);
    
    const response = await fetch(`${APIDECK_BASE_URL}/vault/connections?api=accounting`, {
      headers: getHeaders(config),
    });

    if (!response.ok) {
      console.error('[APIDECK] Failed to get connections:', await response.text());
      return [];
    }

    const data: ApideckResponse<Array<{
      id: string;
      service_id: string;
      name: string;
      state: string;
      enabled: boolean;
      icon?: string;
    }>> = await response.json();

    return data.data || [];
  } catch (error) {
    console.error('[APIDECK] Get connections error:', error);
    return [];
  }
}

/**
 * Delete a connection
 */
export async function deleteConnection(consumerId: string, serviceId: string): Promise<boolean> {
  try {
    const config = getConfig(consumerId);
    
    const response = await fetch(
      `${APIDECK_BASE_URL}/vault/connections/accounting/${serviceId}`,
      {
        method: 'DELETE',
        headers: getHeaders(config),
      }
    );

    return response.ok;
  } catch (error) {
    console.error('[APIDECK] Delete connection error:', error);
    return false;
  }
}

// ============ Accounting API Methods ============

/**
 * List customers from connected accounting software
 */
export async function listCustomers(
  consumerId: string,
  serviceId: string,
  cursor?: string
): Promise<{ customers: Array<Record<string, unknown>>; nextCursor?: string }> {
  try {
    const config = getConfig(consumerId);
    
    const url = new URL(`${APIDECK_BASE_URL}/accounting/customers`);
    if (cursor) url.searchParams.set('cursor', cursor);

    const response = await fetch(url.toString(), {
      headers: {
        ...getHeaders(config),
        'x-apideck-service-id': serviceId,
      },
    });

    if (!response.ok) {
      console.error('[APIDECK] Failed to list customers:', await response.text());
      return { customers: [] };
    }

    const data: ApideckResponse<Array<Record<string, unknown>>> = await response.json();
    
    return {
      customers: data.data || [],
      nextCursor: data.meta?.cursors?.next,
    };
  } catch (error) {
    console.error('[APIDECK] List customers error:', error);
    return { customers: [] };
  }
}

/**
 * Create a customer in connected accounting software
 */
export async function createCustomer(
  consumerId: string,
  serviceId: string,
  customer: {
    display_name: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    company_name?: string;
    addresses?: Array<{
      type: 'primary' | 'secondary' | 'billing' | 'shipping';
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    }>;
  }
): Promise<{ id: string } | null> {
  try {
    const config = getConfig(consumerId);
    
    const response = await fetch(`${APIDECK_BASE_URL}/accounting/customers`, {
      method: 'POST',
      headers: {
        ...getHeaders(config),
        'x-apideck-service-id': serviceId,
      },
      body: JSON.stringify(customer),
    });

    if (!response.ok) {
      console.error('[APIDECK] Failed to create customer:', await response.text());
      return null;
    }

    const data: ApideckResponse<{ id: string }> = await response.json();
    return data.data;
  } catch (error) {
    console.error('[APIDECK] Create customer error:', error);
    return null;
  }
}

/**
 * List invoices from connected accounting software
 */
export async function listInvoices(
  consumerId: string,
  serviceId: string,
  cursor?: string
): Promise<{ invoices: Array<Record<string, unknown>>; nextCursor?: string }> {
  try {
    const config = getConfig(consumerId);
    
    const url = new URL(`${APIDECK_BASE_URL}/accounting/invoices`);
    if (cursor) url.searchParams.set('cursor', cursor);

    const response = await fetch(url.toString(), {
      headers: {
        ...getHeaders(config),
        'x-apideck-service-id': serviceId,
      },
    });

    if (!response.ok) {
      console.error('[APIDECK] Failed to list invoices:', await response.text());
      return { invoices: [] };
    }

    const data: ApideckResponse<Array<Record<string, unknown>>> = await response.json();
    
    return {
      invoices: data.data || [],
      nextCursor: data.meta?.cursors?.next,
    };
  } catch (error) {
    console.error('[APIDECK] List invoices error:', error);
    return { invoices: [] };
  }
}

/**
 * Create an invoice in connected accounting software
 */
export async function createInvoice(
  consumerId: string,
  serviceId: string,
  invoice: {
    customer_id: string;
    invoice_date?: string;
    due_date?: string;
    currency?: string;
    line_items: Array<{
      description?: string;
      quantity?: number;
      unit_price?: number;
      total_amount?: number;
      item?: { id: string } | { name: string };
    }>;
    memo?: string;
  }
): Promise<{ id: string } | null> {
  try {
    const config = getConfig(consumerId);
    
    const response = await fetch(`${APIDECK_BASE_URL}/accounting/invoices`, {
      method: 'POST',
      headers: {
        ...getHeaders(config),
        'x-apideck-service-id': serviceId,
      },
      body: JSON.stringify(invoice),
    });

    if (!response.ok) {
      console.error('[APIDECK] Failed to create invoice:', await response.text());
      return null;
    }

    const data: ApideckResponse<{ id: string }> = await response.json();
    return data.data;
  } catch (error) {
    console.error('[APIDECK] Create invoice error:', error);
    return null;
  }
}

/**
 * Record a payment in connected accounting software
 */
export async function createPayment(
  consumerId: string,
  serviceId: string,
  payment: {
    customer_id: string;
    total_amount: number;
    transaction_date?: string;
    currency?: string;
    reference?: string;
    allocations?: Array<{
      id: string; // Invoice ID
      type: 'invoice';
      amount: number;
    }>;
  }
): Promise<{ id: string } | null> {
  try {
    const config = getConfig(consumerId);
    
    const response = await fetch(`${APIDECK_BASE_URL}/accounting/payments`, {
      method: 'POST',
      headers: {
        ...getHeaders(config),
        'x-apideck-service-id': serviceId,
      },
      body: JSON.stringify(payment),
    });

    if (!response.ok) {
      console.error('[APIDECK] Failed to create payment:', await response.text());
      return null;
    }

    const data: ApideckResponse<{ id: string }> = await response.json();
    return data.data;
  } catch (error) {
    console.error('[APIDECK] Create payment error:', error);
    return null;
  }
}

/**
 * Get ledger accounts (chart of accounts)
 */
export async function listLedgerAccounts(
  consumerId: string,
  serviceId: string,
  cursor?: string
): Promise<{ accounts: Array<Record<string, unknown>>; nextCursor?: string }> {
  try {
    const config = getConfig(consumerId);
    
    const url = new URL(`${APIDECK_BASE_URL}/accounting/ledger-accounts`);
    if (cursor) url.searchParams.set('cursor', cursor);

    const response = await fetch(url.toString(), {
      headers: {
        ...getHeaders(config),
        'x-apideck-service-id': serviceId,
      },
    });

    if (!response.ok) {
      console.error('[APIDECK] Failed to list ledger accounts:', await response.text());
      return { accounts: [] };
    }

    const data: ApideckResponse<Array<Record<string, unknown>>> = await response.json();
    
    return {
      accounts: data.data || [],
      nextCursor: data.meta?.cursors?.next,
    };
  } catch (error) {
    console.error('[APIDECK] List ledger accounts error:', error);
    return { accounts: [] };
  }
}

/**
 * Get tax rates
 */
export async function listTaxRates(
  consumerId: string,
  serviceId: string
): Promise<Array<Record<string, unknown>>> {
  try {
    const config = getConfig(consumerId);
    
    const response = await fetch(`${APIDECK_BASE_URL}/accounting/tax-rates`, {
      headers: {
        ...getHeaders(config),
        'x-apideck-service-id': serviceId,
      },
    });

    if (!response.ok) {
      console.error('[APIDECK] Failed to list tax rates:', await response.text());
      return [];
    }

    const data: ApideckResponse<Array<Record<string, unknown>>> = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('[APIDECK] List tax rates error:', error);
    return [];
  }
}

/**
 * Get company info from connected accounting software
 */
export async function getCompanyInfo(
  consumerId: string,
  serviceId: string
): Promise<Record<string, unknown> | null> {
  try {
    const config = getConfig(consumerId);
    
    const response = await fetch(`${APIDECK_BASE_URL}/accounting/company-info`, {
      headers: {
        ...getHeaders(config),
        'x-apideck-service-id': serviceId,
      },
    });

    if (!response.ok) {
      console.error('[APIDECK] Failed to get company info:', await response.text());
      return null;
    }

    const data: ApideckResponse<Record<string, unknown>> = await response.json();
    return data.data;
  } catch (error) {
    console.error('[APIDECK] Get company info error:', error);
    return null;
  }
}


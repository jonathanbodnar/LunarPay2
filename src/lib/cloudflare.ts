// Cloudflare for SaaS - Custom Hostname Management

const CLOUDFLARE_API_URL = 'https://api.cloudflare.com/client/v4';

interface CloudflareResponse<T> {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: string[];
  result: T;
}

interface CustomHostname {
  id: string;
  hostname: string;
  ssl: {
    status: string;
    method: string;
    type: string;
    validation_records?: Array<{
      txt_name: string;
      txt_value: string;
    }>;
  };
  status: string;
  created_at: string;
}

/**
 * Add a custom hostname to Cloudflare for SaaS
 */
export async function addCustomHostname(hostname: string): Promise<{
  success: boolean;
  hostname?: CustomHostname;
  error?: string;
  validationRecords?: Array<{ name: string; value: string }>;
}> {
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!zoneId || !apiToken) {
    console.error('[CLOUDFLARE] Missing CLOUDFLARE_ZONE_ID or CLOUDFLARE_API_TOKEN');
    return { success: false, error: 'Cloudflare not configured' };
  }

  try {
    console.log('[CLOUDFLARE] Adding custom hostname:', hostname);

    const response = await fetch(
      `${CLOUDFLARE_API_URL}/zones/${zoneId}/custom_hostnames`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hostname,
          ssl: {
            method: 'txt', // TXT validation
            type: 'dv', // Domain Validation
            settings: {
              min_tls_version: '1.0',
            },
          },
        }),
      }
    );

    const data: CloudflareResponse<CustomHostname> = await response.json();

    if (!data.success) {
      console.error('[CLOUDFLARE] Failed to add hostname:', data.errors);
      const errorMessage = data.errors?.[0]?.message || 'Failed to add custom hostname';
      return { success: false, error: errorMessage };
    }

    console.log('[CLOUDFLARE] Custom hostname added:', data.result.id);

    // Extract validation records if present
    const validationRecords = data.result.ssl?.validation_records?.map(record => ({
      name: record.txt_name,
      value: record.txt_value,
    })) || [];

    return {
      success: true,
      hostname: data.result,
      validationRecords,
    };
  } catch (error) {
    console.error('[CLOUDFLARE] Error adding hostname:', error);
    return { success: false, error: 'Failed to communicate with Cloudflare' };
  }
}

/**
 * Delete a custom hostname from Cloudflare
 */
export async function deleteCustomHostname(hostname: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!zoneId || !apiToken) {
    return { success: false, error: 'Cloudflare not configured' };
  }

  try {
    // First, find the hostname ID
    const listResponse = await fetch(
      `${CLOUDFLARE_API_URL}/zones/${zoneId}/custom_hostnames?hostname=${encodeURIComponent(hostname)}`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
        },
      }
    );

    const listData: CloudflareResponse<CustomHostname[]> = await listResponse.json();

    if (!listData.success || !listData.result?.length) {
      console.log('[CLOUDFLARE] Hostname not found:', hostname);
      return { success: true }; // Not an error if it doesn't exist
    }

    const hostnameId = listData.result[0].id;

    // Delete the hostname
    const deleteResponse = await fetch(
      `${CLOUDFLARE_API_URL}/zones/${zoneId}/custom_hostnames/${hostnameId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
        },
      }
    );

    const deleteData: CloudflareResponse<{ id: string }> = await deleteResponse.json();

    if (!deleteData.success) {
      console.error('[CLOUDFLARE] Failed to delete hostname:', deleteData.errors);
      return { success: false, error: deleteData.errors?.[0]?.message || 'Failed to delete' };
    }

    console.log('[CLOUDFLARE] Custom hostname deleted:', hostname);
    return { success: true };
  } catch (error) {
    console.error('[CLOUDFLARE] Error deleting hostname:', error);
    return { success: false, error: 'Failed to communicate with Cloudflare' };
  }
}

/**
 * Get the status of a custom hostname
 */
export async function getCustomHostnameStatus(hostname: string): Promise<{
  success: boolean;
  status?: string;
  sslStatus?: string;
  error?: string;
}> {
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!zoneId || !apiToken) {
    return { success: false, error: 'Cloudflare not configured' };
  }

  try {
    const response = await fetch(
      `${CLOUDFLARE_API_URL}/zones/${zoneId}/custom_hostnames?hostname=${encodeURIComponent(hostname)}`,
      {
        headers: {
          'Authorization': `Bearer ${apiToken}`,
        },
      }
    );

    const data: CloudflareResponse<CustomHostname[]> = await response.json();

    if (!data.success || !data.result?.length) {
      return { success: false, error: 'Hostname not found' };
    }

    const hostnameData = data.result[0];
    return {
      success: true,
      status: hostnameData.status,
      sslStatus: hostnameData.ssl?.status,
    };
  } catch (error) {
    console.error('[CLOUDFLARE] Error getting hostname status:', error);
    return { success: false, error: 'Failed to communicate with Cloudflare' };
  }
}

/**
 * Get the DCV delegation target for customers to add as a CNAME
 * This is the _acme-challenge CNAME target
 */
export function getDcvDelegationTarget(): string {
  // This is shown in your Cloudflare dashboard under Custom Hostnames
  // It's static for your zone
  return '066217d657c42286.dcv.cloudflare.com';
}

/**
 * Get the CNAME target that merchants should point their domain to
 */
export function getPortalCnameTarget(): string {
  return process.env.PORTAL_CNAME_TARGET || 'portal.lunarpay.com';
}


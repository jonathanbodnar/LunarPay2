/**
 * Railway API client for managing custom domains
 * 
 * When a merchant sets up a custom domain, we need to:
 * 1. Add it to Cloudflare for SaaS (for SSL and routing)
 * 2. Add it to Railway (so Railway accepts the hostname)
 */

const RAILWAY_API_URL = 'https://backboard.railway.app/graphql/v2';
const RAILWAY_TOKEN = process.env.RAILWAY_TOKEN;
const RAILWAY_PROJECT_ID = process.env.RAILWAY_PROJECT_ID;
const RAILWAY_SERVICE_ID = process.env.RAILWAY_SERVICE_ID;
const RAILWAY_ENVIRONMENT_ID = process.env.RAILWAY_ENVIRONMENT_ID;

interface RailwayResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

interface CustomDomain {
  id: string;
  domain: string;
  status: {
    dnsRecords: Array<{
      currentValue: string;
      requiredValue: string;
      type: string;
      hostName: string;
      status: string;
    }>;
  };
}

/**
 * Add a custom domain to Railway
 */
export async function addRailwayCustomDomain(domain: string): Promise<{ success: boolean; domain?: CustomDomain; error?: string }> {
  if (!RAILWAY_TOKEN) {
    console.error('RAILWAY_TOKEN not configured');
    return { success: false, error: 'Railway API not configured' };
  }

  if (!RAILWAY_PROJECT_ID || !RAILWAY_SERVICE_ID || !RAILWAY_ENVIRONMENT_ID) {
    console.error('Railway project/service/environment IDs not configured');
    return { success: false, error: 'Railway project configuration missing' };
  }

  const mutation = `
    mutation customDomainCreate($input: CustomDomainCreateInput!) {
      customDomainCreate(input: $input) {
        id
        domain
        status {
          dnsRecords {
            currentValue
            requiredValue
            type
            hostName
            status
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(RAILWAY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RAILWAY_TOKEN}`,
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          input: {
            domain,
            projectId: RAILWAY_PROJECT_ID,
            serviceId: RAILWAY_SERVICE_ID,
            environmentId: RAILWAY_ENVIRONMENT_ID,
            targetPort: 8080,
          },
        },
      }),
    });

    const result: RailwayResponse<{ customDomainCreate: CustomDomain }> = await response.json();

    if (result.errors && result.errors.length > 0) {
      // Check if domain already exists (not an error)
      const alreadyExists = result.errors.some(e => 
        e.message.includes('already exists') || e.message.includes('duplicate')
      );
      
      if (alreadyExists) {
        console.log(`Domain ${domain} already exists in Railway`);
        return { success: true };
      }

      console.error('Railway API error:', result.errors);
      return { success: false, error: result.errors[0].message };
    }

    if (result.data?.customDomainCreate) {
      console.log(`Successfully added ${domain} to Railway`);
      return { success: true, domain: result.data.customDomainCreate };
    }

    return { success: false, error: 'Unknown error' };
  } catch (error) {
    console.error('Railway API request failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Request failed' };
  }
}

/**
 * Delete a custom domain from Railway
 */
export async function deleteRailwayCustomDomain(domainId: string): Promise<{ success: boolean; error?: string }> {
  if (!RAILWAY_TOKEN) {
    console.error('RAILWAY_TOKEN not configured');
    return { success: false, error: 'Railway API not configured' };
  }

  const mutation = `
    mutation customDomainDelete($id: String!) {
      customDomainDelete(id: $id)
    }
  `;

  try {
    const response = await fetch(RAILWAY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RAILWAY_TOKEN}`,
      },
      body: JSON.stringify({
        query: mutation,
        variables: { id: domainId },
      }),
    });

    const result: RailwayResponse<{ customDomainDelete: boolean }> = await response.json();

    if (result.errors && result.errors.length > 0) {
      console.error('Railway API error:', result.errors);
      return { success: false, error: result.errors[0].message };
    }

    return { success: true };
  } catch (error) {
    console.error('Railway API request failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Request failed' };
  }
}

/**
 * List all custom domains for the service
 */
export async function listRailwayCustomDomains(): Promise<{ success: boolean; domains?: CustomDomain[]; error?: string }> {
  if (!RAILWAY_TOKEN || !RAILWAY_SERVICE_ID || !RAILWAY_ENVIRONMENT_ID) {
    return { success: false, error: 'Railway API not configured' };
  }

  const query = `
    query customDomains($serviceId: String!, $environmentId: String!) {
      customDomains(serviceId: $serviceId, environmentId: $environmentId) {
        id
        domain
        status {
          dnsRecords {
            currentValue
            requiredValue
            type
            hostName
            status
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(RAILWAY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RAILWAY_TOKEN}`,
      },
      body: JSON.stringify({
        query,
        variables: {
          serviceId: RAILWAY_SERVICE_ID,
          environmentId: RAILWAY_ENVIRONMENT_ID,
        },
      }),
    });

    const result: RailwayResponse<{ customDomains: CustomDomain[] }> = await response.json();

    if (result.errors && result.errors.length > 0) {
      console.error('Railway API error:', result.errors);
      return { success: false, error: result.errors[0].message };
    }

    return { success: true, domains: result.data?.customDomains || [] };
  } catch (error) {
    console.error('Railway API request failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Request failed' };
  }
}

/**
 * Find a custom domain by name
 */
export async function findRailwayCustomDomain(domain: string): Promise<CustomDomain | null> {
  const result = await listRailwayCustomDomains();
  if (!result.success || !result.domains) return null;
  return result.domains.find(d => d.domain === domain) || null;
}


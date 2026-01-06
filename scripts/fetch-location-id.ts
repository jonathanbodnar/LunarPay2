/**
 * Script to fetch and update location_id for a Fortis-approved merchant
 * 
 * Usage: DATABASE_URL=<your-db-url> npx tsx scripts/fetch-location-id.ts <organizationId>
 */

import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

async function main() {
  const organizationId = parseInt(process.argv[2] || '8');
  
  console.log(`Fetching location_id for organization ${organizationId}...`);

  // Get organization with Fortis onboarding
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      fortisOnboarding: true,
    },
  });

  if (!organization) {
    console.error('Organization not found');
    process.exit(1);
  }

  if (!organization.fortisOnboarding) {
    console.error('No Fortis onboarding record found');
    process.exit(1);
  }

  const { authUserId, authUserApiKey, locationId: existingLocationId, appStatus } = organization.fortisOnboarding;

  console.log('Current onboarding status:', {
    appStatus,
    authUserId: authUserId ? `${authUserId.substring(0, 10)}...` : 'NOT SET',
    authUserApiKey: authUserApiKey ? `${authUserApiKey.substring(0, 10)}...` : 'NOT SET',
    existingLocationId: existingLocationId || 'NOT SET',
  });

  if (existingLocationId) {
    console.log('✓ Location ID already exists:', existingLocationId);
    process.exit(0);
  }

  if (!authUserId || !authUserApiKey) {
    console.error('Merchant not yet approved (no API credentials)');
    process.exit(1);
  }

  // Determine environment
  const fortisEnv = process.env.fortis_environment || 'prd';
  const baseURL = fortisEnv === 'prd' 
    ? 'https://api.fortis.tech/v1/'
    : 'https://api.sandbox.fortis.tech/v1/';
  
  const developerId = fortisEnv === 'prd'
    ? process.env.fortis_developer_id_production
    : process.env.fortis_developer_id_sandbox;

  console.log(`Using Fortis ${fortisEnv} environment: ${baseURL}`);
  console.log(`Developer ID: ${developerId?.substring(0, 10)}...`);

  // Fetch locations from Fortis
  try {
    console.log('Fetching locations from Fortis API...');
    
    const response = await axios.get(`${baseURL}locations`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'developer-id': developerId!,
        'user-id': authUserId,
        'user-api-key': authUserApiKey,
      },
      timeout: 30000,
    });

    console.log('Fortis API response status:', response.status);
    console.log('Fortis API response:', JSON.stringify(response.data, null, 2));

    const locations = response.data?.list || [];
    
    if (locations.length === 0) {
      console.error('No locations found in Fortis response');
      process.exit(1);
    }

    const location = locations[0];
    const locationId = location.id;

    console.log('Found location:', {
      id: locationId,
      name: location.name || location.dba_name,
    });

    // Update the onboarding record
    await prisma.fortisOnboarding.update({
      where: { id: organization.fortisOnboarding.id },
      data: {
        locationId,
        updatedAt: new Date(),
      },
    });

    console.log('✓ Successfully updated location_id:', locationId);

  } catch (error: any) {
    console.error('Fortis API error:', error.response?.data || error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);


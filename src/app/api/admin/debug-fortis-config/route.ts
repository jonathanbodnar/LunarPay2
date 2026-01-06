import { NextResponse } from 'next/server';

/**
 * Debug endpoint to check Fortis configuration
 * GET /api/admin/debug-fortis-config
 */
export async function GET() {
  const config = {
    environment: process.env.fortis_environment || 'NOT SET (defaults to dev)',
    template: process.env.FORTIS_TPL_DEFAULT || 'NOT SET',
    
    // Sandbox credentials (masked)
    sandbox: {
      developerId: process.env.fortis_developer_id_sandbox ? 'SET (' + process.env.fortis_developer_id_sandbox.slice(0, 8) + '...)' : 'NOT SET',
      userId: process.env.fortis_onboarding_user_id_sandbox ? 'SET (' + process.env.fortis_onboarding_user_id_sandbox.slice(0, 8) + '...)' : 'NOT SET',
      userApiKey: process.env.fortis_onboarding_user_api_key_sandbox ? 'SET (' + process.env.fortis_onboarding_user_api_key_sandbox.slice(0, 8) + '...)' : 'NOT SET',
    },
    
    // Production credentials (masked)
    production: {
      developerId: process.env.fortis_developer_id_production ? 'SET (' + process.env.fortis_developer_id_production.slice(0, 8) + '...)' : 'NOT SET',
      userId: process.env.fortis_onboarding_user_id_production ? 'SET (' + process.env.fortis_onboarding_user_id_production.slice(0, 8) + '...)' : 'NOT SET',
      userApiKey: process.env.fortis_onboarding_user_api_key_production ? 'SET (' + process.env.fortis_onboarding_user_api_key_production.slice(0, 8) + '...)' : 'NOT SET',
    },
    
    // Derived settings
    isProduction: process.env.fortis_environment === 'prd',
    activeCredentials: process.env.fortis_environment === 'prd' ? 'production' : 'sandbox',
  };

  return NextResponse.json(config);
}


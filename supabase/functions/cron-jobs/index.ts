// Supabase Edge Function for LunarPay Cron Jobs
// Handles: Subscription processing & Onboarding email drip sequence

const ADMIN_KEY = 'Trump2028!%23%23!9';
const APP_URL = Deno.env.get('APP_URL') || 'https://app.lunarpay.com';

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    subscriptions: null,
    onboardingEmails: null,
  };

  try {
    // 1. Process Subscriptions
    console.log('Processing subscriptions...');
    const subResponse = await fetch(
      `${APP_URL}/api/cron/process-subscriptions?admin_key=${ADMIN_KEY}`,
      { method: 'GET' }
    );
    results.subscriptions = {
      status: subResponse.status,
      data: await subResponse.json().catch(() => subResponse.statusText),
    };
    console.log('Subscriptions result:', results.subscriptions);

    // 2. Process Onboarding Emails
    console.log('Processing onboarding emails...');
    const emailResponse = await fetch(
      `${APP_URL}/api/cron/onboarding-emails?admin_key=${ADMIN_KEY}`,
      { method: 'GET' }
    );
    results.onboardingEmails = {
      status: emailResponse.status,
      data: await emailResponse.json().catch(() => emailResponse.statusText),
    };
    console.log('Onboarding emails result:', results.onboardingEmails);

    return new Response(JSON.stringify(results, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return new Response(
      JSON.stringify({ error: String(error), results }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

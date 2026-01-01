import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

// TEMPORARY TEST ENDPOINT - DELETE AFTER USE
// POST /api/admin/test-email?to=email@example.com
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const to = searchParams.get('to');

  if (!to) {
    return NextResponse.json({ error: 'to parameter required' }, { status: 400 });
  }

  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@lunarpay.com';
  const fromName = process.env.SENDGRID_FROM_NAME || 'LunarPay';

  if (!apiKey) {
    return NextResponse.json({ 
      error: 'SendGrid not configured',
      apiKeySet: false,
    }, { status: 500 });
  }

  try {
    sgMail.setApiKey(apiKey);
    
    console.log('[TEST EMAIL] Sending test email to:', to, 'from:', fromEmail);
    
    const result = await sgMail.send({
      to,
      from: { email: fromEmail, name: fromName },
      subject: 'LunarPay Test Email',
      text: 'This is a test email from LunarPay. If you received this, email sending is working!',
      html: '<h1>Test Email</h1><p>This is a test email from LunarPay. If you received this, email sending is working!</p>',
    });

    console.log('[TEST EMAIL] Success! Status:', result[0]?.statusCode);
    
    return NextResponse.json({
      success: true,
      statusCode: result[0]?.statusCode,
      to,
      from: fromEmail,
    });
  } catch (error: unknown) {
    console.error('[TEST EMAIL] Error:', error);
    
    let errorDetails = String(error);
    let responseBody = null;
    
    if (error && typeof error === 'object' && 'response' in error) {
      const sgError = error as { response?: { body?: unknown; statusCode?: number } };
      responseBody = sgError.response?.body;
      errorDetails = JSON.stringify(sgError.response?.body);
    }
    
    return NextResponse.json({
      error: 'Failed to send email',
      details: errorDetails,
      responseBody,
      config: {
        apiKeyPrefix: apiKey.substring(0, 10) + '...',
        fromEmail,
        fromName,
      },
    }, { status: 500 });
  }
}


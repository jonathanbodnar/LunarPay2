import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

/**
 * GET /api/admin/email-diagnose?admin_key=...&to=you@example.com
 *
 * One-shot SendGrid send that surfaces the exact response body / error
 * SendGrid returns. Used to debug "Sent 0 / N errors" cron output without
 * having to read Railway logs.
 *
 * Returns env presence flags + SendGrid status code + full response body
 * (or error.response.body) so we can tell at a glance whether the failure
 * is API key, sender verification, scope, or account suspension.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const adminKey = url.searchParams.get('admin_key');
  const to = url.searchParams.get('to') || 'jonathanbodnar@gmail.com';

  if (!process.env.CRON_ADMIN_KEY || adminKey !== process.env.CRON_ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@lunarpay.com';
  const fromName = process.env.SENDGRID_FROM_NAME || 'LunarPay';

  const env = {
    SENDGRID_API_KEY_present: !!apiKey,
    SENDGRID_API_KEY_length: apiKey?.length ?? 0,
    SENDGRID_API_KEY_prefix: apiKey ? apiKey.slice(0, 6) : null,
    SENDGRID_FROM_EMAIL: fromEmail,
    SENDGRID_FROM_NAME: fromName,
  };

  if (!apiKey) {
    return NextResponse.json({
      ok: false,
      stage: 'no_api_key',
      env,
    });
  }

  sgMail.setApiKey(apiKey);

  try {
    const result = await sgMail.send({
      to,
      from: { email: fromEmail, name: fromName },
      subject: '[diagnose] LunarPay SendGrid probe',
      text: 'Diagnostic ping from /api/admin/email-diagnose.',
      html: '<p>Diagnostic ping from <code>/api/admin/email-diagnose</code>.</p>',
    });

    return NextResponse.json({
      ok: true,
      stage: 'sent',
      env,
      sendgridStatus: result[0]?.statusCode ?? null,
      sendgridHeaders: {
        'x-message-id': result[0]?.headers?.['x-message-id'] ?? null,
      },
      to,
    });
  } catch (err: unknown) {
    const e = err as {
      code?: number;
      message?: string;
      response?: { statusCode?: number; body?: unknown; headers?: unknown };
    };
    return NextResponse.json(
      {
        ok: false,
        stage: 'send_failed',
        env,
        to,
        error: {
          code: e?.code ?? null,
          message: e?.message ?? String(err),
          sendgridStatus: e?.response?.statusCode ?? null,
          sendgridBody: e?.response?.body ?? null,
        },
      },
      { status: 200 }
    );
  }
}

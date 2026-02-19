/**
 * Chat Followup Email Cron
 *
 * Sends a chat summary email to users who haven't replied to an admin
 * message within 24 hours. Users can reply directly to the email and
 * their response is routed back into the live chat via SendGrid Inbound Parse.
 *
 * Schedule: Run every hour via Railway cron
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendChatFollowupEmail } from '@/lib/email';
import crypto from 'crypto';

const ADMIN_TRIGGER_KEY = process.env.CRON_ADMIN_KEY;
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
const REPLY_DOMAIN = process.env.CHAT_REPLY_DOMAIN || 'reply.lunarpay.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://lunarpay.com';

async function processChatFollowups(): Promise<{ sent: number; errors: number; skipped: number }> {
  const now = new Date();
  const results = { sent: 0, errors: 0, skipped: 0 };

  console.log('[CHAT_FOLLOWUP] Starting at:', now.toISOString());

  const conversations = await prisma.chatConversation.findMany({
    where: {
      followupEmailSentAt: null,
      status: 'active',
    },
    include: {
      user: {
        select: { email: true, firstName: true },
      },
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  console.log(`[CHAT_FOLLOWUP] Found ${conversations.length} conversations to check`);

  for (const conv of conversations) {
    if (conv.messages.length === 0) {
      results.skipped++;
      continue;
    }

    const lastMessage = conv.messages[conv.messages.length - 1];

    // Only send followup if the last message is from admin and is older than 24h
    if (lastMessage.senderType !== 'admin') {
      results.skipped++;
      continue;
    }

    const timeSinceLastMsg = now.getTime() - new Date(lastMessage.createdAt).getTime();
    if (timeSinceLastMsg < TWENTY_FOUR_HOURS) {
      results.skipped++;
      continue;
    }

    const firstName = conv.user.firstName || 'there';
    const token = crypto.randomBytes(32).toString('hex');
    const replyToAddress = `chat+${token}@${REPLY_DOMAIN}`;

    console.log(`[CHAT_FOLLOWUP] Sending followup to ${conv.user.email} for conversation ${conv.id}`);

    try {
      const sent = await sendChatFollowupEmail({
        to: conv.user.email,
        firstName,
        messages: conv.messages.map((m) => ({
          senderType: m.senderType,
          content: m.content,
          createdAt: m.createdAt.toISOString(),
        })),
        replyToAddress,
        dashboardUrl: `${APP_URL}/dashboard`,
      });

      if (sent) {
        await prisma.chatConversation.update({
          where: { id: conv.id },
          data: {
            followupEmailSentAt: now,
            followupEmailToken: token,
          },
        });
        results.sent++;
        console.log(`[CHAT_FOLLOWUP] Sent successfully to ${conv.user.email}`);
      } else {
        results.errors++;
        console.log(`[CHAT_FOLLOWUP] Send failed for ${conv.user.email}`);
      }
    } catch (error) {
      results.errors++;
      console.error(`[CHAT_FOLLOWUP] Error for ${conv.user.email}:`, error);
    }
  }

  console.log('[CHAT_FOLLOWUP] Complete:', JSON.stringify(results));
  return results;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const adminKey = searchParams.get('admin_key');

  const cronSecret = request.headers.get('x-cron-secret') || request.headers.get('authorization');
  const isAuthorized =
    cronSecret === process.env.CRON_SECRET ||
    cronSecret === `Bearer ${process.env.CRON_SECRET}` ||
    (ADMIN_TRIGGER_KEY && adminKey === ADMIN_TRIGGER_KEY);

  if (!isAuthorized) {
    console.log('[CHAT_FOLLOWUP] Unauthorized request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results = await processChatFollowups();

    return NextResponse.json({
      success: true,
      message: `Sent ${results.sent} followup emails, ${results.errors} errors, ${results.skipped} skipped`,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[CHAT_FOLLOWUP] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat followups', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}

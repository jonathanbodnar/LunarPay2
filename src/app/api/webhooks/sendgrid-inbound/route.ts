/**
 * SendGrid Inbound Parse Webhook
 *
 * Receives emails sent to chat+{token}@reply.lunarpay.com and
 * inserts the reply text as a chat message in the matching conversation.
 *
 * SendGrid posts multipart/form-data with fields like:
 *   to, from, subject, text, html, envelope, etc.
 *
 * Setup: SendGrid Inbound Parse → hostname: reply.lunarpay.com → POST to this URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const REPLY_DOMAIN = process.env.CHAT_REPLY_DOMAIN || 'reply.lunarpay.com';

function extractToken(toField: string): string | null {
  // Match chat+{token}@reply.lunarpay.com in the To header
  const pattern = new RegExp(`chat\\+([a-f0-9]{64})@${REPLY_DOMAIN.replace(/\./g, '\\.')}`, 'i');
  const match = toField.match(pattern);
  return match ? match[1] : null;
}

function extractReplyText(text: string): string {
  // Strip quoted content below the reply separator
  const separators = [
    '---- Reply above this line to continue the conversation ----',
    '----',
    'On ',          // Gmail: "On Mon, Feb 10, 2026..."
    'From:',        // Outlook forward header
    '> ',           // Quoted lines
  ];

  let reply = text;

  // First try the explicit separator
  const sepIdx = reply.indexOf('---- Reply above this line');
  if (sepIdx > 0) {
    reply = reply.substring(0, sepIdx);
  } else {
    // Fallback: strip from first "On ... wrote:" pattern (Gmail style)
    const gmailPattern = /\nOn .+wrote:\s*$/ms;
    const gmailMatch = reply.search(gmailPattern);
    if (gmailMatch > 0) {
      reply = reply.substring(0, gmailMatch);
    }

    // Fallback: strip from "From:" header (Outlook style)
    const outlookIdx = reply.indexOf('\nFrom:');
    if (outlookIdx > 0) {
      reply = reply.substring(0, outlookIdx);
    }

    // Fallback: strip consecutive quoted lines from the end
    const lines = reply.split('\n');
    while (lines.length > 0 && lines[lines.length - 1].trimStart().startsWith('>')) {
      lines.pop();
    }
    reply = lines.join('\n');
  }

  return reply.trim();
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const toField = (formData.get('to') as string) || (formData.get('envelope') as string) || '';
    const textBody = (formData.get('text') as string) || '';

    console.log('[INBOUND_EMAIL] Received inbound email, to:', toField);

    // Also check the envelope JSON for the actual recipient
    let token = extractToken(toField);
    if (!token) {
      const envelope = formData.get('envelope') as string;
      if (envelope) {
        try {
          const env = JSON.parse(envelope);
          const recipients: string[] = env.to || [];
          for (const addr of recipients) {
            token = extractToken(addr);
            if (token) break;
          }
        } catch { /* ignore parse errors */ }
      }
    }

    if (!token) {
      console.log('[INBOUND_EMAIL] No valid token found in To field');
      return NextResponse.json({ error: 'Invalid recipient' }, { status: 400 });
    }

    const conversation = await prisma.chatConversation.findFirst({
      where: { followupEmailToken: token },
    });

    if (!conversation) {
      console.log('[INBOUND_EMAIL] No conversation found for token');
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const replyText = extractReplyText(textBody);

    if (!replyText) {
      console.log('[INBOUND_EMAIL] Empty reply after stripping quotes');
      return NextResponse.json({ error: 'Empty reply' }, { status: 400 });
    }

    // Truncate to 2000 chars (same limit as the chat API)
    const content = replyText.substring(0, 2000);

    await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        senderType: 'user',
        content,
      },
    });

    await prisma.chatConversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        unreadByAdmin: { increment: 1 },
        // Reset so another followup can fire if admin replies and user goes silent again
        followupEmailSentAt: null,
        followupEmailToken: null,
      },
    });

    console.log(`[INBOUND_EMAIL] Reply inserted for conversation ${conversation.id}: "${content.substring(0, 50)}..."`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[INBOUND_EMAIL] Error processing inbound email:', error);
    return NextResponse.json({ error: 'Failed to process email' }, { status: 500 });
  }
}

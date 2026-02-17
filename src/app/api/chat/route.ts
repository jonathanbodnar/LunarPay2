import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const ZAPIER_CHAT_WEBHOOK_URL = 'https://hooks.zapier.com/hooks/catch/25882699/ucu39xx/';

const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message is required').max(2000),
  autoMessage: z.string().optional(),
});

// GET /api/chat - Fetch user's conversation + messages
export async function GET() {
  try {
    const currentUser = await requireAuth();

    const conversation = await prisma.chatConversation.findUnique({
      where: { userId: currentUser.userId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!conversation) {
      return NextResponse.json({ conversation: null, messages: [] });
    }

    if (conversation.unreadByUser > 0) {
      await prisma.$transaction([
        prisma.chatConversation.update({
          where: { id: conversation.id },
          data: { unreadByUser: 0 },
        }),
        // Mark all unread admin messages as read by the user
        prisma.chatMessage.updateMany({
          where: {
            conversationId: conversation.id,
            senderType: 'admin',
            readAt: null,
          },
          data: { readAt: new Date() },
        }),
      ]);
    }

    // Re-fetch messages with updated readAt
    const freshMessages = conversation.unreadByUser > 0
      ? (await prisma.chatMessage.findMany({
          where: { conversationId: conversation.id },
          orderBy: { createdAt: 'asc' },
        }))
      : conversation.messages;

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        status: conversation.status,
        unreadByUser: 0,
        lastMessageAt: conversation.lastMessageAt,
      },
      messages: freshMessages.map((m) => ({
        id: m.id,
        senderType: m.senderType,
        content: m.content,
        createdAt: m.createdAt,
        readAt: m.readAt,
      })),
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Chat GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch chat' }, { status: 500 });
  }
}

// POST /api/chat - Send a message
export async function POST(request: Request) {
  try {
    const currentUser = await requireAuth();
    const body = await request.json();

    const validation = sendMessageSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { content, autoMessage } = validation.data;

    let conversation = await prisma.chatConversation.findUnique({
      where: { userId: currentUser.userId },
    });

    const isFirstMessage = !conversation;

    if (!conversation) {
      conversation = await prisma.chatConversation.create({
        data: {
          userId: currentUser.userId,
          lastMessageAt: new Date(),
          unreadByAdmin: 1,
        },
      });

      // Persist the auto-message from Jonathan as the first message in the conversation
      if (autoMessage) {
        await prisma.chatMessage.create({
          data: {
            conversationId: conversation.id,
            senderType: 'admin',
            content: autoMessage,
          },
        });
      }
    } else {
      await prisma.chatConversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: new Date(),
          unreadByAdmin: { increment: 1 },
        },
      });
    }

    const message = await prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        senderType: 'user',
        content,
      },
    });

    // Zapier webhook on first message (async, non-blocking)
    if (isFirstMessage) {
      (async () => {
        try {
          const user = await prisma.user.findUnique({
            where: { id: currentUser.userId },
            select: { firstName: true, lastName: true, email: true, phone: true },
          });
          const org = await prisma.organization.findFirst({
            where: { userId: currentUser.userId },
            select: { name: true, website: true, email: true, phoneNumber: true },
          });
          await fetch(ZAPIER_CHAT_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'new_chat_message',
              user_name: [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Unknown',
              user_email: user?.email || currentUser.email,
              user_phone: user?.phone || null,
              business_name: org?.name || null,
              business_website: org?.website || null,
              business_email: org?.email || null,
              business_phone: org?.phoneNumber || null,
              message: content,
              timestamp: new Date().toISOString(),
            }),
          });
        } catch (err) {
          console.error('Zapier chat webhook error:', err);
        }
      })();
    }

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        senderType: message.senderType,
        content: message.content,
        createdAt: message.createdAt,
        readAt: message.readAt,
      },
    });
  } catch (error) {
    if ((error as Error).message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Chat POST error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

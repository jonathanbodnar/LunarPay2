import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { sendSMS } from '@/lib/sms';
import { z } from 'zod';

const sendSMSSchema = z.object({
  to: z.string(),
  message: z.string().min(1).max(1600),
});

export async function POST(request: Request) {
  try {
    const currentUser = await requireAuth();
    const body = await request.json();
    const validatedData = sendSMSSchema.parse(body);

    const result = await sendSMS({
      to: validatedData.to,
      message: validatedData.message,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send SMS' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Send SMS error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


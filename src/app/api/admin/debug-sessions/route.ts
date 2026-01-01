import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// TEMPORARY DEBUG ENDPOINT - DELETE AFTER USE
export async function GET() {
  try {
    // Check if customer_sessions table exists and its structure
    const tableCheck = await prisma.$queryRaw<Array<{
      table_name: string;
      column_name: string;
      data_type: string;
    }>>`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'customer_sessions'
      ORDER BY ordinal_position
    `;

    // Try to count sessions
    let sessionCount = 0;
    let sessionError = null;
    try {
      const countResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count FROM customer_sessions
      `;
      sessionCount = Number(countResult[0]?.count || 0);
    } catch (e) {
      sessionError = String(e);
    }

    // Check if gen_random_uuid() works
    let uuidTest = null;
    let uuidError = null;
    try {
      const uuidResult = await prisma.$queryRaw<Array<{ uuid: string }>>`
        SELECT gen_random_uuid() as uuid
      `;
      uuidTest = uuidResult[0]?.uuid;
    } catch (e) {
      uuidError = String(e);
    }

    return NextResponse.json({
      tableExists: tableCheck.length > 0,
      columns: tableCheck,
      sessionCount,
      sessionError,
      uuidTest,
      uuidError,
    });
  } catch (error) {
    console.error('Debug sessions error:', error);
    return NextResponse.json(
      { error: 'Debug failed', details: String(error) },
      { status: 500 }
    );
  }
}


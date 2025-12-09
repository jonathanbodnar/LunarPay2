import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Test database connection and run schema sync
export async function GET(request: Request) {
  const results = {
    connection: 'unknown',
    databaseUrl: '',
    canQuery: false,
    canWrite: false,
    tablesExist: false,
    error: null as string | null,
  };

  try {
    // Get DATABASE_URL (sanitized)
    const dbUrl = process.env.DATABASE_URL || '';
    results.databaseUrl = dbUrl.replace(/:[^:@]+@/, ':***@'); // Hide password

    // Test connection
    await prisma.$queryRaw`SELECT 1`;
    results.connection = 'success';
    results.canQuery = true;

    // Check if tables exist
    const tables: any = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      LIMIT 5
    `;
    
    results.tablesExist = tables.length > 0;
    results.canWrite = true;

    return NextResponse.json({
      success: true,
      results,
      tables: tables.map((t: any) => t.table_name),
    });
  } catch (error) {
    results.connection = 'failed';
    results.error = (error as Error).message;

    return NextResponse.json({
      success: false,
      results,
      error: (error as Error).message,
    }, { status: 500 });
  }
}


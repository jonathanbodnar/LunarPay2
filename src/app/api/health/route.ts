import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Health check endpoint for Railway
 */
export async function GET() {
  try {
    let dbStatus = 'unknown';
    
    // Test database connection (non-blocking)
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
    } catch (dbError) {
      dbStatus = 'disconnected';
      console.warn('Database health check failed:', (dbError as Error).message);
    }

    // Return healthy even if DB is down (for Railway healthcheck)
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'lunarpay2',
      database: dbStatus,
      version: '1.0.0',
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: (error as Error).message,
      },
      { status: 503 }
    );
  }
}


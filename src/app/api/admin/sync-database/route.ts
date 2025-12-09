import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

// ADMIN ENDPOINT - Run database schema sync
// This is safer than running during build
export async function POST(request: Request) {
  try {
    const { adminSecret } = await request.json();

    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Running prisma db push...');
    
    // Run prisma db push
    const output = execSync('npx prisma db push --accept-data-loss --skip-generate', {
      encoding: 'utf8',
      cwd: process.cwd(),
    });

    console.log('Database sync output:', output);

    return NextResponse.json({
      success: true,
      message: 'Database schema synced successfully',
      output,
    });
  } catch (error) {
    console.error('Database sync error:', error);
    return NextResponse.json(
      { error: 'Database sync failed', message: (error as Error).message },
      { status: 500 }
    );
  }
}



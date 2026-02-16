import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/public/fomo
 * Returns randomized business names for the FOMO social proof widget.
 * Public endpoint — no auth required.
 */
export async function GET() {
  try {
    const organizations = await prisma.organization.findMany({
      where: {
        name: { not: '' },
        restricted: { not: true },
      },
      select: { name: true },
    });

    // Filter out generic/test names
    const skipNames = ['my organization', 'test', 'demo', 'example'];
    const names = organizations
      .map((o) => o.name?.trim())
      .filter((name): name is string =>
        !!name && !skipNames.some((s) => name.toLowerCase().includes(s))
      );

    // Shuffle
    for (let i = names.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [names[i], names[j]] = [names[j], names[i]];
    }

    const response = NextResponse.json({ names });
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Cache-Control', 'public, max-age=300');
    return response;
  } catch (error) {
    console.error('[FOMO] Error fetching names:', error);
    return NextResponse.json({ names: [] });
  }
}

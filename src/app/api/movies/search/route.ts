import { NextRequest, NextResponse } from 'next/server';
import { tmdb } from '@/lib/tmdb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q') || '';
  try {
    const movies = await tmdb.searchMovies(query);
    return NextResponse.json({ results: movies });
  } catch {
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';
import { tmdb } from '@/lib/tmdb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const movies = await tmdb.getTrending();
    return NextResponse.json({ results: movies });
  } catch {
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}


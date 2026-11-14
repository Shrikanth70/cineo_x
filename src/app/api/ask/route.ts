import { NextRequest, NextResponse } from 'next/server';
import { tmdb } from '@/lib/tmdb';
import { FIXTURE_MOVIES } from '@/data/fixtures';
import { Movie } from '@/types/movie';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = (body?.query || '').trim();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    // If Anthropic Key is present, call Claude
    if (anthropicKey) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8000);

        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 300,
            system: 'You are Cinéo AI, an expert cinema consultant. Recommend films with precision and warmth. Limit answers to 2 short paragraphs.',
            messages: [{ role: 'user', content: query }],
          }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (res.ok) {
          const data = await res.json();
          const answerText = data.content?.[0]?.text || '';
          return NextResponse.json({
            answer: answerText,
            recommendations: FIXTURE_MOVIES.slice(0, 3),
          });
        }
      } catch {
        // Fall back to template answer
      }
    }

    // Deterministic Rule & Semantic Template Matcher Fallback
    const lower = query.toLowerCase();
    let matchingMovies: Movie[] = [];
    let answerText = '';

    if (lower.includes('horror') || lower.includes('cabin') || lower.includes('until dawn') || lower.includes('scary')) {
      matchingMovies = [
        FIXTURE_MOVIES.find((m) => m.id === 101)!,
        FIXTURE_MOVIES.find((m) => m.id === 102)!,
        FIXTURE_MOVIES.find((m) => m.id === 112)!,
      ];
      answerText =
        'For high-tension isolation and psychological dread, Until Dawn (2025) and The Cabin in the Woods (2012) deliver intense group survival dilemmas where split-second choices determine who lives.';
    } else if (lower.includes('mind') || lower.includes('sci-fi') || lower.includes('inception') || lower.includes('twist')) {
      matchingMovies = [
        FIXTURE_MOVIES.find((m) => m.id === 103)!,
        FIXTURE_MOVIES.find((m) => m.id === 104)!,
        FIXTURE_MOVIES.find((m) => m.id === 106)!,
      ];
      answerText =
        'If you want a mind-bending experience that rewards repeated viewings, Inception (2010) and Interstellar (2014) are modern high-water marks of metaphysical speculation and emotional resonance.';
    } else if (lower.includes('action') || lower.includes('epic') || lower.includes('dune') || lower.includes('rrr')) {
      matchingMovies = [
        FIXTURE_MOVIES.find((m) => m.id === 105)!,
        FIXTURE_MOVIES.find((m) => m.id === 108)!,
        FIXTURE_MOVIES.find((m) => m.id === 111)!,
      ];
      answerText =
        'For kinetic spectacle and breathtaking cinematic scale, Dune: Part Two (2024) and RRR (2022) provide peerless visual power and visceral emotional stakes.';
    } else {
      matchingMovies = FIXTURE_MOVIES.slice(0, 3);
      answerText = `Based on your interest in "${query}", we recommend starting with these acclaimed titles that feature compelling storytelling, stellar performances, and rich world-building.`;
    }

    return NextResponse.json({
      answer: answerText,
      recommendations: matchingMovies,
    });
  } catch {
    return NextResponse.json(
      {
        answer: 'Here are our top recommended cinema picks for your evening.',
        recommendations: FIXTURE_MOVIES.slice(0, 3),
      },
      { status: 200 }
    );
  }
}


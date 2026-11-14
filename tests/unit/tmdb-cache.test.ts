import { describe, it, expect } from 'vitest';
import { tmdb } from '../../src/lib/tmdb';

describe('TMDB Client and Demo Mode Fallback', () => {
  it('returns bundled movie fixtures when no API keys are configured', async () => {
    const trending = await tmdb.getTrending();
    expect(trending.length).toBeGreaterThan(0);
    expect(trending[0]).toHaveProperty('title');
    expect(trending[0]).toHaveProperty('voteAverage');
  });

  it('retrieves detailed similar movie dossier for Until Dawn', async () => {
    const similar = await tmdb.getSimilar('101-until-dawn');
    expect(similar.seedMovie.title).toBe('Until Dawn');
    expect(similar.rankedMatches.length).toBeGreaterThanOrEqual(3);
    expect(similar.highestRatedPick).toBeDefined();
    expect(similar.newestPick).toBeDefined();
  });

  it('searches movies locally in demo mode without errors', async () => {
    const results = await tmdb.searchMovies('inception');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toBe('Inception');
  });
});


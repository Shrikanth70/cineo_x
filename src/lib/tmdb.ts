import { Movie, TVShow, SimilarMovieCollection } from '@/types/movie';
import { FIXTURE_MOVIES, FIXTURE_TV_SHOWS, getSimilarMoviesFor } from '@/data/fixtures';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

async function fetchWithTimeout(url: string, headers: HeadersInit = {}, timeoutMs = 4000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers,
      signal: controller.signal,
      next: { revalidate: 600 },
    });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

export class TmdbClient {
  private apiKey: string | undefined;
  private readToken: string | undefined;
  private baseUrl = 'https://api.themoviedb.org/3';

  constructor() {
    this.apiKey = process.env.TMDB_API_KEY;
    this.readToken = process.env.TMDB_API_READ_ACCESS_TOKEN;
  }

  private hasAuth(): boolean {
    return Boolean(this.apiKey || this.readToken);
  }

  private getHeaders(): HeadersInit {
    if (this.readToken) {
      return {
        Authorization: `Bearer ${this.readToken}`,
        'Content-Type': 'application/json',
      };
    }
    return {
      'Content-Type': 'application/json',
    };
  }

  private getUrl(endpoint: string, params: Record<string, string> = {}): string {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (this.apiKey && !this.readToken) {
      url.searchParams.set('api_key', this.apiKey);
    }
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
    return url.toString();
  }

  public async getTrending(): Promise<Movie[]> {
    const cacheKey = 'tmdb:trending';
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data as Movie[];
    }

    if (!this.hasAuth()) {
      return FIXTURE_MOVIES;
    }

    try {
      const res = await fetchWithTimeout(this.getUrl('/trending/movie/week'), this.getHeaders());
      if (!res.ok) throw new Error(`TMDB error ${res.status}`);
      const data = await res.json();
      const results: Movie[] = (data.results || []).slice(0, 15).map((item: any) => ({
        id: item.id,
        title: item.title,
        overview: item.overview || '',
        releaseYear: item.release_date ? parseInt(item.release_date.slice(0, 4), 10) : 2024,
        releaseDate: item.release_date,
        runtimeMinutes: 110,
        genres: ['Cinema'],
        voteAverage: Math.round((item.vote_average || 7.5) * 10) / 10,
        voteCount: item.vote_count || 100,
        posterUrl: item.poster_path
          ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
          : FIXTURE_MOVIES[0].posterUrl,
        backdropUrl: item.backdrop_path
          ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`
          : FIXTURE_MOVIES[0].backdropUrl,
        language: item.original_language || 'English',
      }));

      cache.set(cacheKey, { data: results, expiresAt: Date.now() + CACHE_TTL_MS });
      return results.length > 0 ? results : FIXTURE_MOVIES;
    } catch {
      return FIXTURE_MOVIES;
    }
  }

  public async getTopRated(): Promise<Movie[]> {
    const cacheKey = 'tmdb:top_rated';
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data as Movie[];
    }

    if (!this.hasAuth()) {
      return FIXTURE_MOVIES.slice().sort((a, b) => b.voteAverage - a.voteAverage);
    }

    try {
      const res = await fetchWithTimeout(this.getUrl('/movie/top_rated'), this.getHeaders());
      if (!res.ok) throw new Error(`TMDB error ${res.status}`);
      const data = await res.json();
      const results: Movie[] = (data.results || []).slice(0, 15).map((item: any) => ({
        id: item.id,
        title: item.title,
        overview: item.overview || '',
        releaseYear: item.release_date ? parseInt(item.release_date.slice(0, 4), 10) : 2024,
        releaseDate: item.release_date,
        runtimeMinutes: 125,
        genres: ['Drama', 'Masterpiece'],
        voteAverage: Math.round((item.vote_average || 8.2) * 10) / 10,
        voteCount: item.vote_count || 1000,
        posterUrl: item.poster_path
          ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
          : FIXTURE_MOVIES[1].posterUrl,
        backdropUrl: item.backdrop_path
          ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`
          : FIXTURE_MOVIES[1].backdropUrl,
        language: item.original_language || 'English',
      }));

      cache.set(cacheKey, { data: results, expiresAt: Date.now() + CACHE_TTL_MS });
      return results.length > 0 ? results : FIXTURE_MOVIES;
    } catch {
      return FIXTURE_MOVIES.slice().sort((a, b) => b.voteAverage - a.voteAverage);
    }
  }

  public async getMovieById(id: number): Promise<Movie | null> {
    const fixture = FIXTURE_MOVIES.find((m) => m.id === id);
    if (fixture) return fixture;

    if (!this.hasAuth()) {
      return FIXTURE_MOVIES[0];
    }

    const cacheKey = `tmdb:movie:${id}`;
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data as Movie;
    }

    try {
      const res = await fetchWithTimeout(this.getUrl(`/movie/${id}`), this.getHeaders());
      if (!res.ok) return FIXTURE_MOVIES[0];
      const item = await res.json();
      const movie: Movie = {
        id: item.id,
        title: item.title,
        tagline: item.tagline,
        overview: item.overview,
        releaseYear: item.release_date ? parseInt(item.release_date.slice(0, 4), 10) : 2024,
        releaseDate: item.release_date,
        runtimeMinutes: item.runtime || 115,
        genres: (item.genres || []).map((g: any) => g.name),
        voteAverage: Math.round((item.vote_average || 7.5) * 10) / 10,
        voteCount: item.vote_count || 100,
        posterUrl: item.poster_path
          ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
          : FIXTURE_MOVIES[0].posterUrl,
        backdropUrl: item.backdrop_path
          ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`
          : FIXTURE_MOVIES[0].backdropUrl,
        language: item.original_language || 'English',
      };
      cache.set(cacheKey, { data: movie, expiresAt: Date.now() + CACHE_TTL_MS });
      return movie;
    } catch {
      return FIXTURE_MOVIES[0];
    }
  }

  public async searchMovies(query: string): Promise<Movie[]> {
    if (!query.trim()) return [];

    const lower = query.toLowerCase();
    const localMatches = FIXTURE_MOVIES.filter(
      (m) =>
        m.title.toLowerCase().includes(lower) ||
        m.overview.toLowerCase().includes(lower) ||
        m.genres.some((g) => g.toLowerCase().includes(lower))
    );

    if (!this.hasAuth()) {
      return localMatches;
    }

    try {
      const res = await fetchWithTimeout(this.getUrl('/search/movie', { query }), this.getHeaders());
      if (!res.ok) return localMatches;
      const data = await res.json();
      const results: Movie[] = (data.results || []).slice(0, 10).map((item: any) => ({
        id: item.id,
        title: item.title,
        overview: item.overview || '',
        releaseYear: item.release_date ? parseInt(item.release_date.slice(0, 4), 10) : 2024,
        releaseDate: item.release_date,
        runtimeMinutes: 115,
        genres: ['Movie'],
        voteAverage: Math.round((item.vote_average || 7.0) * 10) / 10,
        voteCount: item.vote_count || 50,
        posterUrl: item.poster_path
          ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
          : FIXTURE_MOVIES[0].posterUrl,
        backdropUrl: item.backdrop_path
          ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`
          : FIXTURE_MOVIES[0].backdropUrl,
        language: item.original_language || 'English',
      }));

      return results.length > 0 ? results : localMatches;
    } catch {
      return localMatches;
    }
  }

  public async getSimilar(slugOrId: string): Promise<SimilarMovieCollection> {
    return getSimilarMoviesFor(slugOrId);
  }

  public async getTVShows(): Promise<TVShow[]> {
    return FIXTURE_TV_SHOWS;
  }
}

export const tmdb = new TmdbClient();


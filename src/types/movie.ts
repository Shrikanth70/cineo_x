export interface Movie {
  id: number;
  title: string;
  originalTitle?: string;
  tagline?: string;
  overview: string;
  releaseYear: number;
  releaseDate?: string;
  runtimeMinutes: number;
  genres: string[];
  voteAverage: number;
  voteCount: number;
  posterUrl: string;
  backdropUrl: string;
  trailerYoutubeId?: string;
  language: string;
  certification?: string;
  providers?: {
    stream: string[];
    rent?: string[];
    buy?: string[];
  };
  whyItMatches?: string;
  matchScore?: number;
}

export interface TVShow {
  id: number;
  title: string;
  overview: string;
  firstAirYear: number;
  seasonsCount: number;
  episodesCount: number;
  genres: string[];
  voteAverage: number;
  posterUrl: string;
  backdropUrl: string;
  language: string;
  status: string;
}

export interface FranchiseEntry {
  movieId: number;
  title: string;
  releaseYear: number;
  runtimeMinutes: number;
  releaseOrderIndex: number;
  chronologicalOrderIndex: number;
  postCreditScenes: number;
  posterUrl: string;
  notes?: string;
}

export interface Franchise {
  id: string;
  slug: string;
  title: string;
  description: string;
  posterStrip: string[];
  filmsOutCount: number;
  moreComing: boolean;
  entries: FranchiseEntry[];
}

export interface SimilarMovieCollection {
  seedMovie: Movie;
  highestRatedPick: Movie;
  newestPick: Movie;
  rankedMatches: Movie[];
}

export interface MoodCategory {
  id: string;
  title: string;
  emoji: string;
  description: string;
  tagline: string;
  sampleMovieIds: number[];
}

export interface CuratedList {
  id: string;
  slug: string;
  title: string;
  description: string;
  curator: string;
  itemCount: number;
  coverPoster: string;
  movieIds: number[];
}

export interface MovieMapNode {
  id: string;
  title: string;
  year: number;
  genre: string;
  rating: number;
  posterUrl: string;
  x?: number;
  y?: number;
  cluster: string;
}

export interface MovieMapLink {
  source: string;
  target: string;
  relation: string;
}


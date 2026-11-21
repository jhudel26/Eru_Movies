/**
 * Type declarations for Electron Preload API (eruAPI)
 * Exposed via contextBridge in electron/preload.js
 */

interface MediaItem {
  id: string;
  sourceId: string;
  source: string;
  title: string;
  type: 'movie' | 'tv';
  slug: string;
  tmdbId: string;
  imdbId: string | null;
  poster: string | null;
  backdrop: string | null;
  rating: string;
  year: string;
  releaseDate: string | null;
  quality: string;
  genres: string[];
  overview: string;
  seasonNum?: number;
  episodeNum?: number;
  seasons?: number[];
  runtime?: string;
  tagline?: string;
  status?: string;
  cast?: Array<{ name: string; character: string; profile: string | null }>;
  director?: string | null;
  trailerKey?: string | null;
  trailerUrl?: string | null;
  firstAirDate?: string | null;
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  isHero?: boolean;
}

interface HomeData {
  heroes: MediaItem[];
  items: MediaItem[];
}

interface Episode {
  number: number;
  title: string;
  thumbnail: string | null;
  overview: string;
  airDate: string;
  rating: string | null;
  runtime: string | null;
}

interface Server {
  name: string;
  url: string;
  isDirect?: boolean;
  provider: string;
}

interface EpisodeEmbed {
  embedUrl: string | null;
  servers: Server[];
}

interface DetailResponse extends MediaItem {
  servers: Server[];
  seasons?: number[];
  runtime?: string | null;
  imdbId: string | null;
}

interface EruAPI {
  // Window controls
  minimize(): Promise<void>;
  maximize(): Promise<boolean>;
  close(): Promise<void>;
  isMaximized(): Promise<boolean>;
  onMaximizeChange(callback: (isMax: boolean) => void): () => void;

  // Catalog APIs
  getHome(): Promise<HomeData>;
  getMovies(): Promise<MediaItem[]>;
  getTvShows(): Promise<MediaItem[]>;
  search(query: string): Promise<MediaItem[]>;
  getDetail(type: string, slug: string, source: string, cardTitle?: string | null): Promise<DetailResponse | null>;
  getEpisodes(slug: string, seasonNum: number, source: string): Promise<Episode[]>;
  getEpisodeEmbed(slug: string, seasonNum: number, episodeNum: number, tmdbId: string, imdbId: string, source: string): Promise<EpisodeEmbed>;

  // Shell
  openExternal(url: string): Promise<void>;
}

declare global {
  interface Window {
    eruAPI: EruAPI;
  }
}
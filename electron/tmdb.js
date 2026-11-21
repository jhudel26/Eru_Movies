const TMDB_KEY = process.env.TMDB_API_KEY || '';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p';

const POSTER_SM = `${IMAGE_BASE}/w342`;
const POSTER_MD = `${IMAGE_BASE}/w500`;
const BACKDROP_LG = `${IMAGE_BASE}/original`;
const PROFILE_MD = `${IMAGE_BASE}/w185`;
const STILL_MD = `${IMAGE_BASE}/w500`;

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const { tmdbLogger } = require('./logger');

// Genre ID to Name Dictionary
const GENRE_MAP = {
  // Movie Genres
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Sci-Fi',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
  // TV Genres
  10759: 'Action & Adventure',
  10762: 'Kids',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics'
};

// In-memory TTL Cache with proper LRU eviction and request deduplication
class MemoryCache {
  constructor(maxEntries = 300) {
    this.store = new Map(); // key -> { data, timestamp, accessTime }
    this.pending = new Map(); // key -> Promise (for request deduplication)
    this.maxEntries = maxEntries;
  }

  get(key, ttlMs = 3600000) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > ttlMs) {
      this.store.delete(key);
      return null;
    }
    // Update access time for LRU
    entry.accessTime = Date.now();
    return entry.data;
  }

  set(key, data) {
    // Evict LRU if at capacity
    if (this.store.size >= this.maxEntries) {
      let lruKey = null;
      let lruTime = Infinity;
      for (const [k, v] of this.store.entries()) {
        if (v.accessTime < lruTime) {
          lruTime = v.accessTime;
          lruKey = k;
        }
      }
      if (lruKey) this.store.delete(lruKey);
    }
    this.store.set(key, { data, timestamp: Date.now(), accessTime: Date.now() });
  }

  // Request deduplication: returns existing promise or creates new one
  async fetchOrSet(key, fetcher, ttlMs = 3600000) {
    const cached = this.get(key, ttlMs);
    if (cached !== null) return cached;

    // Return existing in-flight request
    if (this.pending.has(key)) {
      return this.pending.get(key);
    }

    // Create new request
    const promise = fetcher().then(data => {
      this.set(key, data);
      return data;
    }).finally(() => {
      this.pending.delete(key);
    });

    this.pending.set(key, promise);
    return promise;
  }

  clear() {
    this.store.clear();
    this.pending.clear();
  }
}

const cache = new MemoryCache(300);

async function fetchJson(endpoint, params = {}) {
  const url = new URL(`${TMDB_BASE}${endpoint}`);
  url.searchParams.set('api_key', TMDB_KEY);
  url.searchParams.set('language', 'en-US');

  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) {
      url.searchParams.set(k, String(v));
    }
  }

  const urlStr = url.toString();
  const fetchFn = (typeof globalThis.fetch === 'function') ? globalThis.fetch : fetch;

  try {
    tmdbLogger.debug('TMDB request', { endpoint, params });
    const res = await fetchFn(urlStr, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) {
      tmdbLogger.warn('TMDB HTTP error', { endpoint, status: res.status });
      return null;
    }
    return await res.json();
  } catch (err) {
    tmdbLogger.error('TMDB fetch error', { endpoint, error: err.message });
    return null;
  }
}

function resolveGenreNames(genreIds = [], genres = []) {
  if (genres && genres.length > 0) {
    return genres.map(g => g.name || g).filter(Boolean);
  }
  if (genreIds && genreIds.length > 0) {
    return genreIds.map(id => GENRE_MAP[id]).filter(Boolean);
  }
  return ['General'];
}

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

function isAvailableItem(item) {
  if (!item) return false;
  const today = getTodayString();
  if (item.type === 'movie') {
    if (!item.releaseDate) return false;
    // Exclude future unreleased releases
    if (item.releaseDate > today) return false;
    // Exclude unreleased placeholders with 0 votes
    if (item.voteCount === 0 && (item.popularity || 0) < 15) return false;
    return true;
  }
  if (item.type === 'tv') {
    if (!item.firstAirDate) return false;
    // Exclude future un-aired TV series
    if (item.firstAirDate > today) return false;
    return true;
  }
  return false;
}

function normalizeMovie(m) {
  if (!m) return null;
  const year = m.release_date ? m.release_date.split('-')[0] : null;
  const rating = m.vote_average ? Number(m.vote_average).toFixed(1) : 'N/A';
  return {
    id: `tmdb-movie-${m.id}`,
    sourceId: String(m.id),
    source: 'tmdb',
    title: m.title || m.original_title || 'Unknown Title',
    originalTitle: m.original_title,
    type: 'movie',
    slug: String(m.id),
    tmdbId: String(m.id),
    imdbId: m.imdb_id || m.external_ids?.imdb_id || null,
    poster: m.poster_path ? `${POSTER_MD}${m.poster_path}` : null,
    posterSm: m.poster_path ? `${POSTER_SM}${m.poster_path}` : null,
    backdrop: m.backdrop_path ? `${BACKDROP_LG}${m.backdrop_path}` : null,
    rating,
    year: year || '',
    releaseDate: m.release_date || null,
    quality: '4K',
    genres: resolveGenreNames(m.genre_ids, m.genres),
    overview: m.overview || '',
    popularity: m.popularity || 0,
    voteCount: m.vote_count || 0
  };
}

function normalizeTv(t) {
  if (!t) return null;
  const year = t.first_air_date ? t.first_air_date.split('-')[0] : null;
  const rating = t.vote_average ? Number(t.vote_average).toFixed(1) : 'N/A';
  return {
    id: `tmdb-tv-${t.id}`,
    sourceId: String(t.id),
    source: 'tmdb',
    title: t.name || t.original_name || 'Unknown Show',
    originalTitle: t.original_name,
    type: 'tv',
    slug: String(t.id),
    tmdbId: String(t.id),
    imdbId: t.imdb_id || t.external_ids?.imdb_id || null,
    poster: t.poster_path ? `${POSTER_MD}${t.poster_path}` : null,
    posterSm: t.poster_path ? `${POSTER_SM}${t.poster_path}` : null,
    backdrop: t.backdrop_path ? `${BACKDROP_LG}${t.backdrop_path}` : null,
    rating,
    year: year || '',
    firstAirDate: t.first_air_date || null,
    quality: 'HD',
    genres: resolveGenreNames(t.genre_ids, t.genres),
    overview: t.overview || '',
    popularity: t.popularity || 0,
    voteCount: t.vote_count || 0,
    numberOfSeasons: t.number_of_seasons || 1,
    numberOfEpisodes: t.number_of_episodes || null
  };
}

const TMDB = {
  async getTrendingMovies(page = 1) {
    const key = `trending_movies_${page}`;
    return cache.fetchOrSet(key, async () => {
      const data = await fetchJson('/trending/movie/week', { page });
      const results = (data?.results || [])
        .map(normalizeMovie)
        .filter(Boolean)
        .filter(isAvailableItem);
      return results;
    }, 3600000);
  },

  async getPopularMovies(page = 1) {
    const key = `popular_movies_digital_${page}`;
    return cache.fetchOrSet(key, async () => {
      const today = getTodayString();
      // Prioritize confirmed digital or physical online releases
      let data = await fetchJson('/discover/movie', {
        page,
        sort_by: 'popularity.desc',
        'release_date.lte': today,
        'with_release_type': '4|5',
        'vote_count.gte': 10
      });

      let results = (data?.results || [])
        .map(normalizeMovie)
        .filter(Boolean)
        .filter(isAvailableItem);

      // If digital discover is empty, fallback to released movies with votes up to today
      if (results.length === 0) {
        data = await fetchJson('/discover/movie', {
          page,
          sort_by: 'popularity.desc',
          'release_date.lte': today,
          'vote_count.gte': 15
        });
        results = (data?.results || [])
          .map(normalizeMovie)
          .filter(Boolean)
          .filter(isAvailableItem);
      }
      return results;
    }, 3600000);
  },

  async getTrendingTv(page = 1) {
    const key = `trending_tv_${page}`;
    const cached = cache.get(key, 3600000);
    if (cached) return cached;

    const data = await fetchJson('/trending/tv/week', { page });
    const results = (data?.results || [])
      .map(normalizeTv)
      .filter(Boolean)
      .filter(isAvailableItem);

    if (results.length > 0) cache.set(key, results);
    return results;
  },

  async getPopularTv(page = 1) {
    const key = `popular_tv_aired_${page}`;
    return cache.fetchOrSet(key, async () => {
      const today = getTodayString();
      const data = await fetchJson('/discover/tv', {
        page,
        sort_by: 'popularity.desc',
        'first_air_date.lte': today,
        'vote_count.gte': 10
      });

      const results = (data?.results || [])
        .map(normalizeTv)
        .filter(Boolean)
        .filter(isAvailableItem);
      return results;
    }, 3600000);
  },

  async getHomeData() {
    const key = 'home_data';
    return cache.fetchOrSet(key, async () => {
      const [trendingMovies, popularMovies, trendingTv, popularTv] = await Promise.all([
        this.getTrendingMovies(1),
        this.getPopularMovies(1),
        this.getTrendingTv(1),
        this.getPopularTv(1)
      ]);

      // Build Hero Banner items (top trending movies with backdrop + top trending tv)
      const heroes = [];
      const heroMovies = trendingMovies.filter(m => m.backdrop && m.poster).slice(0, 5);
      const heroTv = trendingTv.filter(t => t.backdrop && t.poster).slice(0, 3);
      heroes.push(...heroMovies, ...heroTv);

      // Merge and deduplicate items
      const seen = new Set();
      const items = [];
      for (const item of [...trendingMovies, ...trendingTv, ...popularMovies, ...popularTv]) {
        if (item && !seen.has(item.id)) {
          seen.add(item.id);
          items.push(item);
        }
      }

      const payload = {
        heroes: heroes.map(h => ({ ...h, isHero: true })),
        items
      };

      return payload;
    }, 1800000); // 30 min
  },

  async getMovies() {
    const [trending, popular] = await Promise.all([
      this.getTrendingMovies(1),
      this.getPopularMovies(1)
    ]);
    const seen = new Set();
    const items = [];
    for (const item of [...trending, ...popular]) {
      if (item && !seen.has(item.id)) {
        seen.add(item.id);
        items.push(item);
      }
    }
    return items;
  },

  async getTvShows() {
    const [trending, popular] = await Promise.all([
      this.getTrendingTv(1),
      this.getPopularTv(1)
    ]);
    const seen = new Set();
    const items = [];
    for (const item of [...trending, ...popular]) {
      if (item && !seen.has(item.id)) {
        seen.add(item.id);
        items.push(item);
      }
    }
    return items;
  },

  async search(query) {
    if (!query || !query.trim()) return [];
    const q = query.trim();
    const key = `search_${q.toLowerCase()}`;
    return cache.fetchOrSet(key, async () => {
      const data = await fetchJson('/search/multi', {
        query: q,
        include_adult: 'false'
      });

      const results = [];
      for (const item of (data?.results || [])) {
        if (item.media_type === 'movie') {
          const norm = normalizeMovie(item);
          if (norm && isAvailableItem(norm)) results.push(norm);
        } else if (item.media_type === 'tv') {
          const norm = normalizeTv(item);
          if (norm && isAvailableItem(norm)) results.push(norm);
        }
      }

      // Sort by popularity
      results.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
      return results;
    }, 900000); // 15 min
  },

  async getMovieDetail(movieId) {
    const key = `movie_detail_${movieId}`;
    return cache.fetchOrSet(key, async () => {
      const data = await fetchJson(`/movie/${movieId}`, {
        append_to_response: 'credits,images,videos,external_ids,recommendations,similar'
      });
      if (!data) return null;

      const base = normalizeMovie(data);
      base.imdbId = data.imdb_id || data.external_ids?.imdb_id || null;
      base.tagline = data.tagline || '';
      base.runtime = data.runtime ? `${data.runtime} min` : null;
      base.status = data.status || '';

      // Credits
      const credits = data.credits || {};
      const cast = (credits.cast || []).slice(0, 15).map(p => ({
        name: p.name,
        character: p.character,
        profile: p.profile_path ? `${PROFILE_MD}${p.profile_path}` : null
      }));
      const director = credits.crew?.find(p => p.job === 'Director')?.name || null;

      // Videos / Trailers
      const videos = data.videos?.results || [];
      const trailer = videos.find(v => v.site === 'YouTube' && v.type === 'Trailer' && v.official)
        || videos.find(v => v.site === 'YouTube' && v.type === 'Trailer')
        || videos.find(v => v.site === 'YouTube');

      base.cast = cast;
      base.director = director;
      base.trailerKey = trailer ? trailer.key : null;
      base.trailerUrl = trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;

      return base;
    }, 43200000); // 12 hours
  },

  async getTvDetail(tvId) {
    const key = `tv_detail_${tvId}`;
    return cache.fetchOrSet(key, async () => {
      const data = await fetchJson(`/tv/${tvId}`, {
        append_to_response: 'credits,images,videos,external_ids,recommendations,similar'
      });
      if (!data) return null;

      const base = normalizeTv(data);
      base.imdbId = data.imdb_id || data.external_ids?.imdb_id || null;
      base.tagline = data.tagline || '';
      base.status = data.status || '';

      // Seasons array [1, 2, 3, ...]
      const seasonList = [];
      if (data.seasons && data.seasons.length > 0) {
        for (const s of data.seasons) {
          if (s.season_number > 0) seasonList.push(s.season_number);
        }
      }
      if (seasonList.length === 0) {
        const numSeasons = data.number_of_seasons || 1;
        for (let i = 1; i <= numSeasons; i++) seasonList.push(i);
      }
      base.seasons = seasonList;
      base.numberOfSeasons = seasonList.length;

      // Credits
      const credits = data.credits || {};
      const cast = (credits.cast || []).slice(0, 15).map(p => ({
        name: p.name,
        character: p.character,
        profile: p.profile_path ? `${PROFILE_MD}${p.profile_path}` : null
      }));

      // Videos / Trailers
      const videos = data.videos?.results || [];
      const trailer = videos.find(v => v.site === 'YouTube' && v.type === 'Trailer' && v.official)
        || videos.find(v => v.site === 'YouTube' && v.type === 'Trailer')
        || videos.find(v => v.site === 'YouTube');

      base.cast = cast;
      base.trailerKey = trailer ? trailer.key : null;
      base.trailerUrl = trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;

      return base;
    }, 43200000); // 12 hours
  },

  async getSeasonEpisodes(tvId, seasonNumber = 1) {
    const key = `tv_episodes_${tvId}_s${seasonNumber}`;
    return cache.fetchOrSet(key, async () => {
      const data = await fetchJson(`/tv/${tvId}/season/${seasonNumber}`);
      if (!data?.episodes) return [];

      const episodes = data.episodes.map(ep => ({
        number: ep.episode_number,
        title: ep.name || `Episode ${ep.episode_number}`,
        thumbnail: ep.still_path ? `${STILL_MD}${ep.still_path}` : null,
        overview: ep.overview || '',
        airDate: ep.air_date || '',
        rating: ep.vote_average ? Number(ep.vote_average).toFixed(1) : null,
        runtime: ep.runtime ? `${ep.runtime} min` : null
      }));

      return episodes;
    }, 43200000);
  },

  // Resolve ID helper: accepts numeric ID, slug string, or title
  async resolveTmdbId(slug, type = 'movie', title = null) {
    if (!slug && !title) return null;
    const cleanId = String(slug || '').replace(/^tmdb-(?:movie|tv)-/, '').replace(/^rido-(?:tv-)?/, '');
    if (/^\d+$/.test(cleanId)) {
      return parseInt(cleanId, 10);
    }

    // Try search by title or slug
    const query = (title || slug || '').replace(/-/g, ' ').trim();
    if (!query) return null;

    const results = await this.search(query);
    const match = results.find(r => (type === 'tv' ? r.type === 'tv' : r.type === 'movie')) || results[0];
    if (match) {
      return parseInt(match.tmdbId, 10);
    }

    return null;
  }
};

module.exports = { TMDB };

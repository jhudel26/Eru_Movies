// Service layer interfacing with Electron Preload API with direct fallback

const TMDB_KEY = 'c1dd4a7d9aab18675dc3720ab5a99436';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const POSTER_MD = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_LG = 'https://image.tmdb.org/t/p/original';
const VIDY_BASE = 'https://www.vidy.st';
const VIDY_ACCENT = '?color=2DD4BF'; // ERU teal accent for Vidy player controls

const GENRE_MAP = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
  10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News', 10764: 'Reality',
  10765: 'Sci-Fi & Fantasy', 10766: 'Soap', 10767: 'Talk', 10768: 'War & Politics'
};

function getTodayString() {
  return new Date().toISOString().split('T')[0];
}

function isAvailableDirect(item) {
  if (!item) return false;
  const today = getTodayString();
  if (item.type === 'movie') {
    if (!item.releaseDate) return false;
    if (item.releaseDate > today) return false;
    return true;
  }
  if (item.type === 'tv') {
    if (!item.releaseDate) return false;
    if (item.releaseDate > today) return false;
    return true;
  }
  return false;
}

function normalizeDirect(item, type) {
  if (!item || item.media_type === 'person') return null;
  const isMovie = type === 'movie' || item.title !== undefined;
  const t = isMovie ? 'movie' : 'tv';
  const title = isMovie ? (item.title || item.original_title) : (item.name || item.original_name);
  const date = isMovie ? item.release_date : item.first_air_date;
  const genres = (item.genre_ids || []).map(id => GENRE_MAP[id]).filter(Boolean);
  return {
    id: `tmdb-${t}-${item.id}`,
    sourceId: String(item.id),
    source: 'tmdb',
    title: title || 'Unknown Title',
    type: t,
    slug: String(item.id),
    tmdbId: String(item.id),
    imdbId: item.imdb_id || null,
    poster: item.poster_path ? `${POSTER_MD}${item.poster_path}` : null,
    backdrop: item.backdrop_path ? `${BACKDROP_LG}${item.backdrop_path}` : null,
    rating: item.vote_average ? Number(item.vote_average).toFixed(1) : 'N/A',
    year: date ? date.split('-')[0] : '',
    releaseDate: date || null,
    quality: isMovie ? '4K' : 'HD',
    genres: genres.length > 0 ? genres : ['General'],
    overview: item.overview || ''
  };
}

async function directTmdbFetch(path, params = {}) {
  try {
    const url = new URL(`${TMDB_BASE}${path}`);
    url.searchParams.set('api_key', TMDB_KEY);
    url.searchParams.set('language', 'en-US');
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, String(v));
    }
    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Direct TMDB fetch error:', err);
    return null;
  }
}

export const ApiService = {
  get isElectron() {
    return typeof window !== 'undefined' && Boolean(window.eruAPI);
  },

  async getHome() {
    if (this.isElectron) {
      try {
        const res = await window.eruAPI.getHome();
        if (res && Array.isArray(res.items)) return res;
      } catch (e) {
        console.warn('eruAPI.getHome failed, using direct fallback:', e);
      }
    }

    // Direct fallback
    const [trending, popular] = await Promise.all([
      directTmdbFetch('/trending/all/week'),
      directTmdbFetch('/movie/popular')
    ]);

    const results = [
      ...(trending?.results || []).map(it => normalizeDirect(it, it.media_type)),
      ...(popular?.results || []).map(it => normalizeDirect(it, 'movie'))
    ].filter(Boolean);

    const seen = new Set();
    const items = [];
    for (const it of results) {
      if (!seen.has(it.id)) {
        seen.add(it.id);
        items.push(it);
      }
    }

    const heroes = items.filter(it => it.backdrop && it.poster).slice(0, 8);
    return {
      heroes: heroes.map(h => ({ ...h, isHero: true })),
      items
    };
  },

  async getMovies() {
    if (this.isElectron) {
      try {
        const res = await window.eruAPI.getMovies();
        if (Array.isArray(res)) return res;
      } catch (e) {
        console.warn('eruAPI.getMovies failed, using direct fallback:', e);
      }
    }

    const today = getTodayString();
    const data = await directTmdbFetch('/discover/movie', {
      sort_by: 'popularity.desc',
      'release_date.lte': today,
      'with_release_type': '4|5',
      'vote_count.gte': 10
    });
    return (data?.results || []).map(m => normalizeDirect(m, 'movie')).filter(Boolean).filter(isAvailableDirect);
  },

  async getTvShows() {
    if (this.isElectron) {
      try {
        const res = await window.eruAPI.getTvShows();
        if (Array.isArray(res)) return res;
      } catch (e) {
        console.warn('eruAPI.getTvShows failed, using direct fallback:', e);
      }
    }

    const today = getTodayString();
    const data = await directTmdbFetch('/discover/tv', {
      sort_by: 'popularity.desc',
      'first_air_date.lte': today,
      'vote_count.gte': 10
    });
    return (data?.results || []).map(t => normalizeDirect(t, 'tv')).filter(Boolean).filter(isAvailableDirect);
  },

  async search(query) {
    if (!query || !query.trim()) return [];
    if (this.isElectron) {
      try {
        const res = await window.eruAPI.search(query);
        if (Array.isArray(res)) return res;
      } catch (e) {
        console.warn('eruAPI.search failed, using direct fallback:', e);
      }
    }

    const data = await directTmdbFetch('/search/multi', { query: query.trim(), include_adult: 'false' });
    return (data?.results || [])
      .map(it => normalizeDirect(it, it.media_type))
      .filter(Boolean)
      .filter(isAvailableDirect);
  },

  async getDetail(type, slug, source, cardTitle = null) {
    if (this.isElectron) {
      try {
        const res = await window.eruAPI.getDetail(type, slug, source, cardTitle);
        if (res) return res;
      } catch (e) {
        console.warn('eruAPI.getDetail failed, using direct fallback:', e);
      }
    }

    // Direct TMDB fallback
    const cleanId = String(slug).replace(/^tmdb-(?:movie|tv)-/, '');
    const isTv = type === 'tv';
    const endpoint = isTv ? `/tv/${cleanId}` : `/movie/${cleanId}`;
    const data = await directTmdbFetch(endpoint, {
      append_to_response: 'credits,videos,external_ids'
    });
    if (!data) return null;

    const norm = normalizeDirect(data, type);
    const imdbId = data.imdb_id || data.external_ids?.imdb_id || null;
    norm.imdbId = imdbId;
    norm.runtime = data.runtime ? `${data.runtime} min` : null;

    // Vidy and failover servers
    norm.servers = [
      {
        name: 'Vidy.st Direct',
        url: isTv ? `${VIDY_BASE}/tv/${cleanId}/1/1${VIDY_ACCENT}` : `${VIDY_BASE}/movie/${cleanId}${VIDY_ACCENT}`,
        isDirect: true
      },
      {
        name: 'VidSrc Pro',
        url: isTv ? `https://vidsrc.cc/v2/embed/tv/${cleanId}/1/1` : `https://vidsrc.cc/v2/embed/movie/${cleanId}`
      },
      {
        name: 'SuperEmbed 4K',
        url: isTv ? `https://multiembed.mov/?video_id=${cleanId}&s=1&e=1&tmdb=1` : `https://multiembed.mov/?video_id=${cleanId}&tmdb=1`
      },
      {
        name: 'Cinezo HD',
        url: isTv ? `https://player.cinezo.live/embed/tv/${cleanId}/1/1` : `https://player.cinezo.live/embed/movie/${cleanId}`
      },
      {
        name: '2Embed',
        url: isTv ? `https://www.2embed.cc/embedtv/${cleanId}?s=1&e=1` : `https://www.2embed.cc/embed/${cleanId}`
      }
    ];

    if (isTv) {
      const numSeasons = data.number_of_seasons || 1;
      norm.seasons = Array.from({ length: numSeasons }, (_, i) => i + 1);
    }

    return norm;
  },

  async getEpisodes(slug, seasonNum, source) {
    if (this.isElectron) {
      try {
        const res = await window.eruAPI.getEpisodes(slug, seasonNum, source);
        if (Array.isArray(res)) return res;
      } catch (e) {
        console.warn('eruAPI.getEpisodes failed, using direct fallback:', e);
      }
    }

    const cleanId = String(slug).replace(/^tmdb-(?:movie|tv)-/, '');
    const data = await directTmdbFetch(`/tv/${cleanId}/season/${seasonNum}`);
    return (data?.episodes || []).map(ep => ({
      number: ep.episode_number,
      title: ep.name || `Episode ${ep.episode_number}`,
      thumbnail: ep.still_path ? `${POSTER_MD}${ep.still_path}` : null,
      overview: ep.overview || '',
      airDate: ep.air_date || '',
      rating: ep.vote_average ? Number(ep.vote_average).toFixed(1) : null
    }));
  },

  async getEpisodeEmbed(slug, seasonNum = 1, episodeNum = 1, tmdbId, imdbId, source) {
    if (this.isElectron) {
      try {
        const res = await window.eruAPI.getEpisodeEmbed(slug, seasonNum, episodeNum, tmdbId, imdbId, source);
        if (res && res.servers && res.servers.length > 0) return res;
      } catch (e) {
        console.warn('eruAPI.getEpisodeEmbed failed, using direct fallback:', e);
      }
    }

    const cleanId = String(tmdbId || slug).replace(/^tmdb-(?:movie|tv)-/, '');
    const servers = [
      {
        name: 'Vidy.st Direct',
        url: `${VIDY_BASE}/tv/${cleanId}/${seasonNum}/${episodeNum}${VIDY_ACCENT}`,
        isDirect: true
      },
      {
        name: 'VidSrc Pro',
        url: `https://vidsrc.cc/v2/embed/tv/${cleanId}/${seasonNum}/${episodeNum}`
      },
      {
        name: 'SuperEmbed 4K',
        url: `https://multiembed.mov/?video_id=${cleanId}&s=${seasonNum}&e=${episodeNum}&tmdb=1`
      },
      {
        name: 'Cinezo HD',
        url: `https://player.cinezo.live/embed/tv/${cleanId}/${seasonNum}/${episodeNum}`
      },
      {
        name: '2Embed',
        url: `https://www.2embed.cc/embedtv/${cleanId}?s=${seasonNum}&e=${episodeNum}`
      }
    ];

    return {
      embedUrl: servers[0]?.url || null,
      servers
    };
  },

  // Window Controls
  minimize() {
    if (this.isElectron) window.eruAPI.minimize();
  },

  maximize() {
    if (this.isElectron) window.eruAPI.maximize();
  },

  close() {
    if (this.isElectron) window.eruAPI.close();
  },

  async isMaximized() {
    if (this.isElectron) return await window.eruAPI.isMaximized();
    return false;
  },

  onMaximizeChange(cb) {
    if (this.isElectron) return window.eruAPI.onMaximizeChange(cb);
    return () => {};
  }
};

/**
 * ERU — Catalog & Scraper Engine
 * Catalog Source: TMDB (The Movie Database) & IMDb
 * Streaming Source: Vidy (https://www.vidy.st/) & Auto-Failover Embed Servers
 */

const { TMDB } = require('./tmdb');
const { Vidy } = require('./vidy');

const UnifiedCatalog = {
  async getHome() {
    try {
      return await TMDB.getHomeData();
    } catch (err) {
      console.error('[UnifiedCatalog] getHome error:', err);
      return { heroes: [], items: [] };
    }
  },

  async getMovies() {
    try {
      return await TMDB.getMovies();
    } catch (err) {
      console.error('[UnifiedCatalog] getMovies error:', err);
      return [];
    }
  },

  async getTvShows() {
    try {
      return await TMDB.getTvShows();
    } catch (err) {
      console.error('[UnifiedCatalog] getTvShows error:', err);
      return [];
    }
  },

  async search(query) {
    try {
      return await TMDB.search(query);
    } catch (err) {
      console.error('[UnifiedCatalog] search error:', err);
      return [];
    }
  },

  async getDetail(type, slug, source, cardTitle = null) {
    try {
      const mediaType = type === 'tv' ? 'tv' : 'movie';
      const tmdbId = await TMDB.resolveTmdbId(slug, mediaType, cardTitle);
      if (!tmdbId) {
        console.warn(`[UnifiedCatalog] Could not resolve TMDB ID for ${type} slug "${slug}"`);
        return null;
      }

      let detail = null;
      if (mediaType === 'tv') {
        detail = await TMDB.getTvDetail(tmdbId);
      } else {
        detail = await TMDB.getMovieDetail(tmdbId);
      }

      if (!detail) return null;

      // Attach streaming servers powered by Vidy and fallbacks
      const servers = Vidy.buildServers(mediaType, tmdbId, detail.imdbId);
      detail.servers = servers;
      detail.embedUrl = servers[0]?.url || null;

      return detail;
    } catch (err) {
      console.error('[UnifiedCatalog] getDetail error:', err);
      return null;
    }
  },

  async getEpisodes(slug, seasonNum = 1, source = null) {
    try {
      const tmdbId = await TMDB.resolveTmdbId(slug, 'tv');
      if (!tmdbId) return [];

      return await TMDB.getSeasonEpisodes(tmdbId, seasonNum);
    } catch (err) {
      console.error('[UnifiedCatalog] getEpisodes error:', err);
      return [];
    }
  },

  async getEpisodeEmbed(slug, seasonNum = 1, episodeNum = 1, tmdbId = null, imdbId = null, source = null) {
    try {
      let resolvedTmdb = tmdbId;
      let resolvedImdb = imdbId;

      if (!resolvedTmdb) {
        resolvedTmdb = await TMDB.resolveTmdbId(slug, 'tv');
      }

      // If we don't have imdbId yet, try to fetch it from TV detail
      if (resolvedTmdb && !resolvedImdb) {
        const tvDetail = await TMDB.getTvDetail(resolvedTmdb);
        if (tvDetail?.imdbId) resolvedImdb = tvDetail.imdbId;
      }

      const servers = Vidy.buildServers('tv', resolvedTmdb, resolvedImdb, seasonNum, episodeNum);

      return {
        embedUrl: servers[0]?.url || null,
        servers
      };
    } catch (err) {
      console.error('[UnifiedCatalog] getEpisodeEmbed error:', err);
      return { embedUrl: null, servers: [] };
    }
  }
};

module.exports = {
  TMDB,
  Vidy,
  UnifiedCatalog
};

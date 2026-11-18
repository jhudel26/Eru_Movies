/**
 * ERU — Vidy.st Streaming Source Engine
 * Source: https://www.vidy.st/
 * 
 * Provides direct Vidy streaming player endpoints and multi-server auto-failover
 * powered by TMDB and IMDb IDs.
 */

const VIDY_BASE = 'https://www.vidy.st';

// ERU teal accent — applied to Vidy player controls via ?color= param (no # prefix)
const VIDY_ACCENT_COLOR = '2DD4BF';

const Vidy = {
  baseUrl: VIDY_BASE,

  /**
   * Get direct Vidy player URL for movies and TV episodes.
   * Appends ?color= so Vidy's player controls match ERU's teal theme.
   */
  getVidyPlayerUrl(type, tmdbId, season = 1, episode = 1) {
    if (!tmdbId) return null;
    const cleanTmdb = String(tmdbId);
    const accent = `color=${VIDY_ACCENT_COLOR}`;
    if (type === 'tv') {
      return `${VIDY_BASE}/tv/${cleanTmdb}/${season}/${episode}?${accent}`;
    }
    return `${VIDY_BASE}/movie/${cleanTmdb}?${accent}`;
  },

  /**
   * Build complete multi-server failover list
   * Primary: Vidy.st
   * Secondary: VidSrc Pro, SuperEmbed 4K, Cinezo HD, 2Embed, VidSrc IMDb, AutoEmbed
   */
  buildServers(type, tmdbId, imdbId = null, season = 1, episode = 1, directEmbed = null) {
    const servers = [];
    const isTv = type === 'tv';
    const s = season || 1;
    const e = episode || 1;
    const tmdb = tmdbId ? String(tmdbId) : null;
    const imdb = imdbId ? String(imdbId) : null;

    // 1. Vidy.st Native Stream (Top Priority)
    if (tmdb) {
      const vidyUrl = this.getVidyPlayerUrl(type, tmdb, s, e);
      if (vidyUrl) {
        servers.push({
          name: 'Vidy.st Direct',
          url: vidyUrl,
          isDirect: true,
          provider: 'vidy'
        });
      }
    }

    // Direct Embed override if supplied
    if (directEmbed && !servers.some(srv => srv.url === directEmbed)) {
      servers.push({
        name: 'Direct Stream',
        url: directEmbed,
        isDirect: true,
        provider: 'custom'
      });
    }

    // 2. VidSrc Pro (Fast, High Quality)
    if (tmdb) {
      servers.push({
        name: 'VidSrc Pro',
        url: isTv
          ? `https://vidsrc.cc/v2/embed/tv/${tmdb}/${s}/${e}`
          : `https://vidsrc.cc/v2/embed/movie/${tmdb}`,
        provider: 'vidsrc-pro'
      });
    }

    // 3. SuperEmbed 4K (Multi-host aggregator)
    if (tmdb) {
      servers.push({
        name: 'SuperEmbed 4K',
        url: isTv
          ? `https://multiembed.mov/?video_id=${tmdb}&s=${s}&e=${e}&tmdb=1`
          : `https://multiembed.mov/?video_id=${tmdb}&tmdb=1`,
        provider: 'superembed'
      });
    }

    // 4. Cinezo HD
    if (tmdb) {
      servers.push({
        name: 'Cinezo HD',
        url: isTv
          ? `https://player.cinezo.live/embed/tv/${tmdb}/${s}/${e}`
          : `https://player.cinezo.live/embed/movie/${tmdb}`,
        provider: 'cinezo'
      });
    }

    // 5. 2Embed
    if (tmdb) {
      servers.push({
        name: '2Embed',
        url: isTv
          ? `https://www.2embed.cc/embedtv/${tmdb}?s=${s}&e=${e}`
          : `https://www.2embed.cc/embed/${tmdb}`,
        provider: '2embed'
      });
    }

    // 6 & 7. IMDb-based servers (VidSrc XYZ and VidSrc TO)
    if (imdb) {
      servers.push({
        name: 'VidSrc IMDb',
        url: isTv
          ? `https://vidsrc.xyz/embed/tv?imdb=${imdb}&season=${s}&episode=${e}`
          : `https://vidsrc.xyz/embed/movie?imdb=${imdb}`,
        provider: 'vidsrc-imdb'
      });
      servers.push({
        name: 'VidSrc.to IMDb',
        url: isTv
          ? `https://vidsrc.to/embed/tv/${imdb}/${s}/${e}`
          : `https://vidsrc.to/embed/movie/${imdb}`,
        provider: 'vidsrc-to'
      });
    }

    // 8. AutoEmbed
    if (tmdb) {
      servers.push({
        name: 'AutoEmbed',
        url: isTv
          ? `https://player.autoembed.cc/embed/tv/${tmdb}/${s}/${e}`
          : `https://player.autoembed.cc/embed/movie/${tmdb}`,
        provider: 'autoembed'
      });
    }

    // 9. Closeload Fallback (Movie only)
    if (tmdb && !isTv) {
      servers.push({
        name: 'Closeload',
        url: `https://closeload.com/embed/${tmdb}`,
        provider: 'closeload'
      });
    }

    return servers;
  }
};

module.exports = { Vidy };

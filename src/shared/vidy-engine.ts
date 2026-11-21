/**
 * ERU Cinema — Shared Vidy Streaming Engine
 * Single source of truth for Vidy.st URL construction and server list generation.
 * Used by both Electron (main) and React (renderer) processes.
 */

export const VIDY_BASE = 'https://www.vidy.st';
export const VIDY_ACCENT_COLOR = '2DD4BF'; // ERU Teal (no # prefix — Vidy uses ?color= param)

export type MediaType = 'movie' | 'tv';

export interface StreamServer {
  name: string;
  url: string;
  isDirect?: boolean;
  provider: string;
}

/**
 * Get direct Vidy player URL for movies and TV episodes.
 * Appends ?color= so Vidy's player controls match ERU's teal theme.
 */
export function getVidyPlayerUrl(type: MediaType, tmdbId: string | number, season = 1, episode = 1): string {
  const cleanTmdb = String(tmdbId);
  const accent = `color=${VIDY_ACCENT_COLOR}`;
  if (type === 'tv') {
    return `${VIDY_BASE}/tv/${cleanTmdb}/${season}/${episode}?${accent}`;
  }
  return `${VIDY_BASE}/movie/${cleanTmdb}?${accent}`;
}

/**
 * Build complete multi-server failover list for a media item.
 * Primary: Vidy.st (or directEmbed if provided)
 * Secondary: VidSrc Pro, SuperEmbed 4K, Cinezo HD, 2Embed, VidSrc IMDb, AutoEmbed, Closeload
 */
export function buildServers(
  type: MediaType,
  tmdbId: string | number,
  imdbId: string | null = null,
  season = 1,
  episode = 1,
  directEmbed?: string
): StreamServer[] {
  const servers: StreamServer[] = [];
  const isTv = type === 'tv';
  const s = season || 1;
  const e = episode || 1;
  const tmdb = tmdbId ? String(tmdbId) : null;
  const imdb = imdbId ? String(imdbId) : null;

  // 1. Direct Embed override takes top priority if supplied
  if (directEmbed) {
    servers.push({
      name: 'Direct Stream',
      url: directEmbed,
      isDirect: true,
      provider: 'custom',
    });
  }

  // 2. Vidy.st Native Stream (unless directEmbed already provides it)
  if (tmdb) {
    const vidyUrl = getVidyPlayerUrl(type, tmdb, s, e);
    if (vidyUrl && vidyUrl !== directEmbed) {
      servers.push({
        name: 'Vidy.st Direct',
        url: vidyUrl,
        isDirect: true,
        provider: 'vidy',
      });
    }
  }

  // 2. VidSrc Pro (Fast, High Quality)
  if (tmdb) {
    servers.push({
      name: 'VidSrc Pro',
      url: isTv
        ? `https://vidsrc.cc/v2/embed/tv/${tmdb}/${s}/${e}`
        : `https://vidsrc.cc/v2/embed/movie/${tmdb}`,
      provider: 'vidsrc-pro',
    });
  }

  // 3. SuperEmbed 4K (Multi-host aggregator)
  if (tmdb) {
    servers.push({
      name: 'SuperEmbed 4K',
      url: isTv
        ? `https://multiembed.mov/?video_id=${tmdb}&s=${s}&e=${e}&tmdb=1`
        : `https://multiembed.mov/?video_id=${tmdb}&tmdb=1`,
      provider: 'superembed',
    });
  }

  // 4. Cinezo HD
  if (tmdb) {
    servers.push({
      name: 'Cinezo HD',
      url: isTv
        ? `https://player.cinezo.live/embed/tv/${tmdb}/${s}/${e}`
        : `https://player.cinezo.live/embed/movie/${tmdb}`,
      provider: 'cinezo',
    });
  }

  // 5. 2Embed
  if (tmdb) {
    servers.push({
      name: '2Embed',
      url: isTv
        ? `https://www.2embed.cc/embedtv/${tmdb}?s=${s}&e=${e}`
        : `https://www.2embed.cc/embed/${tmdb}`,
      provider: '2embed',
    });
  }

  // 6 & 7. IMDb-based servers (VidSrc XYZ and VidSrc TO)
  if (imdb) {
    servers.push({
      name: 'VidSrc IMDb',
      url: isTv
        ? `https://vidsrc.xyz/embed/tv?imdb=${imdb}&season=${s}&episode=${e}`
        : `https://vidsrc.xyz/embed/movie?imdb=${imdb}`,
      provider: 'vidsrc-imdb',
    });
    servers.push({
      name: 'VidSrc.to IMDb',
      url: isTv
        ? `https://vidsrc.to/embed/tv/${imdb}/${s}/${e}`
        : `https://vidsrc.to/embed/movie/${imdb}`,
      provider: 'vidsrc-to',
    });
  }

  // 8. AutoEmbed
  if (tmdb) {
    servers.push({
      name: 'AutoEmbed',
      url: isTv
        ? `https://player.autoembed.cc/embed/tv/${tmdb}/${s}/${e}`
        : `https://player.autoembed.cc/embed/movie/${tmdb}`,
      provider: 'autoembed',
    });
  }

  // 9. Closeload Fallback (Movie only)
  if (tmdb && !isTv) {
    servers.push({
      name: 'Closeload',
      url: `https://closeload.com/embed/${tmdb}`,
      provider: 'closeload',
    });
  }

  return servers;
}

/**
 * Get allowed embed origins for CSP frame-src / child-src
 */
export function getEmbedOrigins(): string[] {
  return [
    'https://www.vidy.st',
    'https://vidsrc.cc',
    'https://vidsrc.xyz',
    'https://vidsrc.to',
    'https://multiembed.mov',
    'https://player.cinezo.live',
    'https://www.2embed.cc',
    'https://player.autoembed.cc',
    'https://closeload.com',
    'https://wecollege.net',
    'https://goldenkite.top',
    'https://greenkite.top',
    'https://peakpine.top',
    'https://urbanmesa.top',
    'https://calmsable.top',
    'https://*.workers.dev',
  ];
}

/**
 * Generate CSP frame-src / child-src directive value
 */
export function getCspFrameSrc(): string {
  return getEmbedOrigins().join(' ');
}

/**
 * Generate CSP script-src directive value
 */
export function getCspScriptSrc(): string {
  return [
    "'self'",
    "'unsafe-inline'", // Required for React dev / inline scripts
    'https://www.vidy.st',
    'https://vidsrc.cc',
    'https://vidsrc.xyz',
    'https://vidsrc.to',
    'https://multiembed.mov',
    'https://player.cinezo.live',
    'https://www.2embed.cc',
    'https://player.autoembed.cc',
    'https://closeload.com',
    'https://*.workers.dev',
  ].join(' ');
}
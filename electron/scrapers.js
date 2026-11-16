const { net } = require('electron');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

async function fetchUrl(url, customHeaders = {}) {
  const res = await net.fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      ...customHeaders
    }
  });
  return await res.text();
}

// Thorough text sanitizer to strip any raw HTML tags, entities and trailing years
function sanitizeText(str) {
  if (!str) return '';
  return str
    .replace(/<[^>]+>/g, '') // Strip all HTML tags like <a ...>...</a>
    .replace(/&amp;/g, '&')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

// Clean title from "Watch X Full HD (2026)" strings
function cleanTitle(rawTitle, fallbackSlug = '') {
  if (!rawTitle) return fallbackSlug.replace(/-/g, ' ');
  let cleaned = sanitizeText(rawTitle);
  cleaned = cleaned
    .replace(/^Watch\s+/i, '')
    .replace(/\s+Full\s+HD.*$/i, '')
    .replace(/\s*&ndash;.*$/i, '')
    .replace(/\s*-\s*MoviesTV.*$/i, '')
    .replace(/\s*\(\d{4}\)\s*$/, '')
    .trim();
  return cleaned || fallbackSlug.replace(/-/g, ' ');
}

// -------------------------------------------------------------
// RIDOMOVIE SCRAPER
// -------------------------------------------------------------
const RidoMovie = {
  baseUrl: 'https://ridomovie.to',

  async search(query) {
    try {
      const url = `${this.baseUrl}/api/search?q=${encodeURIComponent(query)}&lang=en&limit=24`;
      const jsonStr = await fetchUrl(url, { 'Referer': `${this.baseUrl}/rd1` });
      const parsed = JSON.parse(jsonStr);

      if (!parsed || !parsed.data) return [];

      return parsed.data.map(item => ({
        id: `rido-${item.id}`,
        sourceId: item.id,
        source: 'ridomovie',
        title: cleanTitle(item.title || item.original_title, item.slug),
        type: item.type === 'tv' ? 'tv' : 'movie',
        slug: item.slug || item.slug_en,
        poster: item.poster_path 
          ? (item.poster_path.startsWith('http') ? item.poster_path : `${this.baseUrl}${item.poster_path}`)
          : null,
        backdrop: null,
        rating: item.vote_average ? parseFloat(item.vote_average).toFixed(1) : 'N/A',
        year: item.release_date ? item.release_date.split('-')[0] : '2026',
        quality: item.quality || 'HD',
        tmdbId: item.tmdb_id,
        imdbId: item.imdb_id,
      }));
    } catch (err) {
      console.error('RidoMovie search error:', err);
      return [];
    }
  },

  async getHome() {
    try {
      const html = await fetchUrl(`${this.baseUrl}/home-rd1`, { 'Referer': `${this.baseUrl}/rd1` });
      
      const items = [];
      const seenSlugs = new Set();

      const cardRegex = /<a[^>]+href="(\/(?:movie|tv)\/([^"]+))"[^>]*>[\s\S]*?<img[^>]+(?:data-src|src)="([^"]+)"[^>]*alt="([^"]*)"[\s\S]*?<\/a>/g;
      let match;
      while ((match = cardRegex.exec(html)) !== null) {
        const fullPath = match[1];
        const slug = match[2];
        const img = match[3];
        const rawTitle = match[4];

        if (seenSlugs.has(slug)) continue;
        seenSlugs.add(slug);

        const isTv = fullPath.startsWith('/tv');
        const posterUrl = img.startsWith('http') ? img : (img.startsWith('/') ? `${this.baseUrl}${img}` : `${this.baseUrl}/${img}`);

        items.push({
          id: `rido-${slug}`,
          source: 'ridomovie',
          title: cleanTitle(rawTitle, slug),
          type: isTv ? 'tv' : 'movie',
          slug: slug,
          poster: posterUrl,
          backdrop: posterUrl,
          rating: '8.0',
          year: slug.match(/\b(20\d\d|19\d\d)\b/)?.[1] || '2026',
          quality: 'HD'
        });
      }

      if (items.length < 10) {
        const fallback = await this.search('spider');
        return fallback;
      }

      return items;
    } catch (err) {
      console.error('RidoMovie getHome error:', err);
      return [];
    }
  },

  async getDetail(type, slug) {
    try {
      const pageUrl = `${this.baseUrl}/${type}/${slug}`;
      const html = await fetchUrl(pageUrl, { 'Referer': `${this.baseUrl}/rd1` });

      // Title & Year cleanly parsed (removes any <a ...> tags!)
      const titleMatch = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || html.match(/<title>(.*?)<\/title>/i);
      let title = slug.replace(/-/g, ' ');
      let year = slug.match(/\b(20\d\d|19\d\d)\b/)?.[1] || '2026';

      if (titleMatch) {
        const raw = titleMatch[1];
        const yearMatch = raw.match(/\b(20\d\d|19\d\d)\b/);
        if (yearMatch) {
          year = yearMatch[1];
        }
        title = cleanTitle(raw, slug);
      }

      // Synopsis / Overview
      const descMatch = html.match(/<p class="description[^"]*">([\s\S]*?)<\/p>/i) 
        || html.match(/"description":\s*"([^"]+)"/i)
        || html.match(/<div class="movie-desc[^"]*">([\s\S]*?)<\/div>/i);
      const overview = descMatch ? sanitizeText(descMatch[1]) : 'Experience the cinema thrill in pure high-definition streaming.';

      // Backdrop / Poster
      const backdropMatch = html.match(/<meta property="og:image" content="([^"]+)"/i)
        || html.match(/class="[^"]*backdrop[^"]*"[^>]+src="([^"]+)"/i);
      const backdrop = backdropMatch ? (backdropMatch[1].startsWith('http') ? backdropMatch[1] : `${this.baseUrl}${backdropMatch[1]}`) : null;

      // Rating
      const ratingMatch = html.match(/<span[^>]*class="rating-value"[^>]*>([\d\.]+)<\/span>/i) || html.match(/(\d\.\d)\s*\/\s*10/);
      const rating = ratingMatch ? ratingMatch[1] : '8.0';

      // Genres
      const genreMatches = [...html.matchAll(/href="\/genre\/([^\/"]+)\/[^"]*"/g)].map(m => m[1]);
      const genres = [...new Set(genreMatches)].map(g => g.charAt(0).toUpperCase() + g.slice(1));

      // Embed iframe
      const iframeMatch = html.match(/<iframe[^>]+data-src="([^"]+)"/i) 
        || html.match(/data-embed="&lt;iframe[^>]+src=&quot;([^&]+)&quot;/i)
        || html.match(/<iframe[^>]+src="([^"]+)"/i);
      let embedUrl = iframeMatch ? iframeMatch[1].replace(/&amp;/g, '&') : null;

      // Extract IMDb and TMDB ID if present
      const imdbMatch = html.match(/imdb_id=([a-zA-Z0-9]+)/i) || html.match(/tt\d{7,8}/i);
      const imdbId = imdbMatch ? (imdbMatch[1] || imdbMatch[0]) : null;

      const tmdbMatch = html.match(/tmdb[_-]?id["']?\s*[:=]\s*["']?(\d+)/i) || html.match(/data-movie-id="(\d+)"/i);
      const tmdbId = tmdbMatch ? tmdbMatch[1] : null;

      // Extract seasons for TV
      let seasons = [];
      if (type === 'tv') {
        const seasonMatches = [...html.matchAll(/data-season-number="(\d+)"/g)].map(m => parseInt(m[1], 10));
        const uniqueSeasons = [...new Set(seasonMatches)].sort((a, b) => a - b);
        seasons = uniqueSeasons.length > 0 ? uniqueSeasons : [1];
      }

      // Generate multi-server stream options
      const idParam = imdbId || tmdbId || slug;
      const servers = [];
      
      if (type === 'movie') {
        servers.push({ name: 'Cinezo HD (Fast)', url: `https://player.cinezo.live/embed/movie/${idParam}` });
        servers.push({ name: 'SuperEmbed 4K', url: `https://multiembed.mov/?video_id=${idParam}&tmdb=1` });
        servers.push({ name: 'VidSrc Alpha', url: `https://vidsrc.xyz/embed/movie?imdb=${idParam}` });
        servers.push({ name: 'VidPlay Pro', url: `https://vidsrc.cc/v2/embed/movie/${idParam}` });
        if (embedUrl) {
          servers.push({ name: 'Closeload Native', url: embedUrl, isDirect: true });
        }
      } else {
        servers.push({ name: 'Cinezo HD (Fast)', url: `https://player.cinezo.live/embed/tv/${idParam}/1/1` });
        servers.push({ name: 'SuperEmbed 4K', url: `https://multiembed.mov/?video_id=${idParam}&s=1&e=1&tmdb=1` });
        servers.push({ name: 'VidSrc Alpha', url: `https://vidsrc.xyz/embed/tv?imdb=${idParam}&season=1&episode=1` });
        servers.push({ name: 'VidPlay Pro', url: `https://vidsrc.cc/v2/embed/tv/${idParam}/1/1` });
        if (embedUrl) {
          servers.push({ name: 'Closeload Native', url: embedUrl, isDirect: true });
        }
      }

      return {
        id: `rido-${slug}`,
        source: 'ridomovie',
        type,
        slug,
        title,
        overview,
        backdrop,
        poster: backdrop,
        rating,
        year,
        genres: genres.length > 0 ? genres : ['Cinema', 'Action', 'Drama'],
        imdbId,
        tmdbId,
        embedUrl: servers[0]?.url || embedUrl,
        servers,
        seasons
      };
    } catch (err) {
      console.error('RidoMovie getDetail error:', err);
      return null;
    }
  },

  async getTvEpisodes(slug, seasonNum) {
    try {
      const url = `${this.baseUrl}/tv/${slug}/season-${seasonNum}`;
      const jsonStr = await fetchUrl(url, {
        'Referer': `${this.baseUrl}/tv/${slug}`,
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
        'X-Content-Mode': 'episodes_only'
      });

      const parsed = JSON.parse(jsonStr);
      const episodesHtml = parsed.episodesHtml || '';

      const episodes = [];
      const epRegex = /<a[^>]+href="(\/tv\/[^\/"]+\/season-\d+\/episode-(\d+))"[^>]*>[\s\S]*?<img[^>]+(?:data-src|src)="([^"]*)"[^>]*>[\s\S]*?<span class="ep-num">([^<]*)<\/span>[\s\S]*?<h[34][^>]*>([^<]*)<\/h[34]>/g;
      let m;
      while ((m = epRegex.exec(episodesHtml)) !== null) {
        const epPath = m[1];
        const epNum = parseInt(m[2], 10);
        const epImg = m[3];
        const rawTitle = m[5];

        episodes.push({
          number: epNum,
          title: cleanTitle(rawTitle, `Episode ${epNum}`),
          thumbnail: epImg ? (epImg.startsWith('http') ? epImg : `${this.baseUrl}${epImg}`) : null,
          urlPath: epPath
        });
      }

      if (episodes.length === 0) {
        for (let i = 1; i <= 10; i++) {
          episodes.push({
            number: i,
            title: `Episode ${i}`,
            thumbnail: null,
            urlPath: `/tv/${slug}/season-${seasonNum}/episode-${i}`
          });
        }
      }

      return episodes;
    } catch (err) {
      console.error('RidoTv getEpisodes error:', err);
      return Array.from({ length: 12 }, (_, i) => ({
        number: i + 1,
        title: `Episode ${i + 1}`,
        thumbnail: null,
        urlPath: `/tv/${slug}/season-${seasonNum}/episode-${i + 1}`
      }));
    }
  },

  async getEpisodeEmbed(slug, seasonNum, episodeNum, tmdbId, imdbId) {
    try {
      let directEmbed = null;
      try {
        const url = `${this.baseUrl}/tv/${slug}/season-${seasonNum}/episode-${episodeNum}`;
        const jsonStr = await fetchUrl(url, {
          'Referer': `${this.baseUrl}/tv/${slug}`,
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json'
        });

        const parsed = JSON.parse(jsonStr);
        const playerHtml = parsed.playerHtml || '';

        const embedMatch = playerHtml.match(/data-embed="&lt;iframe[^>]+src=&quot;([^&]+)&quot;/i)
          || playerHtml.match(/src="([^"]*(?:embed|closeload|stream)[^"]*)"/i);
        
        if (embedMatch) {
          directEmbed = embedMatch[1].replace(/&amp;/g, '&');
        }
      } catch (e) {}

      const idParam = tmdbId || imdbId || slug;
      const servers = [
        { name: 'Cinezo HD (Fast)', url: `https://player.cinezo.live/embed/tv/${idParam}/${seasonNum}/${episodeNum}` },
        { name: 'SuperEmbed 4K', url: `https://multiembed.mov/?video_id=${idParam}&s=${seasonNum}&e=${episodeNum}&tmdb=1` },
        { name: 'VidSrc Alpha', url: `https://vidsrc.xyz/embed/tv?${imdbId ? `imdb=${imdbId}` : `tmdb=${idParam}`}&season=${seasonNum}&episode=${episodeNum}` },
        { name: 'VidPlay Pro', url: `https://vidsrc.cc/v2/embed/tv/${idParam}/${seasonNum}/${episodeNum}` }
      ];

      if (directEmbed) {
        servers.push({ name: 'Closeload Native', url: directEmbed, isDirect: true });
      }

      return {
        embedUrl: servers[0].url,
        servers
      };
    } catch (err) {
      console.error('getEpisodeEmbed error:', err);
      const idParam = tmdbId || imdbId || slug;
      return {
        embedUrl: `https://player.cinezo.live/embed/tv/${idParam}/${seasonNum}/${episodeNum}`,
        servers: [
          { name: 'Cinezo HD (Fast)', url: `https://player.cinezo.live/embed/tv/${idParam}/${seasonNum}/${episodeNum}` },
          { name: 'SuperEmbed 4K', url: `https://multiembed.mov/?video_id=${idParam}&s=${seasonNum}&e=${episodeNum}&tmdb=1` },
          { name: 'VidSrc Alpha', url: `https://vidsrc.xyz/embed/tv?imdb=${idParam}&season=${seasonNum}&episode=${episodeNum}` }
        ]
      };
    }
  }
};

// -------------------------------------------------------------
// MOVIESFREE SCRAPER
// -------------------------------------------------------------
const MoviesFree = {
  baseUrl: 'https://moviesfree.cv',

  async getHome() {
    try {
      const html = await fetchUrl(`${this.baseUrl}/home`);

      // 1. Hero slides
      const heroItems = [];
      const slideRegex = /<div class="container">\s*<div class="slide-wrapper">\s*<div class="info">\s*<div class="start">\s*<h2 class="name">(.*?)<\/h2>[\s\S]*?<div class="quality">(.*?)<\/div>[\s\S]*?<span class="rating">([^<]*)<\/span>[\s\S]*?<span><i class="bi bi-star-fill"><\/i>\s*([\d\.]+)<\/span>[\s\S]*?<span>(\d{4})<\/span>[\s\S]*?<div class="desc end">\s*(.*?)\s*<\/div>[\s\S]*?<a href="https:\/\/moviesfree\.cv\/([^\/"]+)\/" class="watchnow/g;
      
      let match;
      while ((match = slideRegex.exec(html)) !== null) {
        const slug = match[7].trim();
        heroItems.push({
          id: `mf-${slug}`,
          source: 'moviesfree',
          title: cleanTitle(match[1], slug),
          quality: match[2].trim() || 'HD',
          rating: match[4].trim() || '8.0',
          year: match[5].trim() || '2026',
          overview: sanitizeText(match[6]),
          slug: slug,
          type: 'movie',
          isHero: true
        });
      }

      // 2. Regular cards
      const cards = [];
      const seen = new Set();
      const cardRegex = /<a[^>]+href="https:\/\/moviesfree\.cv\/([a-z0-9_-]+)\/"[^>]*>[\s\S]*?<img[^>]+(?:data-src|src)="([^"]+)"[^>]*alt="([^"]*)"/g;
      
      while ((match = cardRegex.exec(html)) !== null) {
        const slug = match[1];
        const poster = match[2].startsWith('//') ? `https:${match[2]}` : match[2];
        const rawTitle = match[3];

        if (seen.has(slug) || slug === 'home' || slug === 'pierre') continue;
        seen.add(slug);

        cards.push({
          id: `mf-${slug}`,
          source: 'moviesfree',
          slug: slug,
          title: cleanTitle(rawTitle, slug),
          poster: poster,
          backdrop: poster,
          rating: '8.0',
          year: slug.match(/\b(20\d\d|19\d\d)\b/)?.[1] || '2026',
          quality: 'HD',
          type: slug.includes('season') || slug.includes('series') ? 'tv' : 'movie'
        });
      }

      return {
        heroes: heroItems,
        items: cards
      };
    } catch (err) {
      console.error('MoviesFree getHome error:', err);
      return { heroes: [], items: [] };
    }
  },

  async search(query) {
    try {
      const url = `${this.baseUrl}/?s=${encodeURIComponent(query)}`;
      const html = await fetchUrl(url);

      const results = [];
      const seen = new Set();
      const itemRegex = /<a[^>]+href="https:\/\/moviesfree\.cv\/([a-z0-9_-]+)\/"[^>]*>[\s\S]*?<img[^>]+(?:data-src|src)="([^"]+)"[^>]*alt="([^"]*)"/g;
      
      let match;
      while ((match = itemRegex.exec(html)) !== null) {
        const slug = match[1];
        const poster = match[2].startsWith('//') ? `https:${match[2]}` : match[2];
        const rawTitle = match[3];

        if (seen.has(slug) || slug === 'home') continue;
        seen.add(slug);

        results.push({
          id: `mf-${slug}`,
          source: 'moviesfree',
          slug: slug,
          title: cleanTitle(rawTitle, slug),
          poster: poster,
          backdrop: poster,
          rating: '7.8',
          year: slug.match(/\b(20\d\d|19\d\d)\b/)?.[1] || '2026',
          quality: 'HD',
          type: slug.includes('season') || slug.includes('series') ? 'tv' : 'movie'
        });
      }

      return results;
    } catch (err) {
      console.error('MoviesFree search error:', err);
      return [];
    }
  },

  async getDetail(slug) {
    try {
      const pageUrl = `${this.baseUrl}/${slug}/`;
      const html = await fetchUrl(pageUrl);

      // Extract title
      const titleMatch = html.match(/<title>(.*?)<\/title>/i);
      const title = cleanTitle(titleMatch ? titleMatch[1] : slug, slug);

      // Extract Episodes or Movie script metadata
      const b64Matches = [...html.matchAll(/data:text\/javascript;base64,([A-Za-z0-9+/=]+)/g)];
      let epData = null;
      for (const b of b64Matches) {
        try {
          const decoded = Buffer.from(b[1], 'base64').toString('utf-8');
          if (decoded.includes('Episodes=')) {
            const jsonPart = decoded.replace(/^var\s+Episodes\s*=\s*/, '').replace(/;$/, '');
            epData = JSON.parse(jsonPart);
            break;
          }
        } catch (e) {}
      }

      // Overview
      const descMatch = html.match(/<div class="desc[^"]*">([\s\S]*?)<\/div>/i)
        || html.match(/<p class="description[^"]*">([\s\S]*?)<\/p>/i);
      const overview = descMatch ? sanitizeText(descMatch[1]) : 'Streaming in high definition.';

      let poster = epData?.tvposter ? (epData.tvposter.startsWith('//') ? `https:${epData.tvposter}` : epData.tvposter) : null;
      let backdrop = epData?.base_backdrop ? (epData.base_backdrop.startsWith('//') ? `https:${epData.base_backdrop}` : epData.base_backdrop) : null;

      if (!poster) {
        const imgMatch = html.match(/<meta property="og:image" content="([^"]+)"/i);
        poster = imgMatch ? imgMatch[1] : null;
        backdrop = poster;
      }

      const tmdbId = epData?.tvid || html.match(/data-load-embed="(\d+)"/)?.[1] || null;
      const imdbId = epData?.tvimdbid || null;
      const rating = epData?.vote_average || '8.0';
      const year = slug.match(/\b(20\d\d|19\d\d)\b/)?.[1] || '2026';
      const isTv = !!(epData?.tvseason || html.includes('data-load-season'));

      const idParam = tmdbId || imdbId || '12345';
      const servers = [];

      if (isTv) {
        servers.push({ name: 'Cinezo HD (Fast)', url: `https://player.cinezo.live/embed/tv/${idParam}/1/1` });
        servers.push({ name: 'SuperEmbed 4K', url: `https://multiembed.mov/?video_id=${idParam}&s=1&e=1&tmdb=1` });
        servers.push({ name: 'VidSrc Alpha', url: `https://vidsrc.xyz/embed/tv?tmdb=${idParam}&season=1&episode=1` });
        servers.push({ name: 'VidPlay Pro', url: `https://vidsrc.cc/v2/embed/tv/${idParam}/1/1` });
      } else {
        servers.push({ name: 'Cinezo HD (Fast)', url: `https://player.cinezo.live/embed/movie/${idParam}` });
        servers.push({ name: 'SuperEmbed 4K', url: `https://multiembed.mov/?video_id=${idParam}&tmdb=1` });
        servers.push({ name: 'VidSrc Alpha', url: `https://vidsrc.xyz/embed/movie?tmdb=${idParam}` });
        servers.push({ name: 'VidPlay Pro', url: `https://vidsrc.cc/v2/embed/movie/${idParam}` });
      }

      return {
        id: `mf-${slug}`,
        source: 'moviesfree',
        type: isTv ? 'tv' : 'movie',
        slug,
        title,
        overview,
        poster,
        backdrop,
        rating,
        year,
        genres: ['Cinema', 'Action', 'Drama'],
        tmdbId,
        imdbId,
        embedUrl: servers[0]?.url || null,
        servers,
        seasons: isTv ? [1, 2, 3] : []
      };
    } catch (err) {
      console.error('MoviesFree getDetail error:', err);
      return null;
    }
  }
};

module.exports = {
  RidoMovie,
  MoviesFree
};

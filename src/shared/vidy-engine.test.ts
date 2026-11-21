import { describe, it, expect } from 'vitest';
import { getVidyPlayerUrl, buildServers, getEmbedOrigins, getCspFrameSrc, getCspScriptSrc } from './vidy-engine';

describe('Vidy Engine', () => {
  describe('getVidyPlayerUrl', () => {
    it('should generate correct movie URL', () => {
      const url = getVidyPlayerUrl('movie', '12345');
      expect(url).toBe('https://www.vidy.st/movie/12345?color=2DD4BF');
    });

    it('should generate correct TV URL with season/episode', () => {
      const url = getVidyPlayerUrl('tv', '67890', 2, 5);
      expect(url).toBe('https://www.vidy.st/tv/67890/2/5?color=2DD4BF');
    });

    it('should handle numeric tmdbId', () => {
      const url = getVidyPlayerUrl('movie', 99999);
      expect(url).toBe('https://www.vidy.st/movie/99999?color=2DD4BF');
    });

    it('should default to season 1, episode 1 for TV', () => {
      const url = getVidyPlayerUrl('tv', '11111');
      expect(url).toBe('https://www.vidy.st/tv/11111/1/1?color=2DD4BF');
    });
  });

  describe('buildServers', () => {
    it('should include Vidy.st as first server for movies', () => {
      const servers = buildServers('movie', '12345', 'tt1234567');
      expect(servers[0].name).toBe('Vidy.st Direct');
      expect(servers[0].provider).toBe('vidy');
      expect(servers[0].isDirect).toBe(true);
    });

    it('should include Vidy.st as first server for TV', () => {
      const servers = buildServers('tv', '12345', 'tt1234567', 1, 1);
      expect(servers[0].name).toBe('Vidy.st Direct');
      expect(servers[0].provider).toBe('vidy');
      expect(servers[0].isDirect).toBe(true);
    });

    it('should include VidSrc Pro for movies', () => {
      const servers = buildServers('movie', '12345');
      const vidsrc = servers.find(s => s.provider === 'vidsrc-pro');
      expect(vidsrc).toBeDefined();
      expect(vidsrc?.url).toBe('https://vidsrc.cc/v2/embed/movie/12345');
    });

    it('should include VidSrc Pro for TV with season/episode', () => {
      const servers = buildServers('tv', '12345', null, 2, 3);
      const vidsrc = servers.find(s => s.provider === 'vidsrc-pro');
      expect(vidsrc?.url).toBe('https://vidsrc.cc/v2/embed/tv/12345/2/3');
    });

    it('should include IMDb-based servers when imdbId provided', () => {
      const servers = buildServers('movie', '12345', 'tt1234567');
      const vidsrcImdb = servers.find(s => s.provider === 'vidsrc-imdb');
      expect(vidsrcImdb).toBeDefined();
      expect(vidsrcImdb?.url).toContain('imdb=tt1234567');
    });

    it('should NOT include IMDb servers when imdbId is null', () => {
      const servers = buildServers('movie', '12345', null);
      const vidsrcImdb = servers.find(s => s.provider === 'vidsrc-imdb');
      expect(vidsrcImdb).toBeUndefined();
    });

    it('should include Closeload only for movies', () => {
      const movieServers = buildServers('movie', '12345');
      const tvServers = buildServers('tv', '12345');
      expect(movieServers.some(s => s.provider === 'closeload')).toBe(true);
      expect(tvServers.some(s => s.provider === 'closeload')).toBe(false);
    });

    it('should respect directEmbed override', () => {
      const servers = buildServers('movie', '12345', null, 1, 1, 'https://custom.stream/movie');
      expect(servers[0].url).toBe('https://custom.stream/movie');
      expect(servers[0].provider).toBe('custom');
    });

    it('should not duplicate directEmbed if same as Vidy', () => {
      const vidyUrl = 'https://www.vidy.st/movie/12345?color=2DD4BF';
      const servers = buildServers('movie', '12345', null, 1, 1, vidyUrl);
      const customCount = servers.filter(s => s.url === vidyUrl).length;
      expect(customCount).toBe(1);
    });
  });

  describe('getEmbedOrigins', () => {
    it('should return array of allowed embed origins', () => {
      const origins = getEmbedOrigins();
      expect(Array.isArray(origins)).toBe(true);
      expect(origins.length).toBeGreaterThan(0);
      expect(origins).toContain('https://www.vidy.st');
      expect(origins).toContain('https://vidsrc.cc');
    });
  });

  describe('getCspFrameSrc', () => {
    it('should return space-separated string of origins', () => {
      const csp = getCspFrameSrc();
      expect(typeof csp).toBe('string');
      expect(csp).toContain('https://www.vidy.st');
      expect(csp).toContain('https://vidsrc.cc');
    });
  });

  describe('getCspScriptSrc', () => {
    it('should include self and unsafe-inline', () => {
      const csp = getCspScriptSrc();
      expect(csp).toContain("'self'");
      expect(csp).toContain("'unsafe-inline'");
    });
  });
});
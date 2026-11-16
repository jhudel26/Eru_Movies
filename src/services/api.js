// Service layer interfacing with Electron Preload API

export const ApiService = {
  isElectron: typeof window !== 'undefined' && !!window.eruAPI,

  async getHome(source = 'ridomovie') {
    if (this.isElectron) {
      return await window.eruAPI.getHome(source);
    }
    // Fallback sample data if rendered in browser
    return {
      heroes: [
        {
          id: 'sample-1',
          title: 'Spider-Man: Brand New Day',
          rating: '7.9',
          year: '2026',
          quality: 'HD',
          type: 'movie',
          overview: 'Fighting crime in New York city with unexpected threats.',
          poster: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/kHBUdqtPKLrjMghBF1usYYoDfi6.jpg',
          backdrop: 'https://image.tmdb.org/t/p/original/g1LJLlmWP74zv9yXKEXm7g9p10O.jpg',
          isHero: true
        }
      ],
      items: []
    };
  },

  async search(source, query) {
    if (this.isElectron) {
      return await window.eruAPI.search(source, query);
    }
    return [];
  },

  async getDetail(source, type, slug) {
    if (this.isElectron) {
      return await window.eruAPI.getDetail(source, type, slug);
    }
    return null;
  },

  async getEpisodes(source, slug, seasonNum) {
    if (this.isElectron) {
      return await window.eruAPI.getEpisodes(source, slug, seasonNum);
    }
    return [];
  },

  async getEpisodeEmbed(source, slug, seasonNum, episodeNum, tmdbId, imdbId) {
    if (this.isElectron) {
      return await window.eruAPI.getEpisodeEmbed(source, slug, seasonNum, episodeNum, tmdbId, imdbId);
    }
    return { embedUrl: null, servers: [] };
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

  isMaximized() {
    if (this.isElectron) return window.eruAPI.isMaximized();
    return false;
  },

  onMaximizeChange(cb) {
    if (this.isElectron) return window.eruAPI.onMaximizeChange(cb);
    return () => {};
  }
};

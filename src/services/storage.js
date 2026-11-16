const WATCHLIST_KEY = 'eru_watchlist';
const HISTORY_KEY = 'eru_history';
const SETTINGS_KEY = 'eru_settings';

export const StorageService = {
  // Watchlist / Bookmarks
  getWatchlist() {
    try {
      const data = localStorage.getItem(WATCHLIST_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  isInWatchlist(id) {
    const list = this.getWatchlist();
    return list.some(item => item.id === id);
  },

  toggleWatchlist(item) {
    const list = this.getWatchlist();
    const index = list.findIndex(i => i.id === item.id);
    let updated;
    if (index >= 0) {
      updated = list.filter(i => i.id !== item.id);
    } else {
      updated = [{ ...item, savedAt: Date.now() }, ...list];
    }
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(updated));
    return updated;
  },

  // Watch History
  getHistory() {
    try {
      const data = localStorage.getItem(HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  addToHistory(mediaItem, extra = {}) {
    const history = this.getHistory();
    const filtered = history.filter(i => i.id !== mediaItem.id);
    const updated = [
      {
        ...mediaItem,
        ...extra,
        watchedAt: Date.now()
      },
      ...filtered
    ].slice(0, 50); // Keep last 50 items
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    return updated;
  },

  clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
  },

  // Settings
  getSettings() {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      return data ? JSON.parse(data) : {
        defaultSource: 'ridomovie', // 'ridomovie' | 'moviesfree'
        autoplayNext: true,
        cinemaMode: true,
        accentColor: 'teal',
      };
    } catch {
      return {
        defaultSource: 'ridomovie',
        autoplayNext: true,
        cinemaMode: true,
        accentColor: 'teal',
      };
    }
  },

  saveSettings(newSettings) {
    const current = this.getSettings();
    const updated = { ...current, ...newSettings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  }
};

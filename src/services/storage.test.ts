import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StorageService } from './storage';

describe('StorageService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('getWatchlist', () => {
    it('should return empty array when no data', () => {
      expect(StorageService.getWatchlist()).toEqual([]);
    });

    it('should return parsed watchlist', () => {
      const items = [{ id: '1', title: 'Test' }];
      localStorage.setItem('eru_watchlist', JSON.stringify(items));
      expect(StorageService.getWatchlist()).toEqual(items);
    });

    it('should return empty array on parse error', () => {
      localStorage.setItem('eru_watchlist', 'invalid json');
      expect(StorageService.getWatchlist()).toEqual([]);
    });
  });

  describe('isInWatchlist', () => {
    it('should return false for empty watchlist', () => {
      expect(StorageService.isInWatchlist('1')).toBe(false);
    });

    it('should return true when item exists', () => {
      localStorage.setItem('eru_watchlist', JSON.stringify([{ id: '1' }]));
      expect(StorageService.isInWatchlist('1')).toBe(true);
    });

    it('should return false when item not in watchlist', () => {
      localStorage.setItem('eru_watchlist', JSON.stringify([{ id: '2' }]));
      expect(StorageService.isInWatchlist('1')).toBe(false);
    });
  });

  describe('toggleWatchlist', () => {
    it('should add item when not in watchlist', () => {
      const item = { id: '1', title: 'Test' };
      const result = StorageService.toggleWatchlist(item);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({ id: '1', title: 'Test' });
      expect(result[0].savedAt).toBeDefined();
    });

    it('should remove item when already in watchlist', () => {
      localStorage.setItem('eru_watchlist', JSON.stringify([{ id: '1', title: 'Test' }]));
      const result = StorageService.toggleWatchlist({ id: '1', title: 'Test' });
      expect(result).toHaveLength(0);
    });

    it('should add new item to beginning of list', () => {
      localStorage.setItem('eru_watchlist', JSON.stringify([{ id: '1' }, { id: '2' }]));
      const result = StorageService.toggleWatchlist({ id: '3' });
      expect(result[0].id).toBe('3');
      expect(result).toHaveLength(3);
    });
  });

  describe('getHistory', () => {
    it('should return empty array when no data', () => {
      expect(StorageService.getHistory()).toEqual([]);
    });

    it('should return parsed history', () => {
      const items = [{ id: '1', watchedAt: 123 }];
      localStorage.setItem('eru_history', JSON.stringify(items));
      expect(StorageService.getHistory()).toEqual(items);
    });
  });

  describe('addToHistory', () => {
    it('should return current history for invalid item', () => {
      const history = StorageService.addToHistory(null);
      expect(history).toEqual([]);
    });

    it('should add item to beginning of history', () => {
      const item = { id: '1', title: 'Test' };
      const history = StorageService.addToHistory(item);
      expect(history[0]).toMatchObject({ id: '1', title: 'Test' });
      expect(history[0].watchedAt).toBeDefined();
    });

    it('should remove duplicate and add to front', () => {
      localStorage.setItem('eru_history', JSON.stringify([{ id: '1' }, { id: '2' }]));
      const history = StorageService.addToHistory({ id: '1', title: 'Updated' });
      expect(history[0].id).toBe('1');
      expect(history[0].title).toBe('Updated');
      expect(history).toHaveLength(2);
    });

    it('should merge extra data', () => {
      const item = { id: '1', title: 'Test' };
      const history = StorageService.addToHistory(item, { seasonNum: 2, episodeNum: 3 });
      expect(history[0].seasonNum).toBe(2);
      expect(history[0].episodeNum).toBe(3);
    });

    it('should limit history to 60 items', () => {
      const items = Array.from({ length: 65 }, (_, i) => ({ id: String(i) }));
      localStorage.setItem('eru_history', JSON.stringify(items));
      const history = StorageService.addToHistory({ id: 'new' });
      expect(history).toHaveLength(60);
    });
  });

  describe('removeFromHistory', () => {
    it('should remove item by id', () => {
      localStorage.setItem('eru_history', JSON.stringify([{ id: '1' }, { id: '2' }]));
      const history = StorageService.removeFromHistory('1');
      expect(history).toHaveLength(1);
      expect(history[0].id).toBe('2');
    });

    it('should handle removing non-existent item', () => {
      localStorage.setItem('eru_history', JSON.stringify([{ id: '1' }]));
      const history = StorageService.removeFromHistory('2');
      expect(history).toHaveLength(1);
    });
  });

  describe('clearHistory', () => {
    it('should clear history', () => {
      localStorage.setItem('eru_history', JSON.stringify([{ id: '1' }]));
      StorageService.clearHistory();
      expect(StorageService.getHistory()).toEqual([]);
    });
  });

  describe('getSettings', () => {
    it('should return defaults when no settings', () => {
      const settings = StorageService.getSettings();
      expect(settings).toEqual({
        defaultSource: 'vidy',
        autoplayNext: true,
        cinemaMode: true,
        accentColor: 'teal',
        hideUnavailable: true,
      });
    });

    it('should return saved settings', () => {
      const saved = { defaultSource: 'custom', autoplayNext: false };
      localStorage.setItem('eru_settings', JSON.stringify(saved));
      const settings = StorageService.getSettings();
      expect(settings.defaultSource).toBe('custom');
      expect(settings.autoplayNext).toBe(false);
      // Should merge with defaults
      expect(settings.cinemaMode).toBe(true);
    });
  });

  describe('saveSettings', () => {
    it('should save and merge settings', () => {
      const newSettings = StorageService.saveSettings({ defaultSource: 'new' });
      expect(newSettings.defaultSource).toBe('new');
      expect(newSettings.autoplayNext).toBe(true); // default preserved
    });

    it('should persist to localStorage', () => {
      StorageService.saveSettings({ cinemaMode: false });
      const stored = JSON.parse(localStorage.getItem('eru_settings') || '{}');
      expect(stored.cinemaMode).toBe(false);
    });
  });
});
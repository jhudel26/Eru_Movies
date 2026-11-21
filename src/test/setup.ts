import { vi } from 'vitest';

// Mock Electron API for tests
Object.defineProperty(window, 'eruAPI', {
  value: {
    minimize: vi.fn(),
    maximize: vi.fn(),
    close: vi.fn(),
    isMaximized: vi.fn().mockResolvedValue(false),
    onMaximizeChange: vi.fn().mockReturnValue(() => {}),
    getHome: vi.fn(),
    getMovies: vi.fn(),
    getTvShows: vi.fn(),
    search: vi.fn(),
    getDetail: vi.fn(),
    getEpisodes: vi.fn(),
    getEpisodeEmbed: vi.fn(),
    openExternal: vi.fn(),
  },
  writable: true,
});

// Mock localStorage with actual storage
const localStorageStore = new Map<string, string>();
const localStorageMock = {
  getItem: vi.fn((key: string) => localStorageStore.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => localStorageStore.set(key, value)),
  removeItem: vi.fn((key: string) => localStorageStore.delete(key)),
  clear: vi.fn(() => localStorageStore.clear()),
  get length() { return localStorageStore.size; },
  key: vi.fn((index: number) => Array.from(localStorageStore.keys())[index] ?? null),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
  writable: true,
});

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
Object.defineProperty(window, 'IntersectionObserver', {
  value: MockIntersectionObserver,
  writable: true,
});

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
Object.defineProperty(window, 'ResizeObserver', {
  value: MockResizeObserver,
  writable: true,
});

// Suppress console.error in tests (optional)
const originalError = console.error;
console.error = (...args) => {
  if (args[0]?.includes?.('Warning: ReactDOM.render is no longer supported')) return;
  originalError.apply(console, args);
};
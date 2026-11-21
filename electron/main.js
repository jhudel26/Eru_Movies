const { app, BrowserWindow, ipcMain, shell, session } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { z } = require('zod');
const { logger, ipcLogger, tmdbLogger } = require('./logger');

// Simple .env loader for main process

// Zod validation schemas for IPC handlers
const schemas = {
  search: z.object({
    query: z.string().min(1).max(500).trim(),
  }),

  getDetail: z.object({
    type: z.enum(['movie', 'tv']),
    slug: z.string().min(1).max(100),
    source: z.string().min(1).max(50),
    cardTitle: z.string().max(200).nullable().optional(),
  }),

  getEpisodes: z.object({
    slug: z.string().min(1).max(100),
    seasonNum: z.number().int().positive().max(100),
    source: z.string().min(1).max(50),
  }),

  getEpisodeEmbed: z.object({
    slug: z.string().min(1).max(100),
    seasonNum: z.number().int().positive().max(100),
    episodeNum: z.number().int().positive().max(1000),
    tmdbId: z.string().min(1).max(20),
    imdbId: z.string().min(1).max(20).nullable().optional(),
    source: z.string().min(1).max(50),
  }),

  openExternal: z.object({
    url: z.string().url(),
  }),
};

// Validation helper
function validateIpc(schema) {
  return (data, _event) => {
    const result = schema.safeParse(data);
    if (!result.success) {
      console.warn('[IPC Validation Failed]', result.error.flatten());
      throw new Error(`Invalid input: ${result.error.errors.map(e => e.message).join(', ')}`);
    }
    return result.data;
  };
}
try {
  const envPath = path.join(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [k, ...rest] = trimmed.split('=');
        const key = k.trim();
        const val = rest.join('=').trim();
        if (key && !process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
} catch {
  // Ignore env read errors
}

const { UnifiedCatalog } = require('./scrapers');

const isDev = process.env.NODE_ENV === 'development';

// Configure isolated userData directory and prevent Windows Chromium disk/shader cache conflicts
app.name = isDev ? 'ERU_Dev' : 'ERU';
app.setPath('userData', path.join(app.getPath('appData'), isDev ? 'ERU_Cinema_Dev' : 'ERU_Cinema'));
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');
app.commandLine.appendSwitch('disable-features', 'Dawn,DawnGraphiteCache');

let mainWindow = null;
let splashWindow = null;
let splashTransitionStarted = false;

const APP_WIDTH = 1320;
const APP_HEIGHT = 840;
const MIN_WIDTH = 1040;
const MIN_HEIGHT = 680;

function getAppIcon() {
  const icoPath = path.join(__dirname, '../public/icon.ico');
  const pngPath = path.join(__dirname, '../public/icon.png');
  if (process.platform === 'win32' && fs.existsSync(icoPath)) {
    return icoPath;
  }
  return pngPath;
}

// ── Splash Screen (Matches Main App Size: 1320x840) ─────────────
function createSplash() {
  const iconPath = getAppIcon();

  splashWindow = new BrowserWindow({
    width: APP_WIDTH,
    height: APP_HEIGHT,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    frame: false,
    transparent: false,
    resizable: false,
    movable: true,
    center: true,
    alwaysOnTop: false,
    skipTaskbar: false,
    backgroundColor: '#081114',
    icon: iconPath,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  splashWindow.once('ready-to-show', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.show();
    }
  });

  const splashPath = path.join(__dirname, 'splash.html');
  splashWindow.loadFile(splashPath);
  splashWindow.on('closed', () => { splashWindow = null; });
}

function transitionToMain() {
  if (splashTransitionStarted) return;
  splashTransitionStarted = true;

  if (splashWindow && !splashWindow.isDestroyed()) {
    // Tell splash HTML to complete progress to 100% and initiate smooth fade-out
    splashWindow.webContents.executeJavaScript(`
      if (typeof window.onAppReady === 'function') {
        window.onAppReady();
      }
    `).catch(() => {});

    // After loading bar hits 100% and pauses for visual feedback (~750ms), reveal main window & close splash
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
      }
      setTimeout(() => {
        if (splashWindow && !splashWindow.isDestroyed()) {
          splashWindow.close();
        }
      }, 400);
    }, 750);
  } else {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
    }
  }
}

// Common ad/popup domain patterns to block from embed players
const AD_PATTERNS = [
  '*://*.adsterra.com/*',
  '*://*.propellerads.com/*',
  '*://*.popads.net/*',
  '*://*.popcash.net/*',
  '*://*.bet365.com/*',
  '*://*.1xbet.com/*',
  '*://*.onclickbright.com/*',
  '*://*.deloton.com/*',
  '*://*.exoclick.com/*',
  '*://*.trafficjunky.com/*',
  '*://*.ad-maven.com/*',
  '*://*.monetag.com/*',
  '*://*.wingsmob.com/*',
  '*://*.tagivi.com/*',
  '*://*.grop.net/*'
];

function createWindow() {
  const iconPath = getAppIcon();

  // Inherit exact position and bounds from splashWindow to ensure seamless transition
  let winBounds = { width: APP_WIDTH, height: APP_HEIGHT };
  if (splashWindow && !splashWindow.isDestroyed()) {
    winBounds = splashWindow.getBounds();
  }

  mainWindow = new BrowserWindow({
    width: winBounds.width,
    height: winBounds.height,
    x: winBounds.x,
    y: winBounds.y,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#081114',
    icon: iconPath,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,             // Enabled for security; CSP handles embeds
      allowRunningInsecureContent: false,
      webviewTag: true               // Enable <webview> for standalone player (own process, ad-blocked)
    }
  });

  // Show main window after splash: wait for React app to be ready, then trigger smooth 100% completion & reveal
  mainWindow.once('ready-to-show', () => {
    transitionToMain();
  });

  // Hard safety: transition if ready-to-show never fires within 6s
  setTimeout(() => {
    if (!splashTransitionStarted) {
      transitionToMain();
    }
  }, 6000);

  // Window maximized events with safety checks
  mainWindow.on('maximize', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window:maximize-change', true);
    }
  });
  mainWindow.on('unmaximize', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('window:maximize-change', false);
    }
  });

  // Block ad popups from streaming iframes and webviews
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // If it's a legitimate user-requested external link, open in browser
    if (url.startsWith('https://github.com') || url.startsWith('https://themoviedb.org')) {
      shell.openExternal(url);
    }
    // Block ALL other popups (ads/redirects from embed servers)
    return { action: 'deny' };
  });

  // Also block new windows opened from webview tags
  mainWindow.webContents.on('did-attach-webview', (_, webviewContents) => {
    webviewContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    const checkNavigation = (e, url) => {
      // Prevent webview from navigating away from embed servers
      const embedHosts = [
        'vidy.st',
        'wecollege.net',
        'goldenkite.top',
        'greenkite.top',
        'peakpine.top',
        'urbanmesa.top',
        'calmsable.top',
        'workers.dev',
        'vidsrc.cc',
        'vidsrc.xyz',
        'vidsrc.to',
        'multiembed.mov',
        'cinezo.live',
        '2embed.cc',
        'autoembed.cc',
        'closeload.com'
      ];
      const isEmbed = embedHosts.some(h => url.includes(h));
      if (!isEmbed && !url.startsWith('about:') && !url.startsWith('blob:') && !url.startsWith('data:')) {
        e.preventDefault();
      }
    };

    webviewContents.on('will-navigate', checkNavigation);
    webviewContents.on('will-redirect', checkNavigation);
  });

  // Setup ad blocking, CSP, and header fixing for streaming players
  const ses = session.defaultSession;

  // Allowed embed origins for streaming (CSP frame-src / child-src)
  const EMBED_ORIGINS = [
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

  const CSP_FRAME_SRC = EMBED_ORIGINS.join(' ');
  const CSP_SCRIPT_SRC = [
    "'self'",
    "'unsafe-inline'",  // Required for React dev / inline scripts
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

  // 1. Block ad scripts
  ses.webRequest.onBeforeRequest({ urls: AD_PATTERNS }, (details, callback) => {
    callback({ cancel: true });
  });

  // 2. Apply CSP + Remove restrictive X-Frame-Options & CSP frame-ancestors for embeds
  ses.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders };
    for (const key of Object.keys(responseHeaders)) {
      const lower = key.toLowerCase();
      if (lower === 'x-frame-options') {
        delete responseHeaders[key];
      } else if (lower === 'content-security-policy') {
        responseHeaders[key] = responseHeaders[key].map(policy => {
          // Remove frame-ancestors restrictions from embed responses
          return policy.replace(/frame-ancestors[^;]+;?/gi, '');
        });
      }
    }

    // Add our CSP for the main app (only for main document, not subresources)
    if (details.resourceType === 'mainFrame') {
      responseHeaders['Content-Security-Policy'] = [
        `default-src 'self'`,
        `frame-src ${CSP_FRAME_SRC}`,
        `child-src ${CSP_FRAME_SRC}`,
        `script-src ${CSP_SCRIPT_SRC}`,
        `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
        `font-src 'self' https://fonts.gstatic.com`,
        `img-src 'self' data: https:`,
        `connect-src 'self' https://api.themoviedb.org https://image.tmdb.org https://www.vidy.st`,
        `media-src 'self' https:`,
        `worker-src 'self' blob:`,
      ].join('; ');
    }

    callback({ cancel: false, responseHeaders });
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createSplash();      // Show splash immediately
    createWindow();      // Start loading main window in background

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// -------------------------------------------------------------
// IPC HANDLERS
// -------------------------------------------------------------

function withLogging(handlerName, handler) {
  return async (event, data) => {
    const start = Date.now();
    ipcLogger.debug(`IPC ${handlerName} called`, { data });
    try {
      const result = await handler(event, data);
      ipcLogger.info(`IPC ${handlerName} completed`, { durationMs: Date.now() - start });
      return result;
    } catch (err) {
      ipcLogger.error(`IPC ${handlerName} failed`, { error: err.message, durationMs: Date.now() - start });
      throw err;
    }
  };
}

// Window Controls
ipcMain.handle('window:minimize', withLogging('window:minimize', () => {
  mainWindow?.minimize();
}));

ipcMain.handle('window:maximize', withLogging('window:maximize', () => {
  if (!mainWindow) return false;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
    return false;
  } else {
    mainWindow.maximize();
    return true;
  }
}));

ipcMain.handle('window:close', withLogging('window:close', () => {
  mainWindow?.close();
}));

ipcMain.handle('window:isMaximized', withLogging('window:isMaximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
}));

ipcMain.handle('shell:openExternal', withLogging('shell:openExternal', async (_event, url) => {
  const { url: validatedUrl } = validateIpc(schemas.openExternal)({ url }, _event);
  await shell.openExternal(validatedUrl);
}));

// Sources Data Scraper Handlers (Unified TMDB & Vidy Engine)
ipcMain.handle('sources:getHome', withLogging('sources:getHome', async () => {
  try {
    const data = await UnifiedCatalog.getHome();
    ipcLogger.info('sources:getHome completed', { heroes: data.heroes?.length || 0, items: data.items?.length || 0 });
    return data;
  } catch (err) {
    ipcLogger.error('sources:getHome error', { error: err.message });
    return { heroes: [], items: [] };
  }
}));

ipcMain.handle('sources:getMovies', withLogging('sources:getMovies', async () => {
  try {
    const movies = await UnifiedCatalog.getMovies();
    ipcLogger.info('sources:getMovies completed', { count: movies?.length || 0 });
    return movies;
  } catch (err) {
    ipcLogger.error('sources:getMovies error', { error: err.message });
    return [];
  }
}));

ipcMain.handle('sources:getTvShows', withLogging('sources:getTvShows', async () => {
  try {
    const tvShows = await UnifiedCatalog.getTvShows();
    ipcLogger.info('sources:getTvShows completed', { count: tvShows?.length || 0 });
    return tvShows;
  } catch (err) {
    ipcLogger.error('sources:getTvShows error', { error: err.message });
    return [];
  }
}));

ipcMain.handle('sources:search', withLogging('sources:search', async (_event, data) => {
  const { query } = validateIpc(schemas.search)(data, _event);
  try {
    const results = await UnifiedCatalog.search(query);
    ipcLogger.info('sources:search completed', { query, count: results?.length || 0 });
    return results;
  } catch (err) {
    ipcLogger.error('sources:search error', { query, error: err.message });
    return [];
  }
}));

ipcMain.handle('sources:getDetail', withLogging('sources:getDetail', async (_event, data) => {
  const { type, slug, source, cardTitle } = validateIpc(schemas.getDetail)(data, _event);
  try {
    const detail = await UnifiedCatalog.getDetail(type, slug, source, cardTitle);
    ipcLogger.info('sources:getDetail completed', { slug, title: detail?.title || 'null' });
    return detail;
  } catch (err) {
    ipcLogger.error('sources:getDetail error', { slug, error: err.message });
    return null;
  }
}));

ipcMain.handle('sources:getEpisodes', withLogging('sources:getEpisodes', async (_event, data) => {
  const { slug, seasonNum, source } = validateIpc(schemas.getEpisodes)(data, _event);
  try {
    const eps = await UnifiedCatalog.getEpisodes(slug, seasonNum, source);
    ipcLogger.info('sources:getEpisodes completed', { slug, seasonNum, count: eps?.length || 0 });
    return eps;
  } catch (err) {
    ipcLogger.error('sources:getEpisodes error', { slug, seasonNum, error: err.message });
    return [];
  }
}));

ipcMain.handle('sources:getEpisodeEmbed', withLogging('sources:getEpisodeEmbed', async (_event, data) => {
  const { slug, seasonNum, episodeNum, tmdbId, imdbId, source } = validateIpc(schemas.getEpisodeEmbed)(data, _event);
  try {
    const embed = await UnifiedCatalog.getEpisodeEmbed(slug, seasonNum, episodeNum, tmdbId, imdbId, source);
    ipcLogger.info('sources:getEpisodeEmbed completed', { slug, seasonNum, episodeNum, serverCount: embed?.servers?.length || 0 });
    return embed;
  } catch (err) {
    ipcLogger.error('sources:getEpisodeEmbed error', { slug, seasonNum, episodeNum, error: err.message });
    return { embedUrl: null, servers: [] };
  }
}));

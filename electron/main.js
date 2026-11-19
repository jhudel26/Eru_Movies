const { app, BrowserWindow, ipcMain, shell, session } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Simple .env loader for main process
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
      webSecurity: false,            // Allows cross-domain streaming embeds
      allowRunningInsecureContent: true,
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

  // Setup ad blocking and header fixing for streaming players
  const ses = session.defaultSession;

  // 1. Block ad scripts
  ses.webRequest.onBeforeRequest({ urls: AD_PATTERNS }, (details, callback) => {
    callback({ cancel: true });
  });

  // 2. Remove restrictive X-Frame-Options & CSP frame-ancestors for embeds (case-insensitive)
  ses.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders };
    for (const key of Object.keys(responseHeaders)) {
      const lower = key.toLowerCase();
      if (lower === 'x-frame-options') {
        delete responseHeaders[key];
      } else if (lower === 'content-security-policy') {
        responseHeaders[key] = responseHeaders[key].map(policy => {
          return policy.replace(/frame-ancestors[^;]+;?/gi, '');
        });
      }
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

// Window Controls
ipcMain.handle('window:minimize', () => {
  mainWindow?.minimize();
});

ipcMain.handle('window:maximize', () => {
  if (!mainWindow) return false;
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
    return false;
  } else {
    mainWindow.maximize();
    return true;
  }
});

ipcMain.handle('window:close', () => {
  mainWindow?.close();
});

ipcMain.handle('window:isMaximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

ipcMain.handle('shell:openExternal', async (_event, url) => {
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    await shell.openExternal(url);
  }
});

// Sources Data Scraper Handlers (Unified TMDB & Vidy Engine)
ipcMain.handle('sources:getHome', async () => {
  try {
    const data = await UnifiedCatalog.getHome();
    console.log(`[IPC] sources:getHome -> ${data.heroes?.length || 0} heroes, ${data.items?.length || 0} items`);
    return data;
  } catch (err) {
    console.error('[IPC] sources:getHome error:', err);
    return { heroes: [], items: [] };
  }
});

ipcMain.handle('sources:getMovies', async () => {
  try {
    const movies = await UnifiedCatalog.getMovies();
    console.log(`[IPC] sources:getMovies -> ${movies?.length || 0} movies`);
    return movies;
  } catch (err) {
    console.error('[IPC] sources:getMovies error:', err);
    return [];
  }
});

ipcMain.handle('sources:getTvShows', async () => {
  try {
    const tvShows = await UnifiedCatalog.getTvShows();
    console.log(`[IPC] sources:getTvShows -> ${tvShows?.length || 0} tv shows`);
    return tvShows;
  } catch (err) {
    console.error('[IPC] sources:getTvShows error:', err);
    return [];
  }
});

ipcMain.handle('sources:search', async (_event, { query } = {}) => {
  try {
    const results = await UnifiedCatalog.search(query || '');
    console.log(`[IPC] sources:search "${query}" -> ${results?.length || 0} results`);
    return results;
  } catch (err) {
    console.error('[IPC] sources:search error:', err);
    return [];
  }
});

ipcMain.handle('sources:getDetail', async (_event, { type, slug, source, cardTitle } = {}) => {
  try {
    const detail = await UnifiedCatalog.getDetail(type, slug, source, cardTitle);
    console.log(`[IPC] sources:getDetail "${slug}" -> ${detail?.title || 'null'}`);
    return detail;
  } catch (err) {
    console.error('[IPC] sources:getDetail error:', err);
    return null;
  }
});

ipcMain.handle('sources:getEpisodes', async (_event, { slug, seasonNum, source } = {}) => {
  try {
    const eps = await UnifiedCatalog.getEpisodes(slug, seasonNum, source);
    console.log(`[IPC] sources:getEpisodes "${slug}" S${seasonNum} -> ${eps?.length || 0} episodes`);
    return eps;
  } catch (err) {
    console.error('[IPC] sources:getEpisodes error:', err);
    return [];
  }
});

ipcMain.handle('sources:getEpisodeEmbed', async (_event, { slug, seasonNum, episodeNum, tmdbId, imdbId, source } = {}) => {
  try {
    const embed = await UnifiedCatalog.getEpisodeEmbed(slug, seasonNum, episodeNum, tmdbId, imdbId, source);
    console.log(`[IPC] sources:getEpisodeEmbed S${seasonNum}E${episodeNum} -> ${embed?.servers?.length || 0} servers`);
    return embed;
  } catch (err) {
    console.error('[IPC] sources:getEpisodeEmbed error:', err);
    return { embedUrl: null, servers: [] };
  }
});

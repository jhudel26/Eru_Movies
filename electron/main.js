const { app, BrowserWindow, ipcMain, shell, session } = require('electron');
const path = require('path');
const { RidoMovie, MoviesFree } = require('./scrapers');

// Configure isolated userData directory and prevent Windows Chromium disk/shader cache conflicts
app.name = 'ERU';
app.setPath('userData', path.join(app.getPath('appData'), 'ERU_Cinema'));
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');

let mainWindow = null;

const isDev = process.env.NODE_ENV === 'development';

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
  const iconPath = path.join(__dirname, '../public/icon.png');

  mainWindow = new BrowserWindow({
    width: 1320,
    height: 840,
    minWidth: 1040,
    minHeight: 680,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#081114',
    icon: iconPath,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // Allows seamless cross-domain streaming player embeds
      allowRunningInsecureContent: true
    }
  });

  // Smooth appearance
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      mainWindow.show();
    }
  }, 1200);

  // Window maximized events
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window:maximize-change', true);
  });
  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window:maximize-change', false);
  });

  // Block ad popups from streaming iframes
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // If it's a legitimate user-requested external link, open in browser
    if (url.startsWith('https://github.com') || url.startsWith('https://themoviedb.org')) {
      shell.openExternal(url);
    }
    // Block all other popups (ads/redirects)
    return { action: 'deny' };
  });

  // Setup ad blocking and header fixing for streaming players
  const ses = session.defaultSession;

  // 1. Block ad scripts
  ses.webRequest.onBeforeRequest({ urls: AD_PATTERNS }, (details, callback) => {
    callback({ cancel: true });
  });

  // 2. Remove restrictive X-Frame-Options & CSP frame-ancestors for embeds
  ses.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders };
    delete responseHeaders['x-frame-options'];
    delete responseHeaders['X-Frame-Options'];

    if (responseHeaders['content-security-policy']) {
      responseHeaders['content-security-policy'] = responseHeaders['content-security-policy'].map(policy => {
        return policy.replace(/frame-ancestors[^;]+;?/gi, '');
      });
    }

    callback({ cancel: false, responseHeaders });
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

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

// Sources Data Scraper Handlers
ipcMain.handle('sources:getHome', async (_event, source) => {
  if (source === 'moviesfree') {
    return await MoviesFree.getHome();
  } else {
    // Default to RidoMovie
    const items = await RidoMovie.getHome();
    return {
      heroes: items.slice(0, 5).map(it => ({ ...it, isHero: true })),
      items: items.slice(5)
    };
  }
});

ipcMain.handle('sources:search', async (_event, { source, query }) => {
  if (source === 'moviesfree') {
    return await MoviesFree.search(query);
  } else {
    return await RidoMovie.search(query);
  }
});

ipcMain.handle('sources:getDetail', async (_event, { source, type, slug }) => {
  if (source === 'moviesfree') {
    return await MoviesFree.getDetail(slug);
  } else {
    return await RidoMovie.getDetail(type || 'movie', slug);
  }
});

ipcMain.handle('sources:getEpisodes', async (_event, { source, slug, seasonNum }) => {
  if (source === 'ridomovie') {
    return await RidoMovie.getTvEpisodes(slug, seasonNum);
  }
  // MoviesFree fallback
  return Array.from({ length: 12 }, (_, i) => ({
    number: i + 1,
    title: `Episode ${i + 1}`,
    thumbnail: null
  }));
});

ipcMain.handle('sources:getEpisodeEmbed', async (_event, { source, slug, seasonNum, episodeNum, tmdbId, imdbId }) => {
  if (source === 'ridomovie') {
    return await RidoMovie.getEpisodeEmbed(slug, seasonNum, episodeNum, tmdbId, imdbId);
  }
  const idParam = tmdbId || imdbId || '12345';
  return {
    embedUrl: `https://player.cinezo.live/embed/tv/${idParam}/${seasonNum}/${episodeNum}`,
    servers: [
      { name: 'Cinezo Server', url: `https://player.cinezo.live/embed/tv/${idParam}/${seasonNum}/${episodeNum}` },
      { name: 'SuperEmbed 4K', url: `https://multiembed.mov/?video_id=${idParam}&s=${seasonNum}&e=${episodeNum}` },
      { name: 'VidSrc Alpha', url: `https://vidsrc.xyz/embed/tv?tmdb=${idParam}&season=${seasonNum}&episode=${episodeNum}` }
    ]
  };
});

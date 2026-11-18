const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('eruAPI', {
  // Window controls
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  onMaximizeChange: (callback) => {
    const listener = (_event, isMax) => callback(isMax);
    ipcRenderer.on('window:maximize-change', listener);
    return () => ipcRenderer.removeListener('window:maximize-change', listener);
  },

  // Unified Multi-Source Catalog APIs
  getHome: () => ipcRenderer.invoke('sources:getHome'),
  getMovies: () => ipcRenderer.invoke('sources:getMovies'),
  getTvShows: () => ipcRenderer.invoke('sources:getTvShows'),
  search: (query) => ipcRenderer.invoke('sources:search', { query }),
  getDetail: (type, slug, source, cardTitle) => ipcRenderer.invoke('sources:getDetail', { type, slug, source, cardTitle }),
  getEpisodes: (slug, seasonNum, source) => ipcRenderer.invoke('sources:getEpisodes', { slug, seasonNum, source }),
  getEpisodeEmbed: (slug, seasonNum, episodeNum, tmdbId, imdbId, source) => 
    ipcRenderer.invoke('sources:getEpisodeEmbed', { slug, seasonNum, episodeNum, tmdbId, imdbId, source }),

  // Open external links safely
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url)
});

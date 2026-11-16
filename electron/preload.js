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

  // Sources Scraper APIs
  getHome: (source) => ipcRenderer.invoke('sources:getHome', source),
  search: (source, query) => ipcRenderer.invoke('sources:search', { source, query }),
  getDetail: (source, type, slug) => ipcRenderer.invoke('sources:getDetail', { source, type, slug }),
  getEpisodes: (source, slug, seasonNum) => ipcRenderer.invoke('sources:getEpisodes', { source, slug, seasonNum }),
  getEpisodeEmbed: (source, slug, seasonNum, episodeNum, tmdbId, imdbId) => 
    ipcRenderer.invoke('sources:getEpisodeEmbed', { source, slug, seasonNum, episodeNum, tmdbId, imdbId }),

  // Open external links safely
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url)
});

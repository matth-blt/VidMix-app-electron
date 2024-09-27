const { contextBridge, ipcRenderer } = require('electron');

// Expose Vidsencoder functions
contextBridge.exposeInMainWorld('electron', {
  browseVideoFile: () => ipcRenderer.invoke('browse-video-file'),
  browseOutputFolder: () => ipcRenderer.invoke('browse-output-folder'),
  encodeVideo: (params) => ipcRenderer.invoke('encode-video', params),
  onTerminalMessage: (callback) => ipcRenderer.on('terminal-message', callback),
  openDialog: () => ipcRenderer.invoke('open-dialog'),
  fetchFormats: (url) => ipcRenderer.invoke('fetch-formats', url),
  download: (args) => ipcRenderer.invoke('download', args),
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (event, progress) => callback(progress)),
  // Expose Extract functions
  browseInput: () => ipcRenderer.invoke('browse-input'),
  browseOutput: () => ipcRenderer.invoke('browse-output'),
  extractFrames: (data) => ipcRenderer.invoke('extract-frames', data)
});

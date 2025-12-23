const { contextBridge, ipcRenderer } = require('electron');

// Store listener references for cleanup
let downloadProgressCallback = null;
let terminalMessageCallback = null;

contextBridge.exposeInMainWorld('electron', {
  // System info
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  getBinPath: () => ipcRenderer.invoke('get-bin-path'),
  checkBinaries: () => ipcRenderer.invoke('check-binaries'),

  // Window controls
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),

  // Vidsencoder functions
  browseVideoFile: () => ipcRenderer.invoke('browse-video-file'),
  browseOutputFolder: () => ipcRenderer.invoke('browse-output-folder'),
  encodeVideo: (params) => ipcRenderer.invoke('encode-video', params),

  // Terminal message listener with cleanup support
  onTerminalMessage: (callback) => {
    terminalMessageCallback = (event, message) => callback(message);
    ipcRenderer.on('terminal-message', terminalMessageCallback);
    return terminalMessageCallback;
  },
  removeTerminalMessageListener: () => {
    if (terminalMessageCallback) {
      ipcRenderer.removeListener('terminal-message', terminalMessageCallback);
      terminalMessageCallback = null;
    }
  },

  // YTDownloader functions
  openDialog: () => ipcRenderer.invoke('open-dialog'),
  fetchFormats: (url) => ipcRenderer.invoke('fetch-formats', url),
  download: (args) => ipcRenderer.invoke('download', args),

  // Download progress listener with cleanup support
  onDownloadProgress: (callback) => {
    downloadProgressCallback = (event, progress) => callback(progress);
    ipcRenderer.on('download-progress', downloadProgressCallback);
    return downloadProgressCallback;
  },
  removeDownloadProgressListener: () => {
    if (downloadProgressCallback) {
      ipcRenderer.removeListener('download-progress', downloadProgressCallback);
      downloadProgressCallback = null;
    }
  },

  // Download error listener
  onDownloadError: (callback) => {
    ipcRenderer.on('download-error', (event, error) => callback(error));
  },

  // Extract functions
  browseInput: () => ipcRenderer.invoke('browse-input'),
  browseOutput: () => ipcRenderer.invoke('browse-output'),
  extractFrames: (data) => ipcRenderer.invoke('extract-frames', data),

  // Binary download functions
  downloadYtdlp: () => ipcRenderer.invoke('download-ytdlp'),
  downloadFfmpeg: () => ipcRenderer.invoke('download-ffmpeg'),
  onBinaryProgress: (callback) => {
    ipcRenderer.on('download-binary-progress', (event, data) => callback(data));
  }
});

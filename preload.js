/**
 * @fileoverview VidMix Preload Script
 * @description Exposes safe IPC methods to the renderer process via contextBridge
 */

const { contextBridge, ipcRenderer } = require('electron');

/** @type {Function|null} Listener reference for download progress cleanup */
let downloadProgressCallback = null;

/** @type {Function|null} Listener reference for terminal message cleanup */
let terminalMessageCallback = null;

/**
 * Electron API exposed to renderer process
 * @namespace electron
 */
contextBridge.exposeInMainWorld('electron', {
  /**
   * Gets the current platform
   * @returns {Promise<string>} Platform identifier ('darwin', 'win32', 'linux')
   */
  getPlatform: () => ipcRenderer.invoke('get-platform'),

  /**
   * Gets the binary storage path
   * @returns {Promise<string>} Path to bin directory
   */
  getBinPath: () => ipcRenderer.invoke('get-bin-path'),

  /**
   * Checks status of all binaries
   * @returns {Promise<Object>} Binary status object
   */
  checkBinaries: () => ipcRenderer.invoke('check-binaries'),

  /**
   * Minimizes the window
   */
  minimize: () => ipcRenderer.send('window-minimize'),

  /**
   * Toggles window maximize state
   */
  maximize: () => ipcRenderer.send('window-maximize'),

  /**
   * Closes the application
   */
  close: () => ipcRenderer.send('window-close'),

  /**
   * Opens file dialog for video selection
   * @returns {Promise<string|undefined>} Selected file path
   */
  browseVideoFile: () => ipcRenderer.invoke('browse-video-file'),

  /**
   * Opens folder dialog for output selection
   * @returns {Promise<string|undefined>} Selected folder path
   */
  browseOutputFolder: () => ipcRenderer.invoke('browse-output-folder'),

  /**
   * Encodes a video with specified parameters
   * @param {Object} params - Encoding parameters
   * @returns {Promise<string>} Result message
   */
  encodeVideo: (params) => ipcRenderer.invoke('encode-video', params),

  /**
   * Gets media information for a file
   * @param {string} filePath - Path to media file
   * @returns {Promise<Object>} Media info object
   */
  getMediaInfo: (filePath) => ipcRenderer.invoke('get-media-info', filePath),

  /**
   * Registers terminal message listener
   * @param {Function} callback - Callback for messages
   * @returns {Function} Listener reference
   */
  onTerminalMessage: (callback) => {
    terminalMessageCallback = (event, message) => callback(message);
    ipcRenderer.on('terminal-message', terminalMessageCallback);
    return terminalMessageCallback;
  },

  /**
   * Removes terminal message listener
   */
  removeTerminalMessageListener: () => {
    if (terminalMessageCallback) {
      ipcRenderer.removeListener('terminal-message', terminalMessageCallback);
      terminalMessageCallback = null;
    }
  },

  /**
   * Opens directory dialog
   * @returns {Promise<Electron.OpenDialogReturnValue>}
   */
  openDialog: () => ipcRenderer.invoke('open-dialog'),

  /**
   * Fetches available formats for a URL
   * @param {string} url - Video URL
   * @returns {Promise<string>} Format list
   */
  fetchFormats: (url) => ipcRenderer.invoke('fetch-formats', url),

  /**
   * Downloads video/audio from URL
   * @param {Object} args - Download arguments
   * @returns {Promise<Object>} Download result
   */
  download: (args) => ipcRenderer.invoke('download', args),

  /**
   * Registers download progress listener
   * @param {Function} callback - Progress callback
   * @returns {Function} Listener reference
   */
  onDownloadProgress: (callback) => {
    downloadProgressCallback = (event, progress) => callback(progress);
    ipcRenderer.on('download-progress', downloadProgressCallback);
    return downloadProgressCallback;
  },

  /**
   * Removes download progress listener
   */
  removeDownloadProgressListener: () => {
    if (downloadProgressCallback) {
      ipcRenderer.removeListener('download-progress', downloadProgressCallback);
      downloadProgressCallback = null;
    }
  },

  /**
   * Registers download error listener
   * @param {Function} callback - Error callback
   */
  onDownloadError: (callback) => {
    ipcRenderer.on('download-error', (event, error) => callback(error));
  },

  /**
   * Opens file dialog for frame extraction input
   * @returns {Promise<string|undefined>} Selected file path
   */
  browseInput: () => ipcRenderer.invoke('browse-input'),

  /**
   * Opens folder dialog for frame extraction output
   * @returns {Promise<string|undefined>} Selected folder path
   */
  browseOutput: () => ipcRenderer.invoke('browse-output'),

  /**
   * Extracts frames from video
   * @param {Object} data - Extraction parameters
   * @returns {Promise<Object>} Extraction result
   */
  extractFrames: (data) => ipcRenderer.invoke('extract-frames', data),

  /**
   * Downloads yt-dlp binary
   * @returns {Promise<Object>} Download result
   */
  downloadYtdlp: () => ipcRenderer.invoke('download-ytdlp'),

  /**
   * Downloads FFmpeg/FFprobe binaries
   * @returns {Promise<Object>} Download result
   */
  downloadFfmpeg: () => ipcRenderer.invoke('download-ffmpeg'),

  /**
   * Registers binary download progress listener
   * @param {Function} callback - Progress callback with {name, progress, message}
   */
  onBinaryProgress: (callback) => {
    ipcRenderer.on('download-binary-progress', (event, data) => callback(data));
  },

  /**
   * Registers encoding progress listener
   * @param {Function} callback - Progress callback with {progress, status, eta}
   */
  onEncodingProgress: (callback) => {
    ipcRenderer.on('encoding-progress', (event, data) => callback(data));
  }
});

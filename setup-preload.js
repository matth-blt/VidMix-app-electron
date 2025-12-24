/**
 * @fileoverview VidMix Setup Preload Script
 * @description Exposes setup-specific IPC methods to the setup wizard renderer
 */

const { contextBridge, ipcRenderer } = require('electron');

/**
 * Setup API exposed to renderer process
 * @namespace electron
 */
contextBridge.exposeInMainWorld('electron', {
    /**
     * Checks status of all binaries
     * @returns {Promise<Object>} Binary status object
     */
    checkBinaries: () => ipcRenderer.invoke('check-binaries'),

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
     * Closes the setup window
     */
    close: () => ipcRenderer.send('window-close'),

    /**
     * Launches the main application
     */
    launchApp: () => ipcRenderer.send('launch-main-app')
});

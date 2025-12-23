/**
 * VidMix Setup Preload Script
 */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    // Check binaries
    checkBinaries: () => ipcRenderer.invoke('check-binaries'),

    // Download binaries
    downloadYtdlp: () => ipcRenderer.invoke('download-ytdlp'),
    downloadFfmpeg: () => ipcRenderer.invoke('download-ffmpeg'),

    // Progress listener
    onBinaryProgress: (callback) => {
        ipcRenderer.on('download-binary-progress', (event, data) => callback(data));
    },

    // Window controls
    close: () => ipcRenderer.send('window-close'),

    // Launch main app
    launchApp: () => ipcRenderer.send('launch-main-app')
});

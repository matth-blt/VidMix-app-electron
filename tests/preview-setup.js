/**
 * VidMix Setup Preview
 * Launches just the setup window for testing/preview purposes
 * Run with: npm run preview-setup
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let setupWindow;

function createSetupWindow() {
    setupWindow = new BrowserWindow({
        width: 550,
        height: 500,
        resizable: false,
        frame: false,
        center: true,
        backgroundColor: '#0d0d14',
        webPreferences: {
            preload: path.join(__dirname, '..', 'setup-preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: false
        }
    });

    setupWindow.loadFile(path.join(__dirname, '..', 'setup.html'));

    // Open DevTools for debugging
    // setupWindow.webContents.openDevTools();

    setupWindow.on('closed', () => {
        setupWindow = null;
        app.quit();
    });
}

// Mock IPC handlers for preview
ipcMain.handle('check-binaries', async () => {
    // Simulate mixed state for preview
    return {
        ffmpeg: { found: true, path: '/opt/homebrew/bin/ffmpeg', isSystem: true },
        ffprobe: { found: false },
        ytdlp: { found: true, path: '/opt/homebrew/bin/yt-dlp', isSystem: true }
    };
});

ipcMain.handle('download-ffmpeg', async () => {
    // Simulate download progress
    for (let i = 0; i <= 100; i += 10) {
        setupWindow?.webContents.send('binary-progress', {
            name: 'ffmpeg',
            progress: i,
            message: `Downloading FFmpeg... ${i}%`
        });
        await new Promise(r => setTimeout(r, 200));
    }
    return { success: true, path: '/mock/path/ffmpeg' };
});

ipcMain.handle('download-ytdlp', async () => {
    // Simulate download progress
    for (let i = 0; i <= 100; i += 10) {
        setupWindow?.webContents.send('binary-progress', {
            name: 'ytdlp',
            progress: i,
            message: `Downloading yt-dlp... ${i}%`
        });
        await new Promise(r => setTimeout(r, 150));
    }
    return { success: true, path: '/mock/path/yt-dlp' };
});

ipcMain.handle('launch-main-app', () => {
    console.log('[Preview] Would launch main app here');
    app.quit();
});

ipcMain.on('window-close', () => {
    app.quit();
});

app.whenReady().then(() => {
    createSetupWindow();
    console.log('🎬 VidMix Setup Preview launched');
    console.log('   This is a preview of the installer UI');
    console.log('   Close the window to exit');
});

app.on('window-all-closed', () => {
    app.quit();
});

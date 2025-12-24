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
    // Simulate: ffmpeg found, ffprobe and ytdlp missing
    return {
        ffmpeg: { found: true, path: '/opt/homebrew/bin/ffmpeg', isSystem: true },
        ffprobe: { found: false },
        ytdlp: { found: false }
    };
});

ipcMain.handle('download-ffmpeg', async () => {
    // Simulate download progress
    for (let i = 0; i <= 100; i += 5) {
        setupWindow?.webContents.send('binary-progress', {
            name: 'ffmpeg',
            progress: i
        });
        await new Promise(r => setTimeout(r, 100));
    }
    return {
        success: true,
        path: '/mock/path/ffmpeg',
        ffprobePath: '/mock/path/ffprobe'
    };
});

ipcMain.handle('download-ytdlp', async () => {
    // Simulate download progress
    for (let i = 0; i <= 100; i += 8) {
        setupWindow?.webContents.send('binary-progress', {
            name: 'ytdlp',
            progress: Math.min(i, 100)
        });
        await new Promise(r => setTimeout(r, 80));
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
    console.log('');
    console.log('   Current mock state:');
    console.log('   - FFmpeg: ✅ Found (system)');
    console.log('   - FFprobe: ❌ Missing');
    console.log('   - yt-dlp: ❌ Missing');
});

app.on('window-all-closed', () => {
    app.quit();
});

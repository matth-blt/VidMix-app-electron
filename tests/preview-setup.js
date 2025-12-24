/**
 * VidMix Setup Preview with REAL Downloads
 * Tests the download progress with actual files
 * Run with: npm run preview-setup
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const https = require('https');
const fs = require('fs');
const os = require('os');

let setupWindow;
const platform = process.platform;

// Real download URLs (same as main.js)
const downloadUrls = {
    darwin: {
        ffmpeg: 'https://evermeet.cx/ffmpeg/getrelease/zip',
        ffprobe: 'https://evermeet.cx/ffmpeg/getrelease/ffprobe/zip',
        ytdlp: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos'
    },
    win32: {
        ffmpeg: 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip',
        ytdlp: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
    }
};

// Download helper with progress
function downloadFile(url, destPath, onProgress) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destPath);

        const doRequest = (urlToFetch, redirectCount = 0) => {
            if (redirectCount > 10) {
                reject(new Error('Too many redirects'));
                return;
            }

            const urlObj = new URL(urlToFetch);
            const httpModule = urlObj.protocol === 'https:' ? https : require('http');

            httpModule.get(urlToFetch, (response) => {
                if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                    const redirectUrl = new URL(response.headers.location, urlToFetch).href;
                    return doRequest(redirectUrl, redirectCount + 1);
                }

                if (response.statusCode !== 200) {
                    reject(new Error(`HTTP ${response.statusCode}`));
                    return;
                }

                const totalSize = parseInt(response.headers['content-length'], 10);
                let downloadedSize = 0;
                let lastReportedProgress = 0;

                console.log(`[Download] Content-Length: ${totalSize || 'not provided'}`);

                response.on('data', (chunk) => {
                    downloadedSize += chunk.length;

                    if (onProgress) {
                        if (totalSize && !isNaN(totalSize) && totalSize > 0) {
                            const progress = Math.round((downloadedSize / totalSize) * 100);
                            if (progress !== lastReportedProgress) {
                                lastReportedProgress = progress;
                                onProgress(progress, downloadedSize, totalSize);
                            }
                        } else {
                            const estimatedSize = 100 * 1024 * 1024;
                            const fakeProgress = Math.min(95, Math.round((downloadedSize / estimatedSize) * 100));
                            if (fakeProgress !== lastReportedProgress) {
                                lastReportedProgress = fakeProgress;
                                onProgress(fakeProgress, downloadedSize, null);
                            }
                        }
                    }
                });

                response.pipe(file);

                file.on('finish', () => {
                    file.close();
                    console.log(`[Download] Complete: ${downloadedSize} bytes`);
                    resolve(destPath);
                });

                file.on('error', (err) => {
                    fs.unlink(destPath, () => { });
                    reject(err);
                });
            }).on('error', (err) => {
                fs.unlink(destPath, () => { });
                reject(err);
            });
        };

        doRequest(url);
    });
}

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
    // setupWindow.webContents.openDevTools();

    setupWindow.on('closed', () => {
        setupWindow = null;
        app.quit();
    });
}

// Mock: All binaries missing for testing
ipcMain.handle('check-binaries', async () => {
    return {
        ffmpeg: { found: false },
        ffprobe: { found: false },
        ytdlp: { found: false }
    };
});

// REAL download test for FFmpeg (just downloads to temp, doesn't install)
ipcMain.handle('download-ffmpeg', async () => {
    const urls = downloadUrls[platform];
    if (!urls?.ffmpeg) {
        return { success: false, error: 'No URL for this platform' };
    }

    const tmpFile = path.join(os.tmpdir(), 'ffmpeg-test.zip');
    console.log(`[Preview] Testing REAL download: ${urls.ffmpeg}`);

    try {
        await downloadFile(urls.ffmpeg, tmpFile, (progress, downloaded, total) => {
            const mb = (downloaded / 1024 / 1024).toFixed(1);
            const totalMb = total ? (total / 1024 / 1024).toFixed(1) : '?';
            const message = `FFmpeg: ${mb}/${totalMb} MB`;
            console.log(`Progress: ${progress}% - ${message}`);

            setupWindow?.webContents.send('download-binary-progress', {
                name: 'ffmpeg',
                progress: Math.round(progress * 0.9),
                message: message
            });
        });

        // Cleanup test file
        fs.unlinkSync(tmpFile);

        setupWindow?.webContents.send('download-binary-progress', {
            name: 'ffmpeg',
            progress: 100,
            message: 'Done!'
        });

        return { success: true, path: '/test/ffmpeg' };
    } catch (err) {
        console.error('[Preview] Download error:', err);
        return { success: false, error: err.message };
    }
});

// REAL download test for yt-dlp
ipcMain.handle('download-ytdlp', async () => {
    const urls = downloadUrls[platform];
    if (!urls?.ytdlp) {
        return { success: false, error: 'No URL for this platform' };
    }

    const tmpFile = path.join(os.tmpdir(), 'ytdlp-test');
    console.log(`[Preview] Testing REAL download: ${urls.ytdlp}`);

    try {
        await downloadFile(urls.ytdlp, tmpFile, (progress, downloaded, total) => {
            const mb = (downloaded / 1024 / 1024).toFixed(1);
            const totalMb = total ? (total / 1024 / 1024).toFixed(1) : '?';
            const message = `yt-dlp: ${mb}/${totalMb} MB`;
            console.log(`Progress: ${progress}% - ${message}`);

            setupWindow?.webContents.send('download-binary-progress', {
                name: 'ytdlp',
                progress: Math.round(progress * 0.9),
                message: message
            });
        });

        // Cleanup test file
        fs.unlinkSync(tmpFile);

        setupWindow?.webContents.send('download-binary-progress', {
            name: 'ytdlp',
            progress: 100,
            message: 'Done!'
        });

        return { success: true, path: '/test/yt-dlp' };
    } catch (err) {
        console.error('[Preview] Download error:', err);
        return { success: false, error: err.message };
    }
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
    console.log('🎬 VidMix Setup Preview - REAL DOWNLOAD TEST');
    console.log('   Downloads will use actual URLs to test progress');
    console.log('   Files are deleted after download (test only)');
    console.log('');
    console.log(`   Platform: ${platform}`);
    console.log('   All binaries marked as MISSING for testing');
});

app.on('window-all-closed', () => {
    app.quit();
});

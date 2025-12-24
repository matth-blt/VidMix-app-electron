const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { exec, spawn, execFile } = require('child_process');

// Paths
const userDataPath = app.getPath('userData');
const binPath = path.join(userDataPath, 'bin');
const platform = process.platform; // 'darwin', 'win32', 'linux'

// Ensure bin directory exists
if (!fs.existsSync(binPath)) {
  fs.mkdirSync(binPath, { recursive: true });
}

// Binary paths
const getBinaryPath = (name) => {
  const ext = platform === 'win32' ? '.exe' : '';
  return path.join(binPath, name + ext);
};

// Find system-installed binary using 'which' (Unix) or 'where' (Windows)
function findSystemBinary(name) {
  try {
    const command = platform === 'win32' ? 'where' : 'which';
    const result = require('child_process').execSync(`${command} ${name}`, { encoding: 'utf-8' });
    const binPath = result.trim().split('\n')[0]; // Take first result
    if (binPath && fs.existsSync(binPath)) {
      return binPath;
    }
  } catch (e) {
    // Not found
  }
  return null;
}

// Initialize binary paths with priority:
// 1. Local downloaded binary
// 2. System-installed binary (brew, apt, etc.)
// 3. null (not found)
function initBinaryPath(name) {
  // 1. Check local binary
  const localPath = getBinaryPath(name);
  if (fs.existsSync(localPath)) {
    console.log(`[VidMix] Using local ${name}: ${localPath}`);
    return localPath;
  }

  // 2. Check system binary
  const systemPath = findSystemBinary(name);
  if (systemPath) {
    console.log(`[VidMix] Using system ${name}: ${systemPath}`);
    return systemPath;
  }

  console.log(`[VidMix] ${name} not found`);
  return null;
}

let ffmpegPath = initBinaryPath('ffmpeg');
let ffprobePath = initBinaryPath('ffprobe');
let ytdlpPath = initBinaryPath('yt-dlp');

let mainWindow;
let setupWindow;

// Check if this is first run (no binaries installed)
function needsSetup() {
  // Check if any critical binary is missing
  return !ffmpegPath || !ffprobePath;
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
      preload: path.join(__dirname, 'setup-preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    }
  });

  setupWindow.loadFile('setup.html');

  setupWindow.on('closed', () => {
    setupWindow = null;
  });
}

function createWindow() {
  // macOS: traffic lights on left, Windows/Linux: buttons on right
  const titleBarStyle = platform === 'darwin' ? 'hiddenInset' : 'hidden';

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    titleBarStyle: titleBarStyle,
    trafficLightPosition: { x: 12, y: 12 },
    backgroundColor: '#0d0d14',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');
}

// IPC handler to launch main app from setup
ipcMain.on('launch-main-app', () => {
  if (setupWindow) {
    setupWindow.close();
  }
  // Re-initialize binary paths after download
  ffmpegPath = initBinaryPath('ffmpeg');
  ffprobePath = initBinaryPath('ffprobe');
  ytdlpPath = initBinaryPath('yt-dlp');

  createWindow();
});

// System info handlers
ipcMain.handle('get-platform', () => platform);
ipcMain.handle('get-bin-path', () => binPath);
ipcMain.handle('check-binaries', () => {
  return {
    ffmpeg: {
      found: !!ffmpegPath,
      path: ffmpegPath,
      isSystem: ffmpegPath && !ffmpegPath.includes(binPath)
    },
    ffprobe: {
      found: !!ffprobePath,
      path: ffprobePath,
      isSystem: ffprobePath && !ffprobePath.includes(binPath)
    },
    ytdlp: {
      found: !!ytdlpPath,
      path: ytdlpPath,
      isSystem: ytdlpPath && !ytdlpPath.includes(binPath)
    }
  };
});

// Window control IPC handlers
ipcMain.on('window-minimize', () => mainWindow?.minimize());
ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.on('window-close', () => {
  // Quit the app completely (not just close window)
  app.quit();
});

// ===== Binary Download Handlers =====
const downloadUrls = {
  darwin: {
    ffmpeg: 'https://evermeet.cx/ffmpeg/getrelease/zip',
    ffprobe: 'https://evermeet.cx/ffmpeg/getrelease/ffprobe/zip',
    ytdlp: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos'
  },
  win32: {
    ffmpeg: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip',
    ytdlp: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
  },
  linux: {
    ffmpeg: 'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz',
    ytdlp: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp'
  }
};

// Helper to download file with proper redirect handling
function downloadFile(url, destPath, onProgress) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);

    const doRequest = (urlToFetch, redirectCount = 0) => {
      if (redirectCount > 10) {
        reject(new Error('Too many redirects'));
        return;
      }

      // Parse URL to handle both http and https
      const urlObj = new URL(urlToFetch);
      const httpModule = urlObj.protocol === 'https:' ? https : require('http');

      httpModule.get(urlToFetch, (response) => {
        // Handle redirects (301, 302, 303, 307, 308)
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          // Resolve relative URLs
          const redirectUrl = new URL(response.headers.location, urlToFetch).href;
          return doRequest(redirectUrl, redirectCount + 1);
        }

        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}`));
          return;
        }

        const totalSize = parseInt(response.headers['content-length'], 10);
        let downloadedSize = 0;

        response.on('data', (chunk) => {
          downloadedSize += chunk.length;
          if (totalSize && onProgress) {
            onProgress(Math.round((downloadedSize / totalSize) * 100));
          }
        });

        response.pipe(file);

        file.on('finish', () => {
          file.close();
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

// Download yt-dlp
ipcMain.handle('download-ytdlp', async (event) => {
  const urls = downloadUrls[platform];
  if (!urls?.ytdlp) throw new Error('No yt-dlp URL for this platform');

  const destPath = getBinaryPath('yt-dlp');

  try {
    mainWindow?.webContents.send('download-binary-progress', { name: 'ytdlp', progress: 0, message: 'Downloading yt-dlp...' });

    await downloadFile(urls.ytdlp, destPath, (progress) => {
      mainWindow?.webContents.send('download-binary-progress', { name: 'ytdlp', progress });
    });

    // Make executable on Unix
    if (platform !== 'win32') {
      fs.chmodSync(destPath, '755');
    }

    return { success: true, path: destPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Download FFmpeg with extraction
ipcMain.handle('download-ffmpeg', async (event) => {
  const urls = downloadUrls[platform];
  if (!urls?.ffmpeg) throw new Error('No FFmpeg URL for this platform');

  const extractZip = require('extract-zip');
  const os = require('os');
  const tmpDir = os.tmpdir();

  try {
    if (platform === 'darwin') {
      // macOS: Download ffmpeg and ffprobe separately (zip files)
      mainWindow?.webContents.send('download-binary-progress', { name: 'ffmpeg', progress: 0, message: 'Downloading FFmpeg...' });

      // Download ffmpeg
      const ffmpegZip = path.join(tmpDir, 'ffmpeg.zip');
      await downloadFile(urls.ffmpeg, ffmpegZip, (progress) => {
        mainWindow?.webContents.send('download-binary-progress', { name: 'ffmpeg', progress: Math.round(progress * 0.4), message: 'Downloading FFmpeg...' });
      });

      // Extract ffmpeg
      mainWindow?.webContents.send('download-binary-progress', { name: 'ffmpeg', progress: 45, message: 'Extracting FFmpeg...' });
      await extractZip(ffmpegZip, { dir: binPath });
      fs.unlinkSync(ffmpegZip);

      // Download ffprobe
      mainWindow?.webContents.send('download-binary-progress', { name: 'ffmpeg', progress: 50, message: 'Downloading FFprobe...' });
      const ffprobeZip = path.join(tmpDir, 'ffprobe.zip');
      await downloadFile(urls.ffprobe, ffprobeZip, (progress) => {
        mainWindow?.webContents.send('download-binary-progress', { name: 'ffmpeg', progress: 50 + Math.round(progress * 0.4), message: 'Downloading FFprobe...' });
      });

      // Extract ffprobe
      mainWindow?.webContents.send('download-binary-progress', { name: 'ffmpeg', progress: 95, message: 'Extracting FFprobe...' });
      await extractZip(ffprobeZip, { dir: binPath });
      fs.unlinkSync(ffprobeZip);

      // Make executable
      fs.chmodSync(path.join(binPath, 'ffmpeg'), '755');
      fs.chmodSync(path.join(binPath, 'ffprobe'), '755');

      mainWindow?.webContents.send('download-binary-progress', { name: 'ffmpeg', progress: 100, message: 'Done!' });
      return { success: true, path: binPath };

    } else if (platform === 'win32') {
      // Windows: Download the full package and extract
      mainWindow?.webContents.send('download-binary-progress', { name: 'ffmpeg', progress: 0, message: 'Downloading FFmpeg (large file)...' });

      const ffmpegZip = path.join(tmpDir, 'ffmpeg-win.zip');
      await downloadFile(urls.ffmpeg, ffmpegZip, (progress) => {
        mainWindow?.webContents.send('download-binary-progress', { name: 'ffmpeg', progress: Math.round(progress * 0.7), message: 'Downloading FFmpeg...' });
      });

      mainWindow?.webContents.send('download-binary-progress', { name: 'ffmpeg', progress: 75, message: 'Extracting (this may take a moment)...' });

      // Extract to temp, then move binaries
      const extractDir = path.join(tmpDir, 'ffmpeg-extract');
      await extractZip(ffmpegZip, { dir: extractDir });

      // Find the bin folder in extracted content
      const dirs = fs.readdirSync(extractDir);
      const ffmpegDir = dirs.find(d => d.includes('ffmpeg'));
      if (ffmpegDir) {
        const binDir = path.join(extractDir, ffmpegDir, 'bin');
        if (fs.existsSync(binDir)) {
          // Copy binaries
          for (const file of ['ffmpeg.exe', 'ffprobe.exe']) {
            const src = path.join(binDir, file);
            const dest = path.join(binPath, file);
            if (fs.existsSync(src)) {
              fs.copyFileSync(src, dest);
            }
          }
        }
      }

      // Cleanup
      fs.unlinkSync(ffmpegZip);
      fs.rmSync(extractDir, { recursive: true, force: true });

      mainWindow?.webContents.send('download-binary-progress', { name: 'ffmpeg', progress: 100, message: 'Done!' });
      return { success: true, path: binPath };

    } else {
      // Linux: tar.xz requires different handling
      return {
        success: false,
        error: 'Linux auto-download not yet implemented. Please download from johnvansickle.com/ffmpeg/',
        urls: urls
      };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

app.whenReady().then(() => {
  // Check if setup is needed (first run or missing binaries)
  if (needsSetup()) {
    console.log('[VidMix] Setup required - launching setup window');
    createSetupWindow();
  } else {
    console.log('[VidMix] All binaries found - launching main app');
    createWindow();
  }

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      if (needsSetup()) {
        createSetupWindow();
      } else {
        createWindow();
      }
    }
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Vidsencoder IPC handlers
ipcMain.handle('browse-video-file', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Fichiers vidéo', extensions: ['mp4', 'mkv', 'mov', 'm2ts', 'webm', 'avi', 'wmv', 'flv'] }]
  });
  return result.filePaths[0];
});

// Get media info using ffprobe
ipcMain.handle('get-media-info', async (event, filePath) => {
  if (!ffprobePath) {
    return { error: 'FFprobe not found' };
  }

  return new Promise((resolve) => {
    const args = [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      '-show_streams',
      filePath
    ];

    execFile(ffprobePath, args, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        resolve({ error: error.message });
        return;
      }

      try {
        const data = JSON.parse(stdout);
        const videoStream = data.streams?.find(s => s.codec_type === 'video');
        const audioStream = data.streams?.find(s => s.codec_type === 'audio');
        const format = data.format;

        // Calculate file size
        const fileSizeBytes = parseInt(format?.size || 0);
        const fileSizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2);

        // Calculate duration
        const durationSec = parseFloat(format?.duration || 0);
        const hours = Math.floor(durationSec / 3600);
        const minutes = Math.floor((durationSec % 3600) / 60);
        const seconds = Math.floor(durationSec % 60);
        const duration = hours > 0
          ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
          : `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // Calculate FPS
        let fps = 'N/A';
        if (videoStream?.r_frame_rate) {
          const [num, den] = videoStream.r_frame_rate.split('/');
          fps = (parseInt(num) / parseInt(den)).toFixed(2);
        }

        // Calculate bitrate
        const bitrate = format?.bit_rate
          ? `${(parseInt(format.bit_rate) / 1000).toFixed(0)} kbps`
          : 'N/A';

        resolve({
          filename: path.basename(filePath),
          path: filePath,
          size: `${fileSizeMB} MB`,
          duration: duration,
          resolution: videoStream ? `${videoStream.width}x${videoStream.height}` : 'N/A',
          videoCodec: videoStream?.codec_name?.toUpperCase() || 'N/A',
          audioCodec: audioStream?.codec_name?.toUpperCase() || 'N/A',
          fps: fps,
          bitrate: bitrate,
          pixelFormat: videoStream?.pix_fmt || 'N/A',
          colorSpace: videoStream?.color_space || 'N/A',
          audioChannels: audioStream?.channels || 'N/A',
          sampleRate: audioStream?.sample_rate ? `${audioStream.sample_rate} Hz` : 'N/A'
        });
      } catch (e) {
        resolve({ error: 'Failed to parse media info' });
      }
    });
  });
});

ipcMain.handle('browse-output-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  return result.filePaths[0];
});

ipcMain.handle('encode-video', async (event, { inputPath, outputPath, videoName, encoder, format, resolution }) => {
  // Check if FFmpeg is available
  if (!ffmpegPath || !fs.existsSync(ffmpegPath)) {
    event.sender.send('terminal-message', 'Error: FFmpeg not found. Please download it from Settings.');
    throw new Error('FFmpeg not found. Go to Settings to download.');
  }

  const outputFile = path.join(outputPath, `${videoName}.${format}`);

  // Step 1: Get total duration using ffprobe
  let totalDurationMs = 0;
  try {
    const durationResult = await new Promise((resolve, reject) => {
      execFile(ffprobePath, [
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        inputPath
      ], (error, stdout) => {
        if (error) reject(error);
        else resolve(stdout.trim());
      });
    });
    totalDurationMs = parseFloat(durationResult) * 1000000; // Convert to microseconds
    event.sender.send('terminal-message', `Duration: ${(totalDurationMs / 1000000).toFixed(2)}s`);
  } catch (e) {
    event.sender.send('terminal-message', `Warning: Could not get duration, progress will be estimated`);
    totalDurationMs = 0;
  }

  // Build encoder-specific arguments
  const encoderArgs = {
    'x264': ['-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-profile:v', 'high'],
    'x265': ['-c:v', 'libx265', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p10le', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709'],
    'ProRes': ['-c:v', 'prores_ks', '-profile:v', '4', '-vendor', 'apl0', '-bits_per_mb', '8000', '-pix_fmt', 'yuva444p10le'],
    'FFV1': ['-c:v', 'ffv1', '-coder', '2', '-context', '1', '-level', '3', '-slices', '12', '-g', '1'],
    'AV1': ['-c:v', 'libsvtav1', '-preset', '6', '-crf', '25', '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709'],
    'VP9': ['-c:v', 'libvpx-vp9', '-crf', '30', '-b:v', '0', '-pix_fmt', 'yuv420p']
  }[encoder] || ['-c:v', 'libx264', '-preset', 'medium', '-crf', '18'];

  // Build ffmpeg arguments array
  let ffmpegArgs = ['-hide_banner', '-y', '-i', inputPath];

  // Add progress output to stdout
  ffmpegArgs.push('-progress', 'pipe:1');

  // Add resolution filter if needed
  if (resolution !== 'Keep') {
    ffmpegArgs.push('-vf', `scale=${resolution}:flags=lanczos`);
  }

  // Add encoder arguments and output file
  ffmpegArgs = ffmpegArgs.concat(encoderArgs);
  ffmpegArgs.push('-c:a', 'copy'); // Copy audio
  ffmpegArgs.push(outputFile);

  event.sender.send('terminal-message', `Starting encode: ${encoder} → ${format}`);
  event.sender.send('encoding-progress', { progress: 0, status: 'Starting...', eta: '' });

  return new Promise((resolve, reject) => {
    const ffmpegProcess = spawn(ffmpegPath, ffmpegArgs);
    let lastProgress = 0;

    // Parse progress from stdout (key=value format)
    ffmpegProcess.stdout.on('data', (data) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        // Parse out_time_us (microseconds)
        if (line.startsWith('out_time_us=')) {
          const outTimeUs = parseInt(line.split('=')[1], 10);
          if (totalDurationMs > 0 && outTimeUs > 0) {
            const progress = Math.min(100, Math.round((outTimeUs / totalDurationMs) * 100));
            if (progress !== lastProgress) {
              lastProgress = progress;
              const timeProcessed = (outTimeUs / 1000000).toFixed(1);
              const totalTime = (totalDurationMs / 1000000).toFixed(1);
              event.sender.send('encoding-progress', {
                progress,
                status: `Encoding... ${timeProcessed}s / ${totalTime}s`,
                eta: ''
              });
            }
          }
        }
        // Parse speed for ETA calculation
        if (line.startsWith('speed=')) {
          const speedStr = line.split('=')[1];
          if (speedStr && speedStr !== 'N/A') {
            const speed = parseFloat(speedStr.replace('x', ''));
            if (speed > 0 && totalDurationMs > 0 && lastProgress < 100) {
              const remainingMs = totalDurationMs * (1 - lastProgress / 100);
              const etaSeconds = Math.round(remainingMs / 1000000 / speed);
              const etaMin = Math.floor(etaSeconds / 60);
              const etaSec = etaSeconds % 60;
              event.sender.send('encoding-progress', {
                progress: lastProgress,
                status: `Encoding... ${lastProgress}%`,
                eta: `ETA: ${etaMin}m ${etaSec}s (${speedStr})`
              });
            }
          }
        }
      }
    });

    // Log stderr (FFmpeg logs to stderr)
    ffmpegProcess.stderr.on('data', (data) => {
      const message = data.toString().trim();
      // Only log important messages, not every frame
      if (message.includes('Error') || message.includes('error') ||
        message.includes('Stream') || message.includes('encoder')) {
        event.sender.send('terminal-message', message);
      }
    });

    ffmpegProcess.on('close', (code) => {
      if (code === 0) {
        event.sender.send('encoding-progress', { progress: 100, status: 'Complete!', eta: '' });
        event.sender.send('terminal-message', `✓ Encoding complete: ${outputFile}`);
        resolve('Encoding complete');
      } else {
        event.sender.send('terminal-message', `✗ Encoding failed with code ${code}`);
        reject(`Encoding failed with code ${code}`);
      }
    });

    ffmpegProcess.on('error', (err) => {
      event.sender.send('terminal-message', `✗ Error: ${err.message}`);
      reject(err.message);
    });
  });
});

// YTDownloader IPC handlers
ipcMain.handle('open-dialog', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  return result;
});

ipcMain.handle('fetch-formats', (event, url) => {
  return new Promise((resolve, reject) => {
    const ytDlp = spawn(ytdlpPath, ['--no-playlist', '-F', url]);

    let output = '';
    let errorOutput = '';

    ytDlp.stdout.on('data', data => {
      output += data.toString();
    });

    // Collect stderr but don't reject immediately (yt-dlp sends warnings to stderr)
    ytDlp.stderr.on('data', data => {
      errorOutput += data.toString();
    });

    ytDlp.on('close', code => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(errorOutput || 'Failed to fetch formats');
      }
    });

    ytDlp.on('error', err => {
      reject(`yt-dlp not found or failed to start: ${err.message}`);
    });
  });
});

ipcMain.handle('download', (event, args) => {
  const { url, outputFolder, videoFormat, audioFormat, videoEnabled, audioEnabled, autoMode } = args;

  let ytdlpArgs;

  if (autoMode) {
    // Auto mode: Best quality with recommended options
    ytdlpArgs = [
      '--no-playlist',
      '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best',
      '--merge-output-format', 'mp4',
      '--add-metadata',
      '--embed-thumbnail',
      '--embed-chapters',
      '-o', `${outputFolder}/%(title)s.%(ext)s`,
      url
    ];
  } else {
    // Manual mode: Use format IDs
    let formatStr;

    if (videoEnabled && audioEnabled) {
      formatStr = `${videoFormat}+${audioFormat}`;
    } else if (videoEnabled) {
      formatStr = videoFormat;
    } else {
      formatStr = audioFormat;
    }

    ytdlpArgs = [
      '--no-playlist',
      '-f', formatStr,
      '-o', `${outputFolder}/%(title)s.%(ext)s`
    ];

    if (videoEnabled && audioEnabled) {
      ytdlpArgs.push('--merge-output-format', 'mkv');
    } else if (!videoEnabled) {
      ytdlpArgs.push('-x', '--audio-format', 'mp3');
    }

    ytdlpArgs.push(url);
  }

  console.log('[VidMix] yt-dlp args:', ytdlpArgs.join(' '));

  const ytDlp = spawn(ytdlpPath, ytdlpArgs);

  let stderrData = '';

  ytDlp.stdout.on('data', data => {
    const msg = data.toString();
    console.log('[yt-dlp]', msg);
    event.sender.send('download-progress', msg);
    event.sender.send('terminal-message', msg.trim());
  });

  ytDlp.stderr.on('data', data => {
    const msg = data.toString();
    console.log('[yt-dlp ERROR]', msg);
    stderrData += msg;
    event.sender.send('terminal-message', `[stderr] ${msg.trim()}`);
  });

  return new Promise((resolve, reject) => {
    ytDlp.on('close', code => {
      if (code === 0) {
        event.sender.send('terminal-message', '✓ Download complete!');
        resolve('Download complete!');
      } else {
        const errorMsg = stderrData || `Exit code: ${code}`;
        event.sender.send('terminal-message', `✗ Download failed: ${errorMsg}`);
        reject(`Download failed: ${errorMsg}`);
      }
    });
  });
});

// Extract IPC handlers
ipcMain.handle('browse-input', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Video Files', extensions: ['mkv', 'mp4', 'webm', 'mov'] }]
  });
  return result.filePaths[0];
});

ipcMain.handle('browse-output', async () => {
  const result = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  return result.filePaths[0];
});

ipcMain.handle('extract-frames', async (event, { inputPath, outputPath, format, createFolder }) => {
  // Create output folder if needed
  if (createFolder && !fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  let ffmpegArgs = [];

  if (format === 'PNG') {
    ffmpegArgs = ['-hide_banner', '-i', inputPath, '-sws_flags', 'spline+accurate_rnd+full_chroma_int', '-color_trc', '2', '-colorspace', '2', '-color_primaries', '2', '-map', '0:v', '-c:v', 'png', '-pix_fmt', 'rgb24', '-start_number', '0', path.join(outputPath, '%08d.png')];
  } else if (format === 'TIFF') {
    ffmpegArgs = ['-hide_banner', '-i', inputPath, '-sws_flags', 'spline+accurate_rnd+full_chroma_int', '-color_trc', '1', '-colorspace', '1', '-color_primaries', '1', '-map', '0:v', '-c:v', 'tiff', '-pix_fmt', 'rgb24', '-compression_algo', 'deflate', '-start_number', '0', path.join(outputPath, '%08d.tiff')];
  } else if (format === 'JPEG') {
    ffmpegArgs = ['-hide_banner', '-i', inputPath, '-sws_flags', 'spline+accurate_rnd+full_chroma_int', '-color_trc', '2', '-colorspace', '2', '-color_primaries', '2', '-map', '0:v', '-c:v', 'mjpeg', '-pix_fmt', 'yuvj420p', '-q:v', '1', '-start_number', '0', path.join(outputPath, '%08d.jpg')];
  }

  return new Promise((resolve, reject) => {
    event.sender.send('terminal-message', `Extracting frames to: ${outputPath}`);

    execFile(ffmpegPath, ffmpegArgs, (error, stdout, stderr) => {
      if (error) {
        event.sender.send('terminal-message', `✗ Extract failed: ${stderr}`);
        reject(stderr);
      } else {
        event.sender.send('terminal-message', '✓ Frames extracted successfully!');
        resolve(stdout);
      }
    });
  });
});

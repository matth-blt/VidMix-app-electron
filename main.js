const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { exec, spawn, execFile } = require('child_process');
const ffmpeg = require('ffmpeg-static');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 784,
    height: 643,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Vidsencoder IPC handlers
ipcMain.handle('browse-video-file', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Fichiers vidéo', extensions: ['mp4', 'mkv', 'mov', 'm2ts', 'webm'] }]
  });
  return result.filePaths[0];
});

ipcMain.handle('browse-output-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  return result.filePaths[0];
});

ipcMain.handle('encode-video', async (event, { inputPath, outputPath, videoName, encoder, format, resolution }) => {
  const outputFile = path.join(outputPath, `${videoName}.${format}`);
  const resolutionCommand = resolution !== 'Keep' ? `-vf "scale=${resolution}:flags=lanczos"` : '';
  const encoderCommand = {
    'x264': '-c:v libx264 -b:v 35M -g 120 -keyint_min 120 -sc_threshold 0 -pix_fmt yuv420p -color_primaries bt709 -color_trc bt709 -colorspace bt709 -profile:v high -bf 2 -b_strategy 2',
    'x265': '-c:v libx265 -b:v 30M -g 120 -keyint_min 120 -sc_threshold 0 -pix_fmt yuv420p10le -color_primaries bt709 -color_trc bt709 -colorspace bt709 -rc:v cbr',
    'ProRes': '-c:v prores_ks -profile:v 4 -vendor apl0 -bits_per_mb 8000 -pix_fmt yuva444p10le',
    'FFV1': '-c:v ffv1 -coder 2 -context 1 -level 3 -slices 12 -g 1',
    'AV1': '-c:v libsvtav1 -b:v 30M -g 120 -keyint_min 120 -sc_threshold 0 -pix_fmt yuv420p -color_primaries bt709 -color_trc bt709 -colorspace bt709 -rc:v cbr'
  }[encoder];

  const ffmpegCommand = `"${ffmpeg}" -hide_banner -y -i "${inputPath}" ${resolutionCommand} ${encoderCommand} "${outputFile}"`;

  return new Promise((resolve, reject) => {
    exec(ffmpegCommand, (error, stdout, stderr) => {
      if (error) {
        event.sender.send('terminal-message', `Erreur : ${error.message}`);
        reject(error.message);
        return;
      }
      event.sender.send('terminal-message', `Succès : ${stdout || stderr}`);
      resolve(stdout || stderr);
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
    const ytDlp = spawn('yt-dlp', ['-F', url]);

    let output = '';
    ytDlp.stdout.on('data', data => {
      output += data.toString();
    });

    ytDlp.stderr.on('data', data => {
      reject(data.toString());
    });

    ytDlp.on('close', () => {
      resolve(output);
    });
  });
});

ipcMain.handle('download', (event, args) => {
  const { url, outputFolder, videoFormat, audioFormat } = args;
  const ytDlp = spawn('yt-dlp', [
    '-f', `${videoFormat}+${audioFormat}`,
    '-o', `${outputFolder}/%(title)s.%(ext)s`,
    '--merge-output-format', 'mkv',
    url
  ]);

  ytDlp.stdout.on('data', data => {
    event.sender.send('download-progress', data.toString());
  });

  ytDlp.stderr.on('data', data => {
    event.sender.send('download-error', data.toString());
  });

  return new Promise((resolve, reject) => {
    ytDlp.on('close', code => {
      if (code === 0) {
        resolve('Download complete!');
      } else {
        reject('Download failed!');
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

ipcMain.handle('extract-frames', async (event, { inputPath, outputPath, format }) => {
  let ffmpegArgs = [];

  if (format === 'PNG') {
    ffmpegArgs = ['-hide_banner', '-i', inputPath, '-sws_flags', 'spline+accurate_rnd+full_chroma_int', '-color_trc', '2', '-colorspace', '2', '-color_primaries', '2', '-map', '0:v', '-c:v', 'png', '-pix_fmt', 'rgb24', '-start_number', '0', path.join(outputPath, '%08d.png')];
  } else if (format === 'TIFF') {
    ffmpegArgs = ['-hide_banner', '-i', inputPath, '-sws_flags', 'spline+accurate_rnd+full_chroma_int', '-color_trc', '1', '-colorspace', '1', '-color_primaries', '1', '-map', '0:v', '-c:v', 'tiff', '-pix_fmt', 'rgb24', '-compression_algo', 'deflate', '-start_number', '0', '-movflags', 'frag_keyframe+empty_moov+delay_moov+use_metadata_tags+write_colr', '-bf', '0', path.join(outputPath, '%08d.tiff')];
  } else if (format === 'JPEG') {
    ffmpegArgs = ['-hide_banner', '-i', inputPath, '-sws_flags', 'spline+accurate_rnd+full_chroma_int', '-color_trc', '2', '-colorspace', '2', '-color_primaries', '2', '-map', '0:v', '-c:v', 'mjpeg', '-pix_fmt', 'yuvj420p', '-q:v', '1', '-start_number', '0', path.join(outputPath, '%08d.jpg')];
  }

  return new Promise((resolve, reject) => {
    execFile(ffmpeg, ffmpegArgs, (error, stdout, stderr) => {
      if (error) {
        reject(stderr);
      } else {
        resolve(stdout);
      }
    });
  });
});

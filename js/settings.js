/**
 * Settings Module
 * Handles app settings and binary downloads
 */

export const template = `
  <div class="animate-fadeIn">
    <div class="tool-header">
      <i class="fas fa-cog"></i>
      <h2>Settings</h2>
    </div>
    
    <div class="form-group">
      <label>FFmpeg / FFprobe</label>
      <div class="input-row">
        <input type="text" class="form-input" id="ffmpeg-path" disabled placeholder="Checking...">
        <button class="btn" id="download-ffmpeg"><i class="fas fa-download"></i> Download</button>
      </div>
      <div id="ffmpeg-status" class="status-text"></div>
    </div>
    
    <div class="form-group">
      <label>yt-dlp</label>
      <div class="input-row">
        <input type="text" class="form-input" id="ytdlp-path" disabled placeholder="Checking...">
        <button class="btn" id="download-ytdlp"><i class="fas fa-download"></i> Download</button>
      </div>
      <div id="ytdlp-status" class="status-text"></div>
    </div>
    
    <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.05); margin: 24px 0;">
    
    <div class="form-group">
      <label>Storage</label>
      <div class="input-row">
        <input type="text" class="form-input" id="bin-path" disabled placeholder="Loading...">
        <button class="btn" id="open-bin-folder"><i class="fas fa-folder-open"></i> Open</button>
      </div>
    </div>
    
    <div class="form-group">
      <label>About</label>
      <div style="color: var(--text-muted); font-size: 8pt; line-height: 1.8;">
        <strong>VidMix</strong> v1.2.0<br>
        Video encoding, downloading, and frame extraction tool.
      </div>
    </div>
  </div>
`;

export async function init(log) {
  // Check binaries status
  await updateBinaryStatus(log);

  // Get bin path
  try {
    const binPath = await window.electron.getBinPath();
    document.getElementById('bin-path').value = binPath;
  } catch (e) { }

  // Download yt-dlp
  document.getElementById('download-ytdlp')?.addEventListener('click', async () => {
    const statusEl = document.getElementById('ytdlp-status');
    const btn = document.getElementById('download-ytdlp');

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Downloading...';
    statusEl.textContent = 'Starting download...';
    statusEl.style.color = 'var(--accent-primary)';

    log('Downloading yt-dlp...', 'info');

    try {
      const result = await window.electron.downloadYtdlp();
      if (result.success) {
        statusEl.textContent = '✓ Downloaded successfully';
        statusEl.style.color = 'var(--success)';
        document.getElementById('ytdlp-path').value = result.path;
        log('yt-dlp downloaded successfully!', 'success');
      } else {
        statusEl.textContent = '✗ ' + result.error;
        statusEl.style.color = 'var(--error)';
        log('yt-dlp download failed: ' + result.error, 'error');
      }
    } catch (e) {
      statusEl.textContent = '✗ Download failed';
      statusEl.style.color = 'var(--error)';
      log('yt-dlp download error: ' + e.message, 'error');
    }

    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-download"></i> Download';
  });

  // Download FFmpeg
  document.getElementById('download-ffmpeg')?.addEventListener('click', async () => {
    const statusEl = document.getElementById('ffmpeg-status');

    log('FFmpeg download...', 'info');

    try {
      const result = await window.electron.downloadFfmpeg();
      if (result.success) {
        statusEl.textContent = '✓ Downloaded successfully';
        statusEl.style.color = 'var(--success)';
        log('FFmpeg downloaded!', 'success');
      } else {
        statusEl.innerHTML = result.error + '<br><a href="#" style="color: var(--accent-primary);">Click to download manually</a>';
        statusEl.style.color = 'var(--warning)';
        log(result.error, 'warning');
      }
    } catch (e) {
      statusEl.textContent = '✗ ' + e.message;
      statusEl.style.color = 'var(--error)';
    }
  });

  // Listen to download progress
  window.electron.onBinaryProgress?.((data) => {
    // Map name to status element ID
    const statusId = data.name === 'ytdlp' ? 'ytdlp-status' : `${data.name}-status`;
    const statusEl = document.getElementById(statusId);

    if (statusEl) {
      if (data.message) {
        statusEl.textContent = data.message;
        statusEl.style.color = 'var(--accent-primary)';
      } else if (data.progress !== undefined) {
        statusEl.textContent = `Downloading: ${data.progress}%`;
        statusEl.style.color = 'var(--accent-primary)';
      }
    }
  });

  log('Settings loaded.', 'info');
}

async function updateBinaryStatus(log) {
  try {
    const binaries = await window.electron.checkBinaries();

    // FFmpeg status
    const ffmpegInput = document.getElementById('ffmpeg-path');
    const ffmpegStatus = document.getElementById('ffmpeg-status');
    if (binaries.ffmpeg.found) {
      const source = binaries.ffmpeg.isSystem ? '(system)' : '(local)';
      ffmpegInput.value = `✓ ${source}`;
      ffmpegStatus.textContent = binaries.ffmpeg.path;
      ffmpegStatus.style.color = 'var(--success)';
    } else {
      ffmpegInput.value = 'Not installed';
      ffmpegStatus.textContent = 'Click Download to install';
      ffmpegStatus.style.color = 'var(--warning)';
    }

    // yt-dlp status
    const ytdlpInput = document.getElementById('ytdlp-path');
    const ytdlpStatus = document.getElementById('ytdlp-status');
    if (binaries.ytdlp.found) {
      const source = binaries.ytdlp.isSystem ? '(system)' : '(local)';
      ytdlpInput.value = `✓ ${source}`;
      ytdlpStatus.textContent = binaries.ytdlp.path;
      ytdlpStatus.style.color = 'var(--success)';
    } else {
      ytdlpInput.value = 'Not installed';
      ytdlpStatus.textContent = 'Click Download to install';
      ytdlpStatus.style.color = 'var(--warning)';
    }
  } catch (e) {
    log('Could not check binaries: ' + e.message, 'error');
  }
}

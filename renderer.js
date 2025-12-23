/**
 * VidMix Renderer
 * Main entry point for UI logic
 */

// Import modules
import * as vidsencoder from './js/vidsencoder.js';
import * as ytdownloader from './js/ytdownloader.js';
import * as extract from './js/extract.js';
import * as settings from './js/settings.js';

// ===== State Management =====
const state = {
  currentTab: 'vidsencoder',
  queue: [],
  isProcessing: false,
  mediaInfo: null
};

// Module map
const modules = {
  vidsencoder,
  ytdownloader,
  extract,
  settings
};

// ===== DOM Elements =====
let toolPanel, terminal, queueContent, mediainfoContent;
let progressFill, progressPercent, progressStatus, progressEta;

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', async () => {
  // Cache DOM elements
  toolPanel = document.getElementById('tool-panel');
  terminal = document.getElementById('terminal');
  queueContent = document.getElementById('queue');
  mediainfoContent = document.getElementById('mediainfo');
  progressFill = document.getElementById('progress-fill');
  progressPercent = document.getElementById('progress-percent');
  progressStatus = document.getElementById('progress-status');
  progressEta = document.getElementById('progress-eta');

  // Detect OS and adapt UI
  await detectAndAdaptOS();

  // Setup
  setupNavigation();
  setupWindowControls();
  setupQueueControls();
  setupIPCListeners();

  // Check binaries status
  await checkBinariesStatus();

  // Load initial tab
  loadTab('vidsencoder');

  // Log ready
  log('VidMix ready.', 'success');
});

// ===== OS Detection =====
async function detectAndAdaptOS() {
  try {
    const platform = await window.electron.getPlatform();
    document.body.classList.add(`platform-${platform}`);

    // macOS: hide custom window buttons (use native traffic lights)
    if (platform === 'darwin') {
      const titlebarButtons = document.querySelector('.titlebar-buttons');
      if (titlebarButtons) {
        titlebarButtons.style.display = 'none';
      }
      // Add padding for traffic lights
      const titlebar = document.querySelector('.titlebar');
      if (titlebar) {
        titlebar.style.paddingLeft = '80px';
      }
    }

    log(`Platform: ${platform}`, 'info');
  } catch (e) {
    log('Could not detect platform', 'warning');
  }
}

// ===== Check Binaries =====
async function checkBinariesStatus() {
  try {
    const binaries = await window.electron.checkBinaries();
    if (!binaries.ffmpeg.found) {
      log('⚠ FFmpeg not found. Go to Settings to download.', 'warning');
    } else {
      const source = binaries.ffmpeg.isSystem ? 'system' : 'local';
      log(`FFmpeg: ${source} (${binaries.ffmpeg.path})`, 'info');
    }
    if (!binaries.ytdlp.found) {
      log('⚠ yt-dlp not found. Go to Settings to download.', 'warning');
    }
  } catch (e) {
    // Ignore
  }
}

// ===== Navigation =====
function setupNavigation() {
  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.addEventListener('click', () => {
      const tab = item.dataset.tab;
      if (tab) loadTab(tab);
    });
  });
}

function loadTab(tabName) {
  // Update sidebar active state
  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.classList.toggle('active', item.dataset.tab === tabName);
  });

  // Get module
  const module = modules[tabName];
  if (!module) return;

  // Load template
  toolPanel.innerHTML = module.template;
  state.currentTab = tabName;

  // Initialize module with shared functions
  module.init(log, addQueueItem, updateMediaInfo, getFileName);
}

// ===== Queue Management =====
function setupQueueControls() {
  document.getElementById('clear-queue')?.addEventListener('click', clearQueue);
  document.getElementById('start-queue')?.addEventListener('click', startQueue);
  document.getElementById('clear-terminal')?.addEventListener('click', () => {
    terminal.innerHTML = '';
    log('Terminal cleared.', 'info');
  });
}

function addQueueItem(item) {
  item.id = Date.now();
  state.queue.push(item);
  renderQueue();
  log(`Added to queue: ${item.title}`, 'success');
}

function removeQueueItem(id) {
  state.queue = state.queue.filter(item => item.id !== id);
  renderQueue();
}

function clearQueue() {
  state.queue = [];
  renderQueue();
  log('Queue cleared.', 'info');
}

function renderQueue() {
  const count = state.queue.length;
  document.getElementById('queue-count').textContent = count;

  if (count === 0) {
    queueContent.innerHTML = `
      <div class="queue-empty">
        <i class="fas fa-inbox"></i>
        <p>No tasks in queue</p>
      </div>
    `;
    return;
  }

  queueContent.innerHTML = state.queue.map(item => `
    <div class="queue-item" data-id="${item.id}">
      <div class="queue-thumb">
        <i class="fas ${item.icon}"></i>
      </div>
      <div class="queue-item-info">
        <div class="queue-item-title">${item.title}</div>
        <div class="queue-item-path">${item.subtitle || item.status}</div>
      </div>
      <button class="queue-item-remove" data-id="${item.id}">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `).join('');

  // Add remove handlers
  queueContent.querySelectorAll('.queue-item-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeQueueItem(parseInt(btn.dataset.id));
    });
  });
}

async function startQueue() {
  if (state.queue.length === 0) {
    log('Queue is empty.', 'warning');
    return;
  }

  if (state.isProcessing) {
    log('Already processing queue.', 'warning');
    return;
  }

  state.isProcessing = true;
  log('Starting queue...', 'info');

  for (let i = 0; i < state.queue.length; i++) {
    const item = state.queue[i];
    const progress = ((i + 1) / state.queue.length) * 100;

    updateProgress(progress * 0.5, `Processing: ${item.title}`);
    log(`Processing: ${item.title}`, 'info');

    try {
      await processQueueItem(item);
      item.status = 'Complete';
      log(`✓ Completed: ${item.title}`, 'success');
    } catch (error) {
      item.status = 'Failed';
      log(`✗ Failed: ${item.title} - ${error}`, 'error');
    }

    renderQueue();
  }

  updateProgress(100, 'Complete');
  state.isProcessing = false;
  log('Queue finished.', 'success');
}

async function processQueueItem(item) {
  switch (item.type) {
    case 'encode':
      return await window.electron.encodeVideo(item.data);
    case 'download':
      return await window.electron.download(item.data);
    case 'extract':
      return await window.electron.extractFrames(item.data);
  }
}

// ===== Progress =====
function updateProgress(percent, status, eta = '') {
  if (progressFill) progressFill.style.width = `${percent}%`;
  if (progressPercent) progressPercent.textContent = `${Math.round(percent)}%`;
  if (progressStatus) progressStatus.textContent = status;
  if (progressEta) progressEta.textContent = eta;
}

// ===== Terminal =====
function log(message, type = '') {
  if (!terminal) return;
  const line = document.createElement('div');
  line.className = `terminal-line ${type}`;
  line.textContent = `> ${message}`;
  terminal.appendChild(line);
  terminal.scrollTop = terminal.scrollHeight;
}

// ===== Media Info =====
async function updateMediaInfo(filePath) {
  if (!mediainfoContent) return;
  const fileName = getFileName(filePath);

  // Show loading state
  mediainfoContent.innerHTML = `
    <div class="mediainfo-header-text">
      <i class="fas fa-spinner fa-spin"></i>
      <span class="file-name">${fileName}</span>
    </div>
    <div class="mediainfo-empty">Loading...</div>
  `;

  try {
    const info = await window.electron.getMediaInfo(filePath);

    if (info.error) {
      mediainfoContent.innerHTML = `
        <div class="mediainfo-header-text">
          <i class="fas fa-exclamation-triangle"></i>
          <span class="file-name">${fileName}</span>
        </div>
        <div class="mediainfo-empty">${info.error}</div>
      `;
      return;
    }

    mediainfoContent.innerHTML = `
      <div class="mediainfo-header-text">
        <i class="fas fa-video"></i>
        <span class="file-name">${info.filename}</span>
      </div>
      <ul class="mediainfo-list">
        <li><span class="mediainfo-label">Duration</span> <span class="mediainfo-value">${info.duration}</span></li>
        <li><span class="mediainfo-label">Resolution</span> <span class="mediainfo-value">${info.resolution}</span></li>
        <li><span class="mediainfo-label">Video</span> <span class="mediainfo-value">${info.videoCodec}</span></li>
        <li><span class="mediainfo-label">Audio</span> <span class="mediainfo-value">${info.audioCodec}</span></li>
        <li><span class="mediainfo-label">FPS</span> <span class="mediainfo-value">${info.fps}</span></li>
        <li><span class="mediainfo-label">Bitrate</span> <span class="mediainfo-value">${info.bitrate}</span></li>
        <li><span class="mediainfo-label">Size</span> <span class="mediainfo-value">${info.size}</span></li>
        <li><span class="mediainfo-label">Pixel Fmt</span> <span class="mediainfo-value">${info.pixelFormat}</span></li>
      </ul>
    `;

    log(`Loaded: ${info.filename} (${info.duration}, ${info.resolution})`, 'info');
  } catch (e) {
    mediainfoContent.innerHTML = `
      <div class="mediainfo-header-text">
        <i class="fas fa-exclamation-triangle"></i>
        <span class="file-name">${fileName}</span>
      </div>
      <div class="mediainfo-empty">Error loading media info</div>
    `;
    log(`Error loading media info: ${e.message}`, 'error');
  }
}

// ===== Window Controls =====
function setupWindowControls() {
  document.getElementById('btn-minimize')?.addEventListener('click', () => {
    window.electron?.minimize?.();
  });
  document.getElementById('btn-maximize')?.addEventListener('click', () => {
    window.electron?.maximize?.();
  });
  document.getElementById('btn-close')?.addEventListener('click', () => {
    window.electron?.close?.();
  });
}

// ===== IPC Listeners =====
function setupIPCListeners() {
  window.electron?.onDownloadProgress?.((progress) => {
    const match = progress.match(/(\d+(\.\d+)?)%/);
    if (match) {
      updateProgress(parseFloat(match[1]), 'Downloading...');
    }
    // Log raw yt-dlp output
    log(progress.trim());
  });

  window.electron?.onTerminalMessage?.((message) => {
    log(message);
  });
}

// ===== Utilities =====
function getFileName(filePath) {
  return filePath.split(/[\\/]/).pop().split('.').slice(0, -1).join('.');
}

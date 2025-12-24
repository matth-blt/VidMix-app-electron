/**
 * VidMix Renderer
 * Main entry point for UI logic
 */

/** Module imports */
import * as vidsencoder from './js/vidsencoder.js';
import * as ytdownloader from './js/ytdownloader.js';
import * as extract from './js/extract.js';
import * as settings from './js/settings.js';

/** State Management */
const state = {
  currentTab: 'vidsencoder',
  queue: [],
  isProcessing: false,
  mediaInfo: null
};

/** Module registry */
const modules = {
  vidsencoder,
  ytdownloader,
  extract,
  settings
};

/** DOM Elements */
let toolPanel, terminal, queueContent, mediainfoContent;
let progressFill, progressPercent, progressStatus, progressEta;
let splashOverlay, splashStatus;

/** Initialization */
document.addEventListener('DOMContentLoaded', async () => {
  toolPanel = document.getElementById('tool-panel');
  terminal = document.getElementById('terminal');
  queueContent = document.getElementById('queue');
  mediainfoContent = document.getElementById('mediainfo');
  progressFill = document.getElementById('progress-fill');
  progressPercent = document.getElementById('progress-percent');
  progressStatus = document.getElementById('progress-status');
  progressEta = document.getElementById('progress-eta');
  splashOverlay = document.getElementById('splash-overlay');
  splashStatus = document.getElementById('splash-status');

  await initializeWithSplash();
});

/**
 * Initializes the application with splash screen
 * @async
 */
async function initializeWithSplash() {
  try {
    updateSplashStatus('Detecting platform...');
    await detectAndAdaptOS();

    updateSplashStatus('Checking binaries...');
    await checkBinariesStatus();

    updateSplashStatus('Setting up interface...');
    setupNavigation();
    setupWindowControls();
    setupQueueControls();
    setupIPCListeners();

    updateSplashStatus('Loading modules...');
    loadTab('vidsencoder');

    await new Promise(resolve => setTimeout(resolve, 1800));
    await hideSplash();
    log('VidMix ready.', 'success');
  } catch (e) {
    console.error('Initialization error:', e);
    updateSplashStatus(`Error: ${e.message}`);
  }
}

/**
 * Updates the splash screen status text
 * @param {string} text - Status message to display
 */
function updateSplashStatus(text) {
  if (splashStatus) {
    splashStatus.textContent = text;
  }
}

/**
 * Hides the splash screen with animation
 * @async
 */
async function hideSplash() {
  if (!splashOverlay) return;
  splashOverlay.classList.add('sweep-out');
  await new Promise(resolve => setTimeout(resolve, 600));
  splashOverlay.classList.add('hidden');
}

/**
 * Detects the OS and adapts UI accordingly
 * @async
 */
async function detectAndAdaptOS() {
  try {
    const platform = await window.electron.getPlatform();
    document.body.classList.add(`platform-${platform}`);

    if (platform === 'darwin') {
      const titlebarButtons = document.querySelector('.titlebar-buttons');
      if (titlebarButtons) {
        titlebarButtons.style.display = 'none';
      }
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

/**
 * Checks and logs the status of required binaries
 * @async
 */
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

/**
 * Sets up sidebar navigation click handlers
 */
function setupNavigation() {
  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.addEventListener('click', () => {
      const tab = item.dataset.tab;
      if (tab) loadTab(tab);
    });
  });
}

/**
 * Loads and initializes a tab module
 * @param {string} tabName - Name of the tab to load
 */
function loadTab(tabName) {
  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.classList.toggle('active', item.dataset.tab === tabName);
  });

  const module = modules[tabName];
  if (!module) return;

  toolPanel.innerHTML = module.template;
  state.currentTab = tabName;

  module.init(log, addQueueItem, updateMediaInfo, getFileName);
}

/**
 * Sets up queue control button handlers
 */
function setupQueueControls() {
  document.getElementById('clear-queue')?.addEventListener('click', clearQueue);
  document.getElementById('start-queue')?.addEventListener('click', startQueue);
  document.getElementById('clear-terminal')?.addEventListener('click', () => {
    terminal.innerHTML = '';
    log('Terminal cleared.', 'info');
  });
}

/**
 * Adds an item to the processing queue
 * @param {Object} item - Queue item with title and processing info
 */
function addQueueItem(item) {
  item.id = Date.now();
  state.queue.push(item);
  renderQueue();
  log(`Added to queue: ${item.title}`, 'success');
}

/**
 * Removes an item from the queue by ID
 * @param {number} id - Item ID to remove
 */
function removeQueueItem(id) {
  state.queue = state.queue.filter(item => item.id !== id);
  renderQueue();
}

/**
 * Clears all items from the queue
 */
function clearQueue() {
  state.queue = [];
  renderQueue();
  log('Queue cleared.', 'info');
}

/**
 * Renders the queue UI
 */
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

  queueContent.querySelectorAll('.queue-item-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeQueueItem(parseInt(btn.dataset.id));
    });
  });
}

/**
 * Starts processing all items in the queue
 * @async
 */
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

/**
 * Processes a single queue item based on its type
 * @async
 * @param {Object} item - Queue item with type and data
 * @returns {Promise<*>} Processing result
 */
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

/**
 * Updates the progress bar UI
 * @param {number} percent - Progress percentage (0-100)
 * @param {string} status - Status message
 * @param {string} [eta=''] - Optional ETA string
 */
function updateProgress(percent, status, eta = '') {
  if (progressFill) progressFill.style.width = `${percent}%`;
  if (progressPercent) progressPercent.textContent = `${Math.round(percent)}%`;
  if (progressStatus) progressStatus.textContent = status;
  if (progressEta) progressEta.textContent = eta;
}

/**
 * Logs a message to the terminal panel
 * @param {string} message - Message to log
 * @param {string} [type=''] - Message type (info, success, warning, error)
 */
function log(message, type = '') {
  if (!terminal) return;
  const line = document.createElement('div');
  line.className = `terminal-line ${type}`;
  line.textContent = `> ${message}`;
  terminal.appendChild(line);
  terminal.scrollTop = terminal.scrollHeight;
}

/**
 * Updates the media info panel with file details
 * @async
 * @param {string} filePath - Path to media file
 */
async function updateMediaInfo(filePath) {
  if (!mediainfoContent) return;
  const fileName = getFileName(filePath);

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

/**
 * Sets up window control button handlers (minimize, maximize, close)
 */
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

/**
 * Sets up IPC event listeners for progress and messages
 */
function setupIPCListeners() {
  window.electron?.onDownloadProgress?.((progress) => {
    const match = progress.match(/(\d+(\.\d+)?)%/);
    if (match) {
      updateProgress(parseFloat(match[1]), 'Downloading...');
    }
    log(progress.trim());
  });

  window.electron?.onTerminalMessage?.((message) => {
    log(message);
  });

  window.electron?.onEncodingProgress?.((data) => {
    if (data.progress !== undefined) {
      updateProgress(data.progress, data.status || 'Encoding...');
    }
    if (data.eta && progressEta) {
      progressEta.textContent = data.eta;
    }
  });
}

/**
 * Extracts filename without extension from a path
 * @param {string} filePath - Full file path
 * @returns {string} Filename without extension
 */
function getFileName(filePath) {
  return filePath.split(/[\\/]/).pop().split('.').slice(0, -1).join('.');
}

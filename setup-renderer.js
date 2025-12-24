/**
 * VidMix Setup Renderer
 * Handles first-run setup wizard logic
 */

// Screen elements
const screens = {
    splash: document.getElementById('screen-splash'),
    requirements: document.getElementById('screen-requirements')
};

const splashStatus = document.getElementById('splash-status');

// Binary status elements
const binaries = ['ffmpeg', 'ffprobe', 'ytdlp'];
const binaryElements = {};

binaries.forEach(name => {
    binaryElements[name] = {
        card: document.getElementById(`card-${name}`),
        status: document.getElementById(`status-${name}`),
        path: document.getElementById(`path-${name}`),
        progress: document.getElementById(`progress-${name}`),
        progressFill: document.getElementById(`progress-fill-${name}`),
        progressText: document.getElementById(`progress-text-${name}`),
        downloadBtn: document.getElementById(`download-${name}`),
        check: document.getElementById(`check-${name}`)
    };
});

// Action buttons
const btnSkip = document.getElementById('btn-skip');
const btnDownloadAll = document.getElementById('btn-download-all');
const btnContinue = document.getElementById('btn-continue');
const btnClose = document.getElementById('btn-close');

// State
let binariesStatus = {};
let missingBinaries = [];
let currentlyDownloading = null;

// ===== Screen Navigation =====
function showScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screenName].classList.add('active');
}

// ===== Initialize =====
async function init() {
    // Show splash for at least 1.5 seconds
    splashStatus.textContent = 'Checking system...';

    // Check binaries in background
    const checkPromise = checkBinaries();
    const delayPromise = new Promise(resolve => setTimeout(resolve, 2000));

    await Promise.all([checkPromise, delayPromise]);

    // Show requirements screen
    showScreen('requirements');
    updateUI();
}

// ===== Check Binaries =====
async function checkBinaries() {
    try {
        binariesStatus = await window.electron.checkBinaries();
        missingBinaries = [];

        // Map result to our UI
        const mapping = {
            ffmpeg: 'ffmpeg',
            ffprobe: 'ffprobe',
            ytdlp: 'ytdlp'
        };

        Object.entries(mapping).forEach(([key, name]) => {
            const info = binariesStatus[key];
            if (info && info.found) {
                markAsFound(name, info.path, info.isSystem ? 'System' : 'Local');
            } else {
                markAsMissing(name);
                missingBinaries.push(name);
            }
        });
    } catch (e) {
        console.error('Error checking binaries:', e);
    }
}

// ===== Update UI based on binary status =====
function updateUI() {
    if (missingBinaries.length > 0) {
        btnDownloadAll.style.display = 'flex';
        btnContinue.style.display = 'none';
    } else {
        btnDownloadAll.style.display = 'none';
        btnContinue.style.display = 'flex';
    }
}

function markAsFound(name, path, source) {
    const el = binaryElements[name];
    if (!el) return;

    el.card.classList.add('found');
    el.card.classList.remove('missing');
    el.status.textContent = `Installed (${source})`;
    el.status.classList.add('found');
    el.status.classList.remove('missing');
    el.path.textContent = path || '';
    el.path.style.display = 'block';
    el.progress.style.display = 'none';
    el.downloadBtn.style.display = 'none';
    el.check.style.display = 'flex';
}

function markAsMissing(name) {
    const el = binaryElements[name];
    if (!el) return;

    el.card.classList.add('missing');
    el.card.classList.remove('found');
    el.status.textContent = 'Not found';
    el.status.classList.add('missing');
    el.status.classList.remove('found');
    el.path.textContent = '';
    el.path.style.display = 'none';
    el.progress.style.display = 'none';
    el.downloadBtn.style.display = 'flex';
    el.check.style.display = 'none';
}

function showInlineProgress(name, isWaiting = false) {
    const el = binaryElements[name];
    if (!el) return;

    el.path.style.display = 'none';
    el.downloadBtn.style.display = 'none';
    el.progress.style.display = 'flex';
    el.progressFill.style.width = '0%';
    el.progressFill.classList.toggle('waiting', isWaiting);
    el.progressText.textContent = isWaiting ? 'Waiting...' : '0%';
    el.status.textContent = isWaiting ? 'Waiting...' : 'Downloading...';
    el.status.classList.remove('found', 'missing');
}

function updateInlineProgress(name, percent, message) {
    const el = binaryElements[name];
    if (!el) return;

    el.progressFill.classList.remove('waiting');
    el.progressFill.style.width = `${percent}%`;
    el.progressText.textContent = `${percent}%`;
    el.status.textContent = message || 'Downloading...';
}

function hideInlineProgress(name) {
    const el = binaryElements[name];
    if (!el) return;

    el.progress.style.display = 'none';
}

// ===== Download Functions =====
async function downloadBinary(name) {
    const el = binaryElements[name];
    currentlyDownloading = name;

    // Show inline progress for this binary
    showInlineProgress(name, false);

    try {
        let result;
        if (name === 'ytdlp') {
            result = await window.electron.downloadYtdlp();
        } else if (name === 'ffmpeg' || name === 'ffprobe') {
            result = await window.electron.downloadFfmpeg();
        }

        if (result && result.success) {
            hideInlineProgress(name);
            markAsFound(name, result.path, 'Local');
            missingBinaries = missingBinaries.filter(b => b !== name);

            // If ffmpeg was downloaded, also mark ffprobe as found (they come together)
            if (name === 'ffmpeg' && result.ffprobePath) {
                missingBinaries = missingBinaries.filter(b => b !== 'ffprobe');
                hideInlineProgress('ffprobe');
                markAsFound('ffprobe', result.ffprobePath, 'Local');
            }
            if (name === 'ffprobe' && result.ffmpegPath) {
                missingBinaries = missingBinaries.filter(b => b !== 'ffmpeg');
                hideInlineProgress('ffmpeg');
                markAsFound('ffmpeg', result.ffmpegPath, 'Local');
            }

            updateUI();
        } else {
            hideInlineProgress(name);
            el.status.textContent = `Error: ${result?.error || 'Download failed'}`;
            el.status.classList.add('missing');
            el.downloadBtn.style.display = 'flex';
            el.downloadBtn.innerHTML = '<i class="fas fa-download"></i> Retry';
        }
    } catch (e) {
        hideInlineProgress(name);
        el.status.textContent = `Error: ${e.message}`;
        el.status.classList.add('missing');
        el.downloadBtn.style.display = 'flex';
        el.downloadBtn.innerHTML = '<i class="fas fa-download"></i> Retry';
    }

    currentlyDownloading = null;
}

async function downloadAll() {
    btnDownloadAll.disabled = true;
    btnDownloadAll.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Downloading...';

    // Show waiting state for all missing binaries
    const toDownload = [...missingBinaries];
    toDownload.forEach((name, index) => {
        showInlineProgress(name, index > 0); // First one is active, others are waiting
    });

    // Download one by one
    for (let i = 0; i < toDownload.length; i++) {
        const name = toDownload[i];

        // Skip if already downloaded (e.g., ffprobe comes with ffmpeg)
        if (!missingBinaries.includes(name)) continue;

        // Update waiting states - current one is now active
        toDownload.forEach((n, idx) => {
            if (idx > i && missingBinaries.includes(n)) {
                showInlineProgress(n, true);
            }
        });

        showInlineProgress(name, false);
        await downloadBinary(name);
    }

    btnDownloadAll.disabled = false;
    btnDownloadAll.innerHTML = '<i class="fas fa-download"></i> Download All';
    updateUI();
}

// ===== Event Listeners =====
btnClose.addEventListener('click', () => {
    window.electron.close();
});

btnSkip.addEventListener('click', () => {
    window.electron.launchApp();
});

btnContinue.addEventListener('click', () => {
    window.electron.launchApp();
});

btnDownloadAll.addEventListener('click', () => {
    downloadAll();
});

// Individual download buttons
binaries.forEach(name => {
    binaryElements[name].downloadBtn.addEventListener('click', () => {
        downloadBinary(name);
    });
});

// Listen to download progress
window.electron.onBinaryProgress?.((data) => {
    if (currentlyDownloading && data.progress !== undefined) {
        updateInlineProgress(currentlyDownloading, data.progress, data.message);
    }
});

// Start
init();

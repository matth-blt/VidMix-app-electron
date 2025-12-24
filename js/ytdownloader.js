/**
 * YTDownloader Module
 * Handles YouTube video downloading
 */

export const template = `
  <div class="animate-fadeIn">
    <div class="tool-header">
      <i class="fab fa-youtube" style="color: #ff0000;"></i>
      <h2>YTDownloader</h2>
    </div>
    
    <div class="panel">
      <!-- YouTube URL Row -->
      <div class="panel-row">
        <label class="panel-label">YouTube URL</label>
        <div class="panel-value">
          <input type="text" class="panel-input" id="yt-url" placeholder="https://youtube.com/watch?v=...">
          <button class="panel-btn hidden" id="fetch-formats" title="Fetch formats"><i class="fas fa-search"></i></button>
        </div>
      </div>
      
      <!-- Output Path Row -->
      <div class="panel-row">
        <label class="panel-label">Output path</label>
        <div class="panel-value">
          <input type="text" class="panel-input" id="output-folder" disabled placeholder="Select output folder...">
          <button class="panel-btn" id="browse-output"><i class="fas fa-ellipsis-h"></i></button>
        </div>
      </div>
      
      <!-- Auto Mode Row -->
      <div class="panel-row">
        <label class="panel-label">Quality mode</label>
        <div class="panel-value">
          <div class="toggle-inline">
            <span class="toggle-text">Auto Best Quality</span>
            <div class="toggle-switch">
              <input type="checkbox" id="toggle-auto" class="toggle-input" checked>
              <label for="toggle-auto" class="toggle-track"></label>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Manual Options (hidden when auto is on) -->
      <div id="manual-options" class="hidden">
        <!-- Video Format Row -->
        <div class="panel-row">
          <label class="panel-label">Video format</label>
          <div class="panel-value">
            <div class="toggle-switch">
              <input type="checkbox" id="toggle-video" class="toggle-input" checked>
              <label for="toggle-video" class="toggle-track"></label>
            </div>
            <input type="text" class="panel-input" id="video-format" placeholder="Format ID (e.g. 137)">
          </div>
        </div>
        
        <!-- Audio Format Row -->
        <div class="panel-row">
          <label class="panel-label">Audio format</label>
          <div class="panel-value">
            <div class="toggle-switch">
              <input type="checkbox" id="toggle-audio" class="toggle-input" checked>
              <label for="toggle-audio" class="toggle-track"></label>
            </div>
            <input type="text" class="panel-input" id="audio-format" placeholder="Format ID (e.g. 140)">
          </div>
        </div>
        
        <!-- Formats Info Row -->
        <div class="panel-row panel-row-tall">
          <label class="panel-label">Available formats</label>
          <div class="panel-value">
            <textarea class="panel-textarea" id="format-info" readonly placeholder="Click 'Fetch' to see available formats..."></textarea>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Bottom Actions -->
    <div class="panel-actions">
      <button class="btn btn-action" id="add-to-queue">
        <i class="fas fa-bars-staggered"></i> Add to queue
      </button>
    </div>
  </div>
`;

let autoMode = true;
let videoEnabled = true;
let audioEnabled = true;

export function init(log, addQueueItem) {
  const manualOptions = document.getElementById('manual-options');
  const fetchBtn = document.getElementById('fetch-formats');

  // Auto mode toggle
  document.getElementById('toggle-auto')?.addEventListener('change', (e) => {
    autoMode = e.target.checked;
    if (autoMode) {
      manualOptions?.classList.add('hidden');
      fetchBtn?.classList.add('hidden');
    } else {
      manualOptions?.classList.remove('hidden');
      fetchBtn?.classList.remove('hidden');
    }
    log(autoMode ? 'Auto mode: Best quality will be downloaded' : 'Manual mode: Select format IDs', 'info');
  });

  // Initial state
  if (autoMode) {
    manualOptions?.classList.add('hidden');
    fetchBtn?.classList.add('hidden');
  }

  // Video toggle handler
  document.getElementById('toggle-video')?.addEventListener('change', (e) => {
    videoEnabled = e.target.checked;
    document.getElementById('video-format').disabled = !videoEnabled;
    document.getElementById('video-format').parentElement.classList.toggle('disabled', !videoEnabled);
    updateToggleState();
  });

  // Audio toggle handler
  document.getElementById('toggle-audio')?.addEventListener('change', (e) => {
    audioEnabled = e.target.checked;
    document.getElementById('audio-format').disabled = !audioEnabled;
    document.getElementById('audio-format').parentElement.classList.toggle('disabled', !audioEnabled);
    updateToggleState();
  });

  function updateToggleState() {
    if (!videoEnabled && !audioEnabled) {
      log('Warning: At least one of Video or Audio must be enabled.', 'warning');
      document.getElementById('toggle-audio').checked = true;
      audioEnabled = true;
      document.getElementById('audio-format').disabled = false;
    }
  }

  // Fetch formats (only visible in manual mode)
  document.getElementById('fetch-formats')?.addEventListener('click', async () => {
    const url = document.getElementById('yt-url').value;
    if (!url) {
      log('Error: Please enter a YouTube URL.', 'error');
      return;
    }

    log(`Fetching formats for: ${url}`, 'info');
    document.getElementById('format-info').value = 'Fetching formats...';

    try {
      const result = await window.electron.fetchFormats(url);
      document.getElementById('format-info').value = result;
      log('Formats fetched successfully.', 'success');
    } catch (error) {
      log(`Error: ${error}`, 'error');
      document.getElementById('format-info').value = `Error: ${error}`;
    }
  });

  // Browse output
  document.getElementById('browse-output')?.addEventListener('click', async () => {
    const result = await window.electron.openDialog();
    if (!result.canceled) {
      document.getElementById('output-folder').value = result.filePaths[0];
    }
  });

  // Add to queue
  document.getElementById('add-to-queue')?.addEventListener('click', () => {
    const url = document.getElementById('yt-url').value;
    const outputFolder = document.getElementById('output-folder').value;

    if (!url || !outputFolder) {
      log('Error: Please enter URL and select output folder.', 'error');
      return;
    }

    // Auto mode - no format IDs needed
    if (autoMode) {
      const videoId = url.match(/(?:v=|youtu\.be\/)([^&\s]+)/)?.[1] || 'video';

      addQueueItem({
        type: 'download',
        icon: 'fa-download',
        title: `YouTube: ${videoId}`,
        subtitle: 'Auto: Best quality → MP4',
        status: 'Pending',
        data: {
          url,
          outputFolder,
          autoMode: true
        }
      });

      log('Added to queue: Best quality auto-download', 'success');
      return;
    }

    // Manual mode - need format IDs
    const videoFormat = videoEnabled ? document.getElementById('video-format').value : null;
    const audioFormat = audioEnabled ? document.getElementById('audio-format').value : null;

    if (videoEnabled && !videoFormat) {
      log('Error: Please enter a video format ID.', 'error');
      return;
    }

    if (audioEnabled && !audioFormat) {
      log('Error: Please enter an audio format ID.', 'error');
      return;
    }

    const videoId = url.match(/(?:v=|youtu\.be\/)([^&\s]+)/)?.[1] || 'video';

    let subtitle = '';
    if (videoEnabled && audioEnabled) {
      subtitle = `${videoFormat}+${audioFormat}`;
    } else if (videoEnabled) {
      subtitle = `Video only (${videoFormat})`;
    } else {
      subtitle = `Audio only (${audioFormat})`;
    }

    addQueueItem({
      type: 'download',
      icon: videoEnabled ? 'fa-video' : 'fa-music',
      title: `YouTube: ${videoId}`,
      subtitle: subtitle,
      status: 'Pending',
      data: {
        url,
        outputFolder,
        videoFormat,
        audioFormat,
        videoEnabled,
        audioEnabled,
        autoMode: false
      }
    });

    log(`Added to queue: ${subtitle}`, 'success');
  });
}

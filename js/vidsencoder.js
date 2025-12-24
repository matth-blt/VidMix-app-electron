/**
 * Vidsencoder Module
 * Handles video encoding functionality
 */

export const template = `
  <div class="animate-fadeIn">
    <div class="tool-header">
      <i class="fas fa-video"></i>
      <h2>Vidsencoder</h2>
    </div>
    
    <div class="panel">
      <!-- Input Video Row -->
      <div class="panel-row">
        <label class="panel-label">Input video</label>
        <div class="panel-value">
          <input type="text" class="panel-input" id="input-file" disabled placeholder="Select a video file...">
          <button class="panel-btn" id="browse-input"><i class="fas fa-ellipsis-h"></i></button>
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
      
      <!-- Output Name Row -->
      <div class="panel-row">
        <label class="panel-label">Output name</label>
        <div class="panel-value">
          <input type="text" class="panel-input" id="output-name" placeholder="Enter output filename...">
          <button class="panel-btn" id="keep-name" title="Keep original name"><i class="fas fa-undo"></i></button>
        </div>
      </div>
      
      <!-- Codec Row -->
      <div class="panel-row">
        <label class="panel-label">Codec</label>
        <div class="panel-value">
          <div class="codec-grid">
            <div class="codec active" data-codec="x264">x264</div>
            <div class="codec" data-codec="x265">x265</div>
            <div class="codec" data-codec="AV1">AV1</div>
            <div class="codec" data-codec="VP9">VP9</div>
            <div class="codec" data-codec="ProRes">ProRes</div>
            <div class="codec" data-codec="FFV1">Lossless</div>
          </div>
        </div>
      </div>
      
      <!-- Container Row -->
      <div class="panel-row">
        <label class="panel-label">Output container</label>
        <div class="panel-value">
          <select class="panel-select" id="format">
            <option value="mkv">.mkv</option>
            <option value="mp4">.mp4</option>
            <option value="mov">.mov</option>
            <option value="webm">.webm</option>
          </select>
        </div>
      </div>
      
      <!-- Resolution Row -->
      <div class="panel-row">
        <label class="panel-label">Resolution</label>
        <div class="panel-value">
          <select class="panel-select" id="resolution">
            <option value="Keep">Original</option>
            <option value="1280:720">720p</option>
            <option value="1920:1080">1080p</option>
            <option value="2560:1440">2K</option>
            <option value="3840:2160">4K</option>
          </select>
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

/** @type {string} Currently selected video codec */
let selectedCodec = 'x264';

/**
 * Initializes the Vidsencoder module
 * @param {Function} log - Logging function
 * @param {Function} addQueueItem - Function to add items to queue
 * @param {Function} updateMediaInfo - Function to update media info panel
 * @param {Function} getFileName - Function to extract filename from path
 */
export function init(log, addQueueItem, updateMediaInfo, getFileName) {
  // Codec selection
  const codecs = document.querySelectorAll('.codec');
  codecs.forEach(codec => {
    codec.addEventListener('click', () => {
      codecs.forEach(c => c.classList.remove('active'));
      codec.classList.add('active');
      selectedCodec = codec.dataset.codec;
    });
  });

  // Browse input
  document.getElementById('browse-input')?.addEventListener('click', async () => {
    const filePath = await window.electron.browseVideoFile();
    if (filePath) {
      document.getElementById('input-file').value = filePath;
      document.getElementById('output-name').value = getFileName(filePath);
      updateMediaInfo(filePath);
      log(`Loaded: ${filePath}`, 'info');
    }
  });

  // Browse output
  document.getElementById('browse-output')?.addEventListener('click', async () => {
    const folderPath = await window.electron.browseOutputFolder();
    if (folderPath) {
      document.getElementById('output-folder').value = folderPath;
    }
  });

  // Keep name
  document.getElementById('keep-name')?.addEventListener('click', () => {
    const inputPath = document.getElementById('input-file').value;
    if (inputPath) {
      document.getElementById('output-name').value = getFileName(inputPath);
    }
  });

  // Add to queue
  document.getElementById('add-to-queue')?.addEventListener('click', () => {
    const inputPath = document.getElementById('input-file').value;
    const outputPath = document.getElementById('output-folder').value;
    const outputName = document.getElementById('output-name').value;
    const format = document.getElementById('format').value;
    const resolution = document.getElementById('resolution').value;

    if (!inputPath || !outputPath || !outputName) {
      log('Error: Please fill all required fields.', 'error');
      return;
    }

    addQueueItem({
      type: 'encode',
      icon: 'fa-video',
      title: outputName,
      subtitle: `${selectedCodec} → .${format}`,
      status: 'Pending',
      data: {
        inputPath,
        outputPath,
        videoName: outputName,
        encoder: selectedCodec,
        format,
        resolution
      }
    });
  });
}

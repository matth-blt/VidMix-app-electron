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
    
    <div class="form-group">
      <label>Input Video</label>
      <div class="input-row">
        <input type="text" class="form-input" id="input-file" disabled placeholder="Select a video file...">
        <button class="btn" id="browse-input"><i class="fas fa-folder-open"></i> Browse</button>
      </div>
    </div>
    
    <div class="form-group">
      <label>Output Path</label>
      <div class="input-row">
        <input type="text" class="form-input" id="output-folder" disabled placeholder="Select output folder...">
        <button class="btn" id="browse-output"><i class="fas fa-folder-open"></i> Browse</button>
      </div>
    </div>
    
    <div class="form-group">
      <label>Output Name</label>
      <div class="input-row">
        <input type="text" class="form-input" id="output-name" placeholder="Enter output filename...">
        <button class="btn" id="keep-name"><i class="fas fa-undo"></i> Keep</button>
      </div>
    </div>
    
    <div class="form-group">
      <label>Codec</label>
      <div class="codec-row">
        <div class="codec active" data-codec="x264">x264</div>
        <div class="codec" data-codec="x265">x265</div>
        <div class="codec" data-codec="AV1">AV1</div>
        <div class="codec" data-codec="ProRes">ProRes</div>
        <div class="codec" data-codec="FFV1">Lossless</div>
      </div>
    </div>
    
    <div class="options-grid">
      <div class="form-group">
        <label>Output Container</label>
        <select class="form-input" id="format">
          <option value="mkv">.mkv</option>
          <option value="mp4">.mp4</option>
          <option value="mov">.mov</option>
        </select>
      </div>
      <div class="form-group">
        <label>Resolution</label>
        <select class="form-input" id="resolution">
          <option value="Keep">Original</option>
          <option value="1280:720">720p</option>
          <option value="1920:1080">1080p</option>
          <option value="2560:1440">2K</option>
          <option value="3840:2160">4K</option>
        </select>
      </div>
    </div>
    
    <button class="btn btn-action" id="add-to-queue">
      <i class="fas fa-bars-staggered"></i> Add to queue
    </button>
  </div>
`;

let selectedCodec = 'x264';

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

/**
 * Extract Module
 * Handles frame extraction from videos
 */

export const template = `
  <div class="animate-fadeIn">
    <div class="tool-header">
      <i class="fas fa-images"></i>
      <h2>Extract Frames</h2>
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
    
    <!-- Create Folder Option -->
    <div class="form-group">
      <div class="toggle-item">
        <span class="toggle-label"><i class="fas fa-folder-plus"></i> Create Folder</span>
        <div class="toggle-switch">
          <input type="checkbox" id="toggle-folder" class="toggle-input" checked>
          <label for="toggle-folder" class="toggle-track"></label>
        </div>
        <input type="text" class="form-input format-input folder-name-input" id="folder-name" placeholder="Folder name (from video name)">
      </div>
    </div>
    
    <div class="form-group">
      <label>Image Format</label>
      <div class="codec-row">
        <div class="codec active" data-format="PNG">PNG</div>
        <div class="codec" data-format="TIFF">TIFF</div>
        <div class="codec" data-format="JPEG">JPEG</div>
      </div>
    </div>
    
    <button class="btn btn-action" id="add-to-queue">
      <i class="fas fa-bars-staggered"></i> Add to queue
    </button>
  </div>
`;

let selectedFormat = 'PNG';
let createFolder = true;

export function init(log, addQueueItem, updateMediaInfo, getFileName) {
  const folderNameInput = document.getElementById('folder-name');

  // Toggle folder creation
  document.getElementById('toggle-folder')?.addEventListener('change', (e) => {
    createFolder = e.target.checked;
    folderNameInput.disabled = !createFolder;
    folderNameInput.parentElement.classList.toggle('disabled', !createFolder);
  });

  // Format selection
  const formats = document.querySelectorAll('.codec');
  formats.forEach(format => {
    format.addEventListener('click', () => {
      formats.forEach(f => f.classList.remove('active'));
      format.classList.add('active');
      selectedFormat = format.dataset.format;
    });
  });

  // Browse input
  document.getElementById('browse-input')?.addEventListener('click', async () => {
    const filePath = await window.electron.browseInput();
    if (filePath) {
      document.getElementById('input-file').value = filePath;
      // Auto-fill folder name from video name
      const videoName = getFileName(filePath);
      folderNameInput.value = videoName;
      folderNameInput.placeholder = videoName;
      updateMediaInfo(filePath);
      log(`Loaded: ${filePath}`, 'info');
    }
  });

  // Browse output
  document.getElementById('browse-output')?.addEventListener('click', async () => {
    const folderPath = await window.electron.browseOutput();
    if (folderPath) {
      document.getElementById('output-folder').value = folderPath;
    }
  });

  // Add to queue
  document.getElementById('add-to-queue')?.addEventListener('click', () => {
    const inputPath = document.getElementById('input-file').value;
    let outputPath = document.getElementById('output-folder').value;
    const folderName = folderNameInput.value || getFileName(inputPath);

    if (!inputPath || !outputPath) {
      log('Error: Please fill all required fields.', 'error');
      return;
    }

    // Build final output path
    let finalOutputPath = outputPath;
    if (createFolder && folderName) {
      finalOutputPath = `${outputPath}/${folderName}`;
    }

    addQueueItem({
      type: 'extract',
      icon: 'fa-images',
      title: getFileName(inputPath),
      subtitle: `→ ${selectedFormat}${createFolder ? ` (${folderName}/)` : ''}`,
      status: 'Pending',
      data: {
        inputPath,
        outputPath: finalOutputPath,
        format: selectedFormat,
        createFolder: createFolder
      }
    });

    log(`Added to queue: Extract ${selectedFormat} → ${finalOutputPath}`, 'success');
  });
}

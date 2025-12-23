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
    
    <div class="form-group">
      <label>YouTube URL</label>
      <div class="input-row">
        <input type="text" class="form-input" id="yt-url" placeholder="https://youtube.com/watch?v=...">
        <button class="btn" id="fetch-formats"><i class="fas fa-search"></i> Fetch</button>
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
      <label>Available Formats</label>
      <textarea class="form-input" id="format-info" readonly placeholder="Click 'Fetch' to see available formats..."></textarea>
    </div>
    
    <div class="options-grid" style="grid-template-columns: 1fr 1fr;">
      <div class="form-group">
        <label>Video Format ID</label>
        <input type="text" class="form-input" id="video-format" placeholder="e.g. 137">
      </div>
      <div class="form-group">
        <label>Audio Format ID</label>
        <input type="text" class="form-input" id="audio-format" placeholder="e.g. 140">
      </div>
    </div>
    
    <button class="btn btn-action" id="add-to-queue">
      <i class="fas fa-bars-staggered"></i> Add to queue
    </button>
  </div>
`;

export function init(log, addQueueItem) {
    // Fetch formats
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
        const videoFormat = document.getElementById('video-format').value;
        const audioFormat = document.getElementById('audio-format').value;

        if (!url || !outputFolder || !videoFormat || !audioFormat) {
            log('Error: Please fill all required fields.', 'error');
            return;
        }

        // Extract video ID for title
        const videoId = url.match(/(?:v=|youtu\.be\/)([^&\s]+)/)?.[1] || 'video';

        addQueueItem({
            type: 'download',
            icon: 'fa-download',
            title: `YouTube: ${videoId}`,
            subtitle: `${videoFormat}+${audioFormat}`,
            status: 'Pending',
            data: { url, outputFolder, videoFormat, audioFormat }
        });
    });
}

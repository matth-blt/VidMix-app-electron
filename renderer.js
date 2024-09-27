function openApp(appName) {
  const appContainer = document.getElementById('app-container');
  let appContent = '';

  if (appName === 'vidsencoder') {
    appContent = `
      <div class="container">
        <h1>Vidsencoder</h1>
        <div class="label-input-group">
          <label for="inputFile">Input File:</label>
          <input type="text" id="inputFile" disabled>
          <button id="browseInputButton">Browse...</button>
        </div>
        <div class="label-input-group">
          <label for="outputFolder">Output Folder:</label>
          <input type="text" id="outputFolder" disabled>
          <button id="browseOutputButton">Browse...</button>
        </div>
        <div class="label-input-group">
          <label for="videoName">Video Name:</label>
          <input type="text" id="videoName">
          <button id="keepNameButton">Keep Video Name</button>
        </div>
        <div class="options-group">
          <div>
            <label for="encoder">Codec:</label>
            <select id="encoder">
              <option value="x264">x264</option>
              <option value="x265">x265</option>
              <option value="ProRes">ProRes</option>
              <option value="FFV1">FFV1</option>
              <option value="AV1">AV1</option>
            </select>
          </div>
          <div>
            <label for="format">Format:</label>
            <select id="format">
              <option value="mp4">mp4</option>
              <option value="mkv">mkv</option>
              <option value="mov">mov</option>
            </select>
          </div>
          <div>
            <label for="resolution">Resolution:</label>
            <select id="resolution">
              <option value="Keep">Keep</option>
              <option value="1280:720">720p</option>
              <option value="1920:1080">1080p</option>
              <option value="2560:1440">2k</option>
              <option value="3840:2160">4k</option>
              <option value="7680:4320">8k</option>
            </select>
          </div>
        </div>
        <button id="encodeButton">Encode</button>
        <div id="loading-animation" class="loading-animation">
          <img src="assets/render-load.gif" alt="Loading...">
        </div>
      </div>
    `;
  } else if (appName === 'ytdownloader') {
    appContent = `
      <div class="container">
        <h1>YTDownloader</h1>
        <div class="label-input-group">
          <label for="url">YouTube URL:</label>
          <input type="text" id="url" placeholder="Enter YouTube URL">
        </div>
        <div class="label-input-group">
          <label for="outputFolder">Output Folder:</label>
          <input type="text" id="outputFolder" disabled>
          <button id="browseOutputButton">Browse...</button>
        </div>
        <button id="fetchFormatsButton">Fetch Formats</button>
        <textarea id="formatInfo" placeholder="Format info will be displayed here..." readonly></textarea>
        <div class="label-input-group">
          <label for="videoFormat">Video Format ID:</label>
          <input type="text" id="videoFormat" placeholder="Enter Video Format ID">
        </div>
        <div class="label-input-group">
          <label for="audioFormat">Audio Format ID:</label>
          <input type="text" id="audioFormat" placeholder="Enter Audio Format ID">
        </div>
        <button id="downloadButton">Download</button>
        <div id="loading-animation" class="loading-animation">
          <img src="assets/render-load.gif" alt="Loading...">
        </div>
        <progress id="progressBar" value="0" max="100" style="width: 100%; display: none;"></progress>
        <p id="progressText" style="color: white; display: none;">Download Progress</p>
      </div>
    `;
  } else if (appName === 'extract') {
    appContent = `
      <div class="container">
        <h1>Extract</h1>
        <div class="label-input-group">
          <label for="input-path">Input Path:</label>
          <input type="text" id="input-path" disabled>
          <button id="browseInputButton">Browse...</button>
        </div>
        <div class="label-input-group">
          <label for="output-path">Output Path:</label>
          <input type="text" id="output-path" disabled>
          <button id="browseOutputButton">Browse...</button>
        </div>
        <div class="options-group">
          <label for="format">Format:</label>
          <select id="format">
            <option value="PNG">PNG</option>
            <option value="TIFF">TIFF</option>
            <option value="JPEG">JPEG</option>
          </select>
        </div>
        <button id="extractButton">Extract</button>
        <div id="loading-animation" class="loading-animation">
          <img src="assets/render-load.gif" alt="Loading...">
        </div>
      </div>
    `;
  }

  appContainer.innerHTML = appContent;
  initializeApp(appName);
}

function initializeApp(appName) {
  if (appName === 'vidsencoder') {
    document.getElementById('browseInputButton').addEventListener('click', async () => {
      const filePath = await window.electron.browseVideoFile();
      if (filePath) {
        document.getElementById('inputFile').value = filePath;
        document.getElementById('videoName').value = filePath.split('\\').pop().split('/').pop().split('.').slice(0, -1).join('.');
      }
    });

    document.getElementById('browseOutputButton').addEventListener('click', async () => {
      const folderPath = await window.electron.browseOutputFolder();
      if (folderPath) {
        document.getElementById('outputFolder').value = folderPath;
      }
    });

    document.getElementById('keepNameButton').addEventListener('click', () => {
      const inputPath = document.getElementById('inputFile').value;
      document.getElementById('videoName').value = inputPath.split('\\').pop().split('/').pop().split('.').slice(0, -1).join('.');
    });

    document.getElementById('encodeButton').addEventListener('click', async () => {
      const inputPath = document.getElementById('inputFile').value;
      const outputPath = document.getElementById('outputFolder').value;
      const videoName = document.getElementById('videoName').value;
      const encoder = document.getElementById('encoder').value;
      const format = document.getElementById('format').value;
      const resolution = document.getElementById('resolution').value;

      if (!inputPath || !outputPath || !videoName) {
        alert('Error: Please select the video file, output folder, and specify the video name.');
        return;
      }

      try {
        document.getElementById('loading-animation').style.display = 'flex';
        await window.electron.encodeVideo({ inputPath, outputPath, videoName, encoder, format, resolution });
      } catch (error) {
        alert(`Error: ${error}`);
      } finally {
        document.getElementById('loading-animation').style.display = 'none';
      }
    });
  } else if (appName === 'ytdownloader') {
    document.getElementById('browseOutputButton').addEventListener('click', () => {
      window.electron.openDialog().then(result => {
        if (!result.canceled) {
          document.getElementById('outputFolder').value = result.filePaths[0];
        }
      });
    });

    document.getElementById('fetchFormatsButton').addEventListener('click', () => {
      const url = document.getElementById('url').value;
      window.electron.fetchFormats(url).then(result => {
        document.getElementById('formatInfo').value = result;
      }).catch(error => {
        console.error('Error fetching formats:', error);
      });
    });

    document.getElementById('downloadButton').addEventListener('click', () => {
      const url = document.getElementById('url').value;
      const outputFolder = document.getElementById('outputFolder').value;
      const videoFormat = document.getElementById('videoFormat').value;
      const audioFormat = document.getElementById('audioFormat').value;
      const args = { url, outputFolder, videoFormat, audioFormat };

      const progressBar = document.getElementById('progressBar');
      const progressText = document.getElementById('progressText');
      progressBar.style.display = 'block';
      progressText.style.display = 'block';

      window.electron.download(args).then(result => {
        progressBar.value = 100;
        progressText.textContent = 'Download complete!';
      }).catch(error => {
        progressText.textContent = 'Download failed!';
      });
    });

    window.electron.onDownloadProgress((progress) => {
      const progressBar = document.getElementById('progressBar');
      const progressText = document.getElementById('progressText');
      const progressMatch = progress.match(/(\d+(\.\d+)?)%/);

      if (progressMatch) {
        const progressValue = parseFloat(progressMatch[1]);
        progressBar.value = progressValue;
        progressText.textContent = `Download Progress: ${progressValue}%`;
      }
    });
  } else if (appName === 'extract') {
    document.getElementById('browseInputButton').addEventListener('click', async () => {
      const filePath = await window.electron.browseInput();
      if (filePath) {
        document.getElementById('input-path').value = filePath;
      }
    });

    document.getElementById('browseOutputButton').addEventListener('click', async () => {
      const folderPath = await window.electron.browseOutput();
      if (folderPath) {
        document.getElementById('output-path').value = folderPath;
      }
    });

    document.getElementById('extractButton').addEventListener('click', async () => {
      const inputPath = document.getElementById('input-path').value;
      const outputPath = document.getElementById('output-path').value;
      const format = document.getElementById('format').value;

      if (!inputPath || !outputPath) {
        alert('Please select the input file and output folder.');
        return;
      }

      try {
        document.getElementById('loading-animation').style.display = 'flex';
        await window.electron.extractFrames({ inputPath, outputPath, format });
        alert('Extraction completed!');
      } catch (error) {
        alert(`Error: ${error}`);
      } finally {
        document.getElementById('loading-animation').style.display = 'none';
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  openApp('vidsencoder');
});

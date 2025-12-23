![VidMix Banner](https://github.com/user-attachments/assets/20b08280-e972-41db-af05-7f7e5fdec0eb)

# VidMix

**A modern Electron application for video encoding, YouTube downloading, and frame extraction.**

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Electron](https://img.shields.io/badge/Electron-33.x-47848F?logo=electron)](https://www.electronjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)](https://nodejs.org/)

## ✨ Features

### 🎬 Vidsencoder
Encode and convert video files with customizable options:
- Multiple encoder support (H.264, H.265/HEVC, VP9, AV1)
- Quality and bitrate control
- Resolution presets
- Real-time encoding progress

### 📥 YTDownloader
Download videos from YouTube with advanced options:
- Fetch available formats (video/audio)
- **Auto Best Quality** mode - downloads best video + audio merged
- Separate video/audio download toggles
- Embedded metadata, thumbnails, and chapters

### 🖼️ Frame Extractor
Extract frames from videos:
- Multiple output formats (PNG, JPG, BMP, TIFF)
- Custom frame rate selection
- Optional output folder creation

### ℹ️ Media Info
View detailed video metadata:
- Duration, resolution, codecs
- FPS, bitrate, file size
- Pixel format information

### ⚡ First-Run Setup Wizard
Automatic binary detection and installation:
- Detects system-installed FFmpeg, FFprobe, and yt-dlp
- One-click download for missing binaries
- Animated setup wizard with progress tracking

## 📦 Installation

### From Releases
Download the installer from the [Releases](https://github.com/matth-blt/VidMix-app-electron/releases) page:
- **macOS**: `.dmg` installer
- **Windows**: `.exe` installer
- **Linux**: `.deb` or `.rpm` package

### Requirements
The application requires the following binaries (automatically downloaded if missing):
- **FFmpeg** - Video encoding/decoding
- **FFprobe** - Media information extraction
- **yt-dlp** - YouTube downloading

## 🚀 Usage

### Vidsencoder
1. Click **Import** to select your video file
2. Choose your encoder and quality settings
3. Set output path and click **Encode**

### YTDownloader
1. Paste a YouTube URL
2. Toggle **Auto Best Quality** for automatic best format, or:
   - Click **Fetch Formats** to see available formats
   - Select video and audio format IDs
3. Set output path and click **Download**

### Frame Extractor
1. Click **Import** to select your video
2. Choose output format and frame rate
3. Enable **Create Folder** to organize frames
4. Click **Extract**

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup
```bash
# Clone the repository
git clone https://github.com/matth-blt/VidMix-app-electron.git
cd VidMix-app-electron

# Install dependencies
npm install

# Start development
npm start
```

### Available Scripts
| Command | Description |
|---------|-------------|
| `npm start` | Start the app in development mode |
| `npm test` | Run unit tests with Jest |
| `npm run preview-setup` | Preview the setup wizard |
| `npm run package` | Package the app for distribution |
| `npm run make` | Create platform-specific installers |

### Project Structure
```
VidMix-app-electron/
├── main.js              # Electron main process
├── preload.js           # Main window preload script
├── renderer.js          # Main window renderer
├── index.html           # Main application UI
├── setup.html           # Setup wizard UI
├── setup-renderer.js    # Setup wizard logic
├── setup-preload.js     # Setup preload script
├── css/                 # Stylesheets
│   ├── app.css          # Main application styles
│   ├── setup.css        # Setup wizard styles
│   └── mediainfo.css    # Media info panel styles
├── js/                  # Module scripts
│   ├── settings.js      # Settings page logic
│   ├── ytdownloader.js  # YouTube downloader logic
│   └── extract.js       # Frame extractor logic
└── tests/               # Unit tests
    ├── setup.test.js    # Setup wizard tests
    └── preview-setup.js # Setup preview script
```

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [FFmpeg](https://ffmpeg.org/) - Video processing
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - YouTube downloading
- [Electron](https://www.electronjs.org/) - Desktop app framework

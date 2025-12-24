![VidMix Banner](https://github.com/user-attachments/assets/20b08280-e972-41db-af05-7f7e5fdec0eb)

# 🎬 VidMix

[![Français](https://img.shields.io/badge/lang-Français-blue.svg)](README_FR.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Electron](https://img.shields.io/badge/Electron-33.x-47848F?logo=electron)](https://www.electronjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)](https://nodejs.org/)

A modern Electron application for video encoding, YouTube downloading, and frame extraction.

## 📋 Features

- ✅ **Video Encoding** - Encode videos with H.264, H.265, VP9, AV1, ProRes, FFV1
- ✅ **YouTube Downloading** - Download videos with yt-dlp (auto best quality mode)
- ✅ **Frame Extraction** - Extract frames as PNG, TIFF, or JPEG
- ✅ **Media Info** - Detailed metadata analysis via FFprobe
- ✅ **First-Run Setup** - Automatic binary detection and one-click download
- ✅ **Cross-Platform** - macOS, Windows, and Linux support

## 🚀 Installation

### For Users (Installers)
Download the latest release from the [Releases](https://github.com/matth-blt/VidMix-app-electron/releases) page:
- **macOS**: `.dmg` installer
- **Windows**: `.exe` NSIS installer (choose installation directory)
- **Linux**: `.deb`, `.rpm`, or `AppImage`

### For Developers

#### Prerequisites
- **Node.js 18+**
- **npm**

#### Setup
```bash
git clone https://github.com/matth-blt/VidMix-app-electron.git
cd VidMix-app-electron
npm install
npm start
```

## 📦 Project Structure

```
VidMix-app-electron/
├── main.js              # Electron main process
├── preload.js           # Main window preload script
├── renderer.js          # Main window renderer
├── index.html           # Main application UI
├── setup.html           # Setup wizard UI
├── setup-renderer.js    # Setup wizard logic
├── setup-preload.js     # Setup preload script
├── forge.config.js      # Electron Forge config
├── electron-builder.json # Electron Builder config
├── css/
│   ├── app.css          # Main styles
│   ├── setup.css        # Setup wizard styles
│   ├── splash.css       # Splash screen styles
│   ├── panel.css        # Panel component styles
│   └── mediainfo.css    # Media info styles
├── js/
│   ├── vidsencoder.js   # Video encoder module
│   ├── ytdownloader.js  # YouTube downloader module
│   ├── extract.js       # Frame extractor module
│   └── settings.js      # Settings module
└── tests/
    ├── setup.test.js    # Unit tests
    └── preview-setup.js # Setup preview script
```

## 🎨 Features in Detail

### 1️⃣ Vidsencoder
Encode videos with multiple codecs and containers.
- **Codecs**: x264, x265, AV1, VP9, ProRes, FFV1 (Lossless)
- **Containers**: MKV, MP4, MOV, WebM
- **Options**: Resolution scaling, quality presets
- **Progress**: Real-time encoding progress with ETA

### 2️⃣ YTDownloader
Download YouTube videos with advanced options.
- **Auto Mode**: Best video + audio automatically merged
- **Manual Mode**: Choose specific video/audio formats
- **Toggles**: Video only, audio only, or both
- **Metadata**: Embedded thumbnails, chapters, subtitles

### 3️⃣ Frame Extractor
Extract all frames from a video.
- **Formats**: PNG (lossless), TIFF (archive), JPEG (lightweight)
- **Organization**: Auto-create folder with video name
- **Quality**: High-quality scaling filters

### 4️⃣ Media Info
Analyze media files with FFprobe.
- Resolution, duration, FPS
- Video/audio codecs
- Bitrate, file size, pixel format

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start in development mode |
| `npm test` | Run Jest unit tests |
| `npm run preview-setup` | Preview setup wizard |
| `npm run package` | Package app (Electron Forge) |
| `npm run make` | Create installers (Electron Forge) |
| `npm run build` | Build all platforms (Electron Builder) |
| `npm run build:mac` | Build macOS (.dmg, .zip) |
| `npm run build:win` | Build Windows (NSIS .exe) |
| `npm run build:linux` | Build Linux (.deb, .rpm, AppImage) |

## 🔧 Required Binaries

VidMix automatically detects and downloads these binaries:
- **FFmpeg** - Video encoding/decoding
- **FFprobe** - Media analysis
- **yt-dlp** - YouTube downloading

Binaries can be system-installed (Homebrew, apt, etc.) or downloaded via Settings.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

- [FFmpeg](https://ffmpeg.org/) - Video processing
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - YouTube downloading
- [Electron](https://www.electronjs.org/) - Desktop framework

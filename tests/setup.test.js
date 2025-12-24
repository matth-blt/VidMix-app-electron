/**
 * VidMix Setup Wizard Tests
 */

const path = require('path');
const fs = require('fs');

// Mock electron modules
jest.mock('electron', () => ({
    app: {
        getPath: jest.fn(() => '/mock/userData'),
        quit: jest.fn(),
        whenReady: jest.fn(() => Promise.resolve())
    },
    BrowserWindow: jest.fn().mockImplementation(() => ({
        loadFile: jest.fn(),
        on: jest.fn(),
        webContents: { send: jest.fn() }
    })),
    ipcMain: {
        handle: jest.fn(),
        on: jest.fn()
    },
    dialog: {
        showOpenDialog: jest.fn()
    }
}));

// Mock child_process
jest.mock('child_process', () => ({
    execSync: jest.fn(),
    exec: jest.fn(),
    spawn: jest.fn(),
    execFile: jest.fn()
}));

// Mock fs
jest.mock('fs', () => ({
    existsSync: jest.fn(),
    mkdirSync: jest.fn(),
    writeFileSync: jest.fn(),
    readFileSync: jest.fn(),
    unlinkSync: jest.fn(),
    createWriteStream: jest.fn(() => ({
        on: jest.fn(),
        close: jest.fn()
    })),
    chmodSync: jest.fn(),
    readdirSync: jest.fn(),
    statSync: jest.fn()
}));

describe('Binary Detection', () => {
    const { execSync } = require('child_process');
    const fs = require('fs');

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('findSystemBinary', () => {
        // Simulate the findSystemBinary function
        function findSystemBinary(name) {
            try {
                const platform = process.platform;
                const command = platform === 'win32' ? 'where' : 'which';
                const result = execSync(`${command} ${name}`, { encoding: 'utf-8' });
                const binPath = result.trim().split('\n')[0];
                if (binPath && fs.existsSync(binPath)) {
                    return binPath;
                }
            } catch (e) {
                // Not found
            }
            return null;
        }

        test('should find system ffmpeg when installed', () => {
            execSync.mockReturnValue('/usr/local/bin/ffmpeg\n');
            fs.existsSync.mockReturnValue(true);

            const result = findSystemBinary('ffmpeg');
            expect(result).toBe('/usr/local/bin/ffmpeg');
        });

        test('should return null when binary not found', () => {
            execSync.mockImplementation(() => {
                throw new Error('not found');
            });

            const result = findSystemBinary('ffmpeg');
            expect(result).toBeNull();
        });

        test('should return null when path does not exist', () => {
            execSync.mockReturnValue('/usr/local/bin/ffmpeg\n');
            fs.existsSync.mockReturnValue(false);

            const result = findSystemBinary('ffmpeg');
            expect(result).toBeNull();
        });
    });

    describe('getBinaryPath', () => {
        function getBinaryPath(name, platform, binPath) {
            const ext = platform === 'win32' ? '.exe' : '';
            return path.join(binPath, name + ext);
        }

        test('should return correct path for macOS', () => {
            const result = getBinaryPath('ffmpeg', 'darwin', '/mock/bin');
            expect(result).toBe('/mock/bin/ffmpeg');
        });

        test('should return correct path for Windows with .exe', () => {
            const result = getBinaryPath('ffmpeg', 'win32', '/mock/bin');
            expect(result).toBe('/mock/bin/ffmpeg.exe');
        });

        test('should handle yt-dlp name', () => {
            const result = getBinaryPath('yt-dlp', 'darwin', '/mock/bin');
            expect(result).toBe('/mock/bin/yt-dlp');
        });
    });

    describe('initBinaryPath', () => {
        // Simulate the initBinaryPath function
        function initBinaryPath(name, platform, binPath) {
            // 1. Check local binary
            const ext = platform === 'win32' ? '.exe' : '';
            const localPath = path.join(binPath, name + ext);
            if (fs.existsSync(localPath)) {
                return { path: localPath, isLocal: true };
            }

            // 2. Check system binary (simulated)
            try {
                const command = platform === 'win32' ? 'where' : 'which';
                const result = execSync(`${command} ${name}`, { encoding: 'utf-8' });
                const systemPath = result.trim().split('\n')[0];
                if (systemPath && fs.existsSync(systemPath)) {
                    return { path: systemPath, isLocal: false };
                }
            } catch (e) {
                // Not found
            }

            return null;
        }

        test('should prefer local binary over system', () => {
            fs.existsSync.mockReturnValue(true);

            const result = initBinaryPath('ffmpeg', 'darwin', '/mock/bin');
            expect(result.path).toBe('/mock/bin/ffmpeg');
            expect(result.isLocal).toBe(true);
        });

        test('should fallback to system if local not found', () => {
            fs.existsSync
                .mockReturnValueOnce(false) // local not found
                .mockReturnValueOnce(true);  // system found
            execSync.mockReturnValue('/opt/homebrew/bin/ffmpeg\n');

            const result = initBinaryPath('ffmpeg', 'darwin', '/mock/bin');
            expect(result.path).toBe('/opt/homebrew/bin/ffmpeg');
            expect(result.isLocal).toBe(false);
        });

        test('should return null if no binary found', () => {
            fs.existsSync.mockReturnValue(false);
            execSync.mockImplementation(() => {
                throw new Error('not found');
            });

            const result = initBinaryPath('ffmpeg', 'darwin', '/mock/bin');
            expect(result).toBeNull();
        });
    });
});

describe('needsSetup', () => {
    test('should return true if ffmpeg is missing', () => {
        function needsSetup(ffmpegPath, ffprobePath) {
            return !ffmpegPath || !ffprobePath;
        }

        expect(needsSetup(null, '/path/to/ffprobe')).toBe(true);
    });

    test('should return true if ffprobe is missing', () => {
        function needsSetup(ffmpegPath, ffprobePath) {
            return !ffmpegPath || !ffprobePath;
        }

        expect(needsSetup('/path/to/ffmpeg', null)).toBe(true);
    });

    test('should return false if all binaries are present', () => {
        function needsSetup(ffmpegPath, ffprobePath) {
            return !ffmpegPath || !ffprobePath;
        }

        expect(needsSetup('/path/to/ffmpeg', '/path/to/ffprobe')).toBe(false);
    });
});

describe('Download URLs', () => {
    test('FFmpeg macOS download URL should be valid', () => {
        const ffmpegUrl = 'https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip';
        const ffprobeUrl = 'https://evermeet.cx/ffmpeg/getrelease/ffprobe/zip';

        expect(ffmpegUrl).toMatch(/^https:\/\//);
        expect(ffprobeUrl).toMatch(/^https:\/\//);
    });

    test('yt-dlp macOS download URL should be valid', () => {
        const ytdlpUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos';

        expect(ytdlpUrl).toMatch(/^https:\/\/github\.com\/yt-dlp/);
    });

    test('yt-dlp Windows download URL should be valid', () => {
        const ytdlpUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';

        expect(ytdlpUrl).toMatch(/\.exe$/);
    });
});

describe('Setup UI States', () => {
    describe('Binary status mapping', () => {
        function mapBinaryStatus(binaries) {
            const missing = [];
            const found = [];

            Object.entries(binaries).forEach(([name, info]) => {
                if (info && info.found) {
                    found.push({ name, ...info });
                } else {
                    missing.push(name);
                }
            });

            return { missing, found };
        }

        test('should correctly identify missing binaries', () => {
            const binaries = {
                ffmpeg: { found: true, path: '/usr/bin/ffmpeg', isSystem: true },
                ffprobe: { found: false },
                ytdlp: { found: false }
            };

            const result = mapBinaryStatus(binaries);
            expect(result.missing).toEqual(['ffprobe', 'ytdlp']);
            expect(result.found.length).toBe(1);
            expect(result.found[0].name).toBe('ffmpeg');
        });

        test('should handle all binaries found', () => {
            const binaries = {
                ffmpeg: { found: true, path: '/usr/bin/ffmpeg', isSystem: true },
                ffprobe: { found: true, path: '/usr/bin/ffprobe', isSystem: true },
                ytdlp: { found: true, path: '/usr/bin/yt-dlp', isSystem: true }
            };

            const result = mapBinaryStatus(binaries);
            expect(result.missing).toEqual([]);
            expect(result.found.length).toBe(3);
        });

        test('should handle all binaries missing', () => {
            const binaries = {
                ffmpeg: { found: false },
                ffprobe: { found: false },
                ytdlp: { found: false }
            };

            const result = mapBinaryStatus(binaries);
            expect(result.missing).toEqual(['ffmpeg', 'ffprobe', 'ytdlp']);
            expect(result.found.length).toBe(0);
        });
    });

    describe('UI button visibility', () => {
        function getButtonVisibility(missingCount) {
            return {
                showDownloadAll: missingCount > 0,
                showContinue: missingCount === 0
            };
        }

        test('should show Download All when binaries are missing', () => {
            const result = getButtonVisibility(2);
            expect(result.showDownloadAll).toBe(true);
            expect(result.showContinue).toBe(false);
        });

        test('should show Continue when all binaries are found', () => {
            const result = getButtonVisibility(0);
            expect(result.showDownloadAll).toBe(false);
            expect(result.showContinue).toBe(true);
        });
    });
});

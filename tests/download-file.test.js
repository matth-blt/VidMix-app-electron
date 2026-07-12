/**
 * VidMix downloadFile() Tests
 * @description Verifies that main.js's downloadFile() never leaves a stale
 * (partial/empty) destination file behind on failure, per Task 1 Bug B.
 * Uses lightweight EventEmitter-based fakes for https.get() instead of a
 * real HTTP server.
 */

const { EventEmitter } = require('events');

jest.mock('electron', () => ({
  app: {
    getPath: jest.fn(() => '/mock/userData'),
    quit: jest.fn(),
    whenReady: jest.fn(() => Promise.resolve()),
    on: jest.fn()
  },
  BrowserWindow: Object.assign(
    jest.fn().mockImplementation(() => ({
      loadFile: jest.fn(),
      on: jest.fn(),
      webContents: { send: jest.fn() }
    })),
    { getAllWindows: jest.fn(() => []) }
  ),
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn()
  },
  dialog: {
    showOpenDialog: jest.fn()
  }
}));

jest.mock('child_process', () => ({
  execSync: jest.fn(() => {
    throw new Error('not found');
  }),
  exec: jest.fn(),
  spawn: jest.fn(),
  execFile: jest.fn()
}));

jest.mock('fs', () => ({
  existsSync: jest.fn(() => false),
  mkdirSync: jest.fn(),
  createWriteStream: jest.fn(),
  unlink: jest.fn((filePath, cb) => cb && cb()),
  unlinkSync: jest.fn(),
  chmodSync: jest.fn(),
  readdirSync: jest.fn(),
  rmSync: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn(),
  statSync: jest.fn()
}));

jest.mock('https', () => ({ get: jest.fn() }));

describe('downloadFile', () => {
  let downloadFile;
  let fs;
  let https;

  beforeEach(() => {
    jest.resetModules();
    fs = require('fs');
    https = require('https');
    jest.clearAllMocks();
    fs.unlink.mockImplementation((filePath, cb) => cb && cb());
    ({ downloadFile } = require('../main.js'));
  });

  test('rejects and never creates a file when the server returns a non-200 status', async () => {
    https.get.mockImplementation((url, cb) => {
      const res = new EventEmitter();
      res.statusCode = 404;
      res.headers = {};
      cb(res);
      return new EventEmitter();
    });

    await expect(downloadFile('https://example.com/file.zip', '/tmp/dest.zip')).rejects.toThrow('HTTP 404');
    expect(fs.createWriteStream).not.toHaveBeenCalled();
    expect(fs.unlink).toHaveBeenCalledWith('/tmp/dest.zip', expect.any(Function));
  });

  test('rejects and cleans up destPath on a request-level error (e.g. DNS failure)', async () => {
    const fakeRequest = new EventEmitter();
    https.get.mockImplementation(() => fakeRequest);

    const promise = downloadFile('https://example.com/file.zip', '/tmp/dest.zip');
    fakeRequest.emit('error', new Error('ENOTFOUND'));

    await expect(promise).rejects.toThrow('ENOTFOUND');
    expect(fs.createWriteStream).not.toHaveBeenCalled();
    expect(fs.unlink).toHaveBeenCalledWith('/tmp/dest.zip', expect.any(Function));
  });

  test('destroys the partial file and removes destPath on a mid-stream response error', async () => {
    const fakeFile = new EventEmitter();
    fakeFile.destroy = jest.fn();
    fakeFile.close = jest.fn();
    fs.createWriteStream.mockReturnValue(fakeFile);

    let res;
    https.get.mockImplementation((url, cb) => {
      res = new EventEmitter();
      res.statusCode = 200;
      res.headers = {};
      res.pipe = jest.fn();
      cb(res);
      return new EventEmitter();
    });

    const promise = downloadFile('https://example.com/file.zip', '/tmp/dest.zip');
    res.emit('error', new Error('socket hang up'));

    await expect(promise).rejects.toThrow('socket hang up');
    expect(fakeFile.destroy).toHaveBeenCalled();
    expect(fs.unlink).toHaveBeenCalledWith('/tmp/dest.zip', expect.any(Function));
  });

  test('rejects with "Too many redirects" without ever creating a file', async () => {
    https.get.mockImplementation((url, cb) => {
      const res = new EventEmitter();
      res.statusCode = 302;
      res.headers = { location: 'https://example.com/redirect' };
      cb(res);
      return new EventEmitter();
    });

    await expect(downloadFile('https://example.com/file.zip', '/tmp/dest.zip')).rejects.toThrow('Too many redirects');
    expect(fs.createWriteStream).not.toHaveBeenCalled();
  });

  test('resolves with destPath and reports progress on a successful download', async () => {
    const fakeFile = new EventEmitter();
    fakeFile.close = jest.fn();
    fs.createWriteStream.mockReturnValue(fakeFile);

    let res;
    https.get.mockImplementation((url, cb) => {
      res = new EventEmitter();
      res.statusCode = 200;
      res.headers = { 'content-length': '10' };
      res.pipe = jest.fn(() => {
        process.nextTick(() => fakeFile.emit('finish'));
      });
      cb(res);
      return new EventEmitter();
    });

    const onProgress = jest.fn();
    const promise = downloadFile('https://example.com/file.zip', '/tmp/dest.zip', onProgress);
    res.emit('data', Buffer.from('12345'));
    res.emit('data', Buffer.from('67890'));

    await expect(promise).resolves.toBe('/tmp/dest.zip');
    expect(onProgress).toHaveBeenCalled();
    expect(fs.unlink).not.toHaveBeenCalled();
  });
});

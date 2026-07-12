/**
 * VidMix getFileName tests
 * @description Covers Task 4 Bug B's renderer helper: js/utils.js is a
 * plain (Electron-free) CommonJS-requireable module shared with the
 * renderer, which side-effect-imports it as an ES module (see
 * js/codec-rules.js for the same pattern). Verifies getFileName() strips
 * extensions correctly, including the extension-less and dotfile edge
 * cases that motivated the fix.
 */

const { getFileName } = require('../js/utils.js');

describe('getFileName', () => {
  test('strips a simple extension', () => {
    expect(getFileName('movie.mp4')).toBe('movie');
  });

  test('strips extension from a nested path with forward slashes', () => {
    expect(getFileName('/home/user/videos/movie.mp4')).toBe('movie');
  });

  test('strips extension from a nested path with backslashes', () => {
    expect(getFileName('C:\\Users\\user\\videos\\movie.mp4')).toBe('movie');
  });

  test('keeps only the last extension for multi-dot names', () => {
    expect(getFileName('archive.tar.gz')).toBe('archive.tar');
  });

  test('returns the name as-is when there is no extension', () => {
    expect(getFileName('video')).toBe('video');
  });

  test('returns a dotfile as-is instead of emptying it', () => {
    expect(getFileName('.hidden')).toBe('.hidden');
  });
});

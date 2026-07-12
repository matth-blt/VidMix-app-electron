/**
 * VidMix getFileName / escapeHtml tests
 * @description Covers Task 4 Bug B's renderer helper: js/utils.js is a
 * plain (Electron-free) CommonJS-requireable module shared with the
 * renderer, which side-effect-imports it as an ES module (see
 * js/codec-rules.js for the same pattern). Verifies getFileName() strips
 * extensions correctly, including the extension-less and dotfile edge
 * cases that motivated the fix. Also covers Task 5 Bug B's escapeHtml(),
 * which prevents HTML injection when untrusted strings (filenames, media
 * info) are interpolated into innerHTML template strings.
 */

const { getFileName, escapeHtml } = require('../js/utils.js');

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

describe('escapeHtml', () => {
  test('escapes angle brackets', () => {
    expect(escapeHtml('<img src=x onerror=alert(1)>')).toBe(
      '&lt;img src=x onerror=alert(1)&gt;'
    );
  });

  test('escapes ampersands', () => {
    expect(escapeHtml('Q&A')).toBe('Q&amp;A');
  });

  test('escapes double quotes', () => {
    expect(escapeHtml('say "hi"')).toBe('say &quot;hi&quot;');
  });

  test('escapes single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#39;s');
  });

  test('escapes all special characters together', () => {
    expect(escapeHtml(`<a href="x" onclick='y'>&</a>`)).toBe(
      '&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;&lt;/a&gt;'
    );
  });

  test('leaves plain strings unchanged', () => {
    expect(escapeHtml('movie.mp4')).toBe('movie.mp4');
  });

  test('coerces non-string values to string', () => {
    expect(escapeHtml(42)).toBe('42');
  });
});

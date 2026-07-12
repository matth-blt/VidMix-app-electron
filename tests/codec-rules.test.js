/**
 * VidMix codec/container compatibility rules tests
 * @description Covers Task 2 Bug C's renderer guard: js/codec-rules.js is a
 * plain (Electron-free) CommonJS-requireable module shared with the
 * renderer, which side-effect-imports it as an ES module. Verifies
 * codecContainerRules / isValidCombo() reject muxing combinations ffmpeg
 * cannot actually produce (e.g. VP9 into .mp4, FFV1 outside .mkv).
 */

const { codecContainerRules, isValidCombo } = require('../js/codec-rules.js');

describe('codecContainerRules', () => {
  test('defines rules for every codec offered in the UI', () => {
    expect(Object.keys(codecContainerRules).sort()).toEqual(
      ['AV1', 'FFV1', 'ProRes', 'VP9', 'x264', 'x265'].sort()
    );
  });
});

describe('isValidCombo', () => {
  test.each([
    ['FFV1', 'mkv'],
    ['ProRes', 'mov'],
    ['ProRes', 'mkv'],
    ['VP9', 'webm'],
    ['VP9', 'mkv'],
    ['AV1', 'mp4'],
    ['AV1', 'mkv'],
    ['AV1', 'webm'],
    ['x264', 'mp4'],
    ['x264', 'mkv'],
    ['x264', 'mov'],
    ['x265', 'mp4'],
    ['x265', 'mkv'],
    ['x265', 'mov']
  ])('%s -> .%s is valid', (codec, format) => {
    expect(isValidCombo(codec, format)).toBe(true);
  });

  test.each([
    ['FFV1', 'mp4'],
    ['FFV1', 'mov'],
    ['FFV1', 'webm'],
    ['ProRes', 'mp4'],
    ['ProRes', 'webm'],
    ['VP9', 'mp4'],
    ['VP9', 'mov'],
    ['x264', 'webm'],
    ['x265', 'webm']
  ])('%s -> .%s is invalid', (codec, format) => {
    expect(isValidCombo(codec, format)).toBe(false);
  });

  test('unknown codecs are permissively allowed anywhere', () => {
    expect(isValidCombo('made-up-codec', 'mp4')).toBe(true);
  });
});

/**
 * Codec/container compatibility rules.
 *
 * Plain, dependency-free module (no Electron/DOM imports) so it can be
 * consumed from two different module systems without a build step:
 *  - The renderer loads this file as a native ES module via a side-effect
 *    `import './codec-rules.js'` in js/vidsencoder.js (Chromium's module
 *    loader does not understand CommonJS `module.exports`, so values are
 *    published on `globalThis` instead of using `export`).
 *  - Jest (CommonJS by default, no ESM transform configured) loads this
 *    file with a plain `require('../js/codec-rules.js')`.
 */

/** @type {Object<string, string[]>} allowed output containers keyed by codec */
const codecContainerRules = {
  FFV1: ['mkv'],
  ProRes: ['mov', 'mkv'],
  VP9: ['webm', 'mkv'],
  AV1: ['mp4', 'mkv', 'webm'],
  x264: ['mp4', 'mkv', 'mov'],
  x265: ['mp4', 'mkv', 'mov']
};

/**
 * Checks whether a codec can be muxed into a given container format.
 * Codecs without an explicit rule are treated as compatible with any
 * container (permissive default for codecs this table doesn't know about).
 * @param {string} codec - encoder name, e.g. 'x264', 'VP9', 'FFV1'
 * @param {string} format - container extension without the dot, e.g. 'mp4'
 * @returns {boolean}
 */
function isValidCombo(codec, format) {
  const allowed = codecContainerRules[codec];
  if (!allowed) return true;
  return allowed.includes(format);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { codecContainerRules, isValidCombo };
} else {
  globalThis.__codecRules = { codecContainerRules, isValidCombo };
}

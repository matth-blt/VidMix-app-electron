/**
 * Small dependency-free renderer utilities.
 *
 * Plain, Electron-free module so it can be consumed from two different
 * module systems without a build step:
 *  - The renderer loads this file as a native ES module via a side-effect
 *    `import './js/utils.js'` in renderer.js (Chromium's module loader does
 *    not understand CommonJS `module.exports`, so values are published on
 *    `globalThis` instead of using `export`).
 *  - Jest (CommonJS by default, no ESM transform configured) loads this
 *    file with a plain `require('../js/utils.js')`.
 *
 * See js/codec-rules.js for the same pattern.
 */

/**
 * Extracts the filename without its extension from a file path.
 * Dotfiles (e.g. `.hidden`) and extension-less names (e.g. `video`) are
 * returned as-is since they have no meaningful extension to strip.
 * @param {string} filePath - full or relative file path
 * @returns {string} filename without extension
 */
function getFileName(filePath) {
  const base = filePath.split(/[\\/]/).pop();
  const i = base.lastIndexOf('.');
  return i > 0 ? base.slice(0, i) : base;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getFileName };
} else {
  globalThis.__utils = { getFileName };
}

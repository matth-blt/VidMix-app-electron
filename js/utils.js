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

/**
 * Escapes HTML-significant characters so a string is safe to interpolate
 * into an `innerHTML` template string. Values that reach the DOM this way
 * (e.g. filenames, media info) may originate from user-controlled input
 * such as a crafted filename, so they must never be inserted raw.
 * @param {*} s - value to escape (coerced to string)
 * @returns {string} HTML-escaped string
 */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { getFileName, escapeHtml };
} else {
  globalThis.__utils = { getFileName, escapeHtml };
}

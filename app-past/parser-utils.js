/**
 * Shared Parser Utilities
 */

/**
 * Checks if the given text contains keywords indicating a pre-config request.
 * Keywords: "pre-config", "preconfig", "pre config" (case-insensitive)
 * 
 * @param {string} text The text to search
 * @returns {boolean} True if pre-config is detected
 */
function isPreConfig(text) {
    if (!text) return false;
    const preConfigRegex = /pre[- ]?config/i;
    return preConfigRegex.test(text);
}

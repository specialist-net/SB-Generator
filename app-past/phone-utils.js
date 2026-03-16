/**
 * Shared Phone Number Detection and Normalization Utility
 */

/**
 * Normalizes a Cambodian phone number from a given string.
 * Detects formats: +855..., 855..., 885..., 0...
 * Converts all to local format: 0...
 * 
 * @param {string} text The text to search for a phone number
 * @returns {string} The normalized phone number or 'N/A'
 */
function normalizePhoneNumber(text) {
    if (!text) return 'N/A';

    // 1. Try to find a phone number using common prefixes or standalone sequences
    // Matches:
    // - Starting with +855 or 855 or 885 followed by 8-10 digits
    // - Starting with 0 followed by 8-10 digits
    // Supports spaces, dashes, and parentheses which are later cleaned
    const phoneRegex = /(?:\+?855|885|0)\s*\(?\d{2,3}\)?[\s.-]?\d{3}[\s.-]?\d{3,4}/g;
    
    const matches = text.match(phoneRegex);
    if (!matches) {
        // Fallback: check if there's a "Phone" label and extract what follows
        const phoneLabelMatch = text.match(/Phone\s*[:.]?\s*([\+\d\s\-()]+)/i);
        if (phoneLabelMatch) {
            return formatNumber(phoneLabelMatch[1]);
        }
        return 'N/A';
    }

    // Use the first valid looking match
    return formatNumber(matches[0]);
}

/**
 * Internal helper to format a specific number string to 0XXXXXXXX layout
 */
function formatNumber(numStr) {
    // Strip all non-digit characters
    let cleaned = numStr.replace(/\D/g, '');
    
    // Handle prefixes
    if (cleaned.startsWith('855') || cleaned.startsWith('885')) {
        cleaned = '0' + cleaned.substring(3);
    } else if (cleaned.startsWith('0')) {
        // Already starts with 0, keep as is
    } else if (cleaned.length >= 8 && cleaned.length <= 10) {
        // Standalone number without prefix, assume it needs a 0
        cleaned = '0' + cleaned;
    }

    // Basic length validation for Cambodian numbers (usually 9-10 digits including 0)
    if (cleaned.length >= 9 && cleaned.length <= 11) {
        return cleaned;
    }
    
    return 'N/A';
}

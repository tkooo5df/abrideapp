/**
 * Utility functions for obfuscating and de-obfuscating IDs in URLs
 * We use Base64 encoding with a prefix to avoid raw numbers in URLs.
 */

export const encodeId = (id: string | number | undefined | null): string => {
  if (id === undefined || id === null || id === '') return '';
  try {
    return btoa(`ABRIDE_${id}`);
  } catch (e) {
    return String(id); // fallback
  }
};

export const decodeId = (encoded: string | undefined | null): string => {
  if (!encoded) return '';
  try {
    const decoded = atob(encoded);
    if (decoded.startsWith('ABRIDE_')) {
      return decoded.replace('ABRIDE_', '');
    }
    // If it wasn't encoded properly, just return the raw string
    return encoded;
  } catch (e) {
    // If atob fails (not base64), return the raw string
    return encoded;
  }
};

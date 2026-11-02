import LZString from 'lz-string';
import type { EventRecord } from '../types';

/**
 * Encodes an EventRecord into a compact URL-safe base64 string.
 */
export function encodeEventToUrlHash(event: EventRecord): string {
  try {
    const jsonStr = JSON.stringify(event);
    const compressed = LZString.compressToEncodedURIComponent(jsonStr);
    
    // In PWA standalone mode or different environments, window.location.pathname might include query params or trailing files
    // Ensure clean public URL: https://kevindiu.github.io/pay-lah/
    let baseUrl = window.location.origin + window.location.pathname;
    
    // If running on github.io, ensure proper /pay-lah/ base path
    if (window.location.hostname.includes('github.io')) {
      const match = window.location.pathname.match(/^(\/[^/]+)/);
      const repoName = match ? match[1] : '/pay-lah';
      baseUrl = `${window.location.origin}${repoName}/`;
    } else {
      // For localhost or custom domain, clean trailing filename if any
      baseUrl = baseUrl.replace(/\/[^/]*\.[^/]+$/, '/');
      if (!baseUrl.endsWith('/')) {
        baseUrl += '/';
      }
    }

    return `${baseUrl}#d=${compressed}`;
  } catch (e) {
    console.error('Failed to encode event to URL hash', e);
    return window.location.href;
  }
}

/**
 * Parses and decodes an EventRecord from the URL hash #d=...
 */
export function decodeEventFromUrlHash(): EventRecord | null {
  try {
    const hash = window.location.hash;
    if (!hash || !hash.includes('#d=')) return null;
    const compressed = hash.split('#d=')[1];
    if (!compressed) return null;
    const jsonStr = LZString.decompressFromEncodedURIComponent(compressed);
    if (!jsonStr) return null;
    const event = JSON.parse(jsonStr) as EventRecord;
    return event;
  } catch (e) {
    console.error('Failed to decode event from URL hash', e);
    return null;
  }
}

import LZString from 'lz-string';
import type { EventRecord } from '../types';

/**
 * Encodes an EventRecord into a compact URL-safe base64 string.
 */
export function encodeEventToUrlHash(event: EventRecord): string {
  try {
    const jsonStr = JSON.stringify(event);
    const compressed = LZString.compressToEncodedURIComponent(jsonStr);
    const baseUrl = window.location.origin + window.location.pathname;
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

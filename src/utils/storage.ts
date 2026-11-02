import type { EventRecord } from '../types';

const STORAGE_KEY = 'paylah_events_v1';
const CURRENT_EVENT_ID_KEY = 'paylah_current_event_id';
const LANG_KEY = 'paylah_lang';

export function getSavedLanguage(): string | null {
  try {
    return localStorage.getItem(LANG_KEY);
  } catch {
    return null;
  }
}

export function saveLanguage(lang: string) {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch (e) {
    console.error(e);
  }
}

export function loadAllEvents(): EventRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse events from localStorage', e);
    return [];
  }
}

export function saveAllEvents(events: EventRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (e) {
    console.error('Failed to save events to localStorage', e);
  }
}

export function getCurrentEventId(): string | null {
  try {
    return localStorage.getItem(CURRENT_EVENT_ID_KEY);
  } catch {
    return null;
  }
}

export function saveCurrentEventId(id: string) {
  try {
    localStorage.setItem(CURRENT_EVENT_ID_KEY, id);
  } catch (e) {
    console.error(e);
  }
}

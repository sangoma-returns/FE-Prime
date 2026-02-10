/**
 * Storage Keys Constants
 * 
 * Centralized constants for localStorage/sessionStorage keys.
 * Prevents typos and makes it easy to update keys across the app.
 * 
 * Using 'bitfrost_' prefix to avoid conflicts with other apps.
 * 
 * Note: Authentication uses HTTP-only cookies (not localStorage)
 */

export const STORAGE_KEYS = {
  /** User's selected theme preference */
  THEME_PREFERENCE: 'bitfrost_theme',
  
  /** Session ID for analytics */
  SESSION_ID: 'bitfrost_session_id',
} as const;

/**
 * Type-safe storage keys
 */
export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
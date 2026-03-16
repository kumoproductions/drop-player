import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { StorageAdapter } from '../types';

// Storage key prefix
const STORAGE_PREFIX = 'drop_player_';

// Throttle interval for periodic saves (5 seconds)
const SAVE_THROTTLE_MS = 5000;

// Maximum age for saved position (7 days in milliseconds)
const MAX_SAVED_POSITION_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// Maximum number of saved positions to keep
const MAX_SAVED_POSITIONS = 200;

interface SavedPositionData {
  position: number;
  savedAt: number;
}

/**
 * Default localStorage adapter (SSR-safe: no-op when window is undefined)
 */
const defaultStorage: StorageAdapter = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  },
};

/**
 * Clean up old saved positions (SSR-safe: no-op when window is undefined)
 */
function cleanupSavedPositions(storage: StorageAdapter) {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  const positionKeys: { key: string; savedAt: number }[] = [];

  // Collect all position entries
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(`${STORAGE_PREFIX}position_`)) {
      const saved = storage.getItem(key);
      if (saved) {
        try {
          const data: SavedPositionData = JSON.parse(saved);
          positionKeys.push({ key, savedAt: data.savedAt });
        } catch {
          // Invalid data, mark for removal
          positionKeys.push({ key, savedAt: 0 });
        }
      }
    }
  }

  // Remove expired entries
  const validEntries = positionKeys.filter((entry) => {
    const age = now - entry.savedAt;
    if (age > MAX_SAVED_POSITION_AGE_MS || entry.savedAt === 0) {
      storage.removeItem(entry.key);
      return false;
    }
    return true;
  });

  // If still over limit, remove oldest entries
  if (validEntries.length > MAX_SAVED_POSITIONS) {
    validEntries.sort((a, b) => a.savedAt - b.savedAt);
    const toRemove = validEntries.slice(
      0,
      validEntries.length - MAX_SAVED_POSITIONS
    );
    for (const entry of toRemove) {
      storage.removeItem(entry.key);
    }
  }
}

// Run cleanup once on module load
if (typeof window !== 'undefined') {
  cleanupSavedPositions(defaultStorage);
}

interface UsePlayerStorageOptions {
  persistenceKey?: string;
  storage?: StorageAdapter;
  onPositionSave?: (position: number) => void;
  onPositionRestore?: (position: number) => void;
}

interface UsePlayerStorageReturn {
  savePosition: (position: number, force?: boolean) => void;
  loadPosition: () => number | null;
  clearPosition: () => void;
  getStoredValue: <T>(key: string, defaultValue: T) => T;
  setStoredValue: <T>(key: string, value: T) => void;
}

/**
 * Hook for player storage (position persistence, preferences)
 */
export function usePlayerStorage(
  options: UsePlayerStorageOptions = {}
): UsePlayerStorageReturn {
  const {
    persistenceKey,
    storage = defaultStorage,
    onPositionSave,
    onPositionRestore,
  } = options;

  const lastSaveTimeRef = useRef<number>(0);
  const positionKeyRef = useRef<string | null>(
    persistenceKey ? `${STORAGE_PREFIX}position_${persistenceKey}` : null
  );

  // Update key ref when persistenceKey changes
  useEffect(() => {
    positionKeyRef.current = persistenceKey
      ? `${STORAGE_PREFIX}position_${persistenceKey}`
      : null;
  }, [persistenceKey]);

  const savePosition = useCallback(
    (position: number, force = false) => {
      const key = positionKeyRef.current;
      if (!key) return;

      const now = Date.now();
      // Throttle saves unless forced
      if (!force && now - lastSaveTimeRef.current < SAVE_THROTTLE_MS) {
        return;
      }

      const data: SavedPositionData = {
        position,
        savedAt: now,
      };
      storage.setItem(key, JSON.stringify(data));
      lastSaveTimeRef.current = now;
      onPositionSave?.(position);
    },
    [storage, onPositionSave]
  );

  const loadPosition = useCallback((): number | null => {
    const key = positionKeyRef.current;
    if (!key) return null;

    const saved = storage.getItem(key);
    if (!saved) return null;

    const data: SavedPositionData = JSON.parse(saved);
    const age = Date.now() - data.savedAt;

    if (
      age < MAX_SAVED_POSITION_AGE_MS &&
      !Number.isNaN(data.position) &&
      data.position >= 0
    ) {
      onPositionRestore?.(data.position);
      return data.position;
    }

    // Clean up old or invalid data
    storage.removeItem(key);
    if (age >= MAX_SAVED_POSITION_AGE_MS) {
      throw new Error(
        `Saved position expired (age: ${age}ms, max: ${MAX_SAVED_POSITION_AGE_MS}ms)`
      );
    }
    if (Number.isNaN(data.position) || data.position < 0) {
      throw new Error(
        `Invalid saved position: ${data.position} (must be >= 0 and finite)`
      );
    }
    return null;
  }, [storage, onPositionRestore]);

  const clearPosition = useCallback(() => {
    const key = positionKeyRef.current;
    if (key) {
      storage.removeItem(key);
    }
  }, [storage]);

  const getStoredValue = useCallback(
    <T>(key: string, defaultValue: T): T => {
      const fullKey = `${STORAGE_PREFIX}${key}`;
      const saved = storage.getItem(fullKey);
      if (!saved) return defaultValue;

      return JSON.parse(saved) as T;
    },
    [storage]
  );

  const setStoredValue = useCallback(
    <T>(key: string, value: T) => {
      const fullKey = `${STORAGE_PREFIX}${key}`;
      storage.setItem(fullKey, JSON.stringify(value));
    },
    [storage]
  );

  return useMemo(
    () => ({
      savePosition,
      loadPosition,
      clearPosition,
      getStoredValue,
      setStoredValue,
    }),
    [savePosition, loadPosition, clearPosition, getStoredValue, setStoredValue]
  );
}
